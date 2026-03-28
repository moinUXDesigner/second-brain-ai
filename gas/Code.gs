/***********************
 * CONFIG
 ***********************/
var TASK_SHEET_NAME = "Task_Database";
var CACHE_SHEET_NAME = "AI_Cache";

/***********************
 * WEB APP ENDPOINTS
 ***********************/
function doGet(e) {
  var action = (e.parameter.action || "").toString();
  var result = { success: false, data: null, message: "Unknown action" };

  try {
    switch (action) {
      case "getTasks":
        result = { success: true, data: handleGetTasks() };
        break;
      case "getTodayTasks":
        result = { success: true, data: handleGetTodayTasks() };
        break;
      case "getProjects":
        result = { success: true, data: handleGetProjects() };
        break;
      case "getDailyState":
        result = { success: true, data: handleGetDailyState(e.parameter.date) };
        break;
      case "getDashboard":
        result = { success: true, data: handleGetDashboard() };
        break;
      case "getProfile":
        result = { success: true, data: handleGetProfile() };
        break;
      default:
        result = { success: false, data: null, message: "Unknown GET action: " + action };
    }
  } catch (err) {
    result = { success: false, data: null, message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: "Invalid JSON body" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var action = (body.action || "").toString();
  var result = { success: false, data: null, message: "Unknown action" };

  try {
    switch (action) {
      case "createTask":
        result = { success: true, data: handleCreateTask(body) };
        break;
      case "updateTaskStatus":
        result = { success: true, data: handleUpdateTaskStatus(body.taskId, body.status) };
        break;
      case "deleteTask":
        result = { success: true, data: handleDeleteTask(body.taskId) };
        break;
      case "createProject":
        result = { success: true, data: handleCreateProject(body) };
        break;
      case "updateProject":
        result = { success: true, data: handleUpdateProject(body) };
        break;
      case "deleteProject":
        result = { success: true, data: handleDeleteProject(body.projectId) };
        break;
      case "saveDailyState":
        result = { success: true, data: handleSaveDailyState(body) };
        break;
      case "runPipeline":
        runFullPipeline();
        result = { success: true, data: handleGetTodayTasks(), message: "Pipeline completed" };
        break;
      case "classifyTasks":
        classifyTasks();
        result = { success: true, data: null, message: "Classification completed" };
        break;
      case "generateTodayView":
        generateSmartTodayView();
        result = { success: true, data: handleGetTodayTasks() };
        break;
      case "createInput":
        result = { success: true, data: handleCreateInput(body) };
        break;
      case "analyzeInput":
        result = { success: true, data: handleAnalyzeInput(body) };
        break;
      case "cleanupTasks":
        result = { success: true, data: handleCleanupTasks() };
        break;
      case "saveProfile":
        result = { success: true, data: handleSaveProfile(body) };
        break;
      default:
        result = { success: false, data: null, message: "Unknown POST action: " + action };
    }
  } catch (err) {
    result = { success: false, data: null, message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/***********************
 * HANDLER FUNCTIONS
 ***********************/
function handleGetTasks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TASK_SHEET_NAME);
  var data = sheet.getDataRange().getValues();

  // Build project name map
  var projectNameMap = {};
  var projectSheet = ss.getSheetByName("Projects");
  if (projectSheet) {
    var pData = projectSheet.getDataRange().getValues();
    for (var p = 1; p < pData.length; p++) {
      if (pData[p][0]) projectNameMap[String(pData[p][0])] = String(pData[p][1] || "");
    }
  }

  var tasks = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][1]) continue;
    var task = mapRowToTask(data[i]);
    task.projectName = task.projectId ? (projectNameMap[task.projectId] || "") : "";
    tasks.push(task);
  }

  return tasks;
}

function handleGetTodayTasks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var todaySheet = ss.getSheetByName("Today_View");
  if (!todaySheet) return [];

  var data = todaySheet.getDataRange().getValues();
  var taskSheet = ss.getSheetByName(TASK_SHEET_NAME);
  var taskData = taskSheet.getDataRange().getValues();

  // Build a lookup of full task data by Task_ID
  var taskMap = {};
  for (var j = 1; j < taskData.length; j++) {
    if (taskData[j][0]) {
      taskMap[taskData[j][0]] = taskData[j];
    }
  }

  var tasks = [];
  for (var i = 1; i < data.length; i++) {
    var taskId = data[i][0];
    if (!taskId) continue;

    var fullRow = taskMap[taskId];
    if (fullRow) {
      var task = mapRowToTask(fullRow);
      // Override with Today_View specific fields
      task.priority = Number(data[i][2]) || task.priority;
      task.fitScore = Number(data[i][3]) || task.fitScore;
      task.category = data[i][4] || task.category;
      task.status = data[i][5] || task.status;
      tasks.push(task);
    } else {
      tasks.push({
        id: String(taskId),
        title: data[i][1] || "",
        type: "",
        area: "",
        notes: "",
        priority: Number(data[i][2]) || 0,
        fitScore: Number(data[i][3]) || 0,
        category: data[i][4] || "",
        status: data[i][5] || "Pending"
      });
    }
  }

  return tasks;
}

function handleGetProjects() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var projectSheet = ss.getSheetByName("Projects");
  if (!projectSheet) return [];

  var projectData = projectSheet.getDataRange().getValues();
  var taskSheet = ss.getSheetByName(TASK_SHEET_NAME);
  var taskData = taskSheet.getDataRange().getValues();

  // Build subtask map by project ID
  var subtaskMap = {};
  for (var j = 1; j < taskData.length; j++) {
    var pid = clean(taskData[j][6]);
    if (pid) {
      if (!subtaskMap[pid]) subtaskMap[pid] = [];
      subtaskMap[pid].push(mapRowToTask(taskData[j]));
    }
  }

  var projects = [];
  for (var i = 1; i < projectData.length; i++) {
    var row = projectData[i];
    var projectId = clean(row[0]);
    if (!projectId) continue;

    var subtasks = subtaskMap[projectId] || [];
    var doneCount = subtasks.filter(function (s) { return s.status === "Done"; }).length;
    var progress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

    projects.push({
      id: projectId,
      title: row[1] || "",
      description: row[2] || "",
      status: row[3] || "Active",
      priority: Number(row[4]) || 0,
      progress: progress,
      subtasks: subtasks,
      createdAt: row[5] ? new Date(row[5]).toISOString() : "",
      updatedAt: row[7] ? new Date(row[7]).toISOString() : ""
    });
  }

  return projects;
}

