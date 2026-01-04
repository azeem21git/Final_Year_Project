# Gemini AI Integration Setup

This guide will help you set up Gemini AI for auto code suggestions and other AI features in V-yes Code.

## Prerequisites

- A Google Account
- Access to Google AI Studio (https://aistudio.google.com)

## Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Click on **"Get API Key"** in the left sidebar
3. Select **"Create API key in new project"** or use an existing project
4. Copy your API key

## Step 2: Add API Key to Environment Variables

1. Create or update your `.env.local` file in the project root:

```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

2. Replace `your_api_key_here` with your actual Gemini API key

## Step 3: Test the Integration

1. Start the development server:
```bash
npm run dev
```

2. Open the application and navigate to a code editor
3. Start typing code - you should see AI suggestions appear
4. Click the **"AI"** button in the editor header to access additional features:
   - **Explain Code**: Get an explanation of selected code
   - **Optimize**: Get optimization suggestions
   - **Debug Code**: Get debugging help

## Available AI Features

### 1. Auto Code Suggestion
- Triggered automatically as you type
- Shows relevant code completion suggestions
- Click "Accept" to insert the suggestion or "Dismiss" to ignore it

### 2. Explain Code
- Select code and click AI → Explain Code
- Get a concise explanation of what the code does

### 3. Code Optimization
- Select code and click AI → Optimize
- Get suggestions to improve performance and readability

### 4. Debug Code
- Select code and click AI → Debug Code
- Get help identifying and fixing potential issues

## Configuration

### Temperature and Response Length

You can customize the AI behavior in `src/services/aiService.js`:

- **Temperature**: Controls randomness (0.5 = focused, 0.7 = creative)
- **maxOutputTokens**: Maximum length of generated responses

Current defaults:
- Auto-suggestions: temperature 0.7, max 150 tokens
- Explanations: temperature 0.5, max 300 tokens
- Optimizations: temperature 0.6, max 400 tokens
- Debugging: temperature 0.5, max 500 tokens

## Rate Limiting

The Gemini API has rate limits:
- Free tier: 60 requests per minute
- Paid tier: Higher limits available

Monitor your usage at [Google AI Studio](https://aistudio.google.com)

## Troubleshooting

### No suggestions appearing
1. Check that `VITE_GEMINI_API_KEY` is set in `.env.local`
2. Verify your API key is valid in Google AI Studio
3. Check browser console for error messages
4. Ensure you have sufficient quota in your Google project

### API Key errors
- Make sure the key is copied completely (no extra spaces)
- Regenerate the key if it seems to have issues
- Check that your Google project has billing enabled

### Rate limit exceeded
- Wait a few moments before making more requests
- Consider upgrading to a paid tier if you hit limits frequently

## Security Notes

- **Never commit `.env.local` to version control**
- Keep your API key secret - treat it like a password
- Monitor your API usage to avoid unexpected charges
- Consider using environment variables in production deployments

## Cost Considerations

Gemini API is free within usage limits. Once you exceed free limits:
- Check current pricing at [Google AI Pricing](https://ai.google.dev/pricing)
- Set up billing alerts in your Google Cloud Console
- Monitor usage at Google AI Studio

## Advanced Configuration

To customize AI behavior for different use cases, edit the prompt templates in `src/services/aiService.js`:

```javascript
const prompt = `You are an expert ${language} programmer...`;
```

Modify the prompt to suit your needs while maintaining the code block markers and formatting.

## Support

For API-related issues, visit:
- [Google AI Documentation](https://ai.google.dev)
- [GitHub Issues](https://github.com/google/generative-ai-js)
