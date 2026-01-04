# AI Features Quick Reference

## 🚀 Quick Start

### 1. Set up your Gemini API Key
```bash
# Add to .env.local
VITE_GEMINI_API_KEY=your_key_here
```

### 2. Start using AI
Open any code editor in your workspace - AI features are automatically enabled!

---

## 📚 Features at a Glance

### Auto Code Suggestions 💡
- **When**: Automatically as you type
- **How**: Watch for the cyan suggestion box
- **Action**: Click "Accept" or "Dismiss"

### Explain Code 📖
1. Select code in the editor
2. Click the **Sparkles (✨)** button → **Explain Code**
3. Get instant explanation in a toast notification

### Optimize Code ⚡
1. Select code in the editor  
2. Click the **Sparkles (✨)** button → **Optimize**
3. See performance & readability suggestions

### Debug Code 🐛
1. Select code in the editor
2. Click the **Sparkles (✨)** button → **Debug Code**
3. Get help identifying and fixing issues

---

## ⌨️ Keyboard Shortcuts
- **Ctrl/Cmd + A**: Select all code (then use AI features)
- **Auto-save**: Your code saves automatically after 1 second of inactivity

---

## 📊 Supported Languages
✅ JavaScript | TypeScript | Python | Java | C++ | Go | Rust | HTML | CSS

---

## 💰 Cost
- **Free Tier**: 60 requests/minute with generous free limits
- **Paid**: Optional upgrade available
- Monitor usage at [Google AI Studio](https://aistudio.google.com)

---

## ⚙️ Tips for Best Results

1. **For Code Suggestions**: 
   - Write naturally - suggestions appear as you type
   - Accept suggestions that are relevant to your code

2. **For Explanations**: 
   - Select a specific function or code block
   - Longer selections = more detailed explanations

3. **For Debugging**: 
   - Include relevant code context
   - Paste error messages if you have them

4. **For Optimization**:
   - Select complete functions when possible
   - Review suggestions before applying

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| No suggestions appearing | Check `.env.local` has your API key |
| "API key invalid" error | Regenerate key in Google AI Studio |
| Rate limited | Wait a moment - free tier has 60 req/min |
| Code doesn't respond | Try selecting a smaller code block |

---

## 📖 Full Documentation
See [GEMINI_SETUP.md](./GEMINI_SETUP.md) for detailed setup and configuration.

---

## 🎯 Pro Tips
- Copy complex code from documentation and let AI explain it
- Ask AI to debug code before running it
- Use optimization suggestions to learn coding best practices
- Create custom prompts in `aiService.js` for your workflow