function handleGetDailyState(dateStr) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stateSheet = ss.getSheetByName("Daily_State");
  if (!stateSheet) return null;

  var lastRow = stateSheet.getLastRow();
  if (lastRow < 2) return null;

  // Read all 6 columns explicitly (A:F) to always include Available_Time
  var data = stateSheet.getRange(1, 1, lastRow, 6).getValues();

  // If looking for a specific date, find it
  if (dateStr) {
    for (var i = 1; i < data.length; i++) {
      var rowDate = data[i][0];
      if (rowDate) {
        var formatted = Utilities.formatDate(new Date(rowDate), Session.getScriptTimeZone(), "yyyy-MM-dd");
        if (formatted === dateStr) {
          return {
            id: String(i),
            date: formatted,
            energy: Number(data[i][1]) || 5,
            mood: Number(data[i][2]) || 5,
            focus: Number(data[i][3]) || 5,
            notes: data[i][4] != null ? String(data[i][4]) : "",
            availableTime: data[i][5] ? Number(data[i][5]) : 120
          };
        }
      }
    }
  }

  // Return latest entry
  var last = data[data.length - 1];
  var lastDate = "";
  try { if (last[0]) lastDate = Utilities.formatDate(new Date(last[0]), Session.getScriptTimeZone(), "yyyy-MM-dd"); } catch (_) {}
  return {
    id: String(data.length - 1),
    date: lastDate,
    energy: Number(last[1]) || 5,
    mood: Number(last[2]) || 5,
    focus: Number(last[3]) || 5,
    notes: last[4] != null ? String(last[4]) : "",
    availableTime: last[5] ? Number(last[5]) : 120
  };
}

function handleGetDashboard() {
  var tasks = handleGetTasks();
  var todayTasks = handleGetTodayTasks();
  var projects = handleGetProjects();

  var total = tasks.length;
  var done = tasks.filter(function (t) { return t.status === "Done"; }).length;
  var pending = tasks.filter(function (t) { return t.status === "Pending"; }).length;
  var todayDone = todayTasks.filter(function (t) { return t.status === "Done"; }).length;

  return {
    totalTasks: total,
    completedTasks: done,
    pendingTasks: pending,
    todayDone: todayDone,
    todayTotal: todayTasks.length,
    projectCount: projects.length,
    tasks: tasks,
    todayTasks: todayTasks,
    projects: projects
  };
}

/***********************
 * PROFILE HANDLERS
 * User_Profile columns: A=User_ID, B=Name, C=Work_Type, D=Routine_Type,
 * E=Commute_Time, F=Use_Personal_Data, G=Age, H=DOB,
 * I=Financial_Status, J=Health_Status, K=Custom_Notes, L=Updated_At
 ***********************/
function handleGetProfile() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("User_Profile");
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var row = data[1];

  var dobStr = "";
  try { if (row[7]) dobStr = Utilities.formatDate(new Date(row[7]), Session.getScriptTimeZone(), "yyyy-MM-dd"); } catch (_) {}
  var updStr = "";
  try { if (row[11]) updStr = Utilities.formatDate(new Date(row[11]), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss"); } catch (_) {}

  return {
    userId: String(row[0] || ""),
    name: String(row[1] || ""),
    workType: String(row[2] || ""),
    routineType: String(row[3] || ""),
    commuteTime: String(row[4] || ""),
    usePersonalData: row[5] === true || String(row[5]).toUpperCase() === "TRUE" || String(row[5]).toUpperCase() === "YES",
    age: String(row[6] || ""),
    dob: dobStr,
    financialStatus: String(row[8] || ""),
    healthStatus: String(row[9] || ""),
    customNotes: String(row[10] || ""),
    updatedAt: updStr
  };
}

function handleSaveProfile(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("User_Profile");
  if (!sheet) throw new Error("User_Profile sheet not found");

  var data = sheet.getDataRange().getValues();
  var now = new Date();
  var usePersonal = !!body.usePersonalData;

  if (data.length < 2) {
    if (data.length === 0) {
      sheet.appendRow(["User_ID", "Name", "Work_Type", "Routine_Type",
        "Commute_Time", "Use_Personal_Data", "Age", "DOB", "Financial_Status",
        "Health_Status", "Custom_Notes", "Updated_At"]);
    }
    sheet.appendRow([
      body.userId || "U1",
      body.name || "",
      body.workType || "",
      body.routineType || "",
      body.commuteTime || "",
      usePersonal,
      body.age || "",
      body.dob || "",
      body.financialStatus || "",
      body.healthStatus || "",
      body.customNotes || "",
      now
    ]);
  } else {
    var row = [
      body.name || "",
      body.workType || "",
      body.routineType || "",
      body.commuteTime || "",
      usePersonal,
      body.age || "",
      body.dob || "",
      body.financialStatus || "",
      body.healthStatus || "",
      body.customNotes || "",
      now
    ];
    sheet.getRange(2, 2, 1, 11).setValues([row]);
  }

  return {
    userId: data.length >= 2 ? String(data[1][0] || "U1") : "U1",
    name: body.name || "",
    workType: body.workType || "",
    routineType: body.routineType || "",
    commuteTime: body.commuteTime || "",
    usePersonalData: usePersonal,
    age: body.age || "",
    dob: body.dob || "",
    financialStatus: body.financialStatus || "",
    healthStatus: body.healthStatus || "",
    customNotes: body.customNotes || "",
    updatedAt: Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss")
  };
}

function handleCreateTask(body) {
  var title = (body.title || "").trim();
  if (!title) {
    throw new Error("Task title is required");
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TASK_SHEET_NAME);
  var taskId = "T" + new Date().getTime();

  var row = [
    taskId,                        // A: Task_ID
    title,                         // B: Task
    body.type || "Task",           // C: Type
    body.area || "",               // D: Area
    body.dueDate || "",            // E: Due Date
    body.notes || "",              // F: Notes
    body.projectId || "",          // G: Project_ID
    "",                            // H: Maslow (auto-filled by classification)
    "",                            // I: Impact
    "",                            // J: Effort
    "",                            // K: Time Estimate
    "",                            // L: Urgency
    "",                            // M: Type Derived
    "",                            // N: Confidence
    "",                            // O: Priority
    "",                            // P: Fit
    body.status || "Pending",      // Q: Status
    "",                            // R: Source
    "",                            // S: (reserved)
    "",                            // T: (reserved)
    ""                             // U: Completed At
  ];

  sheet.appendRow(row);

  // Run classification on the new task
  try {
    classifyTasks();
    calculatePriorityScores();
    calculateFitScores();
  } catch (e) {
    Logger.log("Post-create classification failed: " + e);
  }

  // Re-read the created task with computed fields
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === taskId) {
      return mapRowToTask(data[i]);
    }
  }

  return { id: taskId, title: body.title, status: "Pending" };
}

function handleUpdateTaskStatus(taskId, newStatus) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var taskSheet = ss.getSheetByName(TASK_SHEET_NAME);
  var todaySheet = ss.getSheetByName("Today_View");
  var data = taskSheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(taskId)) {
      taskSheet.getRange(i + 1, 17).setValue(newStatus);

      if (newStatus === "Done") {
        taskSheet.getRange(i + 1, 21).setValue(new Date());
      } else {
        taskSheet.getRange(i + 1, 21).setValue("");
      }

      break;
    }
  }

  // Also sync Today_View
  if (todaySheet) {
    var todayData = todaySheet.getDataRange().getValues();
    for (var j = 1; j < todayData.length; j++) {
      if (String(todayData[j][0]) === String(taskId)) {
        todaySheet.getRange(j + 1, 6).setValue(newStatus);
        break;
      }
    }
  }

  return { taskId: taskId, status: newStatus };
}

