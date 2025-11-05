# 🚀 n8n Quick Start Guide - 5 Minutes Setup

## What You Get
Automatically send SEO analysis results to:
- 📧 Email (Gmail, Outlook, etc.)
- 💬 Slack / Discord / Teams
- 📊 Google Sheets / Airtable
- 📝 Notion / Trello / Asana
- 🔔 And 400+ other apps!

---

## Setup in 3 Steps

### Step 1: Get n8n Running (Choose One)

#### Option A: n8n Cloud (Easiest - 2 minutes)
1. Go to https://n8n.io/cloud
2. Sign up for free account
3. Copy your webhook URL: `https://yourname.app.n8n.cloud/webhook`

#### Option B: Self-Hosted (Free Forever)
```bash
# Using Docker (recommended)
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n docker.n8n.io/n8nio/n8n

# Access at: http://localhost:5678
```

---

### Step 2: Configure SEOgenious

Create or edit `.env` file in your project root:

```bash
# Add this line (replace with your n8n URL)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook

# Optional: if you set up Basic Auth in n8n
N8N_AUTH_USER=admin
N8N_AUTH_PASS=yourpassword
```

**Restart the server:**
```bash
npm run dev
```

✅ Done! Webhooks are now active.

---

### Step 3: Create Your First Workflow

Let's create an **Email Alert When Keyword Analysis Done**

**In n8n:**

1. Click **"Add Workflow"**

2. Add **Webhook Node** (Trigger)
   - Click **"+ Add first step"**
   - Search **"Webhook"**
   - HTTP Method: `POST`
   - Path: `keyword-analysis`
   - Click **"Listen for Test Event"** (keeps it active for testing)

3. Add **Gmail Node** (or your email service)
   - Click **"+"** to add node
   - Search **"Gmail"**
   - Click **"Send Email"**
   - Connect your Gmail account (n8n will guide you)
   - Configure:
     - **To**: `{{ $json.userEmail }}`
     - **Subject**: `Your Keyword Analysis Results`
     - **Message**:
     ```
     Hi there!

     Your keyword analysis is ready for: {{ $json.keywords }}

     Found {{ $json.clusters.length }} keyword clusters.

     Check your SEOgenious dashboard!
     ```

4. Click **"Save"** (top right)

5. Click **"Activate"** toggle (top right)

6. Copy the **Production Webhook URL**
   - Should look like: `https://yourname.app.n8n.cloud/webhook/keyword-analysis`

✅ Workflow is live!

---

### Step 4: Test It!

1. Go to SEOgenious
2. Navigate to **Keywords** page
3. Enter some keywords (e.g., "SEO tips")
4. Click **"Generate Clusters"**
5. Check your email! 📧

---

## 📋 Available Webhooks

SEOgenious automatically sends data to these webhook paths:

| Event | Webhook Path | When It Fires |
|-------|-------------|--------------|
| Keyword Analysis | `/keyword-analysis` | User generates keyword clusters |
| Content Optimization | `/content-optimization` | User analyzes content |
| SERP Analysis | `/serp-analysis` | User checks competitors |
| Item Saved | `/item-saved` | User saves a cluster/analysis |
| User Registration | `/user-registration` | New user signs up |

---

## 🎯 More Workflow Ideas

### 1. Save to Google Sheets
**Nodes:** Webhook → Google Sheets
```
Automatically log all keyword research to a spreadsheet
```

### 2. Slack Notifications
**Nodes:** Webhook → Slack
```
Notify your team when SEO analysis is done
```

### 3. Create Trello Cards
**Nodes:** Webhook → Filter → Trello
```
Auto-create content tasks based on keyword research
```

### 4. Welcome Email for New Users
**Nodes:** Webhook (user-registration) → Gmail
```
Send personalized welcome email with getting started guide
```

---

## 🔧 Troubleshooting

### Webhook Not Working?

**Check 1:** Is `N8N_WEBHOOK_URL` in `.env`?
```bash
# Open .env file, should have:
N8N_WEBHOOK_URL=https://your-n8n.com/webhook
```

**Check 2:** Did you restart the server?
```bash
# Stop server (Ctrl+C) then:
npm run dev
```

**Check 3:** Is workflow **activated** in n8n?
- Toggle should be ON (green)
- Says "Active" not "Inactive"

**Check 4:** Check server console
```bash
# Should see this when starting:
n8n webhooks initialized: https://your-n8n.com/webhook
```

### Getting 401 Errors?

Your n8n webhook has Basic Auth enabled. Add credentials to `.env`:
```bash
N8N_AUTH_USER=your-username
N8N_AUTH_PASS=your-password
```

### Webhooks Too Slow?

n8n Cloud has 100-second timeout. For long workflows:
1. Use simpler workflows
2. Or switch to self-hosted n8n (no timeout)

---

## 📚 Learn More

- **Full Integration Guide**: See `N8N_INTEGRATION_GUIDE.md`
- **n8n Documentation**: https://docs.n8n.io
- **n8n Templates**: https://n8n.io/workflows
- **Community Forum**: https://community.n8n.io

---

## 💡 Pro Tips

1. **Start Simple** - Begin with one email workflow, then expand
2. **Test First** - Use "Listen for Test Event" before activating
3. **Monitor Logs** - Check n8n execution logs for errors
4. **Save Templates** - Export working workflows as templates
5. **Use Filters** - Add Filter nodes to control when actions run

---

## ✅ Verification Checklist

- [ ] n8n is running (cloud or self-hosted)
- [ ] `N8N_WEBHOOK_URL` added to `.env`
- [ ] Server restarted after `.env` changes
- [ ] Workflow created and **activated** in n8n
- [ ] Tested with real action in SEOgenious

---

**That's it! Your SEO tool now has superpowers! 🚀**

Questions? Check the full guide or n8n docs.
