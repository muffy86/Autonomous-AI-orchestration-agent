// ==UserScript==
// @name         AI Voice Commands
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Control your browser and AI tools with voice commands
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @connect      api.openai.com
// @connect      api.anthropic.com
// ==/UserScript==

(function() {
    'use strict';

    class VoiceCommandSystem {
        constructor() {
            this.recognition = null;
            this.synthesis = window.speechSynthesis;
            this.isListening = false;
            this.commands = new Map();
            this.config = {
                apiKey: GM_getValue('openai_api_key', ''),
                language: GM_getValue('language', 'en-US'),
                continuous: GM_getValue('continuous', false),
                hotword: GM_getValue('hotword', 'hey browser')
            };
            
            this.init();
        }

        init() {
            // Initialize Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.error('Speech Recognition not supported');
                return;
            }

            this.recognition = new SpeechRecognition();
            this.recognition.continuous = this.config.continuous;
            this.recognition.interimResults = true;
            this.recognition.lang = this.config.language;

            this.setupEventHandlers();
            this.registerCommands();
            this.createUI();
        }

        setupEventHandlers() {
            this.recognition.onstart = () => {
                console.log('🎤 Voice recognition started');
                this.isListening = true;
                this.updateUI('listening');
            };

            this.recognition.onend = () => {
                console.log('🎤 Voice recognition ended');
                this.isListening = false;
                this.updateUI('idle');
                
                if (this.config.continuous) {
                    setTimeout(() => this.start(), 100);
                }
            };

            this.recognition.onresult = (event) => {
                const results = event.results;
                const transcript = results[results.length - 1][0].transcript.toLowerCase().trim();
                const isFinal = results[results.length - 1].isFinal;

                console.log('Heard:', transcript, isFinal ? '(final)' : '(interim)');
                
                if (isFinal) {
                    this.processCommand(transcript);
                } else {
                    this.updateUI('listening', transcript);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateUI('error', event.error);
            };
        }

        registerCommands() {
            // Navigation commands
            this.addCommand(['go to', 'open', 'navigate to'], (text) => {
                const url = this.extractUrl(text) || `https://www.google.com/search?q=${encodeURIComponent(text)}`;
                window.location.href = url;
                this.speak('Navigating');
            });

            this.addCommand(['search for', 'search', 'google'], (text) => {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(text)}`, '_blank');
                this.speak('Searching');
            });

            this.addCommand(['ask chatgpt', 'ask gpt'], (text) => {
                window.open(`https://chat.openai.com/?q=${encodeURIComponent(text)}`, '_blank');
                this.speak('Asking ChatGPT');
            });

            this.addCommand(['ask claude'], (text) => {
                window.open(`https://claude.ai/new?q=${encodeURIComponent(text)}`, '_blank');
                this.speak('Asking Claude');
            });

            this.addCommand(['perplexity', 'search perplexity'], (text) => {
                window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent(text)}`, '_blank');
                this.speak('Searching Perplexity');
            });

            // Page control commands
            this.addCommand(['scroll down', 'scroll'], () => {
                window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                this.speak('Scrolling down');
            });

            this.addCommand(['scroll up'], () => {
                window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
                this.speak('Scrolling up');
            });

            this.addCommand(['go to top', 'scroll to top'], () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                this.speak('Going to top');
            });

            this.addCommand(['go to bottom', 'scroll to bottom'], () => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                this.speak('Going to bottom');
            });

            this.addCommand(['go back', 'back'], () => {
                window.history.back();
                this.speak('Going back');
            });

            this.addCommand(['go forward', 'forward'], () => {
                window.history.forward();
                this.speak('Going forward');
            });

            this.addCommand(['reload', 'refresh'], () => {
                window.location.reload();
                this.speak('Reloading');
            });

            this.addCommand(['new tab'], () => {
                window.open('about:blank', '_blank');
                this.speak('Opening new tab');
            });

            this.addCommand(['close tab', 'close'], () => {
                this.speak('Closing tab');
                setTimeout(() => window.close(), 500);
            });

            // Content commands
            this.addCommand(['copy page', 'copy all'], () => {
                const text = document.body.innerText;
                navigator.clipboard.writeText(text);
                this.speak('Page copied');
            });

            this.addCommand(['copy selection', 'copy selected'], () => {
                const text = window.getSelection().toString();
                if (text) {
                    navigator.clipboard.writeText(text);
                    this.speak('Selection copied');
                } else {
                    this.speak('Nothing selected');
                }
            });

            this.addCommand(['read page', 'read this'], async () => {
                const text = document.body.innerText.substring(0, 1000);
                await this.speak(text);
            });

            this.addCommand(['read selection', 'read selected'], async () => {
                const text = window.getSelection().toString();
                if (text) {
                    await this.speak(text);
                } else {
                    this.speak('Nothing selected');
                }
            });

            // AI processing commands
            this.addCommand(['summarize this', 'summarize'], async () => {
                const text = document.body.innerText.substring(0, 3000);
                this.speak('Summarizing...');
                const summary = await this.askAI(`Summarize this in 2-3 sentences: ${text}`);
                await this.speak(summary);
            });

            this.addCommand(['explain this', 'explain'], async () => {
                const text = window.getSelection().toString() || document.body.innerText.substring(0, 1000);
                this.speak('Explaining...');
                const explanation = await this.askAI(`Explain this simply: ${text}`);
                await this.speak(explanation);
            });

            this.addCommand(['translate this', 'translate'], async () => {
                const text = window.getSelection().toString() || document.body.innerText.substring(0, 500);
                this.speak('Translating...');
                const translation = await this.askAI(`Translate this to English: ${text}`);
                await this.speak(translation);
            });

            // Control commands
            this.addCommand(['stop listening', 'stop'], () => {
                this.speak('Stopping');
                this.stop();
            });

            this.addCommand(['help', 'what can you do'], async () => {
                const help = `I can help you with: navigation, search, page control, content reading, and AI tasks. Try saying: search for something, ask ChatGPT, scroll down, read this, or summarize this.`;
                await this.speak(help);
            });

            this.addCommand(['dark mode', 'enable dark mode'], () => {
                document.documentElement.style.filter = 'invert(90%) hue-rotate(180deg)';
                document.querySelectorAll('img, video').forEach(el => {
                    el.style.filter = 'invert(110%) hue-rotate(180deg)';
                });
                this.speak('Dark mode enabled');
            });

            this.addCommand(['light mode', 'disable dark mode'], () => {
                document.documentElement.style.filter = '';
                document.querySelectorAll('img, video').forEach(el => {
                    el.style.filter = '';
                });
                this.speak('Light mode enabled');
            });
        }

        addCommand(triggers, handler) {
            if (!Array.isArray(triggers)) triggers = [triggers];
            triggers.forEach(trigger => {
                this.commands.set(trigger.toLowerCase(), handler);
            });
        }

        processCommand(transcript) {
            console.log('Processing command:', transcript);

            // Check for hotword if configured
            if (this.config.hotword && !transcript.includes(this.config.hotword.toLowerCase())) {
                console.log('Hotword not detected, ignoring');
                return;
            }

            // Remove hotword from transcript
            const cleanTranscript = transcript.replace(this.config.hotword.toLowerCase(), '').trim();

            // Find matching command
            for (const [trigger, handler] of this.commands) {
                if (cleanTranscript.startsWith(trigger)) {
                    const param = cleanTranscript.substring(trigger.length).trim();
                    console.log('Executing command:', trigger, 'with param:', param);
                    handler(param);
                    return;
                }
            }

            // No matching command - ask AI
            console.log('No matching command, asking AI');
            this.handleGenericCommand(cleanTranscript);
        }

        async handleGenericCommand(text) {
            if (!text) return;

            // If it sounds like a question, ask AI
            const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can you', 'could you'];
            const isQuestion = questionWords.some(word => text.startsWith(word));

            if (isQuestion || text.includes('?')) {
                this.speak('Let me think...');
                const answer = await this.askAI(text);
                await this.speak(answer);
            } else {
                // Default to search
                this.speak('Searching');
                window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent(text)}`, '_blank');
            }
        }

        async askAI(prompt) {
            if (!this.config.apiKey) {
                return 'API key not configured. Please set your OpenAI API key in settings.';
            }

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://api.openai.com/v1/chat/completions',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.apiKey}`
                    },
                    data: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 150
                    }),
                    onload: (response) => {
                        try {
                            const data = JSON.parse(response.responseText);
                            resolve(data.choices[0].message.content);
                        } catch (e) {
                            reject(e);
                        }
                    },
                    onerror: reject
                });
            });
        }

        extractUrl(text) {
            // Extract URLs from text
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const match = text.match(urlRegex);
            if (match) return match[0];

            // Convert common sites
            const sites = {
                'youtube': 'https://www.youtube.com',
                'github': 'https://github.com',
                'twitter': 'https://twitter.com',
                'reddit': 'https://reddit.com',
                'gmail': 'https://mail.google.com'
            };

            for (const [key, url] of Object.entries(sites)) {
                if (text.includes(key)) return url;
            }

            return null;
        }

        speak(text, options = {}) {
            return new Promise((resolve) => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = options.rate || 1.1;
                utterance.pitch = options.pitch || 1;
                utterance.volume = options.volume || 1;
                utterance.lang = this.config.language;

                utterance.onend = resolve;
                this.synthesis.speak(utterance);
            });
        }

        start() {
            if (this.isListening) return;
            this.recognition.start();
        }

        stop() {
            if (!this.isListening) return;
            this.recognition.stop();
        }

        toggle() {
            if (this.isListening) {
                this.stop();
            } else {
                this.start();
            }
        }

        createUI() {
            const ui = document.createElement('div');
            ui.id = 'voice-command-ui';
            ui.innerHTML = `
                <style>
                    #voice-command-ui {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        z-index: 999999;
                    }
                    
                    #voice-toggle {
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                        border: none;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 28px;
                        transition: all 0.3s;
                    }
                    
                    #voice-toggle:hover {
                        transform: scale(1.1);
                    }
                    
                    #voice-toggle.listening {
                        animation: pulse 1.5s infinite;
                        background: linear-gradient(135deg, #ef4444 0%, #f59e0b 100%);
                    }
                    
                    #voice-toggle.error {
                        background: #dc2626;
                    }
                    
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.15); }
                    }
                    
                    #voice-status {
                        position: absolute;
                        bottom: 70px;
                        right: 0;
                        background: white;
                        padding: 12px 16px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        max-width: 300px;
                        display: none;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        font-size: 13px;
                    }
                    
                    #voice-status.show {
                        display: block;
                    }
                </style>
                
                <div id="voice-status"></div>
                <button id="voice-toggle" title="Voice Commands (Click to toggle)">🎤</button>
            `;

            document.body.appendChild(ui);

            const toggle = document.getElementById('voice-toggle');
            toggle.addEventListener('click', () => this.toggle());

            // Keyboard shortcut: Ctrl+Shift+V
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                    e.preventDefault();
                    this.toggle();
                }
            });
        }

        updateUI(state, message = '') {
            const toggle = document.getElementById('voice-toggle');
            const status = document.getElementById('voice-status');

            if (!toggle) return;

            toggle.className = state;

            if (message) {
                status.textContent = message;
                status.classList.add('show');
                setTimeout(() => status.classList.remove('show'), 3000);
            }
        }
    }

    // Initialize voice command system
    const voiceCommands = new VoiceCommandSystem();

    // Global controls
    window.voiceCommands = voiceCommands;

    console.log('🎤 Voice Commands ready! Click the mic button or press Ctrl+Shift+V');
})();