function handleDeleteTask(taskId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TASK_SHEET_NAME);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(taskId)) {
      // Soft-delete: set status to "Deleted" (col Q=17) and completedAt (col U=21)
      sheet.getRange(i + 1, 17).setValue("Deleted");
      sheet.getRange(i + 1, 21).setValue(new Date());
      return { deleted: true, taskId: taskId };
    }
  }

  return { deleted: false, taskId: taskId };
}

function handleCreateProject(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var projectSheet = ss.getSheetByName("Projects");
  var taskSheet = ss.getSheetByName(TASK_SHEET_NAME);

  var now = new Date();
  var projectId = "P" + now.getTime();

  projectSheet.appendRow([
    projectId,
    body.title || "",
    body.description || "",
    "Active",
    body.priority || "",
    now,
    "",
    now,
    now
  ]);

  // Generate subtasks
  var subtaskTexts;
  var taskText = body.title || "";
  var area = body.area || "";
  var notes = body.description || "";

  var cacheKey = "SUBTASK_" + taskText;
  var cached = getFromCache(cacheKey);

  if (cached && cached.subtasks) {
    subtaskTexts = cached.subtasks;
  } else {
    var isComplex = taskText.length > 40 || taskText.includes(" and ");
    if (isComplex) {
      try {
        subtaskTexts = generateSubtasksAI(taskText, area, notes);
        saveToCache(cacheKey, { maslow: "", impact: "", effort: "", subtasks: subtaskTexts });
      } catch (e) {
        subtaskTexts = generateSubtasks(taskText);
      }
    } else {
      subtaskTexts = generateSubtasks(taskText);
    }
  }

  var subtasks = [];
  subtaskTexts.forEach(function (subtask) {
    // Normalize: AI may return objects like {subtask: "..."}
    var subtaskTitle = typeof subtask === "string" ? subtask : (subtask.subtask || subtask.title || subtask.text || subtask.name || JSON.stringify(subtask));
    var subId = "T" + new Date().getTime() + Math.floor(Math.random() * 1000);
    taskSheet.appendRow([subId, subtaskTitle, "Task", area, "", "", projectId, "", "", "", "", "", "", "", "", "", "Pending"]);
    subtasks.push({
      id: subId,
      title: subtaskTitle,
      type: "Task",
      area: area,
      projectId: projectId,
      status: "Pending"
    });
    Utilities.sleep(10); // Ensure unique timestamps
  });

  // Run classification on new subtasks
  try {
    classifyTasks();
    calculatePriorityScores();
    calculateFitScores();
  } catch (e) {
    Logger.log("Post-project classification failed: " + e);
  }

  return {
    id: projectId,
    title: body.title,
    description: body.description || "",
    status: "Active",
    progress: 0,
    subtasks: subtasks,
    createdAt: now.toISOString()
  };
}

function handleUpdateProject(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var projectSheet = ss.getSheetByName("Projects");
  var data = projectSheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.projectId)) {
      if (body.title) projectSheet.getRange(i + 1, 2).setValue(body.title);
      if (body.description) projectSheet.getRange(i + 1, 3).setValue(body.description);
      if (body.status) projectSheet.getRange(i + 1, 4).setValue(body.status);
      projectSheet.getRange(i + 1, 9).setValue(new Date());
      return { projectId: body.projectId, updated: true };
    }
  }

  return { projectId: body.projectId, updated: false };
}

function handleDeleteProject(projectId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var projectSheet = ss.getSheetByName("Projects");
  var data = projectSheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(projectId)) {
      projectSheet.deleteRow(i + 1);
      return { deleted: true, projectId: projectId };
    }
  }

  return { deleted: false, projectId: projectId };
}

function handleSaveDailyState(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stateSheet = ss.getSheetByName("Daily_State");
  if (!stateSheet) throw new Error("Daily_State sheet not found");

  var lastRow = stateSheet.getLastRow();
  var dateStr = body.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var availMins = (body.availableTime != null && body.availableTime !== "") ? Number(body.availableTime) : 120;
  var energyVal = body.energy || 5;
  var moodVal = body.mood || 5;
  var focusVal = body.focus || 5;
  var notesVal = (body.notes != null && body.notes !== undefined) ? String(body.notes) : "";

  // Read all 6 columns explicitly to always include Available_Time
  var data = lastRow >= 1 ? stateSheet.getRange(1, 1, lastRow, 6).getValues() : [];

  // Check if entry for this date already exists
  for (var i = 1; i < data.length; i++) {
    var rowDate = data[i][0];
    if (rowDate) {
      var formatted = Utilities.formatDate(new Date(rowDate), Session.getScriptTimeZone(), "yyyy-MM-dd");
      if (formatted === dateStr) {
        // Update existing row — write all 5 data columns at once (B:F)
        stateSheet.getRange(i + 1, 2, 1, 5).setValues([[energyVal, moodVal, focusVal, notesVal, availMins]]);
        return { id: String(i), date: dateStr, energy: energyVal, mood: moodVal, focus: focusVal, notes: notesVal, availableTime: availMins };
      }
    }
  }

  // Create new entry
  stateSheet.appendRow([new Date(dateStr), energyVal, moodVal, focusVal, notesVal, availMins]);

  return {
    id: String(data.length),
    date: dateStr,
    energy: energyVal,
    mood: moodVal,
    focus: focusVal,
    notes: notesVal,
    availableTime: availMins
  };
}

/***********************
 * CLEANUP: fix {subtask=...} titles + re-score all tasks
 ***********************/
function handleCleanupTasks() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TASK_SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var fixedCount = 0;

  // Pass 1: Fix corrupted titles like {subtask=Some text.}
  for (var i = 1; i < data.length; i++) {
    var title = String(data[i][1] || "");
    // Match patterns: {subtask=..., key=value} or {subtask=...}
    var match = title.match(/^\{subtask=(.+?)(?:,\s*\w+=.*)?\}$/);
    if (match) {
      sheet.getRange(i + 1, 2).setValue(match[1].trim());
      fixedCount++;
    }
  }

  // Pass 1b: Delete rows with empty titles (iterate backwards to avoid index shift)
  var deletedCount = 0;
  var refreshData = sheet.getDataRange().getValues();
  for (var d = refreshData.length - 1; d >= 1; d--) {
    var t = String(refreshData[d][1] || "").trim();
    if (!t) {
      sheet.deleteRow(d + 1);
      deletedCount++;
    }
  }

  // Pass 2: Clear stale classification data so everything gets re-scored
  var finalData = sheet.getDataRange().getValues();
  var rowCount = finalData.length - 1;
  if (rowCount > 0) {
    // Clear columns H-N (Maslow, Impact, Effort, TimeEstimate, Urgency, TypeDerived, Confidence)
    sheet.getRange(2, 8, rowCount, 7).clearContent();
    // Clear column R (Source)
    sheet.getRange(2, 18, rowCount, 1).clearContent();
  }

  // Pass 3: Run full pipeline
  classifyTasks();
  calculatePriorityScores();
  calculateFitScores();

  return { fixedTitles: fixedCount, deletedEmpty: deletedCount, totalTasks: rowCount, message: "Cleanup complete" };
}

