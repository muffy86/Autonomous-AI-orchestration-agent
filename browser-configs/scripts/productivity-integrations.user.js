// ==UserScript==
// @name         Productivity App Integrations - 2026
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Integrate with Notion, Obsidian, Roam, and more
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @connect      api.notion.com
// @connect      api.github.com
// ==/UserScript==

(function() {
    'use strict';

    class ProductivityIntegrations {
        constructor() {
            this.integrations = {
                notion: null,
                obsidian: null,
                roam: null,
                github: null
            };
            
            this.init();
        }

        async init() {
            await this.setupNotion();
            await this.setupObsidian();
            await this.setupGitHub();
            this.createUI();
        }

        // ===== Notion Integration =====

        async setupNotion() {
            const apiKey = GM_getValue('notion_api_key', '');
            if (!apiKey) return;

            this.integrations.notion = {
                apiKey,
                baseURL: 'https://api.notion.com/v1',
                version: '2022-06-28',

                async createPage(databaseId, properties) {
                    return new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: `${this.baseURL}/pages`,
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Notion-Version': this.version,
                                'Content-Type': 'application/json'
                            },
                            data: JSON.stringify({
                                parent: { database_id: databaseId },
                                properties
                            }),
                            onload: (response) => resolve(JSON.parse(response.responseText)),
                            onerror: reject
                        });
                    });
                },

                async appendBlock(pageId, content) {
                    return new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'PATCH',
                            url: `${this.baseURL}/blocks/${pageId}/children`,
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Notion-Version': this.version,
                                'Content-Type': 'application/json'
                            },
                            data: JSON.stringify({
                                children: [{
                                    object: 'block',
                                    type: 'paragraph',
                                    paragraph: {
                                        rich_text: [{ type: 'text', text: { content } }]
                                    }
                                }]
                            }),
                            onload: (response) => resolve(JSON.parse(response.responseText)),
                            onerror: reject
                        });
                    });
                },

                async searchPages(query) {
                    return new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: `${this.baseURL}/search`,
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Notion-Version': this.version,
                                'Content-Type': 'application/json'
                            },
                            data: JSON.stringify({ query }),
                            onload: (response) => resolve(JSON.parse(response.responseText)),
                            onerror: reject
                        });
                    });
                }
            };

            console.log('✅ Notion integration ready');
        }

        // ===== Obsidian Integration (via local vault) =====

        async setupObsidian() {
            this.integrations.obsidian = {
                vaultPath: GM_getValue('obsidian_vault_path', ''),
                
                async createNote(title, content) {
                    // Use File System Access API
                    try {
                        const handle = await window.showSaveFilePicker({
                            suggestedName: `${title}.md`,
                            types: [{
                                description: 'Markdown Files',
                                accept: { 'text/markdown': ['.md'] }
                            }]
                        });

                        const writable = await handle.createWritable();
                        await writable.write(content);
                        await writable.close();

                        return { success: true, path: handle.name };
                    } catch (error) {
                        console.error('Obsidian save failed:', error);
                        throw error;
                    }
                },

                async appendToDaily(content) {
                    const today = new Date().toISOString().split('T')[0];
                    const dailyNote = `# ${today}\n\n${content}\n\n`;
                    
                    return await this.createNote(`Daily-${today}`, dailyNote);
                },

                formatAsMarkdown(text, type = 'note') {
                    const timestamp = new Date().toISOString();
                    const metadata = `---
created: ${timestamp}
tags: [ai-generated, ${type}]
---\n\n`;

                    return metadata + text;
                }
            };

            console.log('✅ Obsidian integration ready');
        }

        // ===== GitHub Integration =====

        async setupGitHub() {
            const token = GM_getValue('github_token', '');
            if (!token) return;

            this.integrations.github = {
                token,
                baseURL: 'https://api.github.com',

                async createGist(description, files) {
                    return new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: `${this.baseURL}/gists`,
                            headers: {
                                'Authorization': `token ${token}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/vnd.github.v3+json'
                            },
                            data: JSON.stringify({
                                description,
                                public: false,
                                files
                            }),
                            onload: (response) => resolve(JSON.parse(response.responseText)),
                            onerror: reject
                        });
                    });
                },

                async createIssue(repo, title, body) {
                    return new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: `${this.baseURL}/repos/${repo}/issues`,
                            headers: {
                                'Authorization': `token ${token}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/vnd.github.v3+json'
                            },
                            data: JSON.stringify({ title, body }),
                            onload: (response) => resolve(JSON.parse(response.responseText)),
                            onerror: reject
                        });
                    });
                },

                async searchCode(query) {
                    return new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: `${this.baseURL}/search/code?q=${encodeURIComponent(query)}`,
                            headers: {
                                'Authorization': `token ${token}`,
                                'Accept': 'application/vnd.github.v3+json'
                            },
                            onload: (response) => resolve(JSON.parse(response.responseText)),
                            onerror: reject
                        });
                    });
                }
            };

            console.log('✅ GitHub integration ready');
        }

        // ===== Quick Actions =====

        async saveToNotion(content) {
            if (!this.integrations.notion) {
                alert('Notion not configured. Add API key in settings.');
                return;
            }

            const databaseId = GM_getValue('notion_default_database', '');
            if (!databaseId) {
                alert('Set default Notion database in settings.');
                return;
            }

            try {
                await this.integrations.notion.createPage(databaseId, {
                    Name: {
                        title: [{
                            text: { content: 'AI Generated Note' }
                        }]
                    },
                    Content: {
                        rich_text: [{
                            text: { content }
                        }]
                    }
                });

                alert('✅ Saved to Notion!');
            } catch (error) {
                alert('❌ Failed to save to Notion: ' + error.message);
            }
        }

        async saveToObsidian(title, content) {
            if (!this.integrations.obsidian) return;

            try {
                const markdown = this.integrations.obsidian.formatAsMarkdown(content);
                await this.integrations.obsidian.createNote(title, markdown);
                alert('✅ Saved to Obsidian!');
            } catch (error) {
                alert('❌ Failed to save to Obsidian: ' + error.message);
            }
        }

        async saveToGitHub(content) {
            if (!this.integrations.github) {
                alert('GitHub not configured. Add token in settings.');
                return;
            }

            try {
                const filename = `note-${Date.now()}.md`;
                const gist = await this.integrations.github.createGist(
                    'AI Generated Note',
                    {
                        [filename]: { content }
                    }
                );

                alert(`✅ Saved to GitHub Gist!\n${gist.html_url}`);
                window.open(gist.html_url, '_blank');
            } catch (error) {
                alert('❌ Failed to save to GitHub: ' + error.message);
            }
        }

        // ===== UI =====

        createUI() {
            GM_addStyle(`
                #productivity-integrations {
                    position: fixed;
                    bottom: 100px;
                    right: 20px;
                    z-index: 999998;
                }
                
                .prod-int-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: none;
                    margin-bottom: 10px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    font-size: 24px;
                    display: block;
                    transition: transform 0.2s;
                }
                
                .prod-int-btn:hover {
                    transform: scale(1.1);
                }
                
                .prod-int-btn.notion {
                    background: linear-gradient(135deg, #000 0%, #333 100%);
                }
                
                .prod-int-btn.obsidian {
                    background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
                }
                
                .prod-int-btn.github {
                    background: linear-gradient(135deg, #24292e 0%, #586069 100%);
                }

                #prod-context-menu {
                    position: fixed;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                    padding: 8px;
                    z-index: 9999999;
                    min-width: 180px;
                    display: none;
                }
                
                .prod-menu-item {
                    padding: 10px 14px;
                    cursor: pointer;
                    border-radius: 6px;
                    font-size: 14px;
                }
                
                .prod-menu-item:hover {
                    background: #f0f0f0;
                }
            `);

            const container = document.createElement('div');
            container.id = 'productivity-integrations';
            container.innerHTML = `
                <button class="prod-int-btn notion" title="Save to Notion">📓</button>
                <button class="prod-int-btn obsidian" title="Save to Obsidian">🗒️</button>
                <button class="prod-int-btn github" title="Save to GitHub">🐙</button>
            `;

            document.body.appendChild(container);

            // Event listeners
            container.querySelector('.notion').addEventListener('click', () => {
                const content = this.getPageContent();
                this.saveToNotion(content);
            });

            container.querySelector('.obsidian').addEventListener('click', () => {
                const title = document.title;
                const content = this.getPageContent();
                this.saveToObsidian(title, content);
            });

            container.querySelector('.github').addEventListener('click', () => {
                const content = this.getPageContent();
                this.saveToGitHub(content);
            });

            // Context menu for selected text
            this.setupContextMenu();
        }

        setupContextMenu() {
            const menu = document.createElement('div');
            menu.id = 'prod-context-menu';
            menu.innerHTML = `
                <div class="prod-menu-item" data-action="notion">📓 Save to Notion</div>
                <div class="prod-menu-item" data-action="obsidian">🗒️ Save to Obsidian</div>
                <div class="prod-menu-item" data-action="github">🐙 Save to GitHub</div>
            `;

            document.body.appendChild(menu);

            document.addEventListener('mouseup', (e) => {
                const selectedText = window.getSelection().toString().trim();
                
                if (selectedText && selectedText.length > 10 && e.button === 2) {
                    setTimeout(() => {
                        menu.style.left = e.pageX + 'px';
                        menu.style.top = e.pageY + 'px';
                        menu.style.display = 'block';
                    }, 10);
                }
            });

            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && e.button === 0) {
                    menu.style.display = 'none';
                }
            });

            menu.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const selectedText = window.getSelection().toString();

                if (action === 'notion') {
                    this.saveToNotion(selectedText);
                } else if (action === 'obsidian') {
                    this.saveToObsidian('Selected Text', selectedText);
                } else if (action === 'github') {
                    this.saveToGitHub(selectedText);
                }

                menu.style.display = 'none';
            });
        }

        getPageContent() {
            const selection = window.getSelection().toString();
            if (selection) return selection;

            // Try to get main content
            const article = document.querySelector('article');
            if (article) return article.textContent;

            const main = document.querySelector('main');
            if (main) return main.textContent;

            return document.body.textContent;
        }

        // ===== Configuration =====

        configure() {
            const config = {
                notion_api_key: prompt('Notion API Key:', GM_getValue('notion_api_key', '')),
                notion_default_database: prompt('Default Database ID:', GM_getValue('notion_default_database', '')),
                github_token: prompt('GitHub Token:', GM_getValue('github_token', '')),
                obsidian_vault_path: prompt('Obsidian Vault Path:', GM_getValue('obsidian_vault_path', ''))
            };

            for (const [key, value] of Object.entries(config)) {
                if (value) GM_setValue(key, value);
            }

            alert('✅ Configuration saved! Reload the page.');
        }
    }

    // Initialize
    const integrations = new ProductivityIntegrations();
    window.productivityIntegrations = integrations;

    // Add to menu
    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand('⚙️ Configure Integrations', () => integrations.configure());
    }

    console.log('✅ Productivity integrations loaded');
})();
