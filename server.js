const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Available Models Definition
const AVAILABLE_MODELS = [
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash (Super Fast & Smart)',
    provider: 'gemini',
    recommended: true,
    description: 'Fastest Google model, great for everyday conversations, coding & general knowledge.'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro (Complex Reasoning)',
    provider: 'gemini',
    recommended: false,
    description: 'Highly capable Google model for complex multi-step reasoning and coding.'
  },
  {
    id: 'grok-2-latest',
    name: 'Grok 2 (xAI Flagship)',
    provider: 'grok',
    recommended: false,
    description: 'xAI flagship model with real-time knowledge, high intelligence and reasoning.'
  },
  {
    id: 'grok-beta',
    name: 'Grok Beta (Fast & Real-time)',
    provider: 'grok',
    recommended: false,
    description: 'High-speed Grok model for quick answers and coding.'
  },
  {
    id: 'grok-2-vision-1212',
    name: 'Grok 2 Vision (Multimodal)',
    provider: 'grok',
    recommended: false,
    description: 'Multimodal Grok model with vision capabilities.'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (OpenAI)',
    provider: 'openai',
    recommended: false,
    description: 'Fast, lightweight and affordable OpenAI model.'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (OpenAI Flagship)',
    provider: 'openai',
    recommended: false,
    description: 'Most powerful multimodal model from OpenAI.'
  }
];

// Health Check & Config Status Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    providers: {
      geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
      openaiConfigured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'),
      grokConfigured: !!((process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'your_grok_api_key_here') || (process.env.XAI_API_KEY && process.env.XAI_API_KEY !== 'your_xai_api_key_here'))
    }
  });
});

// Models List Endpoint
app.get('/api/models', (req, res) => {
  res.json({ models: AVAILABLE_MODELS });
});

// Default Tara AI Persona Instruction
const TARA_DEFAULT_PROMPT = `Aapka naam Tara AI (तारा AI) hai. Aap ek bahut hi intelligent, polite, warm aur fast AI assistant hain. 
Aapko Shahnawaz (शाहनवाज़) ne develop kiya hai. 
Jab bhi koi pooche ki aapko kisne develop kiya hai, kisne banaya hai, ya aapka creator/developer kaun hai, toh hamesha fakhr aur aadar ke sath batayein: "Mujhe Shahnawaz ne develop kiya hai."
Aap users ke sabhi sawalon ka jawab Hindi, Hinglish ya English me bahut hi meethi aur madadgaar aawaz/bhasha me turant aur lightning-fast deti hain.
Be concise, fast, and structured with clean markdown formatting.`;