function handleCreateInput(body) {
  var inputType = body.type || "task";
  var text = body.text || "";

  if (inputType === "project") {
    var project = handleCreateProject({
      title: text,
      description: body.notes || "",
      area: body.area || ""
    });
    return { project: project };
  } else {
    var task = handleCreateTask({
      title: text,
      type: body.taskType || "Task",
      area: body.area || "",
      notes: body.notes || ""
    });
    return { task: task };
  }
}

/***********************
 * ANALYZE INPUT (AI)
 ***********************/
function handleAnalyzeInput(body) {
  var text = (body.text || "").trim();
  var area = (body.area || "").trim();
  var aiEnabled = body.aiEnabled !== false;

  if (!text) {
    return { error: "Text is required" };
  }

  // Step 1: Rule-based analysis (always runs — instant)
  var rule = ruleBasedClassificationAdvanced(text, "");
  var type = looksLikeProjectGAS(text) ? "project" : "task";
  var category = deriveCategoryFromRule(rule);
  var priority = derivePriorityFromRule(rule);
  var estimatedTime = deriveTime(text);
  var subtasks = [];
  var confidence = rule.confidence;
  var source = "RULE";

  // Step 2: AI analysis (if enabled)
  if (aiEnabled) {
    try {
      var aiResult = analyzeInputWithAI(text, area);
      if (aiResult) {
        type = aiResult.type || type;
        category = aiResult.category || category;
        priority = aiResult.priority || priority;
        estimatedTime = aiResult.estimatedTime || estimatedTime;
        if (aiResult.subtasks && aiResult.subtasks.length > 0) {
          subtasks = aiResult.subtasks;
        }
        confidence = 0.9;
        source = "AI";
      }
    } catch (e) {
      Logger.log("AI analysis failed, using rule-based: " + e);
    }
  }

  // If project detected and no subtasks yet, generate them
  if (type === "project" && subtasks.length === 0) {
    try {
      if (aiEnabled) {
        subtasks = generateSubtasksAI(text, area, "");
      } else {
        subtasks = generateSubtasks(text);
      }
    } catch (e) {
      subtasks = generateSubtasks(text);
    }
  }

  // Normalize subtasks to plain strings (AI may return objects like {subtask: "..."} )
  var normalizedSubtasks = subtasks.map(function(st) {
    if (typeof st === "string") return st;
    return st.subtask || st.title || st.text || st.name || JSON.stringify(st);
  });

  return {
    type: type,
    title: text,
    area: area,
    category: category,
    priority: priority,
    estimatedTime: estimatedTime,
    subtasks: normalizedSubtasks,
    confidence: confidence,
    source: source
  };
}

function analyzeInputWithAI(text, area) {
  var apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  if (!apiKey) return null;

  var payload = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a productivity assistant that analyzes user input.\n" +
          "Determine if the input is a task or project, and classify it.\n" +
          "Return ONLY valid JSON with these fields:\n" +
          '{\n' +
          '  "type": "task" or "project",\n' +
          '  "category": one of "Deep Work", "Light Work", "Admin", "Recovery",\n' +
          '  "priority": "Low", "Medium", or "High",\n' +
          '  "estimatedTime": e.g. "30 minutes", "1 hour", "2 hours", "4 hours", "1 day",\n' +
          '  "subtasks": [] (array of strings, only if type is "project", 4-6 items)\n' +
          "}"
      },
      {
        role: "user",
        content: "Input: " + text + (area ? "\nArea: " + area : "")
      }
    ]
  };

  var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var json = JSON.parse(response.getContentText());
  if (!json.choices || !json.choices[0]) return null;

  var content = json.choices[0].message.content.replace(/```json|```/g, "").trim();
  return JSON.parse(content);
}

function looksLikeProjectGAS(text) {
  var lower = text.toLowerCase();
  var keywords = ["build", "create", "design", "develop", "launch", "plan", "setup", "implement", "redesign", "migrate", "app", "website", "system", "platform", "project"];
  var count = 0;
  for (var i = 0; i < keywords.length; i++) {
    if (lower.indexOf(keywords[i]) >= 0) count++;
  }
  return count >= 2;
}

function deriveCategoryFromRule(rule) {
  if (rule.effort >= 7) return "Deep Work";
  if (rule.effort <= 3) return "Light Work";
  if (rule.maslow === "Physiological") return "Recovery";
  return "Admin";
}

function derivePriorityFromRule(rule) {
  if (rule.impact >= 8) return "High";
  if (rule.impact >= 5) return "Medium";
  return "Low";
}

/***********************
 * ROW → OBJECT MAPPER
 ***********************/
function mapRowToTask(row) {
  var taskId = String(row[0] || "");
  // Derive createdAt from Task_ID timestamp (e.g. "T1711612345678" → epoch millis)
  var createdAt = "";
  var tsMatch = taskId.match(/^T(\d{13,})$/);
  if (tsMatch) {
    createdAt = new Date(Number(tsMatch[1])).toISOString();
  }
  return {
    id: taskId,
    title: String(row[1] || ""),
    type: String(row[2] || ""),
    area: String(row[3] || ""),
    dueDate: row[4] ? (row[4] instanceof Date ? row[4].toISOString() : String(row[4])) : "",
    notes: String(row[5] || ""),
    projectId: String(row[6] || ""),
    maslow: String(row[7] || ""),
    impact: Number(row[8]) || 0,
    effort: Number(row[9]) || 0,
    timeEstimate: String(row[10] || ""),
    urgency: String(row[11] || ""),
    category: String(row[12] || ""),
    confidence: Number(row[13]) || 0,
    priority: Number(row[14]) || 0,
    fitScore: Number(row[15]) || 0,
    status: String(row[16] || "Pending"),
    source: String(row[17] || ""),
    completedAt: row[20] ? (row[20] instanceof Date ? row[20].toISOString() : String(row[20])) : "",
    createdAt: createdAt,
    updatedAt: createdAt
  };
}

/***********************
 * MAIN ENTRY
 ***********************/
function classifyTasksInstant() {
  classifyTasks();
}

/***********************
 * MAIN CLASSIFICATION ENGINE (UPGRADED)
 ***********************/
