# 🌸 Tara AI — Intelligent Voice & Chat Assistant
### *Developed by Shahnawaz*

Ek powerful, ultra-fast aur visually stunning **AI Voice & Chatbot Web Application** jo **Google Gemini**, **Grok (xAI)** aur **OpenAI** sabhi models ko support karta hai. Isme real-time streaming, sweet real-girl voice engine (TTS), live voice call mode, markdown rendering, syntax highlighting aur chat history persistence shamil hai.

---

## 🚀 Vercel Par Deploy Kaise Karein? (Deploy to Vercel)

### Option 1: Terminal Se Direct Deploy (Sabse Aasan)
Apne terminal ya Command Prompt me `e:\Ai chatbot` folder ke andar ye command run karein:
```bash
npx vercel --prod
```
1. Browser open hoga jahan aap apne **Vercel account** se login/authenticate karenge.
2. Terminal me prompt aane par `Enter` dabayein:
   - `Set up and deploy?` ➜ **Y**
   - `Which scope?` ➜ **Enter**
   - `Link to existing project?` ➜ **N**
   - `Project name?` ➜ **tara-ai** (ya Enter)
3. 1 minute me aapka live public URL mil jayega (e.g. `https://tara-ai.vercel.app`)! 🎉

### Option 2: GitHub Ke Through Deploy
1. Apne code ko GitHub repository me push karein.
2. [vercel.com](https://vercel.com) par login karein aur **"Add New" ➜ "Project"** par click karein.
3. Apni GitHub repo select karke **Deploy** button par click kar dein!

---

## 🔑 API Keys Setup (Gemini, Grok, OpenAI)

Aap do tarike se API Keys add kar sakte hain:
1. **Chatbot Web UI ke Settings (⚙️) me (Sabse Aasan tarika)**
2. **`.env` file ya Vercel Environment Variables ke andar**

---

### 1️⃣ Google Gemini API Key (Recommended & 100% Free)
* **Link:** **[Google AI Studio API Key Page](https://aistudio.google.com/app/apikey)**
* **Step:** Login karke **"Create API key"** par click karein aur key copy karein.

### 2️⃣ Grok (xAI) API Key (Grok 2 & Grok Beta)
* **Link:** **[xAI Console](https://console.x.ai/)**
* **Step:** API key generate karein aur Settings (⚙️) me paste karein.

### 3️⃣ OpenAI API Key (GPT-4o & GPT-4o-mini)
* **Link:** **[OpenAI API Keys Dashboard](https://platform.openai.com/api-keys)**

---

## 💻 Local Me Run Kaise Karein?
```bash
npm start
```
Browser me open karein: **[http://localhost:3000](http://localhost:3000)**

---

## ✨ Features

- ⚡ **Multi-Model Support**: Google Gemini 1.5 Flash, Gemini 1.5 Pro, OpenAI GPT-4o, GPT-4o Mini.
- 🌊 **Real-Time Streaming**: AI se response word-by-word real-time generate hota hai.
- 🎨 **Premium Cyber Glassmorphism UI**: Dark mode, dynamic glow effects, smooth micro-animations.
- 📜 **Chat History & Sessions**: LocalStorage me save rehti hai. New chats create karein, switch karein ya delete karein.
- 💻 **Markdown & Code Highlighting**: Syntax highlighted code blocks with single-click **"Copy Code"** button.
- 🎙️ **Voice Input (Speech-to-Text)**: Microphone button dabakar bol kar prompt likhein.
- 🔊 **Voice Output (Text-to-Speech)**: AI ke answers ko sunne ke liye **"Speak"** button.
- ⚙️ **Custom System Prompts & Personas**: Coder persona, Teacher (Hinglish) persona, Storyteller, etc.
- 🛡️ **Client & Server Key Fallback**: Agar `.env` me key nahi hai, toh user browser me apni temporary key daal kar bhi use kar sakta hai.

---

## 📁 Project Structure

```
Ai chatbot/
│
├── .env.example          # Environment variables template with instructions
├── .env                  # Your private API keys file
├── package.json          # Node.js dependencies & scripts
├── server.js             # Express backend (Gemini & OpenAI API streaming handler)
├── README.md             # Complete setup guide (English & Hindi)
│
└── public/               # Frontend Assets
    ├── index.html        # Main chatbot user interface
    ├── style.css         # Glassmorphic dark styling & responsive layout
    └── app.js            # Chatbot state, streaming handler, voice & history logic
```

---

## 🛠️ Requirements
- **Node.js** (v18 ya usse naya)
- **Modern Browser** (Chrome / Edge / Firefox / Brave)
