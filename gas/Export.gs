// ============================================================
// SECOND BRAIN — Google Sheets → Laravel Export Script
// Run exportAllToLaravel() to export all data
// ============================================================


// var LARAVEL_URL    = "http://localhost:8000/api/import";
// var LARAVEL_TOKEN  = "PASTE_YOUR_TOKEN_HERE"; // from POST /api/auth/login

function exportAllToLaravel() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log("=== Starting Export ===");

  var result = {
    projects:    exportProjects(ss),
    tasks:       exportTasks(ss),
    dailyStates: exportDailyStates(ss),
    profile:     exportProfile(ss),
  };

  var payload = JSON.stringify(result);

  var response = UrlFetchApp.fetch(LARAVEL_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + LARAVEL_TOKEN,
      "Accept": "application/json"
    },
    payload: payload,
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();

  Logger.log("Response Code: " + code);
  Logger.log("Response Body: " + body);

  if (code === 200 || code === 201) {
    SpreadsheetApp.getUi().alert("✅ Export successful!\n\n" + body);
  } else {
    SpreadsheetApp.getUi().alert("❌ Export failed (HTTP " + code + ")\n\n" + body);
  }
}

// ── Projects ──────────────────────────────────────────────
// Columns: A=Project_ID, B=Title, C=Description, D=Status,
//          E=Priority, F=Created_At, G=?, H=Updated_At, I=Updated_At2
function exportProjects(ss) {
  var sheet = ss.getSheetByName("Projects");
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var projects = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = clean(row[0]);
    if (!id) continue;

    projects.push({
      gas_id:      id,
      title:       clean(row[1]),
      description: clean(row[2]),
      status:      clean(row[3]) || "Active",
      priority:    Number(row[4]) || 0,
      created_at:  formatDate(row[5]),
      updated_at:  formatDate(row[7])
    });
  }

  Logger.log("Projects exported: " + projects.length);
  return projects;
}

// ── Tasks ─────────────────────────────────────────────────
// Columns: A=Task_ID, B=Title, C=Type, D=Area, E=Due_Date,
//          F=Notes, G=Project_ID, H=Maslow, I=Impact, J=Effort,
//          K=Recurrence, L=Time_Estimate, M=Urgency, N=Category,
//          O=Confidence, P=Priority, Q=Fit_Score, R=Status,
//          S=Source, T=?, U=Completed_At
function exportTasks(ss) {
  var sheet = ss.getSheetByName("Task_Database");
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var tasks = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var title = clean(row[1]);
    if (!title) continue;

    // Detect if Recurrence column (K=index 10) is empty for this row.
    // If K is empty and the value looks like a time estimate, the sheet
    // has shifted one column left (Recurrence column is missing/empty).
    var colK = clean(row[10]);
    var timeEstimatePatterns = /min|hour|h$|^\d+$/i;
    var recurrencePatterns   = /^(Daily|Weekly|Monthly|Yearly)$/i;

    var shifted = !colK || (!recurrencePatterns.test(colK) && timeEstimatePatterns.test(colK));

    var recurrence, timeEstimate, urgency, category, confidence, priority, fitScore, status, source, completedAt;

    if (shifted) {
      // Recurrence column is empty — everything from K onwards is one left
      recurrence    = "";              // K[10] empty
      timeEstimate  = clean(row[10]);  // L→K
      urgency       = clean(row[11]);  // M→L
      category      = clean(row[12]);  // N→M
      confidence    = Number(row[13]) || 0; // O→N
      priority      = Number(row[14]) || 0; // P→O
      fitScore      = Number(row[15]) || 0; // Q→P
      status        = clean(row[16]) || "Pending"; // R→Q
      source        = clean(row[17]); // S→R
      completedAt   = formatDate(row[19]); // U→T
    } else {
      // Original layout — Recurrence column has data
      recurrence    = colK;
      timeEstimate  = clean(row[11]);
      urgency       = clean(row[12]);
      category      = clean(row[13]);
      confidence    = Number(row[14]) || 0;
      priority      = Number(row[15]) || 0;
      fitScore      = Number(row[16]) || 0;
      status        = clean(row[17]) || "Pending";
      source        = clean(row[18]);
      completedAt   = formatDate(row[20]);
    }

    var validStatuses = ["Pending", "Done", "Deleted", "Idea", "Note"];
    if (validStatuses.indexOf(status) === -1) status = "Pending";

    var validRecurrences = ["Daily", "Weekly", "Monthly", "Yearly"];
    if (recurrence && validRecurrences.indexOf(recurrence) === -1) recurrence = "";

    tasks.push({
      gas_id:         clean(row[0]),
      gas_project_id: clean(row[6]),
      title:          title,
      type:           clean(row[2]) || "Task",
      area:           clean(row[3]),
      due_date:       formatDate(row[4]),
      notes:          clean(row[5]),
      maslow:         clean(row[7]),
      impact:         Number(row[8]) || 0,
      effort:         Number(row[9]) || 0,
      recurrence:     recurrence,
      time_estimate:  timeEstimate,
      urgency:        urgency,
      category:       category,
      confidence:     confidence,
      priority:       priority,
      fit_score:      fitScore,
      status:         status,
      source:         source,
      completed_at:   completedAt
    });
  }

  Logger.log("Tasks exported: " + tasks.length);
  return tasks;
}

// ── Daily States ──────────────────────────────────────────
// Columns: A=Date, B=Energy, C=Mood, D=Focus, E=Notes, F=Available_Time
function exportDailyStates(ss) {
  var sheet = ss.getSheetByName("Daily_State");
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(1, 1, lastRow, 6).getValues();
  var states = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;

    var dateStr = "";
    try {
      dateStr = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), "yyyy-MM-dd");
    } catch(e) { continue; }

    states.push({
      date:           dateStr,
      energy:         Number(row[1]) || 5,
      mood:           Number(row[2]) || 5,
      focus:          Number(row[3]) || 5,
      notes:          clean(row[4]),
      available_time: Number(row[5]) || 120
    });
  }

  Logger.log("Daily states exported: " + states.length);
  return states;
}

// ── Profile ───────────────────────────────────────────────
// Columns: A=User_ID, B=Name, C=Work_Type, D=Routine_Type,
//          E=Commute_Time, F=Use_Personal_Data, G=Age, H=DOB,
//          I=Financial_Status, J=Health_Status, K=Custom_Notes, L=Updated_At
function exportProfile(ss) {
  var sheet = ss.getSheetByName("User_Profile");
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var row = data[1];

  var dobStr = "";
  try { if (row[7]) dobStr = Utilities.formatDate(new Date(row[7]), Session.getScriptTimeZone(), "yyyy-MM-dd"); } catch(_) {}

  return {
    name:              clean(row[1]),
    work_type:         clean(row[2]),
    routine_type:      clean(row[3]),
    commute_time:      clean(row[4]),
    use_personal_data: row[5] === true || String(row[5]).toUpperCase() === "TRUE",
    age:               clean(row[6]),
    dob:               dobStr,
    financial_status:  clean(row[8]),
    health_status:     clean(row[9]),
    custom_notes:      clean(row[10])
  };
}

// ── Helpers ───────────────────────────────────────────────
function clean(val) {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function formatDate(val) {
  if (!val) return null;
  try {
    var d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
  } catch(e) {
    return null;
  }
}