function classifyTasks() {

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TASK_SHEET_NAME);
  var data = sheet.getDataRange().getValues();

  var maslowUpdates = [];
  var impactUpdates = [];
  var effortUpdates = [];
  var timeUpdates = [];
  var urgencyUpdates = [];
  var typeUpdates = [];
  var confidenceUpdates = [];
  var sourceUpdates = [];
  var statusUpdates = [];

  var MAX_AI_CALLS = 3;
  var aiCount = 0;

  var batchTasks = [];
  var batchIndexes = [];
  var batchSize = 10;

  for (var i = 1; i < data.length; i++) {

    var task = normalizeTask(data[i][1], i + 1);
    var userType = clean(data[i][2]);
    var area = clean(data[i][3]);
    var notes = clean(data[i][5]);

    var currentStatus = clean(data[i][16]) || "Pending";

    if (!task) {
      pushEmptyAll(
        maslowUpdates, impactUpdates, effortUpdates,
        timeUpdates, urgencyUpdates, typeUpdates,
        confidenceUpdates, sourceUpdates
      );
      statusUpdates.push([""]);
      continue;
    }

    // PROJECT HANDLING (FIXED)
    if (userType === "Project") {

      var projectId = clean(data[i][6]);

      if (!projectId) {
        createProject(task, area, notes, i + 1);
      }

      pushEmptyAll(
        maslowUpdates, impactUpdates, effortUpdates,
        timeUpdates, urgencyUpdates, typeUpdates,
        confidenceUpdates, sourceUpdates
      );

      statusUpdates.push([currentStatus]);
      continue;
    }

    // RULE ENGINE
    var rule = ruleBasedClassificationAdvanced(task, userType);

    var useAI = false;
    var ENABLE_AI = true;

    if (ENABLE_AI && rule.confidence < 0.4 && rule.isComplex && aiCount < MAX_AI_CALLS) {
      useAI = true;
    }

    var cached = getFromCache(task);

    if (cached) {
      pushRowFull(
        maslowUpdates, impactUpdates, effortUpdates,
        timeUpdates, urgencyUpdates, typeUpdates,
        confidenceUpdates, sourceUpdates,
        cached.maslow, cached.impact, cached.effort,
        deriveTime(task),
        deriveUrgency(task),
        deriveType(task, userType),
        0.95,
        "CACHE"
      );

      statusUpdates.push([currentStatus]);
      continue;
    }

    if (useAI && aiCount < MAX_AI_CALLS) {

      batchTasks.push({ task: task, area: area, notes: notes });
      batchIndexes.push(i);

      maslowUpdates.push([""]);
      impactUpdates.push([""]);
      effortUpdates.push([""]);
      timeUpdates.push([""]);
      urgencyUpdates.push([""]);
      typeUpdates.push([""]);
      confidenceUpdates.push([""]);
      sourceUpdates.push([""]);

      statusUpdates.push([currentStatus]);
      continue;
    }

    pushRowFull(
      maslowUpdates, impactUpdates, effortUpdates,
      timeUpdates, urgencyUpdates, typeUpdates,
      confidenceUpdates, sourceUpdates,
      rule.maslow, rule.impact, rule.effort,
      deriveTime(task),
      deriveUrgency(task),
      deriveType(task, userType),
      rule.confidence,
      "RULE"
    );

    statusUpdates.push([currentStatus]);
  }

  // AI BATCH
  for (var b = 0; b < batchTasks.length; b += batchSize) {

    var slice = batchTasks.slice(b, b + batchSize);
    var indexSlice = batchIndexes.slice(b, b + batchSize);

    try {

      Utilities.sleep(1500);
      var aiResults = classifyWithAIBatch(slice);

      for (var j = 0; j < aiResults.length; j++) {

        var originalIndex = indexSlice[j] - 1;
        var result = aiResults[j];

        maslowUpdates[originalIndex] = [result.maslow || "Self-Actualization"];
        impactUpdates[originalIndex] = [clamp(result.impact, 1, 10)];
        effortUpdates[originalIndex] = [clamp(result.effort, 1, 10)];

        timeUpdates[originalIndex] = [deriveTime(slice[j].task)];
        urgencyUpdates[originalIndex] = [deriveUrgency(slice[j].task)];
        typeUpdates[originalIndex] = [deriveType(slice[j].task, "")];

        confidenceUpdates[originalIndex] = [0.9];
        sourceUpdates[originalIndex] = ["AI_BATCH"];

        saveToCache(slice[j].task, result);
      }

      aiCount += aiResults.length;

    } catch (e) {
      Logger.log("Batch AI failed: " + e);
    }
  }

  // WRITE
  if (maslowUpdates.length > 0) {
    sheet.getRange(2, 8, maslowUpdates.length, 1).setValues(maslowUpdates);
    sheet.getRange(2, 9, impactUpdates.length, 1).setValues(impactUpdates);
    sheet.getRange(2, 10, effortUpdates.length, 1).setValues(effortUpdates);
    sheet.getRange(2, 11, timeUpdates.length, 1).setValues(timeUpdates);
    sheet.getRange(2, 12, urgencyUpdates.length, 1).setValues(urgencyUpdates);
    sheet.getRange(2, 13, typeUpdates.length, 1).setValues(typeUpdates);
    sheet.getRange(2, 14, confidenceUpdates.length, 1).setValues(confidenceUpdates);
    sheet.getRange(2, 18, sourceUpdates.length, 1).setValues(sourceUpdates);
    sheet.getRange(2, 17, statusUpdates.length, 1).setValues(statusUpdates);
  }

  Logger.log("AI calls used (batch): " + aiCount);
}

function generateSmartTodayView() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var taskSheet = ss.getSheetByName("Task_Database");
  var todaySheet = ss.getSheetByName("Today_View");
  var profileSheet = ss.getSheetByName("User_Profile");
  var stateSheet = ss.getSheetByName("Daily_State");
  var projectSheet = ss.getSheetByName("Projects");

  var data = taskSheet.getDataRange().getValues();
  var profileData = profileSheet.getDataRange().getValues();
  var projectData = projectSheet.getDataRange().getValues();

  var projectPriorityMap = {};

  for (var i = 1; i < projectData.length; i++) {
    var pid = projectData[i][0];
    var pPriority = Number(projectData[i][4]);
    projectPriorityMap[pid] = pPriority || 0;
  }

  var profile = profileData[1];

  // Read last daily state — explicitly get 6 columns to include Available_Time (col F)
  var stateLastRow = stateSheet.getLastRow();
  var stateRow = stateLastRow >= 2 ? stateSheet.getRange(stateLastRow, 1, 1, 6).getValues()[0] : [null, 5, 5, 5, "", 120];

  var energy = toLevel(stateRow[1]);
  var availableMinutes = stateRow[5] ? Number(stateRow[5]) : 120;

  var tasks = [];

  for (var i = 1; i < data.length; i++) {

    var task = data[i][1];
    var priority = Number(data[i][14]);
    var fit = Number(data[i][15]);
    var status = clean(data[i][16]);
    var projectId = data[i][6];
    var taskId = data[i][0];
    var effort = Number(data[i][9]) || 5;
    var timeEstStr = String(data[i][10] || "");

    if (!task || status === "Done") continue;

    var projectPriority = projectPriorityMap[projectId] || 0;
    var adjustedPriority = adjustPriorityWithProject(priority, projectPriority);

    var category = getCategory(adjustedPriority, fit, energy);

    // Parse time estimate: column K may be "30 min", "1 hour", "2h", "90", etc.
    var taskMins = parseTimeEstimate(timeEstStr, effort);

    tasks.push([taskId, task, adjustedPriority, fit, category, "Pending", taskMins]);
  }

  tasks.sort(function (a, b) { return b[2] - a[2]; });

  // Pick tasks that fit within the available time budget
  var output = [["Task_ID", "Task", "Priority", "Fit", "Category", "Status"]];
  var totalMins = 0;

  for (var j = 0; j < tasks.length; j++) {
    var tMins = tasks[j][6];
    if (totalMins + tMins > availableMinutes && output.length > 1) break;
    totalMins += tMins;
    output.push([tasks[j][0], tasks[j][1], tasks[j][2], tasks[j][3], tasks[j][4], tasks[j][5]]);
  }

  todaySheet.clear();
  todaySheet.getRange(1, 1, output.length, 6).setValues(output);

  Logger.log("Today View Generated: " + (output.length - 1) + " tasks, " + totalMins + "/" + availableMinutes + " min");
}

