/**
 * Google Apps Script for Tech Crew Complaint Portal
 * 
 * INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.new) and create a new Spreadsheet named "Tech Crew Complaints".
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Delete any code in the editor and paste THIS ENTIRE FILE.
 * 4. Click "Deploy" (top-right blue button) -> "Manage deployments" -> edit -> new version -> Deploy.
 *    (Or Deploy -> New deployment -> Web app -> Anyone -> Deploy).
 */

const SHEET_NAME = "Complaints";

// Columns: Date, Title, Description
const HEADERS = [
  "Submission Date",
  "Title",
  "Description"
];

function setupSheet(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#002045");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Column widths
    sheet.setColumnWidth(1, 180); // Date
    sheet.setColumnWidth(2, 280); // Title
    sheet.setColumnWidth(3, 500); // Description
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    setupSheet(sheet);
    
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }
    
    const timestamp = data.timestamp || Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
    const title = data.title || "Untitled Grievance";
    const description = data.description || "";
    
    const row = [
      timestamp,
      title,
      description
    ];
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Complaint saved successfully in Google Sheet",
      timestamp: timestamp
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        complaints: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        complaints: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const complaints = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (r[1] || r[2]) {
        let timestampStr = r[0];
        if (r[0] instanceof Date) {
          timestampStr = Utilities.formatDate(r[0], "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
        } else {
          timestampStr = String(r[0] || "");
        }
        
        complaints.push({
          timestamp: timestampStr,
          title: String(r[1] || ""),
          description: String(r[2] || "")
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      complaints: complaints.reverse() // Most recent at the top
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