// Chat Completion Endpoint (Supports Streaming & Standard JSON)
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages = [],
      model = 'gemini-3.6-flash',
      provider = 'gemini',
      systemPrompt = TARA_DEFAULT_PROMPT,
      temperature = 0.7,
      stream = true
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Determine API Key: Client header override has priority over server .env
    const clientGeminiKey = req.headers['x-gemini-api-key'];
    const clientOpenaiKey = req.headers['x-openai-api-key'];
    const clientGrokKey = req.headers['x-grok-api-key'] || req.headers['x-xai-api-key'];

    const geminiKey = clientGeminiKey || process.env.GEMINI_API_KEY;
    const openaiKey = clientOpenaiKey || process.env.OPENAI_API_KEY;
    const grokKey = clientGrokKey || process.env.GROK_API_KEY || process.env.XAI_API_KEY;

    // Route according to provider
    if (provider === 'gemini') {
      if (!geminiKey || geminiKey === 'your_gemini_api_key_here' || geminiKey.trim() === '') {
        return res.status(401).json({
          error: 'Google Gemini API Key missing!',
          messageHindi: 'Kripya Google Gemini API Key enter karein. Aap ise top-right Settings (⚙️) icon par click karke ya .env file me set kar sakte hain.',
          keyUrl: 'https://aistudio.google.com/app/apikey'
        });
      }

      await handleGeminiChat({
        geminiKey,
        messages,
        model,
        systemPrompt,
        temperature,
        stream,
        res
      });

    } else if (provider === 'grok' || provider === 'xai') {
      if (!grokKey || grokKey === 'your_grok_api_key_here' || grokKey === 'your_xai_api_key_here' || grokKey.trim() === '') {
        return res.status(401).json({
          error: 'Grok (xAI) API Key missing!',
          messageHindi: 'Kripya Grok API Key enter karein. Aap ise Settings (⚙️) icon par click karke ya .env file me set kar sakte hain.',
          keyUrl: 'https://console.x.ai/'
        });
      }

      await handleGrokChat({
        grokKey,
        messages,
        model,
        systemPrompt,
        temperature,
        stream,
        res
      });

    } else if (provider === 'openai') {
      if (!openaiKey || openaiKey === 'your_openai_api_key_here' || openaiKey.trim() === '') {
        return res.status(401).json({
          error: 'OpenAI API Key missing!',
          messageHindi: 'Kripya OpenAI API Key enter karein. Aap ise Settings (⚙️) icon par click karke ya .env file me set kar sakte hain.',
          keyUrl: 'https://platform.openai.com/api-keys'
        });
      }

      await handleOpenAIChat({
        openaiKey,
        messages,
        model,
        systemPrompt,
        temperature,
        stream,
        res
      });

    } else {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

  } catch (error) {
    console.error('API Chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || 'Internal Server Error',
        details: error.toString()
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

/**
 * Dynamically discover available Google Gemini models for the provided API key
 */
const modelCache = new Map();

async function getAvailableGeminiModels(apiKey) {
  if (modelCache.has(apiKey)) {
    return modelCache.get(apiKey);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.models && Array.isArray(data.models)) {
        const supported = data.models
          .filter(m => {
            const hasGenerateContent = m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent');
            const n = m.name.toLowerCase();
            const isSpecialized = n.includes('-tts') || n.includes('embedding') || n.includes('imagen') || n.includes('aqa');
            return hasGenerateContent && !isSpecialized;
          })
          .map(m => m.name.replace(/^models\//, ''));
        
        // Sort best chat models to the top
        supported.sort((a, b) => {
          const score = (name) => {
            const n = name.toLowerCase();
            if (n === 'gemini-3.6-flash' || n.includes('3.6-flash')) return 1000;
            if (n.includes('3.1-pro') || n.includes('3.1-pro-preview')) return 900;
            if (n.includes('3-flash') || n.includes('3.5-flash')) return 850;
            if (n.includes('gemma-4') || n.includes('gemma')) return 800;
            if (n.includes('2.5-flash')) return 700;
            if (n.includes('2.5-pro')) return 650;
            if (n.includes('2.0-flash')) return 600;
            if (n.includes('1.5-flash')) return 500;
            return 10;
          };
          return score(b) - score(a);
        });

        if (supported.length > 0) {
          modelCache.set(apiKey, supported);
          console.log(`Discovered ${supported.length} text Gemini models:`, supported.slice(0, 5));
          return supported;
        }
      }
    }
  } catch (e) {
    console.warn('Dynamic model discovery warning:', e.message);
  }

  return ['gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
}

/**
 * Handle Google Gemini Generation with optional streaming & dynamic model resolution
 */
async function handleGeminiChat({ geminiKey, messages, model, systemPrompt, temperature, stream, res }) {
  const genAI = new GoogleGenerativeAI(geminiKey.trim());
  
  // Discover available text models dynamically for this key
  const availableModels = await getAvailableGeminiModels(geminiKey.trim());
  
  // Build candidate order
  const candidateModels = [];
  if (model && availableModels.includes(model)) {
    candidateModels.push(model);
  }
  
  // Add remaining available text models in sorted order
  for (const m of availableModels) {
    if (!candidateModels.includes(m)) {
      candidateModels.push(m);
    }
  }

  // Fallbacks if list is empty
  if (candidateModels.length === 0) {
    candidateModels.push('gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-1.5-flash');
  }

  // Convert incoming messages into Gemini contents format
  const contents = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.role === 'assistant' ? 'model' : 'user';
    contents.push({
      role: role,
      parts: [{ text: msg.content || '' }]
    });
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let success = false;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const generativeModel = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt || undefined,
          generationConfig: {
            temperature: typeof temperature === 'number' ? temperature : 0.7,
          }
        });

        const responseStream = await generativeModel.generateContentStream({
          contents: contents
        });

        for await (const chunk of responseStream.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        success = true;
        console.log(`✅ Successfully generated response using model: ${modelName}`);
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Gemini Model ${modelName} attempt failed:`, err.message);
        // Only stop if API key itself is invalid
        if (err.message?.includes('API key not valid') || err.message?.includes('API_KEY_INVALID')) {
          break;
        }
      }
    }

    if (!success && !res.writableEnded) {
      console.error('All Gemini Models Failed:', lastError);
      let userMsg = `⚠️ **Google Gemini Error:** ${lastError?.message || 'Unable to connect to Gemini API.'}`;
      
      if (lastError?.message?.includes('API key not valid') || lastError?.message?.includes('API_KEY_INVALID')) {
        userMsg = `### ⚠️ Google Gemini API Key Galat (Invalid) Hai\n\n` +
          `Aapki enter ki hui API key valid nahi hai.\n\n` +
          `👉 **Nayi 100% Free Key paane ke liye:**\n` +
          `1. [Google AI Studio (aistudio.google.com/app/apikey)](https://aistudio.google.com/app/apikey) par jayein.\n` +
          `2. **"Create API Key"** par click karein aur key copy karein.\n` +
          `3. Top-right me **Settings (⚙️)** me jakar paste karein!`;
      }

      res.write(`data: ${JSON.stringify({ text: userMsg })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } else {
    const generativeModel = genAI.getGenerativeModel({ model: candidateModels[0] });
    const result = await generativeModel.generateContent({ contents: contents });
    res.json({ reply: result.response.text() });
  }
}

/**
 * Handle OpenAI Generation with optional streaming
 */
async function handleOpenAIChat({ openaiKey, messages, model, systemPrompt, temperature, stream, res }) {
  const openai = new OpenAI({ apiKey: openaiKey.trim() });

  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    });
  }

  const actualModel = model || 'gpt-4o-mini';

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const completion = await openai.chat.completions.create({
        model: actualModel,
        messages: formattedMessages,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        stream: true
      });

      for await (const chunk of completion) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          res.write(`data: ${JSON.stringify({ text: text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      console.error('OpenAI Stream Error:', err);
      let userMsg = `⚠️ **OpenAI Error:** ${err.message || 'Error from OpenAI API'}`;

      if (err.status === 429 || err.message?.includes('insufficient_quota') || err.message?.includes('credit_balance_exhausted')) {
        userMsg = `### ⚠️ OpenAI Account me Credits ($0 Balance) Khatam Hain!\n\n` +
          `Aapke OpenAI account ka balance khatam ho chuka hai.\n\n` +
          `👉 **Solution:** Model Selector dropdown se **⚡ Gemini 1.5 Flash** choose karein, jo Google dwara **100% Free** provide kiya jata hai!`;
      }

      res.write(`data: ${JSON.stringify({ text: userMsg })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } else {
    const response = await openai.chat.completions.create({
      model: actualModel,
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7
    });

    res.json({ reply: response.choices[0]?.message?.content || '' });
  }
}

/**
 * Handle Grok (xAI) Generation with optional streaming (OpenAI Compatible)
 */
async function handleGrokChat({ grokKey, messages, model, systemPrompt, temperature, stream, res }) {
  const grokClient = new OpenAI({
    apiKey: grokKey.trim(),
    baseURL: 'https://api.x.ai/v1'
  });

  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    });
  }

  const actualModel = model || 'grok-2-latest';

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const completion = await grokClient.chat.completions.create({
        model: actualModel,
        messages: formattedMessages,
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        stream: true
      });

      for await (const chunk of completion) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          res.write(`data: ${JSON.stringify({ text: text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      console.error('Grok Stream Error:', err);
      let userMsg = `⚠️ **Grok (xAI) Error:** ${err.message || 'Error from Grok API'}`;

      if (err.status === 401 || err.message?.includes('Incorrect API key') || err.message?.includes('invalid_api_key')) {
        userMsg = `### ⚠️ Grok API Key Galat (Invalid) Hai\n\n` +
          `Aapki enter ki hui Grok API key valid nahi hai.\n\n` +
          `👉 **Key paane ke liye:**\n` +
          `1. [xAI Console (console.x.ai)](https://console.x.ai/) par jayein.\n` +
          `2. API Key generate karein aur copy karein.\n` +
          `3. Top-right me **Settings (⚙️)** me jakar paste karein!`;
      } else if (err.status === 429 || err.message?.includes('insufficient_quota') || err.message?.includes('credit')) {
        userMsg = `### ⚠️ Grok (xAI) Account Credits Khatam Hain!\n\n` +
          `Aapke xAI account ka balance khatam ho chuka hai.\n\n` +
          `👉 **Solution:** Model Selector dropdown se **⚡ Gemini 3.6 Flash** choose karein, jo Google dwara Free provide kiya jata hai!`;
      }

      res.write(`data: ${JSON.stringify({ text: userMsg })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } else {
    const response = await grokClient.chat.completions.create({
      model: actualModel,
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7
    });

    res.json({ reply: response.choices[0]?.message?.content || '' });
  }
}

// Fallback all other routes to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server (when not running in serverless environment like Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 AI Chatbot Server is running at: http://localhost:${PORT}`);
    console.log(`======================================================`);
    console.log(`💡 Gemini Key Status: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? '✅ Configured in .env' : '⚠️ Not in .env (Can be provided in UI Settings)'}`);
    console.log(`💡 Grok Key Status:   ${(process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'your_grok_api_key_here') || (process.env.XAI_API_KEY && process.env.XAI_API_KEY !== 'your_xai_api_key_here') ? '✅ Configured in .env' : '⚠️ Not in .env (Can be provided in UI Settings)'}`);
    console.log(`💡 OpenAI Key Status: ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' ? '✅ Configured in .env' : '⚠️ Not in .env (Can be provided in UI Settings)'}`);
    console.log(`\n👉 Open http://localhost:${PORT} in your browser to chat!\n`);
  });
}

module.exports = app;

