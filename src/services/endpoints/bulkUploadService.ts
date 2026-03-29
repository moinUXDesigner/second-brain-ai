import { inputService } from './inputService';
import type { AnalyzeResult, Task, Project } from '@/types';

// ── Types ──

export type BulkMode = 'ai' | 'rule' | 'both';

export interface BulkInputRow {
  text: string;
  area: string;
}

export interface BulkItemResult {
  index: number;
  input: BulkInputRow;
  analysis: AnalyzeResult;
  created: { task?: Task; project?: Project };
  error?: string;
}

export interface BulkProgress {
  phase: 'classifying' | 'creating';
  current: number;
  total: number;
  currentLabel: string;
}

export interface BulkSummary {
  totalProcessed: number;
  tasksCreated: number;
  projectsCreated: number;
  failed: number;
  priorityBreakdown: { High: number; Medium: number; Low: number };
  items: BulkItemResult[];
}

// ── CSV / JSON Parsing ──

export function parseCSV(raw: string): BulkInputRow[] {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const headers = parseCSVLine(headerLine);
  const textIdx = headers.findIndex((h) => h.includes('text') || h.includes('input') || h.includes('title'));
  const areaIdx = headers.findIndex((h) => h.includes('area') || h.includes('domain') || h.includes('category'));

  if (textIdx === -1) throw new Error('CSV must contain a "text" or "input" column');

  const rows: BulkInputRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const text = cols[textIdx]?.trim();
    if (!text) continue;
    rows.push({ text, area: (areaIdx >= 0 ? cols[areaIdx]?.trim() : '') || 'General' });
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols.map((c) => c.replace(/^"|"$/g, '').trim());
}

export function parseJSON(raw: string): BulkInputRow[] {
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : parsed.items ?? parsed.tasks ?? parsed.data ?? [];
  if (!Array.isArray(arr)) throw new Error('JSON must be an array or contain an array field');

  return arr
    .map((item: Record<string, unknown>) => ({
      text: String(item.text ?? item.input ?? item.title ?? '').trim(),
      area: String(item.area ?? item.domain ?? item.category ?? 'General').trim(),
    }))
    .filter((r: BulkInputRow) => r.text.length > 0);
}

export function detectFormat(raw: string): 'json' | 'csv' {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'json';
  return 'csv';
}

// ── Rule-based classifier ──

const PROJECT_KEYWORDS = /\b(project|initiative|plan|redesign|build|develop|implement|launch|migrate|refactor|overhaul|revamp|system|platform|app)\b/i;
const HIGH_KEYWORDS = /\b(urgent|asap|critical|immediately|emergency|blocker|deadline)\b/i;
const MEDIUM_KEYWORDS = /\b(important|significant|key|needed|should|soon)\b/i;

const AREA_CATEGORY_MAP: Record<string, string> = {
  health: 'Recovery', fitness: 'Recovery', exercise: 'Recovery', sleep: 'Recovery', wellness: 'Recovery',
  work: 'Deep Work', career: 'Deep Work', development: 'Deep Work', coding: 'Deep Work', engineering: 'Deep Work',
  finance: 'Admin', money: 'Admin', budget: 'Admin', tax: 'Admin', bills: 'Admin', insurance: 'Admin',
  learning: 'Deep Work', education: 'Deep Work', study: 'Deep Work', course: 'Deep Work', reading: 'Deep Work',
  social: 'Light Work', family: 'Light Work', friends: 'Light Work', relationships: 'Light Work',
  home: 'Light Work', cleaning: 'Admin', errands: 'Admin', shopping: 'Admin',
  creative: 'Deep Work', writing: 'Deep Work', design: 'Deep Work',
};

