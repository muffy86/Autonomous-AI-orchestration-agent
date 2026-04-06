// ==UserScript==
// @name         AI Usage Tracker & Analytics
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Track AI tool usage, costs, and performance
// @author       You
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @match        https://claude.ai/*
// @match        https://www.perplexity.ai/*
// @match        https://bard.google.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'ai_usage_analytics';
    
    class AIUsageTracker {
        constructor() {
            this.data = this.loadData();
            this.currentSession = {
                platform: this.detectPlatform(),
                startTime: Date.now(),
                interactions: 0,
                tokensEstimate: 0,
                costEstimate: 0
            };
            
            this.init();
        }

        loadData() {
            const stored = GM_getValue(STORAGE_KEY, null);
            if (stored) {
                return JSON.parse(stored);
            }
            
            return {
                sessions: [],
                totals: {
                    interactions: 0,
                    estimatedTokens: 0,
                    estimatedCost: 0,
                    timeSpent: 0
                },
                byPlatform: {}
            };
        }

        saveData() {
            GM_setValue(STORAGE_KEY, JSON.stringify(this.data));
        }

        detectPlatform() {
            const host = window.location.hostname;
            if (host.includes('openai') || host.includes('chatgpt')) return 'ChatGPT';
            if (host.includes('claude')) return 'Claude';
            if (host.includes('perplexity')) return 'Perplexity';
            if (host.includes('bard')) return 'Google Bard';
            return 'Unknown';
        }

        init() {
            console.log(`📊 AI Usage Tracker initialized for ${this.currentSession.platform}`);
            
            this.trackInteractions();
            this.createDashboard();
            
            // Save session on page unload
            window.addEventListener('beforeunload', () => {
                this.endSession();
            });
            
            // Periodic save
            setInterval(() => this.saveData(), 30000);
        }

        trackInteractions() {
            // Track message sends
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (this.isMessageNode(node)) {
                                this.recordInteraction(node);
                            }
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        isMessageNode(node) {
            // Platform-specific message detection
            const platform = this.currentSession.platform;
            
            if (platform === 'ChatGPT') {
                return node.matches && node.matches('[data-message-author-role]');
            } else if (platform === 'Claude') {
                return node.matches && node.matches('[data-role]');
            } else if (platform === 'Perplexity') {
                return node.matches && (node.matches('[class*="message"]') || node.matches('[class*="answer"]'));
            }
            
            return false;
        }

        recordInteraction(node) {
            const text = node.textContent || '';
            const tokens = this.estimateTokens(text);
            const cost = this.estimateCost(tokens);

            this.currentSession.interactions++;
            this.currentSession.tokensEstimate += tokens;
            this.currentSession.costEstimate += cost;

            this.data.totals.interactions++;
            this.data.totals.estimatedTokens += tokens;
            this.data.totals.estimatedCost += cost;

            // Update by platform
            const platform = this.currentSession.platform;
            if (!this.data.byPlatform[platform]) {
                this.data.byPlatform[platform] = {
                    interactions: 0,
                    tokens: 0,
                    cost: 0,
                    sessions: 0
                };
            }
            
            this.data.byPlatform[platform].interactions++;
            this.data.byPlatform[platform].tokens += tokens;
            this.data.byPlatform[platform].cost += cost;

            this.updateDashboard();
            this.saveData();

            console.log(`📝 Interaction recorded: ${tokens} tokens, $${cost.toFixed(4)}`);
        }

        estimateTokens(text) {
            // Rough estimate: ~4 characters per token
            return Math.ceil(text.length / 4);
        }

        estimateCost(tokens) {
            // Rough cost estimates (as of 2024)
            const platform = this.currentSession.platform;
            const rates = {
                'ChatGPT': 0.002 / 1000,  // GPT-4 Turbo
                'Claude': 0.008 / 1000,    // Claude 3 Opus
                'Perplexity': 0.001 / 1000,
                'Google Bard': 0.0005 / 1000
            };
            
            const rate = rates[platform] || 0.001 / 1000;
            return tokens * rate;
        }

        endSession() {
            this.currentSession.endTime = Date.now();
            this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

            this.data.sessions.push({...this.currentSession});
            this.data.totals.timeSpent += this.currentSession.duration;

            const platform = this.currentSession.platform;
            if (this.data.byPlatform[platform]) {
                this.data.byPlatform[platform].sessions++;
            }

            this.saveData();
            console.log('📊 Session ended and saved');
        }

        createDashboard() {
            GM_addStyle(`
                #ai-analytics-dashboard {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                #ai-analytics-toggle {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                #ai-analytics-panel {
                    display: none;
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin-top: 10px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    min-width: 320px;
                    max-width: 400px;
                }
                
                #ai-analytics-panel.active {
                    display: block;
                }
                
                .analytics-section {
                    margin-bottom: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .analytics-section:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                    padding-bottom: 0;
                }
                
                .analytics-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #667eea;
                    margin-bottom: 12px;
                }
                
                .analytics-stat {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 13px;
                }
                
                .analytics-label {
                    color: #666;
                }
                
                .analytics-value {
                    color: #333;
                    font-weight: 600;
                }
                
                .analytics-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                
                .analytics-btn {
                    flex: 1;
                    padding: 8px;
                    border: none;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    cursor: pointer;
                }
                
                .analytics-btn.primary {
                    background: #667eea;
                    color: white;
                }
                
                .analytics-btn.secondary {
                    background: #f0f0f0;
                    color: #333;
                }
            `);

            const dashboard = document.createElement('div');
            dashboard.id = 'ai-analytics-dashboard';
            dashboard.innerHTML = `
                <button id="ai-analytics-toggle">📊 Analytics</button>
                <div id="ai-analytics-panel">
                    <div class="analytics-section">
                        <div class="analytics-title">Current Session</div>
                        <div class="analytics-stat">
                            <span class="analytics-label">Platform</span>
                            <span class="analytics-value" id="current-platform">${this.currentSession.platform}</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="analytics-label">Interactions</span>
                            <span class="analytics-value" id="current-interactions">0</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="analytics-label">Est. Tokens</span>
                            <span class="analytics-value" id="current-tokens">0</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="analytics-label">Est. Cost</span>
                            <span class="analytics-value" id="current-cost">$0.00</span>
                        </div>
                    </div>
                    
                    <div class="analytics-section">
                        <div class="analytics-title">All Time</div>
                        <div class="analytics-stat">
                            <span class="analytics-label">Total Interactions</span>
                            <span class="analytics-value" id="total-interactions">${this.data.totals.interactions}</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="analytics-label">Total Tokens</span>
                            <span class="analytics-value" id="total-tokens">${this.formatNumber(this.data.totals.estimatedTokens)}</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="analytics-label">Total Cost</span>
                            <span class="analytics-value" id="total-cost">$${this.data.totals.estimatedCost.toFixed(2)}</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="analytics-label">Time Spent</span>
                            <span class="analytics-value" id="total-time">${this.formatDuration(this.data.totals.timeSpent)}</span>
                        </div>
                    </div>
                    
                    <div class="analytics-section">
                        <div class="analytics-title">By Platform</div>
                        <div id="platform-stats"></div>
                    </div>
                    
                    <div class="analytics-actions">
                        <button class="analytics-btn primary" id="export-data">Export</button>
                        <button class="analytics-btn secondary" id="reset-data">Reset</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dashboard);

            // Event listeners
            document.getElementById('ai-analytics-toggle').addEventListener('click', () => {
                document.getElementById('ai-analytics-panel').classList.toggle('active');
            });

            document.getElementById('export-data').addEventListener('click', () => {
                this.exportData();
            });

            document.getElementById('reset-data').addEventListener('click', () => {
                if (confirm('Reset all analytics data?')) {
                    this.resetData();
                }
            });

            this.updateDashboard();
        }

        updateDashboard() {
            // Current session
            document.getElementById('current-interactions').textContent = this.currentSession.interactions;
            document.getElementById('current-tokens').textContent = this.formatNumber(this.currentSession.tokensEstimate);
            document.getElementById('current-cost').textContent = '$' + this.currentSession.costEstimate.toFixed(4);

            // Totals
            document.getElementById('total-interactions').textContent = this.data.totals.interactions;
            document.getElementById('total-tokens').textContent = this.formatNumber(this.data.totals.estimatedTokens);
            document.getElementById('total-cost').textContent = '$' + this.data.totals.estimatedCost.toFixed(2);
            document.getElementById('total-time').textContent = this.formatDuration(this.data.totals.timeSpent);

            // By platform
            const platformStats = document.getElementById('platform-stats');
            platformStats.innerHTML = '';
            
            for (const [platform, stats] of Object.entries(this.data.byPlatform)) {
                platformStats.innerHTML += `
                    <div class="analytics-stat">
                        <span class="analytics-label">${platform}</span>
                        <span class="analytics-value">$${stats.cost.toFixed(2)}</span>
                    </div>
                `;
            }
        }

        formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        }

        formatDuration(ms) {
            const hours = Math.floor(ms / 3600000);
            const minutes = Math.floor((ms % 3600000) / 60000);
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m`;
        }

        exportData() {
            const dataStr = JSON.stringify(this.data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-usage-analytics-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            console.log('📊 Analytics data exported');
        }

        resetData() {
            this.data = {
                sessions: [],
                totals: {
                    interactions: 0,
                    estimatedTokens: 0,
                    estimatedCost: 0,
                    timeSpent: 0
                },
                byPlatform: {}
            };
            
            this.saveData();
            this.updateDashboard();
            
            console.log('🔄 Analytics data reset');
        }
    }

    // Initialize tracker
    const tracker = new AIUsageTracker();
    window.aiTracker = tracker;

    console.log('📊 AI Usage Tracker loaded');
})();
