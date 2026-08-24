// Vercel Serverless Function: /api/complaints

const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbyLdeZFlOhwE8YYZHmDFet6xOIQxDaPlclYydLhbyAE_VJ60pSJhyx6kCsyoY31ruuwJA/exec";

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sheetUrl = process.env.GOOGLE_SHEET_WEBAPP_URL || DEFAULT_SHEET_URL;

  // GET: Fetch live complaints from Google Sheet
  if (req.method === 'GET') {
    try {
      const response = await fetch(sheetUrl, {
        method: 'GET',
        redirect: 'follow'
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      console.error('Error fetching from Google Sheets:', err.message);
      return res.status(500).json({ error: err.message, complaints: [] });
    }
  }

  // POST: Submit a new complaint to Google Sheet
  if (req.method === 'POST') {
    try {
      const { title, description } = req.body || {};

      if (!title || !description) {
        return res.status(400).json({ error: 'Title and Description are required.' });
      }

      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const payload = {
        timestamp,
        title: title.trim(),
        description: description.trim()
      };

      const response = await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      const responseText = await response.text();
      let sheetResponse;
      try {
        sheetResponse = JSON.parse(responseText);
      } catch {
        sheetResponse = { text: responseText };
      }

      return res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully!',
        complaint: payload,
        sheetResponse
      });
    } catch (err) {
      console.error('Error submitting to Google Sheets:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
