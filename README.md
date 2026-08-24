# 🛠️ Tech Crew - Complaint Portal

A streamlined Complaint Management Portal built with **Stitch Design System** (`Resolution Authority` theme) and **Google Spreadsheets integration** for real-time storage.

---

## 🌟 Features

- **🏛️ Clean Stitch UI**:
  - **Complaint Box**: Focused submission form with **Title**, **Category**, and **Description**.
  - **Recent Complaints List**: Real-time list of submitted complaints with category tags, status badges (`Pending`, `Under Review`, `Resolved`), and formatted timestamps.
  - **Search & Filters**: Quick search and status tabs (`All`, `Pending`, `Under Review`, `Resolved`).
  - **Dark & Light Mode**: Built-in theme switcher with theme persistence.
- **📊 Real-Time Google Spreadsheet Integration**:
  - Automatically records complaints to any Google Sheet via Google Apps Script Webhook.
  - In-app Google Sheet Configuration Modal with diagnostic test ping.
  - Offline & local JSON fallback so complaints are never lost.

---

## 🚀 Quick Start

### 1. Start the Portal

```bash
npm start
```
or
```bash
node server.js
```

Open your browser at:
👉 **`http://localhost:3000`**

---

## 🔗 Connecting to Google Spreadsheets (3 Steps)

1. Open [sheets.new](https://sheets.new) to create a Google Sheet named **Tech Crew Complaints**.
2. Click **Extensions > Apps Script**, paste the code from [`google-apps-script/Code.gs`](./google-apps-script/Code.gs), and click **Deploy > New deployment**.
3. Select type **Web app**, set **Who has access** to **Anyone**, click **Deploy**, and copy the Web App URL.
4. In the portal header, click **Google Sheet**, paste your Web App URL, and click **Save Settings**!

---

## 📁 Project Structure

```
College Complaint/
├── google-apps-script/
│   └── Code.gs             # Google Apps Script for Google Sheets
├── data/
│   ├── complaints.json     # Clean storage database
│   └── config.json         # Google Sheet URL configuration
├── index.html              # Tech Crew application shell
├── styles.css              # Stitch Resolution Authority theme styles
├── app.js                  # Frontend client logic & real-time UI
├── server.js               # Express server & API endpoints
├── package.json            # Node dependencies
└── README.md               # Documentation
```
