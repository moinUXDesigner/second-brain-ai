# Google Apps Script Deployment Guide

## Setup

1. Open your Google Sheet that has: `Task_Database`, `Today_View`, `Projects`, `User_Profile`, `Daily_State`, `AI_Cache` sheets.

2. Go to **Extensions → Apps Script**.

3. Replace the existing code with the contents of `Code.gs` from this folder.

4. (Optional) Set your OpenAI API key:
   - **Project Settings → Script Properties**
   - Add key: `OPENAI_API_KEY`, value: your API key

## Deploy as Web App

1. Click **Deploy → New deployment**
2. Select type: **Web app**
3. Settings:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**
5. Copy the **Web app URL** (looks like: `https://script.google.com/macros/s/XXXXXXXXX/exec`)
6. Paste it into your React app's `.env` file as `VITE_GAS_WEB_APP_URL`

## Re-deploy after changes

After editing `Code.gs`:
1. **Deploy → Manage deployments**
2. Click the edit icon on your deployment
3. Set **Version** to "New version"
4. Click **Deploy**

## API Endpoints

### GET actions (via query param `?action=`)
| Action | Description |
|---|---|
| `getTasks` | All tasks from Task_Database |
| `getTodayTasks` | Today's curated task list |
| `getProjects` | All projects with subtasks |
| `getDailyState&date=YYYY-MM-DD` | Daily state for a date |
| `getDashboard` | Aggregated dashboard data |

### POST actions (via JSON body `{ "action": "..." }`)
| Action | Body | Description |
|---|---|---|
| `createTask` | `{ title, type?, area?, notes? }` | Create a new task |
| `updateTaskStatus` | `{ taskId, status }` | Update task status |
| `deleteTask` | `{ taskId }` | Delete a task |
| `createProject` | `{ title, description?, area? }` | Create project + subtasks |
| `updateProject` | `{ projectId, title?, status? }` | Update project |
| `deleteProject` | `{ projectId }` | Delete project |
| `saveDailyState` | `{ date, energy, mood, focus, notes? }` | Save daily state |
| `runPipeline` | `{}` | Run full classification pipeline |
| `createInput` | `{ text, type: "task"\|"project" }` | Unified input |

## Sheet Structure

### Task_Database
| Col | Field |
|---|---|
| A | Task_ID |
| B | Task (title) |
| C | Type |
| D | Area |
| E | Due Date |
| F | Notes |
| G | Project_ID |
| H | Maslow |
| I | Impact (1-10) |
| J | Effort (1-10) |
| K | Time Estimate |
| L | Urgency |
| M | Category/Type Derived |
| N | Confidence |
| O | Priority Score |
| P | Fit Score |
| Q | Status |
| R | Source |
| S-T | Reserved |
| U | Completed At |
