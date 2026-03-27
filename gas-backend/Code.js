// ==============================
// CONFIGURATION
// ==============================

const CALENDAR_ID = "c_daf29fbeae822f5c0a6213f22d8035888c97ea5faf5e31d51e34e84f9dfb0a68@group.calendar.google.com"
const SHEET_ID = "1cpW49NqBu2671vGT1zbeTqGQYVaMxluiPCzgYKR_uPQ"
const CLIENT_FOLDER_ID = "1UJZtZAWX_hF8eQmv6qyfT58eyxyL8eVG"

const API_TOKEN = "my_secure_token"


// ==============================
// API ROUTER (GET)
// ==============================

function doGet(e) {

  const action = e.parameter.action
  const token = e.parameter.token

  if (token !== API_TOKEN) {
    return jsonResponse({
      success:false,
      error:"Unauthorized"
    })
  }

  if (action === "slots") {
    return getAvailableSlots()
  }

  if (action === "createSession") {
    return createSession(e.parameter)
  }

  return jsonResponse({
    status:"API running"
  })

}


// ==============================
// API ROUTER (POST)
// ==============================

function doPost(e) {

  const data = JSON.parse(e.postData.contents)

  if (data.token !== API_TOKEN) {
    return jsonResponse({
      success:false,
      error:"Unauthorized"
    })
  }

  if (data.action === "createSession") {
    return createSession(data)
  }

  if (data.action === "slots") {
    return getAvailableSlots()
  }

  return jsonResponse({
    success:true,
    message:"API working"
  })

}


// ==============================
// AVAILABLE SLOTS
// ==============================

function getAvailableSlots() {

  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);

  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 14);

  const events = calendar.getEvents(start, end);

  const bookedSlots = events.map(e =>
    e.getStartTime().toISOString()
  );

  const slots = [];

  // 3 hour availability
  // const workingHours = [17,18,19];

  // 24 hour availability
  const workingHours = Array.from({ length: 24 }, (_, i) => i);

  for (let i = 0; i < 14; i++) {

    const day = new Date(start);
    day.setDate(start.getDate() + i);

    workingHours.forEach(hour => {

      const slot = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        hour,
        0,
        0,
        0
      );

      if (slot <= new Date()) return;

      const slotISO = slot.toISOString();

      if (!bookedSlots.includes(slotISO)) {
        slots.push(slotISO);
      }

    });

  }

  return ContentService
    .createTextOutput(JSON.stringify(slots))
    .setMimeType(ContentService.MimeType.JSON);

}


// ==============================
// CREATE SESSION
// ==============================

function createSession(data) {

  const name = data.name;
  const email = data.email;
  const age = data.age;
  const location = data.location;
  const concern = data.concern;
  const slot = new Date(data.slot);

  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);

  // Prevent double booking
  const existing = calendar.getEvents(
    slot,
    new Date(slot.getTime() + 60000)
  );

  if (existing.length > 0) {
    return jsonResponse({
      success: false,
      error: "Slot already booked"
    });
  }

  const event = calendar.createEvent(
    "Counselling Session - " + name,
    slot,
    new Date(slot.getTime() + 60 * 60 * 1000),
    {
      description:
        "Counselling session\n\n" +
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Age: " + age + "\n" +
        "Location: " + location + "\n" +
        "Concern: " + concern,
      guests: email,
      sendInvites: true
    }
  );

 


  // Generate unique client ID
  const clientID = Utilities.getUuid();

  const folder = DriveApp
    .getFolderById(CLIENT_FOLDER_ID)
    .createFolder(clientID + "_" + name);

  const sheet = SpreadsheetApp
    .openById(SHEET_ID)
    .getSheetByName("CounsellingClients");

  sheet.appendRow([
    clientID,
    name,
    email,
    age,
    location,
    concern,
    slot,
    folder.getId(),
    new Date()
  ]);

  sendConfirmationEmail(data, slot);

  return jsonResponse({
    success: true,
    message: "Session booked successfully. Meeting link sent to your email."
  });

}



// ==============================
// EMAIL CONFIRMATION
// ==============================

function sendConfirmationEmail(data, slot, meetLink) {

  const formattedDate = Utilities.formatDate(
    slot,
    Session.getScriptTimeZone(),
    "dd MMM yyyy HH:mm"
  )

  const body = `
Hello ${data.name},

Your counselling session has been scheduled.

Date: ${formattedDate}

Join via Google Meet:
${meetLink}

Regards
Shaik Khaja Mynuddin
`

  MailApp.sendEmail(
    data.email,
    "Counselling Session Confirmation",
    body
  )

}


// ==============================
// JSON RESPONSE HELPER
// ==============================

function jsonResponse(obj) {

  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)

}