/**
 * Parse a time-estimate string into minutes.
 * Accepts formats like "30 min", "1 hour", "2h", "1.5h", "90", "1h 30m".
 * Falls back to effort-based estimate if empty or unparseable.
 */
function parseTimeEstimate(str, effort) {
  if (!str || str.trim() === "") {
    // Fallback: estimate from effort (1-10)
    if (effort <= 3) return 30;
    if (effort <= 6) return 60;
    return 120;
  }
  var s = str.toLowerCase().trim();
  var total = 0;

  // Match hours component: "2h", "2 hours", "1.5 hour"
  var hMatch = s.match(/(\d+\.?\d*)\s*h(?:ours?|r)?/);
  if (hMatch) total += parseFloat(hMatch[1]) * 60;

  // Match minutes component: "30m", "30 min", "45 minutes"
  var mMatch = s.match(/(\d+)\s*m(?:in(?:utes?)?)?/);
  if (mMatch) total += parseInt(mMatch[1], 10);

  // If only a plain number, treat as minutes
  if (total === 0) {
    var num = parseFloat(s);
    if (!isNaN(num)) return num > 0 ? num : 60;
    // Unparseable, fallback
    if (effort <= 3) return 30;
    if (effort <= 6) return 60;
    return 120;
  }
  return total;
}

function generateSmartTodayView_AI() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var taskSheet = ss.getSheetByName("Task_Database");
  var todaySheet = ss.getSheetByName("Today_View");
  var profileSheet = ss.getSheetByName("User_Profile");
  var stateSheet = ss.getSheetByName("Daily_State");
  var projectSheet = ss.getSheetByName("Projects");

  var data = taskSheet.getDataRange().getValues();
  var profileData = profileSheet.getDataRange().getValues();
  var stateData = stateSheet.getDataRange().getValues();
  var projectData = projectSheet.getDataRange().getValues();

  var projectPriorityMap = {};
  for (var i = 1; i < projectData.length; i++) {
    projectPriorityMap[projectData[i][0]] = Number(projectData[i][4]) || 0;
  }

  var profile = profileData[1];
  var lastState = stateData[stateData.length - 1];

  // Available time now comes from Daily_State col F (minutes), not profile
  var stateLastRow = stateSheet.getLastRow();
  var stateRow = stateLastRow >= 2 ? stateSheet.getRange(stateLastRow, 1, 1, 6).getValues()[0] : [null, 5, 5, 5, "", 120];
  var availableMinutes = stateRow[5] ? Number(stateRow[5]) : 120;
  var energy = lastState[1];

  // Convert minutes to a descriptive label for the AI prompt
  var availableTime = availableMinutes <= 60 ? "Low" : (availableMinutes >= 240 ? "High" : "Medium");
  var maxTasks = Math.max(3, Math.round(availableMinutes / 30));

  var taskList = [];

  for (var i = 1; i < data.length; i++) {

    var task = data[i][1];
    var priority = Number(data[i][14]);
    var fit = Number(data[i][15]);
    var status = data[i][16];
    var projectId = data[i][6];
    var taskId = data[i][0];

    if (!task || status === "Done") continue;

    taskList.push({
      taskId: taskId,
      task: task,
      priority: priority,
      fit: fit,
      projectPriority: projectPriorityMap[projectId] || 0
    });
  }

  var aiResponse = callOpenAI(taskList, energy, availableTime, maxTasks);

  var selectedTasks = JSON.parse(aiResponse);

  var output = [["Task_ID", "Task", "Priority", "Fit", "Category", "Status"]];

  selectedTasks.forEach(function (t) {
    output.push([
      t.taskId,
      t.task,
      t.priority,
      t.fit,
      t.category,
      "Pending"
    ]);
  });

  todaySheet.clear();
  todaySheet.getRange(1, 1, output.length, 6).setValues(output);

  Logger.log("AI Today View Generated");
}

