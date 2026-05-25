# College Club Registration Form

A single-page, scrollable registration form for college clubs. Submissions go directly to a Google Sheet — no server, no database, no technical knowledge required.

---

## What You Need

- A Google account (for Google Sheets)
- A free SheetDB account (to connect the form to your sheet)
- A free Vercel or Render account (to host the form online)

Everything is free. The whole setup takes about 10 minutes.

---

## Step 1: Create Your Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and sign in.
2. Click **+ Blank** to create a new spreadsheet.
3. Name the file something like **Club Registrations**.
4. In **Row 1**, type the following headers exactly as shown (one per cell, starting from cell A1):

```
A1: College Name
B1: Club Name
C1: President Designation
D1: President Full Name
E1: President USN
F1: President Phone
G1: President Email
H1: VP Designation
I1: VP Full Name
J1: VP USN
K1: VP Phone
L1: VP Email
M1: Additional Details
```

It should look like this:

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| College Name | Club Name | President Designation | President Full Name | President USN | President Phone | President Email | VP Designation | VP Full Name | VP USN | VP Phone | VP Email | Additional Details |

5. Leave all other rows empty — submissions will fill them in automatically.
6. Keep this tab open. You'll need the spreadsheet URL in the next step.

---

## Step 2: Connect SheetDB

SheetDB is a free service that gives your Google Sheet a web address (API endpoint) so the form can send data to it.

1. Go to [sheetdb.io](https://sheetdb.io) and click **Sign Up** (it's free).
2. After signing in, click **Create new API**.
3. Paste your Google Sheet URL into the field and click **Create**.
   - Your Google Sheet URL looks like: `https://docs.google.com/spreadsheets/d/XXXXXXXX/edit`
4. SheetDB will ask you to grant access to your Google Sheet — click **Allow**.
5. Once created, you'll see your API endpoint URL. It looks like:
   ```
   https://sheetdb.io/api/v1/abc123xyz456
   ```
6. **Copy that URL.**

---

## Step 3: Paste the Endpoint into the Form

1. Open the file `js/submission.js` in a text editor (Notepad, VS Code, etc.).
2. Find this line near the top:
   ```js
   export const SHEETDB_ENDPOINT = 'YOUR_SHEETDB_ENDPOINT_HERE';
   ```
3. Replace `YOUR_SHEETDB_ENDPOINT_HERE` with the URL you copied from SheetDB:
   ```js
   export const SHEETDB_ENDPOINT = 'https://sheetdb.io/api/v1/abc123xyz456';
   ```
4. Save the file.

That's the only code change you need to make.

---

## Step 4: Deploy to Vercel (Recommended)

Vercel hosts the form for free and gives you a public URL to share.

### Option A: Deploy via GitHub (easiest for updates)

1. Create a free account at [github.com](https://github.com).
2. Create a new repository and upload all the files in this folder.
3. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account.
4. Click **Add New → Project**.
5. Select your GitHub repository.
6. On the configuration screen:
   - **Framework Preset**: Other
   - **Build Command**: leave empty
   - **Output Directory**: `.` (a single dot)
7. Click **Deploy**.
8. Vercel will give you a URL like `https://your-project.vercel.app` — share this with clubs!

### Option B: Deploy by dragging and dropping

1. Go to [vercel.com](https://vercel.com) and sign up.
2. On the dashboard, look for the **drag and drop** area.
3. Drag the entire `college-club-registration-form` folder onto it.
4. Vercel deploys it instantly and gives you a public URL.

---

## Step 5: Deploy to Render (Alternative)

If you prefer Render over Vercel:

1. Go to [render.com](https://render.com) and sign up for free.
2. Click **New → Static Site**.
3. Connect your GitHub repository (or upload files manually).
4. Set:
   - **Build Command**: leave empty
   - **Publish Directory**: `.`
5. Click **Create Static Site**.
6. Render gives you a public URL to share.

---

## Sharing the Form

Once deployed, share the URL with club representatives. Each submission will appear as a new row in your Google Sheet automatically.

To share the Google Sheet with other coordinators:
1. Open the sheet.
2. Click **Share** (top right).
3. Enter their email addresses or click **Copy link** to share view access.

---

## Testing the Form Locally

To test the form on your own computer before deploying:

1. Open the `college-club-registration-form` folder.
2. Double-click `index.html` to open it in your browser.

> **Note**: The form will load and look correct, but submissions will fail until you've set the SheetDB endpoint (Step 3) and are running the file through a local server or deployed it. This is a browser security restriction — it doesn't affect the deployed version.

To run a quick local server (if you have Node.js installed):
```bash
npx serve .
```
Then open `http://localhost:3000` in your browser.

---

## Running Tests

The form includes automated tests to verify the validation logic works correctly.

```bash
npm install
npm test
```

You should see all 31 tests pass.

---

## File Structure

```
college-club-registration-form/
├── index.html          ← The form page
├── style.css           ← All styling (pastel colors, layout, responsive)
├── js/
│   ├── validator.js    ← Validation logic (pure functions)
│   ├── submission.js   ← SheetDB integration  ← EDIT THIS FILE (Step 3)
│   └── main.js         ← Form controller (DOM wiring)
├── tests/
│   ├── validator.test.js   ← Property-based tests for validation
│   └── submission.test.js  ← Property-based tests for submission
├── vercel.json         ← Vercel deployment config
├── package.json        ← Dev dependencies (tests only)
└── README.md           ← This file
```

---

## Troubleshooting

**Submissions aren't appearing in the sheet**
- Double-check that you replaced `YOUR_SHEETDB_ENDPOINT_HERE` in `js/submission.js` with your actual SheetDB URL.
- Make sure the column headers in your Google Sheet match exactly (copy-paste from Step 1 above).
- Check that SheetDB still has access to your Google Sheet (log in to sheetdb.io and verify).

**The form shows "Submission failed"**
- This usually means the SheetDB endpoint URL is wrong or the free tier limit (500 requests/month) has been reached.
- Log in to sheetdb.io to check your usage and endpoint status.

**The form looks broken locally**
- Open it through a local server (`npx serve .`) rather than double-clicking the HTML file directly.

**I need more than 500 submissions per month**
- SheetDB's free tier allows 500 requests/month. For more, upgrade to a paid SheetDB plan, or switch to the Google Sheets API directly (requires a Google Cloud project — contact a developer for help).
