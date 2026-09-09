/**
 * TARA AI — FRONTEND APPLICATION LOGIC
 * Developed by Shahnawaz
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // CONFIG & STATE
  // ==========================================================================

  const STORAGE_KEYS = {
    SESSIONS: 'tara_ai_sessions_v1',
    ACTIVE_SESSION: 'tara_ai_active_session_v1',
    SETTINGS: 'tara_ai_settings_v1'
  };

  const PERSONA_PROMPTS = {
    general: 'Aapka naam Tara AI (तारा AI) hai. Aapko Shahnawaz (शाहनवाज़) ne develop kiya hai. Agar koi bhi pooche ki aapko kisne develop kiya ya banaya hai, toh hamesha fakhr aur aadar ke sath batayein: "Mujhe Shahnawaz ne develop kiya hai." Aap bahut hi intelligent, polite, warm aur lightning-fast AI assistant hain. Hamesha fast, helpful, sweet aur structured format me answer dein.',
    coder: 'Aapka naam Tara AI hai (Developed by Shahnawaz). Aap ek world-class expert senior software engineer hain. Clean, modular, error-free aur well-documented code with fastest solutions provide karein.',
    tutor: 'Aapka naam Tara AI hai (Developed by Shahnawaz). Aap ek bahut hi pyari aur patient teacher hain jo complex topics ko simple Hinglish aur Hindi me relatable examples ke sath fast samjhati hain.',
    creative: 'Aapka naam Tara AI hai (Developed by Shahnawaz). Aap ek master creative writer aur storyteller hain jo attractive aur engaging content fast likhti hain.',
    concise: 'Aapka naam Tara AI hai (Developed by Shahnawaz). Aap ultra-fast aur direct bulleted answers deti hain without any unnecessary delay.'
  };

  const defaultSettings = {
    geminiApiKey: '',
    openaiApiKey: '',
    grokApiKey: '',
    temperature: 0.7,
    customSystemPrompt: '',
    autoSpeak: false,
    defaultModel: 'gemini-3.6-flash',
    persona: 'general',
    voiceURI: '',
    voicePitch: 1.25,
    voiceSpeed: 1.05
  };

  let state = {
    sessions: [],
    activeSessionId: null,
    settings: { ...defaultSettings },
    isGenerating: false,
    abortController: null,
    speechRecognition: null,
    isListening: false,
    isSpeaking: false,
    demoMode: false,
    hasServerKey: false,
    isCallActive: false,
    callMuted: false,
    availableVoices: []
  };

  // ==========================================================================
  // DOM ELEMENTS
  // ==========================================================================

  const el = {
    // Banner & Status
    apiWarningBanner: document.getElementById('apiWarningBanner'),
    bannerSettingsBtn: document.getElementById('bannerSettingsBtn'),
    enableDemoBtn: document.getElementById('enableDemoBtn'),

    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    chatHistoryList: document.getElementById('chatHistoryList'),
    chatCountBadge: document.getElementById('chatCountBadge'),
    apiStatusBadge: document.getElementById('apiStatusBadge'),
    clearAllChatsBtn: document.getElementById('clearAllChatsBtn'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    headerSettingsBtn: document.getElementById('headerSettingsBtn'),

    // Voice Call Button & Modal
    voiceCallToggleBtn: document.getElementById('voiceCallToggleBtn'),
    voiceCallOverlay: document.getElementById('voiceCallOverlay'),
    voiceOrb: document.getElementById('voiceOrb'),
    callStatusText: document.getElementById('callStatusText'),
    callSubtitle: document.getElementById('callSubtitle'),
    callMicToggleBtn: document.getElementById('callMicToggleBtn'),
    endCallBtn: document.getElementById('endCallBtn'),

    // Main
    currentSessionTitle: document.getElementById('currentSessionTitle'),
    currentSessionSubtitle: document.getElementById('currentSessionSubtitle'),
    modelSelector: document.getElementById('modelSelector'),
    personaSelector: document.getElementById('personaSelector'),
    chatMessagesContainer: document.getElementById('chatMessagesContainer'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    messagesList: document.getElementById('messagesList'),

    // Input
    messageInput: document.getElementById('messageInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    stopGenerationBtn: document.getElementById('stopGenerationBtn'),
    voiceInputBtn: document.getElementById('voiceInputBtn'),
    charCounter: document.getElementById('charCounter'),

    // Settings Modal
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
    cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    geminiApiKeyInput: document.getElementById('geminiApiKeyInput'),
    openaiApiKeyInput: document.getElementById('openaiApiKeyInput'),
    grokApiKeyInput: document.getElementById('grokApiKeyInput'),
    customSystemPrompt: document.getElementById('customSystemPrompt'),
    temperatureRange: document.getElementById('temperatureRange'),
    tempValueDisplay: document.getElementById('tempValueDisplay'),
    voiceSelector: document.getElementById('voiceSelector'),
    voicePitchRange: document.getElementById('voicePitchRange'),
    voiceSpeedRange: document.getElementById('voiceSpeedRange'),
    pitchDisplay: document.getElementById('pitchDisplay'),
    speedDisplay: document.getElementById('speedDisplay'),
    testVoiceBtn: document.getElementById('testVoiceBtn'),
    autoSpeakCheckbox: document.getElementById('autoSpeakCheckbox'),
    toastContainer: document.getElementById('toastContainer')
  };

  // ==========================================================================
  // MARKDOWN CONFIGURATION
  // ==========================================================================

  if (window.marked) {
    const renderer = new marked.Renderer();

    renderer.code = function(tokenOrCode, maybeLang) {
      let code = '';
      let language = '';

      if (typeof tokenOrCode === 'object' && tokenOrCode !== null) {
        code = tokenOrCode.text || '';
        language = tokenOrCode.lang || '';
      } else {
        code = String(tokenOrCode || '');
        language = String(maybeLang || '');
      }

      let highlighted = escapeHtml(code);
      const displayLang = language || 'code';

      try {
        if (typeof hljs !== 'undefined' && hljs) {
          const validLang = language && hljs.getLanguage(language) ? language : '';
          highlighted = validLang
            ? hljs.highlight(code, { language: validLang }).value
            : hljs.highlightAuto(code).value;
        }
      } catch (e) {
        highlighted = escapeHtml(code);
      }

      return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="code-lang">${escapeHtml(displayLang)}</span>
            <button class="copy-code-btn" onclick="copyCodeSnippet(this)">
              <i class="ri-file-copy-line"></i> Copy Code
            </button>
          </div>
          <pre><code class="hljs ${escapeHtml(language)}">${highlighted}</code></pre>
        </div>
      `;
    };

    marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: true
    });
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  function init() {
    loadSettings();
    loadSessions();
    setupEventListeners();
    setupSpeechRecognition();
    setupVoiceList();
    checkServerHealth();

    el.messageInput.focus();
  }

  // ==========================================================================
  // VOICE & TTS ENGINE (SWEET REAL GIRL VOICE)
  // ==========================================================================

  function setupVoiceList() {
    if (!('speechSynthesis' in window)) return;

    function populateVoices() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      state.availableVoices = voices;
      el.voiceSelector.innerHTML = '';

      // Sort voices prioritizing sweet female voices (Hindi, Indian English, British, US Female)
      const rankedVoices = [...voices].sort((a, b) => {
        const score = (v) => {
          const name = v.name.toLowerCase();
          const lang = v.lang.toLowerCase();
          let s = 0;
          if (lang.includes('hi') || lang.includes('in')) s += 50;
          if (name.includes('female') || name.includes('swara') || name.includes('heera') || name.includes('neerja') || name.includes('zira') || name.includes('jenny') || name.includes('samantha') || name.includes('karen')) s += 40;
          if (name.includes('natural') || name.includes('online')) s += 20;
          if (lang.includes('en-in') || lang.includes('en-gb') || lang.includes('en-us')) s += 15;
          return s;
        };
        return score(b) - score(a);
      });

      rankedVoices.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.voiceURI;
        const isSweetFemale = v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('jenny') || v.lang.includes('hi');
        opt.textContent = `${isSweetFemale ? '🌸 ' : '🎙️ '}${v.name} (${v.lang})`;
        if (state.settings.voiceURI === v.voiceURI) {
          opt.selected = true;
        }
        el.voiceSelector.appendChild(opt);
      });

      // Default to best sweet female voice if not saved
      if (!state.settings.voiceURI && rankedVoices.length > 0) {
        state.settings.voiceURI = rankedVoices[0].voiceURI;
        el.voiceSelector.value = rankedVoices[0].voiceURI;
      }
    }

    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoices;
    }
  }

  function getSelectedVoice() {
    if (!state.availableVoices || state.availableVoices.length === 0) {
      if ('speechSynthesis' in window) state.availableVoices = window.speechSynthesis.getVoices();
    }
    const voiceURI = state.settings.voiceURI || el.voiceSelector?.value;
    const found = state.availableVoices.find(v => v.voiceURI === voiceURI);
    if (found) return found;

    // Fallback sweet female voice
    return state.availableVoices.find(v => 
      v.lang.includes('hi') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('zira')
    ) || state.availableVoices[0];
  }

  function speakText(rawText, onEndCallback = null) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean text: strip markdown symbols for natural human speech
    const plainText = rawText
      .replace(/```[\s\S]*?```/g, 'Code block.')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[#*`_~[\]()|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plainText) {
      if (onEndCallback) onEndCallback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(plainText);
    const chosenVoice = getSelectedVoice();
    if (chosenVoice) utterance.voice = chosenVoice;

    // Sweet real-girl pitch and fast natural speed
    utterance.pitch = parseFloat(state.settings.voicePitch || 1.25);
    utterance.rate = parseFloat(state.settings.voiceSpeed || 1.05);

    state.isSpeaking = true;
    if (state.isCallActive) {
      el.voiceOrb.className = 'voice-orb speaking';
      el.callStatusText.textContent = '🌸 Tara is speaking...';
    }

    utterance.onend = () => {
      state.isSpeaking = false;
      if (state.isCallActive) {
        el.voiceOrb.className = 'voice-orb listening';
        el.callStatusText.textContent = 'Listening to you... Speak now';
      }
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      state.isSpeaking = false;
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  }

  function toggleSpeech(text, btnElement) {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech not supported.', 'error');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      btnElement.innerHTML = '<i class="ri-volume-up-line"></i> Speak';
    } else {
      btnElement.innerHTML = '<i class="ri-volume-mute-line"></i> Stop';
      speakText(text, () => {
        btnElement.innerHTML = '<i class="ri-volume-up-line"></i> Speak';
      });
    }
  }

  // ==========================================================================
  // LIVE VOICE CALL MODE (TARA SE BAAT KAREIN)
  // ==========================================================================

  function startVoiceCall() {
    state.isCallActive = true;
    el.voiceCallOverlay.classList.add('active');
    el.voiceOrb.className = 'voice-orb listening';
    el.callStatusText.textContent = 'Listening... Speak now';
    el.callSubtitle.textContent = '"Namaste! Main Tara hoon. Mujhe Shahnawaz ne develop kiya hai. Boliye, main sun rahi hoon..."';

    // Welcome greeting in sweet girl voice on call start
    speakText('Namaste! Main Tara hoon. Boliye, main sun rahi hoon.', () => {
      startCallListening();
    });
  }

  function endVoiceCall() {
    state.isCallActive = false;
    el.voiceCallOverlay.classList.remove('active');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (state.speechRecognition && state.isListening) {
      state.speechRecognition.stop();
    }
  }

  function startCallListening() {
    if (!state.isCallActive || state.callMuted || !state.speechRecognition) return;
    try {
      if (!state.isListening && !window.speechSynthesis.speaking) {
        state.speechRecognition.start();
      }
    } catch (e) {
      // Ignore if already started
    }
  }

  // ==========================================================================
  // SPEECH RECOGNITION (VOICE INPUT)
  // ==========================================================================

  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      el.voiceInputBtn.style.display = 'none';
      if (el.voiceCallToggleBtn) el.voiceCallToggleBtn.style.display = 'none';
      return;
    }

    state.speechRecognition = new SpeechRecognition();
    state.speechRecognition.continuous = false;
    state.speechRecognition.interimResults = true;
    state.speechRecognition.lang = 'hi-IN'; // Hindi + Hinglish + English support

    state.speechRecognition.onstart = () => {
      state.isListening = true;
      el.voiceInputBtn.classList.add('listening');
      if (state.isCallActive) {
        el.voiceOrb.className = 'voice-orb listening';
        el.callStatusText.textContent = 'Listening to you... Speak now';
      }
    };

    state.speechRecognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (state.isCallActive) {
        el.callSubtitle.textContent = `"${transcript}"`;
      } else {
        el.messageInput.value = transcript;
        updateCharCounter();
        autoResizeInput();
      }
    };

    state.speechRecognition.onerror = (e) => {
      state.isListening = false;
      el.voiceInputBtn.classList.remove('listening');
      if (state.isCallActive) {
        setTimeout(() => {
          if (state.isCallActive && !window.speechSynthesis.speaking) startCallListening();
        }, 1000);
      }
    };

    state.speechRecognition.onend = () => {
      state.isListening = false;
      el.voiceInputBtn.classList.remove('listening');

      if (state.isCallActive) {
        const spokenText = el.callSubtitle.textContent.replace(/"/g, '').trim();
        if (spokenText && !spokenText.startsWith('Namaste!')) {
          el.callStatusText.textContent = 'Thinking...';
          el.voiceOrb.className = 'voice-orb';
          sendMessage(spokenText, true);
        } else {
          startCallListening();
        }
      } else if (el.messageInput.value.trim().length > 0) {
        sendMessage();
      }
    };
  }

  function toggleVoiceInput() {
    if (!state.speechRecognition) {
      showToast('Speech recognition not supported in this browser.', 'error');
      return;
    }

    if (state.isListening) {
      state.speechRecognition.stop();
    } else {
      state.speechRecognition.start();
    }
  }

  // ==========================================================================
  // SETTINGS MANAGEMENT
  // ==========================================================================

  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        state.settings = { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }

    el.geminiApiKeyInput.value = state.settings.geminiApiKey || '';
    el.openaiApiKeyInput.value = state.settings.openaiApiKey || '';
    if (el.grokApiKeyInput) el.grokApiKeyInput.value = state.settings.grokApiKey || '';
    el.customSystemPrompt.value = state.settings.customSystemPrompt || '';
    el.temperatureRange.value = state.settings.temperature ?? 0.7;
    el.tempValueDisplay.textContent = state.settings.temperature ?? 0.7;
    el.autoSpeakCheckbox.checked = !!state.settings.autoSpeak;
    
    el.voicePitchRange.value = state.settings.voicePitch ?? 1.25;
    el.pitchDisplay.textContent = state.settings.voicePitch ?? 1.25;
    el.voiceSpeedRange.value = state.settings.voiceSpeed ?? 1.05;
    el.speedDisplay.textContent = state.settings.voiceSpeed ?? 1.05;

    if (state.settings.defaultModel) {
      el.modelSelector.value = state.settings.defaultModel;
    }
    if (state.settings.persona) {
      el.personaSelector.value = state.settings.persona;
    }
  }

  function saveSettings() {
    state.settings.geminiApiKey = el.geminiApiKeyInput.value.trim();
    state.settings.openaiApiKey = el.openaiApiKeyInput.value.trim();
    state.settings.grokApiKey = el.grokApiKeyInput ? el.grokApiKeyInput.value.trim() : '';
    state.settings.customSystemPrompt = el.customSystemPrompt.value.trim();
    state.settings.temperature = parseFloat(el.temperatureRange.value);
    state.settings.autoSpeak = el.autoSpeakCheckbox.checked;
    state.settings.defaultModel = el.modelSelector.value;
    state.settings.persona = el.personaSelector.value;
    state.settings.voiceURI = el.voiceSelector.value;
    state.settings.voicePitch = parseFloat(el.voicePitchRange.value);
    state.settings.voiceSpeed = parseFloat(el.voiceSpeedRange.value);

    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
      showToast('Settings & Sweet Voice saved!', 'success');
      closeSettingsModal();
      checkServerHealth();
    } catch (e) {
      showToast('Failed to save settings.', 'error');
    }
  }

  function openSettingsModal() {
    el.settingsModal.classList.add('open');
  }

  function closeSettingsModal() {
    el.settingsModal.classList.remove('open');
  }

  // ==========================================================================
  // CHAT SESSIONS & STORAGE
  // ==========================================================================

  function loadSessions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (saved) {
        state.sessions = JSON.parse(saved);
      }
    } catch (e) {
      state.sessions = [];
    }

    const lastActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (lastActiveId && state.sessions.some(s => s.id === lastActiveId)) {
      switchSession(lastActiveId);
    } else if (state.sessions.length > 0) {
      switchSession(state.sessions[0].id);
    } else {
      createNewSession();
    }

    renderHistoryList();
  }

  function saveSessions() {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, state.activeSessionId);
    } catch (e) {
      console.error('Error saving sessions:', e);
    }
    renderHistoryList();
  }

  function createNewSession() {
    const newSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: []
    };

    state.sessions.unshift(newSession);
    state.activeSessionId = newSession.id;
    saveSessions();
    renderCurrentSession();
    closeMobileSidebar();
    el.messageInput.focus();
  }

  function switchSession(sessionId) {
    state.activeSessionId = sessionId;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, sessionId);
    renderCurrentSession();
    renderHistoryList();
    closeMobileSidebar();
  }

  function deleteSession(sessionId, event) {
    if (event) event.stopPropagation();
    
    if (confirm('Delete this conversation?')) {
      state.sessions = state.sessions.filter(s => s.id !== sessionId);
      if (state.activeSessionId === sessionId) {
        if (state.sessions.length > 0) {
          state.activeSessionId = state.sessions[0].id;
        } else {
          createNewSession();
          return;
        }
      }
      saveSessions();
      renderCurrentSession();
    }
  }

  function clearAllSessions() {
    if (confirm('Are you sure you want to clear all chat history?')) {
      state.sessions = [];
      createNewSession();
      showToast('All chat history cleared.', 'success');
    }
  }

  function getCurrentSession() {
    return state.sessions.find(s => s.id === state.activeSessionId);
  }

  // ==========================================================================
  // UI RENDERING
  // ==========================================================================

  function renderHistoryList() {
    el.chatCountBadge.textContent = state.sessions.length;
    el.chatHistoryList.innerHTML = '';

    if (state.sessions.length === 0) {
      el.chatHistoryList.innerHTML = `
        <div style="padding: 12px; font-size: 12px; color: var(--text-muted); text-align: center;">
          No conversations yet
        </div>
      `;
      return;
    }

    state.sessions.forEach(session => {
      const item = document.createElement('div');
      item.className = `history-item ${session.id === state.activeSessionId ? 'active' : ''}`;
      item.innerHTML = `
        <i class="ri-message-3-line item-icon"></i>
        <span class="item-title" title="${escapeHtml(session.title)}">${escapeHtml(session.title)}</span>
        <div class="item-actions">
          <button class="item-action-btn delete-chat-btn" title="Delete conversation">
            <i class="ri-delete-bin-6-line"></i>
          </button>
        </div>
      `;

      item.addEventListener('click', () => switchSession(session.id));
      const deleteBtn = item.querySelector('.delete-chat-btn');
      deleteBtn.addEventListener('click', (e) => deleteSession(session.id, e));

      el.chatHistoryList.appendChild(item);
    });
  }

  function renderCurrentSession() {
    const session = getCurrentSession();
    if (!session) return;

    el.currentSessionTitle.textContent = session.title;
    el.currentSessionSubtitle.textContent = `Developed by Shahnawaz • ${session.messages.length} msgs`;

    el.messagesList.innerHTML = '';

    if (session.messages.length === 0) {
      el.welcomeScreen.style.display = 'block';
      el.messagesList.style.display = 'none';
    } else {
      el.welcomeScreen.style.display = 'none';
      el.messagesList.style.display = 'flex';

      session.messages.forEach(msg => {
        appendMessageElement(msg.role, msg.content, false, msg.timestamp);
      });

      scrollToBottom();
    }
  }

  function appendMessageElement(role, text, isStreaming = false, timestamp = null) {
    const timeFormatted = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const row = document.createElement('div');
    row.className = `message-row ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${role === 'assistant' ? 'assistant-logo-avatar' : ''}`;
    avatar.innerHTML = role === 'user' ? '<i class="ri-user-3-line"></i>' : '<img src="logo.png" alt="Tara" class="avatar-logo-img">';

    const body = document.createElement('div');
    body.className = 'message-body';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'markdown-body';

    if (role === 'user') {
      contentDiv.textContent = text;
    } else {
      contentDiv.innerHTML = renderMarkdown(text) + (isStreaming ? '<span class="typing-indicator"></span>' : '');
    }

    body.appendChild(contentDiv);

    if (role === 'assistant') {
      const meta = document.createElement('div');
      meta.className = 'message-meta';
      meta.innerHTML = `
        <span>🌸 Tara • ${timeFormatted}</span>
        <div class="message-actions">
          <button class="msg-btn copy-msg-btn" title="Copy response">
            <i class="ri-clipboard-line"></i> Copy
          </button>
          <button class="msg-btn speak-msg-btn" title="Sweet Voice Output">
            <i class="ri-volume-up-line"></i> Speak
          </button>
        </div>
      `;

      const copyBtn = meta.querySelector('.copy-msg-btn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.innerHTML = '<i class="ri-check-line"></i> Copied!';
          setTimeout(() => { copyBtn.innerHTML = '<i class="ri-clipboard-line"></i> Copy'; }, 2000);
        });
      });

      const speakBtn = meta.querySelector('.speak-msg-btn');
      speakBtn.addEventListener('click', () => toggleSpeech(text, speakBtn));

      body.appendChild(meta);
    }

    row.appendChild(avatar);
    row.appendChild(body);

    el.messagesList.appendChild(row);
    scrollToBottom();

    return { row, contentDiv, body };
  }

  function renderMarkdown(rawText) {
    if (!rawText) return '';
    try {
      if (window.marked) {
        const html = marked.parse(rawText);
        if (window.DOMPurify) {
          return DOMPurify.sanitize(html);
        }
        return html;
      }
      return escapeHtml(rawText).replace(/\n/g, '<br>');
    } catch (e) {
      return escapeHtml(rawText).replace(/\n/g, '<br>');
    }
  }

  function scrollToBottom() {
    el.chatMessagesContainer.scrollTop = el.chatMessagesContainer.scrollHeight;
  }

  // ==========================================================================
  // SEND MESSAGE & FAST STREAMING HANDLER
  // ==========================================================================

  async function sendMessage(overridePrompt = null, isVoiceCall = false) {
    const prompt = overridePrompt || el.messageInput.value.trim();
    if (!prompt || state.isGenerating) return;

    const session = getCurrentSession();
    if (!session) return;

    const userMsg = {
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };
    session.messages.push(userMsg);

    if (session.messages.length === 1 || session.title === 'New Conversation') {
      session.title = prompt.length > 32 ? prompt.substring(0, 32) + '...' : prompt;
    }

    el.messageInput.value = '';
    el.messageInput.style.height = 'auto';
    updateCharCounter();

    el.welcomeScreen.style.display = 'none';
    el.messagesList.style.display = 'flex';
    appendMessageElement('user', prompt, false, userMsg.timestamp);
    saveSessions();

    state.isGenerating = true;
    state.abortController = new AbortController();
    toggleGenerationState(true);

    const selectedOption = el.modelSelector.options[el.modelSelector.selectedIndex];
    const model = el.modelSelector.value;
    const provider = selectedOption.getAttribute('data-provider') || 'gemini';
    const persona = el.personaSelector.value;
    const systemPrompt = state.settings.customSystemPrompt || PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.general;

    let fullResponse = '';
    const { row, contentDiv, body } = appendMessageElement('assistant', '', true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (state.settings.geminiApiKey) headers['x-gemini-api-key'] = state.settings.geminiApiKey;
      if (state.settings.openaiApiKey) headers['x-openai-api-key'] = state.settings.openaiApiKey;
      if (state.settings.grokApiKey) headers['x-grok-api-key'] = state.settings.grokApiKey;

      const hasAnyKey = !!(state.settings.geminiApiKey || state.settings.openaiApiKey || state.settings.grokApiKey || state.hasServerKey);

      // Instant fast Demo response if no key configured
      if (state.demoMode || !hasAnyKey) {
        const demoReply = await simulateStreamingResponse(prompt, persona, contentDiv);
        const assistantMsg = {
          role: 'assistant',
          content: demoReply,
          timestamp: new Date().toISOString()
        };
        session.messages.push(assistantMsg);
        saveSessions();
        renderCurrentSession();

        state.isGenerating = false;
        state.abortController = null;
        toggleGenerationState(false);

        if (isVoiceCall || state.settings.autoSpeak) {
          speakText(demoReply, () => {
            if (isVoiceCall && state.isCallActive) startCallListening();
          });
        }
        return;
      }

      // Fast streaming request to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          messages: session.messages.map(m => ({ role: m.role, content: m.content })),
          model: model,
          provider: provider,
          systemPrompt: systemPrompt,
          temperature: state.settings.temperature ?? 0.7,
          stream: true
        }),
        signal: state.abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.messageHindi || errorData.error || `Server status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.substring(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.text) {
                fullResponse += parsed.text;
                contentDiv.innerHTML = renderMarkdown(fullResponse) + '<span class="typing-indicator"></span>';
                scrollToBottom();

                if (isVoiceCall) {
                  el.callSubtitle.textContent = `"${fullResponse.substring(0, 140)}..."`;
                }
              }
            } catch (e) {}
          }
        }
      }

      contentDiv.innerHTML = renderMarkdown(fullResponse);

      const assistantMsg = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date().toISOString()
      };
      session.messages.push(assistantMsg);
      saveSessions();
      renderCurrentSession();

      if (isVoiceCall || state.settings.autoSpeak) {
        speakText(fullResponse, () => {
          if (isVoiceCall && state.isCallActive) startCallListening();
        });
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        contentDiv.innerHTML = renderMarkdown(fullResponse + '\n\n*(Stopped)*');
      } else {
        const errorMessage = `⚠️ **Notice:** ${err.message}\n\n*Aap Settings (⚙️) me jakar apni Free Google Gemini key add kar sakte hain.*`;
        contentDiv.innerHTML = renderMarkdown(errorMessage);
        session.messages.push({
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date().toISOString()
        });
        saveSessions();
      }
    } finally {
      state.isGenerating = false;
      state.abortController = null;
      toggleGenerationState(false);
    }
  }

  // Fast simulated response generator with Tara & Shahnawaz branding
  async function simulateStreamingResponse(prompt, persona, targetElement) {
    const lower = prompt.toLowerCase();
    let sampleReply = '';

    if (lower.includes('develop') || lower.includes('banaya') || lower.includes('creator') || lower.includes('owner') || lower.includes('shahnawaz') || lower.includes('who are you') || lower.includes('kaun ho')) {
      sampleReply = `### 🌸 Namaste! Main Tara AI hoon.

Mujhe **Shahnawaz (शाहनवाज़)** ne develop kiya hai! 

Main ek super-fast, intelligent aur friendly AI assistant hoon. Shahnawaz ne mujhe is tarah design kiya hai ki main aapke sabhi coding, studies, writing aur general questions ka jawab **turant aur accurate** tareeqe se de sakoon!

Aap mujhse koi bhi sawal pooch sakte hain ya upar **"Talk to Tara"** button dabakar mujhse seedhe bol kar baat bhi kar sakte hain! 🎙️✨`;
    } else if (lower.includes('resume') || lower.includes('cv') || lower.includes('action words')) {
      sampleReply = `### 📄 Top 5 Resume Improvement Tips & Strong Action Words (by Tara AI)

Agar aap apna resume **Top 1% level** par le jana chahte hain:

1. **Quantify Achievements (Numbers use karein):**
   - ✅ *"Optimized database queries, reducing page load time by 42% for 100k+ active users."*
2. **Use STAR Method:** Situation $\\rightarrow$ Task $\\rightarrow$ Action $\\rightarrow$ Result.
3. **ATS-Friendly Clean Formatting:** Single-column layout standard fonts ke sath.
4. **Action Verbs Use Karein:** *"Spearheaded"*, *"Architected"*, *"Accelerated"*, *"Engineered"*.
5. **Job Description Keywords Match Karein.**

---

### 💥 High-Impact Action Words:
- **Leadership:** *Spearheaded, Orchestrated, Championed, Directed, Pioneered*
- **Technical:** *Architected, Engineered, Developed, Deployed, Automated*
- **Growth:** *Accelerated, Maximized, Streamlined, Scaled, Boosted*`;
    } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('namaste')) {
      sampleReply = `### 🌸 Hello! Namaste! Main Tara AI hoon.

Mujhe **Shahnawaz** ne develop kiya hai. Main aapki kya madad kar sakti hoon?

- 💻 **Coding & Programming:** Python, JavaScript, HTML/CSS, React, SQL.
- 📚 **Study & Learning:** Science, Maths aur complex topics simple bhasha me.
- ✍️ **Writing & Email:** Professional emails, resumes aur stories.
- 🎙️ **Voice Talk:** Upar **"Talk to Tara"** button dabakar mujhse live baat karein!`;
    } else {
      sampleReply = `### 🌸 Tara AI (Developed by Shahnawaz)

Aapne poocha: **"${prompt}"**

Aapka chatbot frontend aur backend poori tarah se functioning aur super-fast hai!

🌟 **Live Google Gemini 3.6 Flash se connect karne ke liye:**
1. Top-right me **Settings (⚙️)** par click karein.
2. [Google AI Studio](https://aistudio.google.com/app/apikey) se Free key lekar paste karein!`;
    }

    // High speed word-by-word streaming
    const words = sampleReply.split(' ');
    let currentText = '';
    for (let i = 0; i < words.length; i++) {
      if (state.abortController?.signal.aborted) break;
      currentText += (i === 0 ? '' : ' ') + words[i];
      targetElement.innerHTML = renderMarkdown(currentText) + '<span class="typing-indicator"></span>';
      scrollToBottom();
      await new Promise(r => setTimeout(r, 12)); // 12ms for lightning fast stream
    }
    targetElement.innerHTML = renderMarkdown(currentText);
    return sampleReply;
  }

  function toggleGenerationState(generating) {
    if (generating) {
      el.sendMessageBtn.disabled = true;
      el.sendMessageBtn.style.display = 'none';
      el.stopGenerationBtn.style.display = 'flex';
    } else {
      el.sendMessageBtn.disabled = false;
      el.sendMessageBtn.style.display = 'flex';
      el.stopGenerationBtn.style.display = 'none';
    }
  }

  function stopGeneration() {
    if (state.abortController) {
      state.abortController.abort();
    }
  }

  // ==========================================================================
  // SERVER HEALTH CHECK
  // ==========================================================================

  async function checkServerHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      
      state.hasServerKey = !!(data.providers?.geminiConfigured || data.providers?.openaiConfigured || data.providers?.grokConfigured);
      const hasKey = (state.settings.geminiApiKey || state.settings.openaiApiKey || state.settings.grokApiKey || state.hasServerKey);
      
      const dot = el.apiStatusBadge.querySelector('.status-dot');
      const text = el.apiStatusBadge.querySelector('.status-text');

      if (hasKey) {
        dot.className = 'status-dot active';
        text.textContent = 'Tara API Ready';
        if (el.apiWarningBanner) el.apiWarningBanner.style.display = 'none';
      } else {
        dot.className = 'status-dot';
        text.textContent = 'Key Required (Settings ⚙️)';
        if (el.apiWarningBanner) el.apiWarningBanner.style.display = 'flex';
      }
    } catch (e) {
      const dot = el.apiStatusBadge.querySelector('.status-dot');
      const text = el.apiStatusBadge.querySelector('.status-text');
      dot.className = 'status-dot error';
      text.textContent = 'Server Offline';
      if (el.apiWarningBanner) el.apiWarningBanner.style.display = 'flex';
    }
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  function setupEventListeners() {
    // Live Voice Call Mode
    if (el.voiceCallToggleBtn) {
      el.voiceCallToggleBtn.addEventListener('click', startVoiceCall);
    }
    if (el.endCallBtn) {
      el.endCallBtn.addEventListener('click', endVoiceCall);
    }
    if (el.callMicToggleBtn) {
      el.callMicToggleBtn.addEventListener('click', () => {
        state.callMuted = !state.callMuted;
        el.callMicToggleBtn.classList.toggle('muted', state.callMuted);
        el.callMicToggleBtn.innerHTML = state.callMuted ? '<i class="ri-mic-off-line"></i>' : '<i class="ri-mic-line"></i>';
        if (state.callMuted && state.speechRecognition) {
          state.speechRecognition.stop();
        } else if (!state.callMuted) {
          startCallListening();
        }
      });
    }

    // Banner buttons
    if (el.bannerSettingsBtn) el.bannerSettingsBtn.addEventListener('click', openSettingsModal);
    if (el.enableDemoBtn) {
      el.enableDemoBtn.addEventListener('click', () => {
        state.demoMode = true;
        showToast('Demo Mode Activated! Tara is ready to chat.', 'success');
        if (el.apiWarningBanner) el.apiWarningBanner.style.display = 'none';
      });
    }

    // New Chat & History
    el.newChatBtn.addEventListener('click', createNewSession);
    el.clearAllChatsBtn.addEventListener('click', clearAllSessions);

    // Mobile Sidebar
    el.toggleSidebarBtn.addEventListener('click', openMobileSidebar);
    el.closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    el.sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Settings Modal
    el.openSettingsBtn.addEventListener('click', openSettingsModal);
    el.headerSettingsBtn.addEventListener('click', openSettingsModal);
    el.closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    el.cancelSettingsBtn.addEventListener('click', closeSettingsModal);
    el.saveSettingsBtn.addEventListener('click', saveSettings);

    // Voice Pitch & Speed Sliders
    el.voicePitchRange.addEventListener('input', () => {
      el.pitchDisplay.textContent = el.voicePitchRange.value;
      state.settings.voicePitch = parseFloat(el.voicePitchRange.value);
    });
    el.voiceSpeedRange.addEventListener('input', () => {
      el.speedDisplay.textContent = el.voiceSpeedRange.value;
      state.settings.voiceSpeed = parseFloat(el.voiceSpeedRange.value);
    });

    // Test Sweet Voice Button
    el.testVoiceBtn.addEventListener('click', () => {
      state.settings.voiceURI = el.voiceSelector.value;
      state.settings.voicePitch = parseFloat(el.voicePitchRange.value);
      state.settings.voiceSpeed = parseFloat(el.voiceSpeedRange.value);
      speakText('Namaste! Main Tara hoon. Mujhe Shahnawaz ne develop kiya hai. Aapko meri aawaz kaisi lagi?');
    });

    // Temperature Range Slider
    el.temperatureRange.addEventListener('input', () => {
      el.tempValueDisplay.textContent = el.temperatureRange.value;
    });

    // Password Toggle Buttons
    document.querySelectorAll('.toggle-password-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = '<i class="ri-eye-off-line"></i>';
        } else {
          input.type = 'password';
          btn.innerHTML = '<i class="ri-eye-line"></i>';
        }
      });
    });

    // Voice Input & Send controls
    el.voiceInputBtn.addEventListener('click', toggleVoiceInput);
    el.sendMessageBtn.addEventListener('click', () => sendMessage());
    el.stopGenerationBtn.addEventListener('click', stopGeneration);

    el.messageInput.addEventListener('input', () => {
      autoResizeInput();
      updateCharCounter();
    });

    el.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Suggestion Cards on Welcome Screen
    document.querySelectorAll('.suggestion-card').forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        if (prompt) sendMessage(prompt);
      });
    });
  }

  function autoResizeInput() {
    el.messageInput.style.height = 'auto';
    el.messageInput.style.height = Math.min(el.messageInput.scrollHeight, 180) + 'px';
  }

  function updateCharCounter() {
    const len = el.messageInput.value.length;
    el.charCounter.textContent = `${len} / 10000`;
  }

  function openMobileSidebar() {
    el.sidebar.classList.add('open');
    el.sidebarOverlay.classList.add('open');
  }

  function closeMobileSidebar() {
    el.sidebar.classList.remove('open');
    el.sidebarOverlay.classList.remove('open');
  }

  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'ri-checkbox-circle-line' : type === 'error' ? 'ri-error-warning-line' : 'ri-information-line';
    toast.innerHTML = `<i class="${icon}"></i> <span>${escapeHtml(message)}</span>`;
    
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  window.copyCodeSnippet = function(button) {
    const codeBlock = button.closest('.code-block-wrapper').querySelector('pre code');
    if (!codeBlock) return;

    navigator.clipboard.writeText(codeBlock.innerText).then(() => {
      button.innerHTML = '<i class="ri-check-line"></i> Copied!';
      setTimeout(() => {
        button.innerHTML = '<i class="ri-file-copy-line"></i> Copy Code';
      }, 2000);
    });
  };

  init();
});