function callOpenAI(taskList, energy, availableTime, maxTasks) {

  var apiKey = PropertiesService
    .getScriptProperties()
    .getProperty("OPENAI_API_KEY");

  var prompt = `
      You are an intelligent productivity assistant.

      User Context:
      - Energy Level: ${energy}
      - Available Time: ${availableTime}

      Tasks:
      ${JSON.stringify(taskList)}

      Your job:
      1. Select best ${maxTasks} tasks for today
      2. Balance:
        - High priority tasks
        - Suitable for current energy
        - Avoid overload
      3. Assign category:
        - Deep Work
        - Light Work
        - Admin
        - Recovery

      Return ONLY JSON array:
      [
        {
          "taskId": "",
          "task": "",
          "priority": number,
          "fit": number,
          "category": ""
        }
      ]
      `;

  var payload = {
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "You are a smart task planner." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", options);
  var result = JSON.parse(response.getContentText());

  return result.choices[0].message.content;
}

/***********************
 * SYNC FUNCTION
 ***********************/
function onEdit(e) {

  if (!e) {
    Logger.log("onEdit triggered without event object (manual run)");
    return;
  }

  var sheet = e.source.getActiveSheet();
  var sheetName = sheet.getName();

  if (sheetName !== "Today_View") return;

  var range = e.range;
  var col = range.getColumn();
  var row = range.getRow();

  if (col !== 6 || row === 1) return;

  var newStatus = (e.value || "").toString().trim();
  if (!newStatus) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var todaySheet = ss.getSheetByName("Today_View");
  var taskSheet = ss.getSheetByName("Task_Database");

  var taskId = todaySheet.getRange(row, 1).getValue();
  if (!taskId) return;

  var data = taskSheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {

    if (data[i][0] == taskId) {

      taskSheet.getRange(i + 1, 17).setValue(newStatus);
      taskSheet.getRange(i + 1, 21).setValue(new Date());

      break;
    }
  }

  Logger.log("Status Synced for Task_ID: " + taskId);
}

/***********************
 * RULE ENGINE (ADVANCED)
 ***********************/
function ruleBasedClassificationAdvanced(task, userType) {

  var text = task.toLowerCase();

  var maslow = "Self-Actualization";
  var impact = 5;
  var effort = 4;
  var confidence = 0.4;
  var isComplex = false;

  // FINANCE
  if (text.match(/pay|bill|invoice|tax|gst|expense|budget|investment/)) {
    maslow = "Safety";
    impact = 8;
    effort = 2;
    confidence += 0.4;
  }

  // COMMUNICATION
  if (text.match(/call|email|message|meet|follow up|contact/)) {
    maslow = "Love";
    impact = 6;
    effort = 2;
    confidence += 0.4;
  }

  // HEALTH
  if (text.match(/doctor|health|sleep|gym|exercise|walk|meditation|diet/)) {
    maslow = "Physiological";
    impact = 9;
    effort = 3;
    confidence += 0.4;
  }

  // HOME / FIX
  if (text.match(/fix|repair|clean|organize|maintenance|service/)) {
    maslow = "Safety";
    impact = 8;
    effort = 5;
    confidence += 0.4;
  }

  // LEARNING
  if (text.match(/learn|study|read|course|practice|tutorial/)) {
    maslow = "Esteem";
    impact = 7;
    effort = 5;
    confidence += 0.3;
  }

  // STARTUP / PRODUCT
  if (text.match(/build|create|develop|launch|mvp|startup|product/)) {
    maslow = "Self-Actualization";
    impact = 9;
    effort = 7;
    confidence += 0.3;
    isComplex = true;
  }

  // CAREER
  if (text.match(/resume|interview|job|internship|networking/)) {
    maslow = "Esteem";
    impact = 8;
    effort = 5;
    confidence += 0.3;
  }

  // RELATIONSHIPS
  if (text.match(/family|friend|parents|birthday|relationship/)) {
    maslow = "Love";
    impact = 7;
    effort = 2;
    confidence += 0.3;
  }

  // CONTENT / CREATION
  if (text.match(/write|blog|video|content|youtube|record|edit/)) {
    maslow = "Esteem";
    impact = 7;
    effort = 6;
    confidence += 0.3;
  }

  // COMPLEXITY DETECTION
  if (text.includes(" and ") || text.includes(" then ") || text.length > 80) {
    isComplex = true;
    confidence -= 0.2;
  }

  // SELF-LEARNING (CACHE BOOST)
  var cached = getFromCache(task);
  if (cached) {
    return {
      maslow: cached.maslow,
      impact: cached.impact,
      effort: cached.effort,
      confidence: 0.95,
      isComplex: false
    };
  }
  confidence = Math.min(Math.max(confidence, 0), 1);
  return { maslow: maslow, impact: impact, effort: effort, confidence: confidence, isComplex: isComplex };
}

/***********************
 * DERIVED FIELDS (NO AI)
 ***********************/
function deriveTime(task) {
  var text = task.toLowerCase();

  if (text.match(/call|email|message/)) return "10 mins";
  if (text.match(/read|review/)) return "20 mins";
  if (text.match(/write|prepare/)) return "45 mins";
  if (text.match(/build|develop|create/)) return "2 hours";

  return "30 mins";
}

function deriveUrgency(task) {
  var text = task.toLowerCase();

  if (text.includes("today") || text.includes("urgent")) return "High";
  if (text.includes("week")) return "Low";

  return "Medium";
}

function deriveType(task, userType) {

  if (userType) return userType;

  var text = task.toLowerCase();

  if (text.includes("fix") || text.includes("issue")) return "Problem";
  if (text.includes("idea")) return "Idea";
  if (text.includes("plan") || text.includes("build")) return "Project";

  return "Task";
}

/***********************
 * AI CALL (MINIMAL)
 ***********************/
function tryAI(task, area, notes) {

  try {
    Utilities.sleep(1200);
    return classifyWithAI(task, area, notes);
  } catch (e) {
    Logger.log("AI failed: " + e);
    return null;
  }
}

function classifyWithAIBatch(tasksArray) {

  var apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  var payload = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a task classification engine.\n" +
          "For each task return JSON array with:\n" +
          "maslow, impact (1-10), effort (1-10).\n" +
          "Return ONLY JSON array."
      },
      {
        role: "user",
        content: JSON.stringify(tasksArray)
      }
    ]
  };

  var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify(payload)
  });

  var json = JSON.parse(response.getContentText());
  var content = json.choices[0].message.content.replace(/```json|```/g, "").trim();

  return JSON.parse(content);
}

function classifyWithAI(taskText, area, notes) {

  var apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  var payload = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Classify task into maslow, impact (1-10), effort (1-10). Return JSON only."
      },
      {
        role: "user",
        content: "Task: " + taskText + "\nArea: " + area + "\nNotes: " + notes
      }
    ]
  };

  var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify(payload)
  });

  var json = JSON.parse(response.getContentText());
  var content = json.choices[0].message.content.replace(/```json|```/g, "").trim();
  var parsed = JSON.parse(content);

  return {
    maslow: parsed.maslow || "Self-Actualization",
    impact: clamp(parsed.impact, 1, 10),
    effort: clamp(parsed.effort, 1, 10)
  };
}

/***********************
 * CACHE SYSTEM
 ***********************/
function getFromCache(task) {

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CACHE_SHEET_NAME);
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  var hash = generateHash(task);

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === hash) {

      var rawSubtasks = data[i][5];
      var parsedSubtasks = null;

      if (rawSubtasks && typeof rawSubtasks === "string" && rawSubtasks.startsWith("[")) {
        try {
          parsedSubtasks = JSON.parse(rawSubtasks);
        } catch (e) {
          parsedSubtasks = null;
        }
      }

      return {
        maslow: data[i][2],
        impact: data[i][3],
        effort: data[i][4],
        subtasks: parsedSubtasks
      };
    }
  }

  return null;
}

function saveToCache(task, result) {

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CACHE_SHEET_NAME);
  if (!sheet) return;

  var hash = generateHash(task);

  sheet.appendRow([
    hash,
    task,
    result.maslow || "",
    result.impact || "",
    result.effort || "",
    result.subtasks ? JSON.stringify(result.subtasks) : "",
    new Date()
  ]);
}

function generateHash(text) {
  return Utilities.base64Encode(text.toLowerCase());
}

function calculatePriorityScores() {

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Task_Database");
  var data = sheet.getDataRange().getValues();

  var updates = [];

  for (var i = 1; i < data.length; i++) {

    var maslow = clean(data[i][7]);
    var impact = Number(data[i][8]);
    var effort = Number(data[i][9]);
    var urgency = clean(data[i][11]);

    if (!maslow || !impact || !effort) {
      updates.push([""]);
      continue;
    }

    var maslowWeight = getMaslowWeight(maslow);
    var urgencyWeight = getUrgencyWeight(urgency);

    var score = (impact * 2) + maslowWeight + urgencyWeight - effort;

    updates.push([Math.round(score)]);
  }

  if (updates.length > 0) {
    sheet.getRange(2, 15, updates.length, 1).setValues(updates);
  }

  Logger.log("Professional Priority Scores Calculated");
}

