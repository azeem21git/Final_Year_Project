# AI Features Visual Guide

## 🎯 Feature Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              V-yes Code AI Features                         │
└─────────────────────────────────────────────────────────────┘

User opens code editor
        ↓
   ┌─────────────────────────────────────┐
   │   Auto Suggestions (Enabled)        │
   │   ✨ Triggers as you type           │
   │   ⟳ 1-second debounce              │
   │   → Shows suggestion box            │
   └─────────────────────────────────────┘
        ↓ (User can)
    ┌──────┴──────────┐
    ↓                 ↓
Accept              Dismiss
 ↓                    ↓
Insert code      Continue typing
 ↓
Auto-save


User clicks Sparkles (✨) button
    ↓
    ├─→ 📖 Explain Code
    │   └─→ Explains selected code
    │       └─→ Shows as toast notification
    │
    ├─→ ⚡ Optimize
    │   └─→ Performance suggestions
    │       └─→ Shows as toast notification
    │
    └─→ 🐛 Debug Code
        └─→ Issue identification & fixes
            └─→ Shows as toast notification
```

## 🖥️ UI Layout

### Editor Header (When Logged In)

```
┌────────────────────────────────────────────────────────────────┐
│ Code Session Title                    [✨AI] [Fork] [↓] [💾]   │
│ JavaScript • Owner • Unsaved changes                            │
└────────────────────────────────────────────────────────────────┘
```

### AI Menu (When Clicked)

```
┌──────────────────────┐
│ 📖 Explain Code      │
├──────────────────────┤
│ ⚡ Optimize          │
├──────────────────────┤
│ 🐛 Debug Code        │
└──────────────────────┘
```

### Suggestion Box

```
┌────────────────────────────────────────────────────────────────┐
│ ✨ AI Suggestion                                               │
│ Here's the suggestion from Gemini...                            │
│                                              [Accept] [Dismiss]  │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ // Your code in the editor                                      │
│ const multiply = (a, b) => {                                    │
│   return a * b;                                                 │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Suggestion Generation Flow

```
User types code
        ↓
    ┌───────────┐
    │ Debounce  │ (1 second wait)
    │ Timer     │
    └───────────┘
        ↓
  ┌──────────────────────────┐
  │ Get editor context:      │
  │ - Current line number    │
  │ - Surrounding 10 lines   │
  │ - Code language          │
  └──────────────────────────┘
        ↓
  ┌──────────────────────────────────────┐
  │ Send to Gemini API:                  │
  │ "You are a [language] programmer"    │
  │ "Current code: [context]"            │
  │ "Suggest completion for line X"      │
  └──────────────────────────────────────┘
        ↓
  ┌──────────────────────────┐
  │ Gemini processes:        │
  │ - Analyzes code pattern  │
  │ - Temperature: 0.7       │
  │ - Max tokens: 150        │
  └──────────────────────────┘
        ↓
  ┌──────────────────────────┐
  │ Return suggestion        │
  │ (under 150 tokens)       │
  └──────────────────────────┘
        ↓
  ┌──────────────────────────┐
  │ Display in UI:           │
  │ Cyan suggestion box      │
  │ Accept/Dismiss buttons   │
  └──────────────────────────┘
```

## 🎨 Color Scheme

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| AI Button (Ready) | Cyan | `#06B6D4` | Indicates AI ready |
| AI Button (Loading) | Amber | `#D97706` | AI is thinking |
| Suggestion Box | Cyan Gradient | `#164e63 → #0c4a6e` | Highlight suggestions |
| Accept Button | Cyan | `#06B6D4` | Primary action |
| Dismiss Button | Gray | `#4B5563` | Secondary action |
| Loading Bar | Amber | `#991B1B` | Processing state |

## 🔄 Workflow Examples

### Example 1: Auto Code Suggestion

```
1. User typing:
   const calculateSum = (arr) => {
     return 

2. AI detects incomplete line, waits 1 second

3. AI Suggestion appears:
   "arr.reduce((sum, val) => sum + val, 0)"

4. User clicks "Accept"
   ↓
   const calculateSum = (arr) => {
     return arr.reduce((sum, val) => sum + val, 0)

5. Code auto-saves
```

### Example 2: Code Explanation

```
1. User selects code:
   const multiply = (a, b) => a * b;

2. Clicks ✨ AI → 📖 Explain Code

3. AI generates explanation:
   "This is an arrow function that takes two parameters
    a and b, and returns their product."

4. Notification shows explanation for 3 seconds
```

### Example 3: Code Optimization

```
1. User selects inefficient code:
   for (let i = 0; i < array.length; i++) {
     if (array[i] === target) return i;
   }

2. Clicks ✨ AI → ⚡ Optimize

3. AI suggests:
   "1. Use array.indexOf() or array.findIndex()
    2. Avoid unnecessary array.length lookups
    3. Consider Map for O(1) lookups with many items"

4. User learns and applies suggestions
```

## 📈 API Request/Response Cycle

```
Browser
  ↓
  │ HTTPS POST Request
  │ {
  │   "contents": [
  │     {
  │       "parts": [{
  │         "text": "You are a [language] programmer..."
  │       }]
  │     }
  │   ],
  │   "generationConfig": {
  │     "temperature": 0.7,
  │     "maxOutputTokens": 150
  │   }
  │ }
  ↓
Google Gemini API
  (generativelanguage.googleapis.com)
  ↓
  │ HTTPS Response
  │ {
  │   "candidates": [{
  │     "content": {
  │       "parts": [{
  │         "text": "AI suggestion here..."
  │       }]
  │     }
  │   }]
  │ }
  ↓
Browser
  (Display in UI)
```

## ⏱️ Timing & Debouncing

```
User starts typing:
|────────────────────────────────────────|
0s   1s   2s   3s   4s   5s

Type 'f'      → Start 1s timer
Type 'u'      → Reset 1s timer
Type 'n'      → Reset 1s timer
Type 'c'      → Reset 1s timer
  (User pauses for 1 second)
         → Timer expires, API call made
            → Suggestion received at ~1.2s
            → Display to user immediately
```

## 🎛️ State Management

```
CodeEditor Component States:

┌──────────────────────┐
│ code                 │  Current code in editor
└──────────────────────┘

┌──────────────────────┐
│ suggestion           │  Current AI suggestion or null
│ (null | string)      │
└──────────────────────┘

┌──────────────────────┐
│ loadingSuggestion    │  true while API call pending
│ (boolean)            │
└──────────────────────┘

┌──────────────────────┐
│ showAIMenu           │  AI menu visibility toggle
│ (boolean)            │
└──────────────────────┘

┌──────────────────────┐
│ hasUnsavedChanges    │  Unsaved flag for auto-save
│ (boolean)            │
└──────────────────────┘
```

## 🛡️ Error Handling Flow

```
API Call Made
    ↓
┌───────────────┐
│ Check Response│
└───────────────┘
    ↓
┌──────────────────────────────────────┐
│         Is Response OK?              │
│      /              \                │
│    YES              NO               │
│    ↓                ↓                │
│ Parse JSON      Log Error            │
│    ↓            Return null          │
│ Extract Text         ↓               │
│    ↓            Clear suggestion     │
│ Validate            ↓                │
│ Length          Hide loading bar     │
│    ↓                ↓                │
│ Show if valid   User sees nothing    │
│ Display UI      (graceful fail)      │
└──────────────────────────────────────┘
```

## 📱 Responsive Design

### Desktop (1024px+)
```
┌─────────────────────────────────────┐
│ Header with AI Button & Menu        │
├─────────────────────────────────────┤
│                                     │
│ Suggestion Box (if any)             │
│                                     │
├─────────────────────────────────────┤
│                                     │
│                                     │
│     Monaco Editor (Large)           │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Tablet/Small Desktop (768px-1024px)
```
┌──────────────────────┐
│ Header (compact)     │
├──────────────────────┤
│ Suggestion (if any)  │
├──────────────────────┤
│ Editor (medium)      │
│                      │
└──────────────────────┘
```

## 🔐 Security Architecture

```
User's Browser
      ↓
┌──────────────────────────────┐
│ Environment Variable (.env)  │
│ VITE_GEMINI_API_KEY=***      │
└──────────────────────────────┘
      ↓
┌──────────────────────────────┐
│ aiService.js                 │
│ Sanitizes code before API    │
│ Validates response           │
│ No logging of sensitive data │
└──────────────────────────────┘
      ↓
│ HTTPS Encryption │
      ↓
┌──────────────────────────────┐
│ Google Gemini API            │
│ Rate limited servers         │
│ Safety filters enabled       │
└──────────────────────────────┘
```

---

**Visual guides help understand the complete AI feature architecture at a glance!**
