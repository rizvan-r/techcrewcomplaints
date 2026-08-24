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
app.use(express.static(__dirname));

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
    console.error("Error reading complaints file:", err);
    return [];
  }
}

function saveComplaints(complaints) {
  try {
    fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(complaints, null, 2));
  } catch (err) {
    console.error("Error writing complaints file:", err);
  }
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
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Forward complaint payload to Google Sheets Web App
async function forwardToGoogleSheets(complaint, webAppUrl) {
  if (!webAppUrl) return { success: false, reason: "No WebApp URL configured" };
  
  try {
    const response = await fetch(webAppUrl, {
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
    console.error("Failed to forward to Google Sheets:", err.message);
    return { success: false, error: err.message };
  }
}

// API Routes

// 1. Get complaints - ALWAYS fetches live from Google Sheets if configured
app.get('/api/complaints', async (req, res) => {
  const config = getConfig();

  if (config.googleSheetWebAppUrl) {
    try {
      const response = await fetch(config.googleSheetWebAppUrl, { 
        method: "GET", 
        redirect: "follow" 
      });
      
      const data = await response.json();
      if (data && data.complaints && Array.isArray(data.complaints)) {
        // Sync local cache with Google Sheet
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
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and Description are required." });
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newComplaint = {
      timestamp: timestamp,
      title: title.trim(),
      description: description.trim()
    };

    // Forward to Google Sheet Web App if configured
    const config = getConfig();
    let sheetSyncResult = null;
    if (config.googleSheetWebAppUrl) {
      sheetSyncResult = await forwardToGoogleSheets(newComplaint, config.googleSheetWebAppUrl);
    }

    // Save to local cache
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
    console.error("Error submitting complaint:", err);
    res.status(500).json({ error: "Internal server error while saving complaint." });
  }
});

// 3. Get Configuration
app.get('/api/config', (req, res) => {
  const config = getConfig();
  res.json({
    googleSheetConnected: Boolean(config.googleSheetWebAppUrl),
    googleSheetWebAppUrl: config.googleSheetWebAppUrl ? config.googleSheetWebAppUrl : ""
  });
});

// 4. Update Google Sheet Web App URL
app.post('/api/config', (req, res) => {
  const { googleSheetWebAppUrl } = req.body;
  const config = getConfig();
  config.googleSheetWebAppUrl = (googleSheetWebAppUrl || "").trim();
  saveConfig(config);

  res.json({
    success: true,
    message: "Google Sheets Web App URL saved!",
    googleSheetConnected: Boolean(config.googleSheetWebAppUrl)
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` 🛠️ Tech Crew Complaint Portal is running at:`);
  console.log(` 🌐 http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
