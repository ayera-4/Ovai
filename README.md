# Ovai — Equation Converter

Convert equations in Word documents and quiz files to LaTeX `\( ... \)` format — powered by Claude AI.

## What it does

- **Convert Content** — upload a `.docx` or `.txt` file with equations in plain text or Word format; download a `.docx` with every equation wrapped in `\( ... \)` LaTeX delimiters
- **Convert Quiz** — upload a multiple-choice quiz file; download a Moodle-ready GIFT `.txt` file with LaTeX equations

---

## Project structure

```
ovai-project/
├── public/
│   └── index.html          ← The Ovai web app
├── netlify/
│   └── functions/
│       └── convert.js      ← Serverless function (proxies Claude API)
├── netlify.toml            ← Netlify build & routing config
├── package.json            ← Node dependencies for the function
└── README.md
```

---

## Deployment (Netlify — free)

### 1. Fork or clone this repository to GitHub

### 2. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up free
2. Click **Add new site → Import an existing project**
3. Connect your GitHub account and select this repository
4. Netlify auto-detects `netlify.toml` — no build settings needed
5. Click **Deploy site**

### 3. Add your Anthropic API key

1. In Netlify → **Site configuration → Environment variables**
2. Click **Add a variable**
3. Key: `ANTHROPIC_API_KEY`
4. Value: your key from [console.anthropic.com](https://console.anthropic.com)
5. Click **Save**
6. Trigger a redeploy: **Deploys → Trigger deploy → Deploy site**

Your site is now live at `https://yoursite.netlify.app`

### 4. Optional: custom domain

1. Buy a domain (Namecheap, Cloudflare Registrar, etc.)
2. In Netlify → **Domain management → Add a domain**
3. Follow the DNS instructions — HTTPS is provisioned automatically

---

## Local development

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Install function dependencies
npm install

# Create a local .env file
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Start local dev server (serves public/ and functions/)
netlify dev
```

Open `http://localhost:8888` in your browser.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key — never exposed to the browser |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| File reading | Mammoth.js (docx → text) |
| File writing | docx.js (text → docx) |
| AI | Claude Sonnet (Anthropic API) |
| Hosting | Netlify (free tier) |
| Functions | Netlify serverless (Node.js) |

---

## Security

- The Anthropic API key is stored as a Netlify environment variable — it is never included in the HTML or exposed to the browser
- All API calls go through the `/api/convert` serverless function
- Files are processed in the browser and in the serverless function only — nothing is stored
