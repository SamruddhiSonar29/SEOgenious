# 🔗 n8n Integration Guide for SEOgenious

This guide shows you how to connect SEOgenious with n8n for workflow automation, reporting, and third-party integrations.

---

## 📋 Table of Contents

1. [What You Can Automate](#what-you-can-automate)
2. [Quick Setup](#quick-setup)
3. [n8n Workflow Examples](#n8n-workflow-examples)
4. [Environment Configuration](#environment-configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 What You Can Automate

With n8n integration, SEOgenious can automatically:

- ✅ **Email SEO reports** to clients when keyword analysis is done
- ✅ **Send Slack notifications** when content optimization is complete
- ✅ **Save data to Google Sheets** for all keyword research
- ✅ **Create tasks in Trello/Asana** for content improvements
- ✅ **Sync saved items** to Notion or Airtable
- ✅ **Send welcome emails** to new users
- ✅ **Generate PDF reports** and send via email
- ✅ **Post to social media** when new SEO insights are found

---

## ⚡ Quick Setup

### Step 1: Set Up n8n

**Option A: n8n Cloud (Easiest)**
1. Sign up at https://n8n.io/cloud
2. Get your workspace URL (e.g., `https://yourname.app.n8n.cloud`)

**Option B: Self-Hosted (Free)**
```bash
# Install with Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Access n8n at: http://localhost:5678

---

### Step 2: Configure SEOgenious

Add these lines to your `.env` file:

```bash
# n8n Webhook Configuration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_AUTH_USER=your-username      # Optional: if you enabled auth
N8N_AUTH_PASS=your-password      # Optional: if you enabled auth
```

**For n8n Cloud:**
```bash
N8N_WEBHOOK_URL=https://yourname.app.n8n.cloud/webhook
```

**For Self-Hosted:**
```bash
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

---

### Step 3: Create Webhook Workflows in n8n

#### Example 1: Send Email When Keyword Analysis Complete

**In n8n:**

1. **Create New Workflow**

2. **Add Webhook Node** (Trigger)
   - HTTP Method: `POST`
   - Path: `/keyword-analysis`
   - Response Mode: `When Last Node Finishes`
   - Click "Listen for Test Event"

3. **Add Gmail Node** (or any email service)
   - Operation: `Send Email`
   - To: `{{ $json.userEmail }}`
   - Subject: `Your Keyword Analysis is Ready!`
   - Message:
   ```
   Hi {{ $json.userEmail }},

   Your keyword analysis for "{{ $json.keywords }}" is complete!

   Found {{ $json.clusters.length }} keyword clusters.

   Best regards,
   SEOgenious Team
   ```

4. **Save & Activate** workflow

5. **Copy Production Webhook URL**
   Example: `https://yourname.app.n8n.cloud/webhook/keyword-analysis`

---

#### Example 2: Save Keyword Data to Google Sheets

**In n8n:**

1. **Webhook Node** (same as above)

2. **Google Sheets Node**
   - Operation: `Append or Update Row`
   - Document: Select your spreadsheet
   - Sheet: `Keyword Analysis`
   - Columns:
     - User Email: `{{ $json.userEmail }}`
     - Keywords: `{{ $json.keywords }}`
     - Clusters: `{{ $json.clusters.length }}`
     - Date: `{{ $json.timestamp }}`

3. **Activate** workflow

---

#### Example 3: Slack Notification for New Users

**In n8n:**

1. **Webhook Node**
   - Path: `/user-registration`

2. **Slack Node**
   - Operation: `Post Message`
   - Channel: `#new-users`
   - Message:
   ```
   🎉 New user registered!
   Name: {{ $json.userName }}
   Email: {{ $json.userEmail }}
   ```

---

### Step 4: Enable Webhooks in SEOgenious

The webhooks are already integrated! When you set `N8N_WEBHOOK_URL`, SEOgenious will automatically send data to n8n for these events:

1. **Keyword Analysis** → `/keyword-analysis`
2. **Content Optimization** → `/content-optimization`
3. **SERP Analysis** → `/serp-analysis`
4. **Item Saved** → `/item-saved`
5. **User Registration** → `/user-registration`

---

## 📊 n8n Workflow Examples

### Workflow 1: Auto-Generate SEO Report

```
Webhook (daily trigger)
  ↓
HTTP Request (get user stats from SEOgenious)
  ↓
Function (format data)
  ↓
Google Docs (create report)
  ↓
Gmail (send to user)
```

### Workflow 2: Competitor Alert System

```
Webhook (SERP analysis)
  ↓
Filter (check competitor rankings)
  ↓
If (ranking changed)
  ↓
Slack (send alert)
```

### Workflow 3: Content Calendar Automation

```
Webhook (content optimized)
  ↓
Google Calendar (create event)
  ↓
Trello (create card)
  ↓
Email (notify team)
```

---

## 🔒 Security Best Practices

### 1. Enable Basic Authentication

**In n8n Webhook Node:**
- Credential Type: `Basic Auth`
- Username: `your-username`
- Password: `strong-password`

**In SEOgenious .env:**
```bash
N8N_AUTH_USER=your-username
N8N_AUTH_PASS=strong-password
```

### 2. Use Custom Webhook Paths

Instead of random UUIDs, use descriptive paths:
- ✅ `/webhook/keyword-analysis`
- ❌ `/webhook/abc123xyz`

### 3. Use HTTPS in Production

```bash
# Production
N8N_WEBHOOK_URL=https://your-n8n.com/webhook

# Never use HTTP in production
N8N_WEBHOOK_URL=http://your-n8n.com/webhook  ❌
```

---

## 🧪 Testing

### Test Webhook Connection

1. **In n8n:** Open your workflow and click "Listen for Test Event"

2. **In SEOgenious:** Trigger an action (e.g., keyword analysis)

3. **In n8n:** You should see the data appear

4. **Execute workflow** to test the full flow

### Manual Test with curl

```bash
# Test keyword analysis webhook
curl -X POST https://your-n8n.com/webhook/keyword-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "userEmail": "test@example.com",
    "keywords": ["SEO", "marketing"],
    "clusters": [
      {"theme": "SEO basics", "keywords": ["SEO tips", "SEO guide"]}
    ],
    "timestamp": "2024-01-15T10:00:00Z"
  }'
```

---

## 📤 Data Sent to n8n

### Keyword Analysis Event
```json
{
  "userId": "uuid",
  "userEmail": "user@example.com",
  "keywords": ["SEO", "marketing"],
  "clusters": [
    {
      "theme": "SEO basics",
      "keywords": ["SEO tips", "SEO guide"],
      "searchVolume": 1200
    }
  ],
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Content Optimization Event
```json
{
  "userId": "uuid",
  "userEmail": "user@example.com",
  "content": "Your content text...",
  "targetKeyword": "SEO tips",
  "results": {
    "wordCount": 500,
    "keywordDensity": 2.5,
    "readabilityScore": 65
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### User Registration Event
```json
{
  "userId": "uuid",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## 🐛 Troubleshooting

### Webhook Not Firing

**Check:**
1. Is `N8N_WEBHOOK_URL` set in `.env`?
2. Did you restart the server after adding `.env`?
3. Is the n8n workflow activated (not just saved)?
4. Check server console for error messages

### Authentication Errors

```bash
# Error: 401 Unauthorized
# Solution: Make sure credentials match

# In .env:
N8N_AUTH_USER=admin
N8N_AUTH_PASS=secret123

# In n8n Webhook Settings:
# Enable Basic Auth with same credentials
```

### Timeout Errors

```bash
# If workflows take >30 seconds, increase timeout:

# In server/n8n-webhooks.ts:
signal: AbortSignal.timeout(60000)  // 60 seconds
```

### CORS Issues

**In n8n Webhook Node:**
- Allowed Origins: `*` (for testing)
- Allowed Origins: `https://your-app.com` (for production)

---

## 🎓 Advanced Use Cases

### 1. Multi-Step Approval Workflow

```
Keyword Analysis
  ↓
Slack (notify manager)
  ↓
Wait for Approval
  ↓
If Approved
  ↓
Send Email to Client
```

### 2. Data Enrichment

```
SERP Analysis
  ↓
HTTP Request (get more data from external API)
  ↓
Merge Data
  ↓
Save to Database
  ↓
Send Report
```

### 3. Scheduled Reports

```
Cron Trigger (every Monday 9 AM)
  ↓
HTTP Request (get SEOgenious stats)
  ↓
Generate PDF
  ↓
Email to Team
```

---

## 📚 Resources

- **n8n Documentation**: https://docs.n8n.io
- **n8n Community**: https://community.n8n.io
- **Webhook Node Docs**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- **n8n Templates**: https://n8n.io/workflows

---

## 💡 Quick Tips

1. **Start Simple** - Begin with one webhook (e.g., email on keyword analysis)
2. **Test First** - Always test webhooks before activating
3. **Monitor Logs** - Check n8n execution logs for errors
4. **Use Test URLs** - Test workflows don't count towards execution limits
5. **Keep Secrets Safe** - Never commit `.env` file to git

---

## 🚀 Next Steps

1. Set up n8n (cloud or self-hosted)
2. Add `N8N_WEBHOOK_URL` to `.env`
3. Create your first workflow (try the email example)
4. Test by generating keyword analysis in SEOgenious
5. Build more complex workflows!

---

**Need Help?**
- Check n8n community forum
- Review n8n documentation
- Test webhooks with curl first
- Check SEOgenious server logs

Happy Automating! 🎉
