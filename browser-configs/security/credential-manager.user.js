// ==UserScript==
// @name         Secure Credential Manager
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Encrypted storage for API keys and credentials
// @author       You
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    class SecureCredentialManager {
        constructor() {
            this.masterKey = null;
            this.isUnlocked = false;
            this.credentials = {};
            
            this.init();
        }

        async init() {
            // Check if master password is set
            const hashedMaster = GM_getValue('master_password_hash', null);
            
            if (!hashedMaster) {
                await this.setupMasterPassword();
            }
            
            GM_registerMenuCommand('🔐 Open Credential Manager', () => this.openManager());
            GM_registerMenuCommand('🔒 Lock Credentials', () => this.lock());
            GM_registerMenuCommand('⚙️ Change Master Password', () => this.changeMasterPassword());
        }

        async setupMasterPassword() {
            const password = prompt('Set a master password for credential manager:');
            if (!password || password.length < 8) {
                alert('Password must be at least 8 characters');
                return this.setupMasterPassword();
            }
            
            const confirm = prompt('Confirm master password:');
            if (password !== confirm) {
                alert('Passwords do not match');
                return this.setupMasterPassword();
            }
            
            const hash = await this.hashPassword(password);
            GM_setValue('master_password_hash', hash);
            
            alert('Master password set successfully!');
        }

        async authenticate() {
            if (this.isUnlocked) return true;
            
            const password = prompt('Enter master password:');
            if (!password) return false;
            
            const hash = await this.hashPassword(password);
            const storedHash = GM_getValue('master_password_hash');
            
            if (hash === storedHash) {
                this.masterKey = password;
                this.isUnlocked = true;
                await this.loadCredentials();
                return true;
            } else {
                alert('Incorrect password');
                return false;
            }
        }

        async hashPassword(password) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async encrypt(text) {
            if (!this.masterKey) throw new Error('Not authenticated');
            
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            
            // Simple XOR encryption (in production, use Web Crypto API)
            const key = this.masterKey;
            const encrypted = Array.from(data).map((byte, i) => {
                return byte ^ key.charCodeAt(i % key.length);
            });
            
            return btoa(String.fromCharCode(...encrypted));
        }

        async decrypt(encrypted) {
            if (!this.masterKey) throw new Error('Not authenticated');
            
            const decoded = atob(encrypted);
            const data = Array.from(decoded).map(c => c.charCodeAt(0));
            
            const key = this.masterKey;
            const decrypted = data.map((byte, i) => {
                return byte ^ key.charCodeAt(i % key.length);
            });
            
            const decoder = new TextDecoder();
            return decoder.decode(new Uint8Array(decrypted));
        }

        async loadCredentials() {
            const encrypted = GM_getValue('encrypted_credentials', null);
            if (!encrypted) {
                this.credentials = {};
                return;
            }
            
            try {
                const decrypted = await this.decrypt(encrypted);
                this.credentials = JSON.parse(decrypted);
            } catch (error) {
                console.error('Failed to decrypt credentials:', error);
                this.credentials = {};
            }
        }

        async saveCredentials() {
            const json = JSON.stringify(this.credentials);
            const encrypted = await this.encrypt(json);
            GM_setValue('encrypted_credentials', encrypted);
        }

        async addCredential(name, value, category = 'general') {
            if (!this.isUnlocked) {
                const auth = await this.authenticate();
                if (!auth) return false;
            }
            
            this.credentials[name] = {
                value,
                category,
                createdAt: Date.now(),
                lastUsed: Date.now()
            };
            
            await this.saveCredentials();
            return true;
        }

        async getCredential(name) {
            if (!this.isUnlocked) {
                const auth = await this.authenticate();
                if (!auth) return null;
            }
            
            const cred = this.credentials[name];
            if (cred) {
                cred.lastUsed = Date.now();
                await this.saveCredentials();
                return cred.value;
            }
            
            return null;
        }

        async deleteCredential(name) {
            if (!this.isUnlocked) {
                const auth = await this.authenticate();
                if (!auth) return false;
            }
            
            delete this.credentials[name];
            await this.saveCredentials();
            return true;
        }

        async listCredentials() {
            if (!this.isUnlocked) {
                const auth = await this.authenticate();
                if (!auth) return [];
            }
            
            return Object.keys(this.credentials).map(name => ({
                name,
                category: this.credentials[name].category,
                createdAt: new Date(this.credentials[name].createdAt).toLocaleDateString(),
                lastUsed: new Date(this.credentials[name].lastUsed).toLocaleDateString()
            }));
        }

        lock() {
            this.masterKey = null;
            this.isUnlocked = false;
            this.credentials = {};
            alert('Credentials locked');
        }

        async changeMasterPassword() {
            const auth = await this.authenticate();
            if (!auth) return;
            
            const newPassword = prompt('Enter new master password (min 8 characters):');
            if (!newPassword || newPassword.length < 8) {
                alert('Password must be at least 8 characters');
                return;
            }
            
            const confirm = prompt('Confirm new password:');
            if (newPassword !== confirm) {
                alert('Passwords do not match');
                return;
            }
            
            // Re-encrypt credentials with new password
            const oldMasterKey = this.masterKey;
            this.masterKey = newPassword;
            
            await this.saveCredentials();
            
            const hash = await this.hashPassword(newPassword);
            GM_setValue('master_password_hash', hash);
            
            alert('Master password changed successfully!');
        }

        async openManager() {
            const auth = await this.authenticate();
            if (!auth) return;
            
            const creds = await this.listCredentials();
            
            // Create UI
            const modal = document.createElement('div');
            modal.id = 'credential-manager-modal';
            modal.innerHTML = `
                <style>
                    #credential-manager-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.8);
                        z-index: 9999999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    
                    .cred-manager-content {
                        background: white;
                        border-radius: 16px;
                        padding: 32px;
                        max-width: 600px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                    }
                    
                    .cred-manager-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 24px;
                    }
                    
                    .cred-manager-title {
                        font-size: 24px;
                        font-weight: 700;
                        color: #333;
                    }
                    
                    .cred-close {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    }
                    
                    .cred-list {
                        margin-bottom: 24px;
                    }
                    
                    .cred-item {
                        background: #f8f9fa;
                        padding: 16px;
                        border-radius: 8px;
                        margin-bottom: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .cred-info {
                        flex: 1;
                    }
                    
                    .cred-name {
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 4px;
                    }
                    
                    .cred-meta {
                        font-size: 12px;
                        color: #666;
                    }
                    
                    .cred-actions button {
                        margin-left: 8px;
                        padding: 6px 12px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 600;
                    }
                    
                    .cred-copy {
                        background: #667eea;
                        color: white;
                    }
                    
                    .cred-delete {
                        background: #dc2626;
                        color: white;
                    }
                    
                    .cred-add-form {
                        background: #f8f9fa;
                        padding: 16px;
                        border-radius: 8px;
                    }
                    
                    .cred-add-form input, .cred-add-form select {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        margin-bottom: 12px;
                        font-size: 14px;
                    }
                    
                    .cred-add-btn {
                        width: 100%;
                        padding: 12px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                    }
                </style>
                
                <div class="cred-manager-content">
                    <div class="cred-manager-header">
                        <h2 class="cred-manager-title">🔐 Credential Manager</h2>
                        <button class="cred-close">✕</button>
                    </div>
                    
                    <div class="cred-list" id="cred-list">
                        ${creds.length === 0 ? '<p style="text-align: center; color: #666;">No credentials stored</p>' : ''}
                        ${creds.map(c => `
                            <div class="cred-item">
                                <div class="cred-info">
                                    <div class="cred-name">${c.name}</div>
                                    <div class="cred-meta">${c.category} • Created: ${c.createdAt} • Last used: ${c.lastUsed}</div>
                                </div>
                                <div class="cred-actions">
                                    <button class="cred-copy" data-name="${c.name}">Copy</button>
                                    <button class="cred-delete" data-name="${c.name}">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="cred-add-form">
                        <h3 style="margin-bottom: 16px; font-size: 16px;">Add New Credential</h3>
                        <input type="text" id="cred-name" placeholder="Name (e.g., OPENAI_API_KEY)">
                        <input type="password" id="cred-value" placeholder="Value">
                        <select id="cred-category">
                            <option value="general">General</option>
                            <option value="ai">AI Services</option>
                            <option value="database">Database</option>
                            <option value="api">API Keys</option>
                            <option value="auth">Authentication</option>
                        </select>
                        <button class="cred-add-btn" id="cred-add">Add Credential</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Event listeners
            modal.querySelector('.cred-close').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            
            modal.querySelectorAll('.cred-copy').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const name = btn.dataset.name;
                    const value = await this.getCredential(name);
                    await navigator.clipboard.writeText(value);
                    btn.textContent = '✓ Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                });
            });
            
            modal.querySelectorAll('.cred-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const name = btn.dataset.name;
                    if (confirm(`Delete credential "${name}"?`)) {
                        await this.deleteCredential(name);
                        btn.closest('.cred-item').remove();
                    }
                });
            });
            
            modal.querySelector('#cred-add').addEventListener('click', async () => {
                const name = modal.querySelector('#cred-name').value.trim();
                const value = modal.querySelector('#cred-value').value;
                const category = modal.querySelector('#cred-category').value;
                
                if (!name || !value) {
                    alert('Name and value are required');
                    return;
                }
                
                await this.addCredential(name, value, category);
                alert('Credential added successfully!');
                modal.remove();
                this.openManager();
            });
        }

        // Export/Import
        async exportEncrypted() {
            if (!this.isUnlocked) {
                const auth = await this.authenticate();
                if (!auth) return;
            }
            
            const encrypted = GM_getValue('encrypted_credentials');
            const blob = new Blob([encrypted], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `credentials-backup-${Date.now()}.enc`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    // Initialize
    const credManager = new SecureCredentialManager();
    window.credentialManager = credManager;

    console.log('🔐 Secure Credential Manager loaded');
})();
