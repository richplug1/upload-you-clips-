# OpenAI Integration Setup

## Fixing "Language model unavailable" Error

The "Language model unavailable" error typically occurs due to one of these issues:

1. **Missing API Key**: OpenAI API key not configured
2. **Invalid Model**: Requesting a model you don't have access to (e.g., GPT-4 without subscription)
3. **Quota Exceeded**: API usage limits reached
4. **Missing Dependencies**: OpenAI package not installed

## Setting up OpenAI API Key

### For Server-side Usage (Recommended)

1. Copy the environment example file:
   ```bash
   cp server/.env.example server/.env
   ```

2. Edit `server/.env` and add your OpenAI API key:
   ```bash
   OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   OPENAI_MODEL=gpt-3.5-turbo  # Use gpt-3.5-turbo if you don't have GPT-4 access
   OPENAI_MAX_TOKENS=1000
   ```

3. Install the OpenAI package:
   ```bash
   cd server && npm install openai
   ```

### For Client-side Usage (Optional, Less Secure)

1. Copy the client environment example file:
   ```bash
   cp client/.env.example client/.env
   ```

2. Edit `client/.env` and add your OpenAI API key:
   ```bash
   VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   ```

3. Install the OpenAI package:
   ```bash
   cd client && npm install openai
   ```

## Usage Examples

### Server-side API Calls (Recommended)

```typescript
import { openAIAPIService } from './services/openaiAPI';

// Check if OpenAI is available
const status = await openAIAPIService.checkStatus();
if (status.available) {
  // Generate video description
  const description = await openAIAPIService.generateVideoDescription(
    "My Awesome Video",
    ["entertainment", "tutorial"]
  );

  // Suggest clip titles
  const titles = await openAIAPIService.suggestClipTitles("My Awesome Video", 3);
}
```

### Client-side Direct Calls (Less Secure)

```typescript
import { openAIService } from './services/openai';

// Check if OpenAI is configured
if (openAIService.isConfigured()) {
  // Generate video description
  const description = await openAIService.generateVideoDescription(
    "My Awesome Video",
    ["entertainment", "tutorial"]
  );
}
```

## API Endpoints

The server now provides these OpenAI endpoints:

- `GET /api/openai/status` - Check if OpenAI is configured
- `POST /api/openai/generate-description` - Generate video descriptions
- `POST /api/openai/suggest-titles` - Suggest clip titles
- `POST /api/openai/analyze-content` - Analyze video content

## Troubleshooting "Language model unavailable"

### 1. Check Model Access
If you get a "model_not_found" error:
- Use `gpt-3.5-turbo` instead of `gpt-4` if you don't have GPT-4 access
- Check your OpenAI dashboard for available models

### 2. Verify API Key
```bash
# Test your API key with curl
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. Check Quota
- Log into your OpenAI dashboard
- Check your usage and billing settings
- Ensure you have sufficient credits

### 4. Update Environment Variables
Make sure your `.env` file contains:
```bash
OPENAI_API_KEY=sk-your-valid-key-here
OPENAI_MODEL=gpt-3.5-turbo  # Start with this model
```

## Security Best Practices

1. **Use server-side API calls** - Keep API keys on the server
2. **Never commit `.env` files** - They are in `.gitignore`
3. **Set up rate limiting** - Prevent API abuse
4. **Monitor usage** - Track API costs in OpenAI dashboard
5. **Rotate keys regularly** - Update API keys periodically

## Environment Variables Reference

### Server (.env)
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Default model (recommend: gpt-3.5-turbo)
- `OPENAI_MAX_TOKENS` - Maximum tokens per request

### Client (.env)
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- `VITE_OPENAI_API_KEY` - Client-side key (use with caution)