function calculateFitScores() {

  var taskSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Task_Database");
  var stateSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Daily_State");

  var taskData = taskSheet.getDataRange().getValues();
  var stateData = stateSheet.getDataRange().getValues();

  if (stateData.length < 2) {
    Logger.log("No Daily_State data");
    return;
  }

  var lastState = stateData[stateData.length - 1];

  var energy = toLevel(lastState[1]);
  var mood = toLevel(lastState[2]);
  var focus = toLevel(lastState[3]);

  var updates = [];

  for (var i = 1; i < taskData.length; i++) {

    var effort = Number(taskData[i][9]);
    var estimated_time = clean(taskData[i][10]);

    if (!effort || !estimated_time) {
      updates.push([""]);
      continue;
    }

    var fitScore = 5;

    if (energy === "Low") {
      if (effort <= 3) fitScore += 3;
      if (effort >= 7) fitScore -= 3;
    }

    if (energy === "Medium") {
      if (effort >= 4 && effort <= 6) fitScore += 2;
    }

    if (energy === "High") {
      fitScore += 1;
      if (effort >= 6) fitScore += 2;
    }

    if (focus === "Low") {
      if (estimated_time.includes("hour")) fitScore -= 2;
      if (estimated_time.includes("mins")) fitScore += 2;
    }

    if (focus === "High") {
      if (estimated_time.includes("hour")) fitScore += 2;
    }

    if (mood === "Low") {
      if (effort >= 6) fitScore -= 2;
      if (effort <= 3) fitScore += 1;
    }

    if (mood === "High") {
      fitScore += 1;
    }

    fitScore = Math.max(1, Math.min(10, fitScore));

    updates.push([fitScore]);
  }

  if (updates.length > 0) {
    taskSheet.getRange(2, 16, updates.length, 1).setValues(updates);
  }

  Logger.log("Professional Fit Scores Calculated");
}

function runFullPipeline() {

  Logger.log("Step 1: Initial Classification");
  classifyTasks();

  Logger.log("Step 2: Re-run Classification (for new subtasks)");
  classifyTasks();

  Logger.log("Step 3: Priority Calculation");
  calculatePriorityScores();

  Logger.log("Step 4: Fit Score Calculation");
  calculateFitScores();

  Logger.log("Step 5: Generate Today View");
  generateSmartTodayView();

  Logger.log("Full Pipeline Completed");
}

/**
 * Convert a numeric value (1-10) or string to Low/Medium/High.
 */
function toLevel(val) {
  var n = Number(val);
  if (!isNaN(n) && n > 0) {
    if (n <= 3) return "Low";
    if (n <= 6) return "Medium";
    return "High";
  }
  var s = String(val || "").trim();
  if (s === "Low" || s === "Medium" || s === "High") return s;
  return "Medium";
}

function getCategory(priority, fit, energy) {

  if (energy === "Low" && priority >= 18) {
    return "Critical (Reschedule or Delegate)";
  }

  if (priority >= 18) return "Critical";
  if (priority >= 15) return "Must Do";
  if (fit >= 6 || priority >= 12) return "Can Do Now";

  return "Optional";
}

function createProject(taskText, area, notes, rowIndex) {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var projectSheet = ss.getSheetByName("Projects");
  var taskSheet = ss.getSheetByName("Task_Database");

  var now = new Date();
  var projectId = "P" + now.getTime();

  projectSheet.appendRow([
    projectId,
    taskText,
    notes || "",
    "Active",
    "",
    now,
    "",
    now,
    now
  ]);

  taskSheet.getRange(rowIndex, 7).setValue(projectId);

  var subtasks;

  var cacheKey = "SUBTASK_" + taskText;
  var cached = getFromCache(cacheKey);

  if (cached && cached.subtasks) {
    subtasks = cached.subtasks;
  } else {

    var isComplex = taskText.length > 40 || taskText.includes(" and ");

    if (isComplex) {
      try {
        subtasks = generateSubtasksAI(taskText, area, notes);

        saveToCache(cacheKey, {
          maslow: "",
          impact: "",
          effort: "",
          subtasks: subtasks
        });

      } catch (e) {
        Logger.log("AI Subtask failed, fallback: " + e);
        subtasks = generateSubtasks(taskText);
      }
    } else {
      subtasks = generateSubtasks(taskText);
    }
  }

  subtasks.forEach(function (subtask) {
    // Normalize: AI may return objects like {subtask: "..."}
    var subtaskTitle = typeof subtask === "string" ? subtask : (subtask.subtask || subtask.title || subtask.text || subtask.name || JSON.stringify(subtask));
    taskSheet.appendRow([
      "",
      subtaskTitle,
      "Task",
      area || "",
      "",
      "",
      projectId
    ]);
  });

  Logger.log("Project created: " + projectId);
}

function generateSubtasks(taskText) {

  var text = taskText.toLowerCase();

  if (text.includes("repair") || text.includes("fix")) {
    return [
      "Inspect the issue",
      "Identify required tools or technician",
      "Fix the problem",
      "Test and verify functionality"
    ];
  }

  if (text.includes("build") || text.includes("create")) {
    return [
      "Define requirements",
      "Plan the approach",
      "Execute development",
      "Test and finalize"
    ];
  }

  if (text.includes("startup") || text.includes("business")) {
    return [
      "Research market",
      "Define product/service",
      "Build MVP",
      "Launch and collect feedback"
    ];
  }

  if (text.includes("learn") || text.includes("study")) {
    return [
      "Identify learning resources",
      "Create study plan",
      "Practice regularly",
      "Review and test knowledge"
    ];
  }

  return [
    "Break down the task",
    "Execute step 1",
    "Execute step 2",
    "Complete and review"
  ];
}

function adjustPriorityWithProject(priority, projectPriority) {
  return priority + (projectPriority * 0.2);
}

function generateSubtasksAI(taskText, area, notes) {

  var apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  var payload = {
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "Break the given task into 4-6 clear actionable subtasks. " +
          "Make them practical, ordered, and concise. Return ONLY JSON array."
      },
      {
        role: "user",
        content:
          "Task: " + taskText +
          "\nArea: " + area +
          "\nNotes: " + notes
      }
    ]
  };

  var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify(payload)
  });

  var json = JSON.parse(response.getContentText());
  var content = json.choices[0].message.content.replace(/```json|```/g, "").trim();

  return JSON.parse(content);
}

/***********************
 * HELPERS
 ***********************/
function getMaslowWeight(maslow) {
  switch (maslow) {
    case "Physiological": return 5;
    case "Safety": return 4;
    case "Love": return 3;
    case "Esteem": return 2;
    default: return 1;
  }
}

function getUrgencyWeight(urgency) {
  switch (urgency) {
    case "High": return 5;
    case "Medium": return 3;
    case "Low": return 1;
    default: return 2;
  }
}

function normalizeTask(rawTask, rowIndex) {
  if (!rawTask) return "";
  return String(rawTask).trim();
}

function clean(val) {
  return val ? val.toString().trim() : "";
}

function clamp(val, min, max) {
  val = Number(val);
  if (isNaN(val)) return 5;
  return Math.max(min, Math.min(max, val));
}

function pushRowFull(mArr, iArr, eArr, tArr, uArr, tyArr, cArr, sArr, m, i, e, t, u, ty, c, s) {
  mArr.push([m]);
  iArr.push([i]);
  eArr.push([e]);
  tArr.push([t]);
  uArr.push([u]);
  tyArr.push([ty]);
  cArr.push([c]);
  sArr.push([s]);
}

function pushEmptyAll(mArr, iArr, eArr, tArr, uArr, tyArr, cArr, sArr) {
  pushRowFull(mArr, iArr, eArr, tArr, uArr, tyArr, cArr, sArr, "", "", "", "", "", "", "", "");
}
