# AI Integration Guide

## Overview

SEOgenious includes AI-powered features to enhance your SEO workflow:
- **Content Rewriting** - Improve content quality and SEO optimization
- **Executive Summaries** - Generate summaries from reports
- **Content Outline Refinement** - Enhance content outlines
- **AI Chatbot** - Get intelligent SEO advice

## Two Ways to Use AI

### Option 1: Replit AI Integration (Recommended for Replit Users)

**Advantages:**
- ✅ No OpenAI API key required
- ✅ Automatically configured on Replit
- ✅ Billed to your Replit credits
- ✅ Access to latest GPT-5 model
- ✅ Zero setup required

**How it works:**
Replit AI Integration is already installed and configured. Just enable real AI mode:

```bash
# In your .env file (or Replit Secrets)
ENABLE_REAL_AI=true
AI_MODE=real
```

That's it! The application will automatically use Replit's AI Integration.

### Option 2: Custom OpenAI API Key

**Use this if:**
- Running outside of Replit
- Want to use your own OpenAI account
- Need specific billing/usage controls

**Setup:**

1. Get an OpenAI API key from https://platform.openai.com/api-keys

2. Add to your `.env` file:
```bash
ENABLE_REAL_AI=true
AI_MODE=real
OPENAI_API_KEY=sk-your-api-key-here
```

3. Restart the application

## Feature Flag Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_REAL_AI` | `false` | Master switch for real AI features |
| `AI_MODE` | `mock` | `mock` or `real` - controls AI behavior |
| `OPENAI_API_KEY` | - | Your OpenAI API key (optional with Replit) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | auto | Set by Replit (don't modify) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | auto | Set by Replit (don't modify) |

### Mock Mode (Default)

When `ENABLE_REAL_AI=false` or `AI_MODE=mock`:
- ✅ **Free** - No API costs
- ✅ **Fast** - Instant responses
- ✅ **Reliable** - Always available
- ℹ️ **Limited** - Pre-programmed responses

Perfect for:
- Development and testing
- Demo environments
- Cost-conscious usage

### Real AI Mode

When `ENABLE_REAL_AI=true` and `AI_MODE=real`:
- ✅ **Intelligent** - GPT-5 powered responses
- ✅ **Contextual** - Understands conversation history
- ✅ **Adaptive** - Learns from your usage patterns
- ⚠️ **Costs money** - API usage fees apply

## Features

### 1. Content Rewriting

**Endpoint:** `POST /api/ai/rewrite`

**Request:**
```json
{
  "content": "Your content here...",
  "targetKeyword": "SEO optimization",
  "tone": "professional"
}
```

**Response:**
```json
{
  "rewrittenContent": "Improved content...",
  "suggestions": ["Add more headers", "Improve keyword density"],
  "mode": "real"
}
```

**Frontend Usage:**
The Content page (`/dashboard/content`) includes an "AI Rewrite" button that uses this feature.

---

### 2. Executive Summary

**Endpoint:** `POST /api/ai/executive-summary`

**Request:**
```json
{
  "reportText": "Full report content...",
  "maxLength": 200
}
```

**Response:**
```json
{
  "summary": "Brief executive summary...",
  "keyPoints": ["Key finding 1", "Key finding 2"],
  "actionItems": ["Action 1", "Action 2"],
  "mode": "real"
}
```

---

### 3. Content Outline Refinement

**Endpoint:** `POST /api/ai/outline-refine`

**Request:**
```json
{
  "outlineSeed": "Basic outline...",
  "targetKeyword": "keyword research",
  "targetAudience": "SEO beginners"
}
```

**Response:**
```json
{
  "refinedOutline": [
    {
      "heading": "Introduction",
      "subheadings": ["What is it?", "Why it matters"],
      "keyPoints": ["Define topic", "Establish importance"]
    }
  ],
  "estimatedWordCount": 1500,
  "mode": "real"
}
```

---

### 4. AI Chatbot

**Endpoint:** `POST /api/ai/chat`

**Request:**
```json
{
  "message": "How do I improve my keyword rankings?",
  "sessionContext": "User is new to SEO"
}
```

**Response:**
```json
{
  "response": "AI-generated response...",
  "suggestions": ["Ask about this", "Learn more about that"],
  "mode": "real"
}
```

**Frontend Usage:**
The Chatbot page (`/dashboard/chatbot`) automatically uses the AI wrapper with feature flag support.

## Error Handling

The AI wrapper includes robust error handling:

### Automatic Retry
- **Retries:** Up to 5 attempts
- **Backoff:** Exponential (1s → 2s → 4s → 8s → 16s)
- **Rate Limits:** Automatically detected and retried

### Rate Limiting
- **Concurrent Requests:** Max 5 simultaneous calls
- **Queue System:** Additional requests wait in queue
- **Fair Scheduling:** First-in-first-out processing

### Fallback Behavior
If AI fails, the system:
1. Logs the error
2. Returns mock data (if available)
3. Shows user-friendly error message

## Monitoring AI Status

**Endpoint:** `GET /api/ai/status`

**Response:**
```json
{
  "enabled": true,
  "mode": "real",
  "provider": "replit-ai-integration"
}
```

Use this to check current AI configuration and provider.

## Cost Management

### Using Replit AI Integration
- Costs are billed to your Replit credits
- Check usage in Replit dashboard
- Set budget alerts in Replit settings

### Using Custom OpenAI Key
- Monitor usage at https://platform.openai.com/usage
- Set monthly spending limits
- Enable usage alerts

### Cost-Saving Tips
1. **Use mock mode for development**
   ```bash
   ENABLE_REAL_AI=false
   ```

2. **Enable AI only for specific features**
   - Keep chatbot in mock mode
   - Enable AI only for content rewriting

3. **Set reasonable max tokens**
   - Default: 2048 tokens
   - Adjust based on your needs

## Testing

### Test Mock Mode
```bash
# Ensure AI is in mock mode
ENABLE_REAL_AI=false

# Test endpoints - should return instant mock responses
curl -X POST http://localhost:5000/api/ai/rewrite \
  -H "Content-Type: application/json" \
  -d '{"content": "test"}'
```

### Test Real AI Mode
```bash
# Enable real AI
ENABLE_REAL_AI=true
AI_MODE=real

# Test with real API
curl -X POST http://localhost:5000/api/ai/rewrite \
  -H "Content-Type: application/json" \
  -d '{"content": "test content", "tone": "professional"}'
```

## Troubleshooting

### "AI features not working"
1. Check `ENABLE_REAL_AI` is set to `true`
2. Verify `AI_MODE=real`
3. Confirm API key is valid (if using custom key)
4. Check application logs for errors

### "Getting mock responses instead of real AI"
- Ensure `ENABLE_REAL_AI=true`
- Check `AI_MODE=real`
- Restart the application after changing env vars

### "API rate limit errors"
- Reduce concurrent requests
- Add delays between calls
- Check your OpenAI account limits

### "High costs"
- Switch to mock mode for development
- Set max token limits lower
- Enable AI only when needed

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Enable rate limiting** to prevent abuse
4. **Monitor usage** regularly
5. **Rotate keys** periodically
6. **Use Replit Secrets** when on Replit platform

## Support

For issues or questions:
- Check this documentation first
- Review application logs
- Test in mock mode to isolate issues
- Contact support with error details

## Future Enhancements

Planned AI features:
- Automated SEO audits with AI recommendations
- Competitor analysis insights
- Keyword trend predictions
- Content performance forecasting

Stay tuned for updates!
