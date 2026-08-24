# 🚀 Deploying Tech Crew Portal to Vercel

Your application is completely pre-configured for Vercel deployment with serverless API functions (`/api/complaints`) and static asset hosting.

---

## 🌟 Method 1: Deploy via GitHub (Recommended)

1. **Commit and Push your project to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit for Tech Crew Complaint Portal"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Sign in with your GitHub account.
   - Select your repository and click **Import**.

3. **Configure Environment Variable (Optional)**:
   - Under **Environment Variables**, add:
     - **Key**: `GOOGLE_SHEET_WEBAPP_URL`
     - **Value**: `https://script.google.com/macros/s/AKfycbyLdeZFlOhwE8YYZHmDFet6xOIQxDaPlclYydLhbyAE_VJ60pSJhyx6kCsyoY31ruuwJA/exec`
   - Click **Deploy**.

---

## ⚡ Method 2: Deploy via Vercel CLI (Directly from Terminal)

You can deploy directly from your local project folder:

```bash
npx vercel
```

- When prompted:
  - *Set up and deploy?* -> `Y`
  - *Which scope?* -> Select your Vercel account.
  - *Link to existing project?* -> `N`
  - *What’s your project’s name?* -> `tech-crew-portal` (or press Enter)
  - *In which directory is your code located?* -> `./` (press Enter)

To deploy directly to production:
```bash
npx vercel --prod
```

---

## 📁 How Vercel Runs This App

- **Static Pages**: `index.html`, `styles.css`, `app.js`, and `logo.png` are automatically served via Vercel's global Edge CDN.
- **Serverless API**: `api/complaints.js` executes as a high-speed Serverless Function handling real-time Google Sheets reads & writes.
