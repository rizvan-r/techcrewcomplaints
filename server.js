const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(__dirname));

// Explicit Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const COMPLAINTS_FILE = path.join(DATA_DIR, 'complaints.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Initialize with empty array if not present
if (!fs.existsSync(COMPLAINTS_FILE)) {
  fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({
    googleSheetWebAppUrl: process.env.GOOGLE_SHEET_WEBAPP_URL || ""
  }, null, 2));
}

// Helpers
function getComplaints() {
  try {
    const raw = fs.readFileSync(COMPLAINTS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function saveComplaints(complaints) {
  try {
    fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(complaints, null, 2));
  } catch (err) {}
}

function getConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { googleSheetWebAppUrl: "" };
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (err) {}
}

const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbyLdeZFlOhwE8YYZHmDFet6xOIQxDaPlclYydLhbyAE_VJ60pSJhyx6kCsyoY31ruuwJA/exec";

// Forward complaint payload to Google Sheets Web App
async function forwardToGoogleSheets(complaint, webAppUrl) {
  const targetUrl = webAppUrl || process.env.GOOGLE_SHEET_WEBAPP_URL || DEFAULT_SHEET_URL;
  if (!targetUrl) return { success: false, reason: "No WebApp URL configured" };
  
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(complaint),
      redirect: "follow"
    });
    
    const text = await response.text();
    let jsonResult;
    try {
      jsonResult = JSON.parse(text);
    } catch {
      jsonResult = { text };
    }
    
    return { success: true, data: jsonResult };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// API Routes

// 1. Get complaints - ALWAYS fetches live from Google Sheets
app.get('/api/complaints', async (req, res) => {
  const config = getConfig();
  const targetUrl = config.googleSheetWebAppUrl || process.env.GOOGLE_SHEET_WEBAPP_URL || DEFAULT_SHEET_URL;

  if (targetUrl) {
    try {
      const response = await fetch(targetUrl, { 
        method: "GET", 
        redirect: "follow" 
      });
      
      const data = await response.json();
      if (data && data.complaints && Array.isArray(data.complaints)) {
        saveComplaints(data.complaints);
        return res.json({
          source: "google_sheet",
          complaints: data.complaints,
          total: data.complaints.length
        });
      }
    } catch (err) {
      console.warn("Could not fetch live complaints from Google Sheets, using local cache:", err.message);
    }
  }

  const localComplaints = getComplaints();
  res.json({
    source: "local",
    complaints: localComplaints,
    total: localComplaints.length
  });
});

// 2. Submit a new complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const { title, description } = req.body || {};

    if (!title || !description) {
      return res.status(400).json({ error: "Title and Description are required." });
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newComplaint = {
      timestamp: timestamp,
      title: title.trim(),
      description: description.trim()
    };

    const config = getConfig();
    const targetUrl = config.googleSheetWebAppUrl || process.env.GOOGLE_SHEET_WEBAPP_URL || DEFAULT_SHEET_URL;
    
    const sheetSyncResult = await forwardToGoogleSheets(newComplaint, targetUrl);

    const complaints = getComplaints();
    complaints.unshift(newComplaint);
    saveComplaints(complaints);

    res.status(201).json({
      success: true,
      message: "Complaint registered successfully!",
      complaint: newComplaint,
      googleSheetSynced: sheetSyncResult ? sheetSyncResult.success : false,
      sheetDetails: sheetSyncResult
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error while saving complaint." });
  }
});

// Fallback for any non-API routes -> serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Only listen locally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` 🛠️ Tech Crew Complaint Portal is running at:`);
    console.log(` 🌐 http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