function ruleClassify(text: string, area: string): Omit<AnalyzeResult, 'subtasks'> {
  const isProject = PROJECT_KEYWORDS.test(text);
  const priority: 'High' | 'Medium' | 'Low' = HIGH_KEYWORDS.test(text) ? 'High' : MEDIUM_KEYWORDS.test(text) ? 'Medium' : 'Low';

  const areaLower = area.toLowerCase();
  let category = 'Light Work';
  for (const [keyword, cat] of Object.entries(AREA_CATEGORY_MAP)) {
    if (areaLower.includes(keyword)) { category = cat; break; }
  }

  return {
    type: isProject ? 'project' : 'task',
    title: text,
    area,
    category,
    priority,
    estimatedTime: isProject ? '4 hours' : '1 hour',
    confidence: 0.6,
    source: 'RULE',
  };
}

// ── Batch processor ──

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 600;

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function chunks<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

export async function processBulkUpload(
  items: BulkInputRow[],
  mode: BulkMode,
  aiEnabled: boolean,
  onProgress: (p: BulkProgress) => void,
  signal?: AbortSignal,
): Promise<BulkSummary> {
  const results: BulkItemResult[] = [];
  const total = items.length;

  // Phase 1: Classify all items
  const analyses: (AnalyzeResult | null)[] = new Array(total).fill(null);
  const classifyBatches = chunks(items.map((item, i) => ({ item, i })), BATCH_SIZE);

  for (const batch of classifyBatches) {
    if (signal?.aborted) break;

    const promises = batch.map(async ({ item, i }) => {
      onProgress({ phase: 'classifying', current: i + 1, total, currentLabel: item.text.slice(0, 50) });

      if (mode === 'rule') {
        const rule = ruleClassify(item.text, item.area);
        // For projects even in rule mode, we need AI for subtasks
        if (rule.type === 'project' && aiEnabled) {
          try {
            const aiRes = await inputService.analyzeInput({ text: item.text, area: item.area, aiEnabled: true });
            analyses[i] = { ...rule, subtasks: aiRes.data.subtasks, source: 'RULE' };
          } catch {
            // Fallback: project with no subtasks
            analyses[i] = { ...rule, subtasks: [] };
          }
        } else {
          analyses[i] = { ...rule, subtasks: [] };
        }
      } else {
        // AI or Both mode
        try {
          const aiRes = await inputService.analyzeInput({ text: item.text, area: item.area, aiEnabled: true });
          analyses[i] = aiRes.data;
        } catch {
          if (mode === 'both') {
            // Fallback to rule
            const rule = ruleClassify(item.text, item.area);
            if (rule.type === 'project') {
              analyses[i] = { ...rule, subtasks: [`Review ${item.text}`, `Plan ${item.text}`, `Execute ${item.text}`] };
            } else {
              analyses[i] = { ...rule, subtasks: [] };
            }
          } else {
            analyses[i] = null; // AI-only failed
          }
        }
      }
    });

    await Promise.allSettled(promises);
    if (classifyBatches.indexOf(batch) < classifyBatches.length - 1) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // Phase 2: Create all items
  const createBatches = chunks(items.map((item, i) => ({ item, i })), BATCH_SIZE);

  for (const batch of createBatches) {
    if (signal?.aborted) break;

    const promises = batch.map(async ({ item, i }) => {
      const analysis = analyses[i];
      if (!analysis) {
        results.push({
          index: i,
          input: item,
          analysis: ruleClassify(item.text, item.area) as AnalyzeResult,
          created: {},
          error: 'Classification failed',
        });
        return;
      }

      onProgress({ phase: 'creating', current: i + 1, total, currentLabel: analysis.title.slice(0, 50) });

      try {
        const res = await inputService.createTaskOrProject({
          text: analysis.title,
          type: analysis.type,
          area: analysis.area || item.area,
          category: analysis.category,
          priority: analysis.priority,
          estimatedTime: analysis.estimatedTime,
          subtasks: analysis.type === 'project' ? analysis.subtasks : undefined,
        });

        // Tag as batch-uploaded
        const created = res.data;
        if (created.task) {
          created.task.tags = [...(created.task.tags ?? []), 'Batch Uploaded'];
          created.task.source = 'BULK';
        }
        if (created.project) {
          (created.project as Project & { tags?: string[] }).tags = ['Batch Uploaded'];
        }

        results.push({ index: i, input: item, analysis, created });
      } catch (err) {
        results.push({
          index: i,
          input: item,
          analysis,
          created: {},
          error: err instanceof Error ? err.message : 'Creation failed',
        });
      }
    });

    await Promise.allSettled(promises);
    if (createBatches.indexOf(batch) < createBatches.length - 1) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // Build summary
  const tasksCreated = results.filter((r) => r.created.task && !r.error).length;
  const projectsCreated = results.filter((r) => r.created.project && !r.error).length;
  const failed = results.filter((r) => !!r.error).length;

  const priorityBreakdown = { High: 0, Medium: 0, Low: 0 };
  results.forEach((r) => {
    if (!r.error && r.analysis.priority in priorityBreakdown) {
      priorityBreakdown[r.analysis.priority]++;
    }
  });

  return {
    totalProcessed: total,
    tasksCreated,
    projectsCreated,
    failed,
    priorityBreakdown,
    items: results,
  };
}

// ── PDF / Print ──

export function generateSummaryHTML(summary: BulkSummary): string {
  const rows = summary.items
    .filter((r) => !r.error)
    .map((r) => {
      const type = r.created.project ? 'Project' : 'Task';
      const title = r.created.project?.title ?? r.created.task?.title ?? r.input.text;
      const subtaskCount = r.created.project?.subtasks?.length ?? 0;
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.index + 1}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee"><strong>${type}</strong></td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${title}${subtaskCount ? ` <em>(${subtaskCount} subtasks)</em>` : ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.analysis.area}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;color:${r.analysis.priority === 'High' ? '#dc2626' : r.analysis.priority === 'Medium' ? '#d97706' : '#16a34a'}">${r.analysis.priority}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.analysis.category}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.analysis.source}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html><head><title>Bulk Upload Summary</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#1a1a1a}
h1{font-size:22px;margin-bottom:4px}
.meta{color:#666;font-size:13px;margin-bottom:20px}
.stats{display:flex;gap:16px;margin-bottom:24px}
.stat{background:#f5f5f5;border-radius:8px;padding:12px 20px;text-align:center}
.stat-num{font-size:24px;font-weight:700}
.stat-label{font-size:12px;color:#666;margin-top:2px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:8px 10px;background:#f9fafb;border-bottom:2px solid #ddd;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666}
@media print{.no-print{display:none}}</style></head>
<body>
<h1>Bulk Upload Summary</h1>
<p class="meta">Generated on ${new Date().toLocaleString()}</p>
<div class="stats">
  <div class="stat"><div class="stat-num">${summary.totalProcessed}</div><div class="stat-label">Total</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${summary.tasksCreated}</div><div class="stat-label">Tasks</div></div>
  <div class="stat"><div class="stat-num" style="color:#2563eb">${summary.projectsCreated}</div><div class="stat-label">Projects</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${summary.failed}</div><div class="stat-label">Failed</div></div>
</div>
<h3 style="margin-bottom:4px">Priority Breakdown</h3>
<p style="font-size:13px;color:#444;margin-bottom:16px">
  🔴 High: ${summary.priorityBreakdown.High} &nbsp; 🟡 Medium: ${summary.priorityBreakdown.Medium} &nbsp; 🟢 Low: ${summary.priorityBreakdown.Low}
</p>
<table><thead><tr>
  <th>#</th><th>Type</th><th>Title</th><th>Area</th><th>Priority</th><th>Category</th><th>Source</th>
</tr></thead><tbody>${rows}</tbody></table>
<br/><button class="no-print" onclick="window.print()" style="padding:8px 20px;cursor:pointer;border:none;background:#2563eb;color:#fff;border-radius:6px;font-size:14px">Save as PDF</button>
</body></html>`;
}

export function openSummaryAsPDF(summary: BulkSummary) {
  const html = generateSummaryHTML(summary);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
