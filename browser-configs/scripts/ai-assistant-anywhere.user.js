// ==UserScript==
// @name         AI Assistant Anywhere
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Add floating AI assistant to any webpage with text selection support
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      api.openai.com
// @connect      api.anthropic.com
// @connect      api.x.ai
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        apiKey: GM_getValue('apiKey', ''),
        provider: GM_getValue('provider', 'openai'), // openai, anthropic, xai
        model: GM_getValue('model', 'gpt-4-turbo'),
        shortcut: 'Alt+Q'
    };

    // Create floating widget
    const createWidget = () => {
        const widget = document.createElement('div');
        widget.id = 'ai-assistant-widget';
        widget.innerHTML = `
            <style>
                #ai-assistant-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                #ai-assistant-toggle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                    transition: transform 0.2s;
                }
                
                #ai-assistant-toggle:hover {
                    transform: scale(1.1);
                }
                
                #ai-assistant-panel {
                    display: none;
                    position: fixed;
                    bottom: 90px;
                    right: 20px;
                    width: 400px;
                    max-height: 600px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    overflow: hidden;
                    flex-direction: column;
                }
                
                #ai-assistant-panel.active {
                    display: flex;
                }
                
                #ai-assistant-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                #ai-assistant-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    max-height: 400px;
                    background: #f7f7f7;
                }
                
                .ai-message {
                    margin-bottom: 12px;
                    padding: 10px 14px;
                    border-radius: 8px;
                    max-width: 85%;
                }
                
                .ai-message.user {
                    background: #667eea;
                    color: white;
                    margin-left: auto;
                }
                
                .ai-message.assistant {
                    background: white;
                    border: 1px solid #e0e0e0;
                }
                
                #ai-assistant-input-container {
                    padding: 16px;
                    background: white;
                    border-top: 1px solid #e0e0e0;
                }
                
                #ai-assistant-input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 14px;
                    resize: vertical;
                    min-height: 60px;
                    font-family: inherit;
                }
                
                #ai-assistant-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                #ai-assistant-send {
                    margin-top: 8px;
                    width: 100%;
                    padding: 10px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                }
                
                #ai-assistant-send:hover {
                    background: #5568d3;
                }
                
                #ai-assistant-send:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .ai-settings-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .ai-settings-btn:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .context-menu {
                    position: fixed;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                    padding: 8px;
                    z-index: 1000000;
                    min-width: 180px;
                }
                
                .context-menu-item {
                    padding: 10px 14px;
                    cursor: pointer;
                    border-radius: 6px;
                    font-size: 14px;
                }
                
                .context-menu-item:hover {
                    background: #f0f0f0;
                }
            </style>
            
            <button id="ai-assistant-toggle" title="AI Assistant (${CONFIG.shortcut})">
                🤖
            </button>
            
            <div id="ai-assistant-panel">
                <div id="ai-assistant-header">
                    <h3 style="margin: 0; font-size: 16px;">AI Assistant</h3>
                    <button class="ai-settings-btn" id="ai-settings-btn">⚙️ Settings</button>
                </div>
                
                <div id="ai-assistant-messages"></div>
                
                <div id="ai-assistant-input-container">
                    <textarea 
                        id="ai-assistant-input" 
                        placeholder="Ask anything... (or select text on the page and right-click)"
                    ></textarea>
                    <button id="ai-assistant-send">Send</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
        return widget;
    };

    // API call function
    const callAI = async (messages) => {
        if (!CONFIG.apiKey) {
            throw new Error('API key not configured. Click Settings to add your API key.');
        }

        const endpoints = {
            openai: 'https://api.openai.com/v1/chat/completions',
            anthropic: 'https://api.anthropic.com/v1/messages',
            xai: 'https://api.x.ai/v1/chat/completions'
        };

        const headers = {
            openai: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.apiKey}`
            },
            anthropic: {
                'Content-Type': 'application/json',
                'x-api-key': CONFIG.apiKey,
                'anthropic-version': '2023-06-01'
            },
            xai: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.apiKey}`
            }
        };

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: endpoints[CONFIG.provider],
                headers: headers[CONFIG.provider],
                data: JSON.stringify({
                    model: CONFIG.model,
                    messages: messages,
                    max_tokens: CONFIG.provider === 'anthropic' ? 4096 : undefined
                }),
                onload: (response) => {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (CONFIG.provider === 'anthropic') {
                            resolve(data.content[0].text);
                        } else {
                            resolve(data.choices[0].message.content);
                        }
                    } catch (e) {
                        reject(new Error('Failed to parse response: ' + e.message));
                    }
                },
                onerror: () => reject(new Error('Network error'))
            });
        });
    };

    // Initialize
    const init = () => {
        const widget = createWidget();
        const toggle = document.getElementById('ai-assistant-toggle');
        const panel = document.getElementById('ai-assistant-panel');
        const input = document.getElementById('ai-assistant-input');
        const send = document.getElementById('ai-assistant-send');
        const messages = document.getElementById('ai-assistant-messages');
        const settingsBtn = document.getElementById('ai-settings-btn');

        let conversationHistory = [];

        // Toggle panel
        toggle.addEventListener('click', () => {
            panel.classList.toggle('active');
            if (panel.classList.contains('active')) {
                input.focus();
            }
        });

        // Send message
        const sendMessage = async () => {
            const userMessage = input.value.trim();
            if (!userMessage) return;

            // Add user message to UI
            const userDiv = document.createElement('div');
            userDiv.className = 'ai-message user';
            userDiv.textContent = userMessage;
            messages.appendChild(userDiv);
            messages.scrollTop = messages.scrollHeight;

            input.value = '';
            send.disabled = true;

            // Add to conversation history
            conversationHistory.push({ role: 'user', content: userMessage });

            try {
                // Call AI
                const response = await callAI(conversationHistory);

                // Add assistant message to UI
                const assistantDiv = document.createElement('div');
                assistantDiv.className = 'ai-message assistant';
                assistantDiv.textContent = response;
                messages.appendChild(assistantDiv);
                messages.scrollTop = messages.scrollHeight;

                // Add to conversation history
                conversationHistory.push({ role: 'assistant', content: response });
            } catch (error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'ai-message assistant';
                errorDiv.style.color = 'red';
                errorDiv.textContent = '❌ Error: ' + error.message;
                messages.appendChild(errorDiv);
            }

            send.disabled = false;
        };

        send.addEventListener('click', sendMessage);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                sendMessage();
            }
        });

        // Settings
        settingsBtn.addEventListener('click', () => {
            const newKey = prompt('Enter your API key:', CONFIG.apiKey);
            if (newKey !== null) {
                CONFIG.apiKey = newKey;
                GM_setValue('apiKey', newKey);
                
                const newProvider = prompt('Provider (openai/anthropic/xai):', CONFIG.provider);
                if (newProvider) {
                    CONFIG.provider = newProvider;
                    GM_setValue('provider', newProvider);
                }
                
                const newModel = prompt('Model name:', CONFIG.model);
                if (newModel) {
                    CONFIG.model = newModel;
                    GM_setValue('model', newModel);
                }
                
                alert('Settings saved!');
            }
        });

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'q') {
                e.preventDefault();
                panel.classList.toggle('active');
                if (panel.classList.contains('active')) {
                    input.focus();
                }
            }
        });

        // Context menu for selected text
        let contextMenu = null;
        
        document.addEventListener('mouseup', (e) => {
            // Remove existing context menu
            if (contextMenu) {
                contextMenu.remove();
                contextMenu = null;
            }

            const selectedText = window.getSelection().toString().trim();
            if (selectedText && selectedText.length > 0) {
                setTimeout(() => {
                    contextMenu = document.createElement('div');
                    contextMenu.className = 'context-menu';
                    contextMenu.style.left = e.pageX + 'px';
                    contextMenu.style.top = e.pageY + 'px';
                    
                    const actions = [
                        { label: '💬 Explain', prompt: 'Explain this:\n\n' },
                        { label: '🔍 Summarize', prompt: 'Summarize this:\n\n' },
                        { label: '🌐 Translate', prompt: 'Translate this to English:\n\n' },
                        { label: '✍️ Improve', prompt: 'Improve this text:\n\n' },
                        { label: '🐛 Fix Code', prompt: 'Fix any issues in this code:\n\n' }
                    ];
                    
                    actions.forEach(action => {
                        const item = document.createElement('div');
                        item.className = 'context-menu-item';
                        item.textContent = action.label;
                        item.addEventListener('click', () => {
                            panel.classList.add('active');
                            input.value = action.prompt + selectedText;
                            input.focus();
                            contextMenu.remove();
                            contextMenu = null;
                        });
                        contextMenu.appendChild(item);
                    });
                    
                    document.body.appendChild(contextMenu);
                }, 10);
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (contextMenu && !contextMenu.contains(e.target)) {
                contextMenu.remove();
                contextMenu = null;
            }
        });
    };

    // Wait for page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
