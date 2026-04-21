/**
 * Autonomous AI Agent - Popup Script
 */

let activeTab = 'agent';
let mcpStatus = { online: false };

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await checkMCPStatus();
  setupEventListeners();
  loadRecentActions();
  updateContext();
});

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Quick actions
  document.getElementById('capture-btn').addEventListener('click', captureContext);
  document.getElementById('analyze-btn').addEventListener('click', analyzePage);
  document.getElementById('fill-btn').addEventListener('click', fillForm);
  document.getElementById('extract-btn').addEventListener('click', extractData);
  
  // Execute task
  document.getElementById('execute-btn').addEventListener('click', executeTask);
  
  // Settings
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('reset-settings').addEventListener('click', resetSettings);
}

// Switch tab
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  activeTab = tabName;
  
  if (tabName === 'context') updateContext();
  if (tabName === 'tasks') updateTasks();
}

// Check MCP status
async function checkMCPStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_MCP_STATUS' });
    mcpStatus = response;
    updateStatusDisplay(response.online);
  } catch (error) {
    console.error('MCP status check failed:', error);
    updateStatusDisplay(false);
  }
}

// Update status display
function updateStatusDisplay(online) {
  const statusEl = document.getElementById('status');
  const dot = statusEl.querySelector('.status-dot');
  const text = statusEl.querySelector('.status-text');
  
  if (online) {
    dot.style.background = '#00ff88';
    text.textContent = 'Connected';
    statusEl.style.color = '#00ff88';
  } else {
    dot.style.background = '#ff4444';
    text.textContent = 'Offline';
    statusEl.style.color = '#ff4444';
  }
}

// Capture context
async function captureContext() {
  showLoading('Capturing context...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.runtime.sendMessage({ 
      type: 'CAPTURE_CONTEXT' 
    });
    
    addRecentAction('Capture Context', 'success', 'Context captured');
    showNotification('Context captured successfully!', 'success');
  } catch (error) {
    console.error('Capture failed:', error);
    addRecentAction('Capture Context', 'error', error.message);
    showNotification('Failed to capture context', 'error');
  }
  
  hideLoading();
}

// Analyze page
async function analyzePage() {
  showLoading('Analyzing page...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.runtime.sendMessage({
      type: 'EXECUTE_TASK',
      task: 'Analyze this page and provide insights'
    });
    
    addRecentAction('Analyze Page', 'success', 'Analysis complete');
    showNotification('Page analyzed successfully!', 'success');
  } catch (error) {
    console.error('Analysis failed:', error);
    addRecentAction('Analyze Page', 'error', error.message);
    showNotification('Analysis failed', 'error');
  }
  
  hideLoading();
}

// Fill form
async function fillForm() {
  showLoading('Filling form...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.runtime.sendMessage({
      type: 'FILL_FORM',
      data: {}
    });
    
    addRecentAction('Fill Form', 'success', 'Form filled');
    showNotification('Form filled successfully!', 'success');
  } catch (error) {
    console.error('Fill failed:', error);
    addRecentAction('Fill Form', 'error', error.message);
    showNotification('Failed to fill form', 'error');
  }
  
  hideLoading();
}

// Extract data
async function extractData() {
  showLoading('Extracting data...');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return {
          text: document.body.innerText,
          links: Array.from(document.links).map(a => ({ href: a.href, text: a.textContent })),
          emails: Array.from(document.body.innerText.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)).map(m => m[0])
        };
      }
    });
    
    console.log('Extracted:', result.result);
    addRecentAction('Extract Data', 'success', `Extracted ${result.result.emails.length} emails`);
    showNotification('Data extracted successfully!', 'success');
  } catch (error) {
    console.error('Extract failed:', error);
    addRecentAction('Extract Data', 'error', error.message);
    showNotification('Extraction failed', 'error');
  }
  
  hideLoading();
}

// Execute custom task
async function executeTask() {
  const prompt = document.getElementById('task-prompt').value.trim();
  if (!prompt) {
    showNotification('Please enter a task', 'warning');
    return;
  }
  
  showLoading(`Executing: ${prompt}`);
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'EXECUTE_TASK',
      task: prompt
    });
    
    addRecentAction('Custom Task', 'success', prompt);
    showNotification('Task executed successfully!', 'success');
    document.getElementById('task-prompt').value = '';
  } catch (error) {
    console.error('Task execution failed:', error);
    addRecentAction('Custom Task', 'error', error.message);
    showNotification('Task execution failed', 'error');
  }
  
  hideLoading();
}

// Add recent action
function addRecentAction(action, status, details) {
  const list = document.querySelector('#recent-actions .action-list');
  const entry = document.createElement('div');
  entry.className = `action-entry ${status}`;
  entry.innerHTML = `
    <div class="action-header">
      <span class="action-name">${action}</span>
      <span class="action-time">${new Date().toLocaleTimeString()}</span>
    </div>
    <div class="action-details">${details}</div>
  `;
  
  list.prepend(entry);
  
  // Keep only last 10
  while (list.children.length > 10) {
    list.removeChild(list.lastChild);
  }
  
  // Save to storage
  saveRecentActions();
}

// Load recent actions
async function loadRecentActions() {
  const result = await chrome.storage.local.get(['recentActions']);
  const actions = result.recentActions || [];
  
  const list = document.querySelector('#recent-actions .action-list');
  actions.forEach(action => {
    const entry = document.createElement('div');
    entry.className = `action-entry ${action.status}`;
    entry.innerHTML = `
      <div class="action-header">
        <span class="action-name">${action.name}</span>
        <span class="action-time">${new Date(action.time).toLocaleTimeString()}</span>
      </div>
      <div class="action-details">${action.details}</div>
    `;
    list.appendChild(entry);
  });
}

// Save recent actions
async function saveRecentActions() {
  const entries = document.querySelectorAll('#recent-actions .action-entry');
  const actions = Array.from(entries).slice(0, 10).map(entry => ({
    name: entry.querySelector('.action-name').textContent,
    time: entry.querySelector('.action-time').textContent,
    status: entry.classList.contains('success') ? 'success' : 'error',
    details: entry.querySelector('.action-details').textContent
  }));
  
  await chrome.storage.local.set({ recentActions: actions });
}

// Update context
async function updateContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Page info
    document.getElementById('page-info').innerHTML = `
      <div class="info-item"><strong>URL:</strong> ${tab.url}</div>
      <div class="info-item"><strong>Title:</strong> ${tab.title}</div>
    `;
    
    // Detect forms
    const [forms] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.forms.length
    });
    
    document.getElementById('forms-info').innerHTML = `
      <div class="info-item">${forms.result} form(s) detected</div>
    `;
    
    // Count elements
    const [elements] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return {
          inputs: document.querySelectorAll('input').length,
          buttons: document.querySelectorAll('button').length,
          links: document.querySelectorAll('a').length
        };
      }
    });
    
    document.getElementById('elements-info').innerHTML = `
      <div class="info-item">${elements.result.inputs} inputs</div>
      <div class="info-item">${elements.result.buttons} buttons</div>
      <div class="info-item">${elements.result.links} links</div>
    `;
  } catch (error) {
    console.error('Context update failed:', error);
  }
}

// Update tasks
async function updateTasks() {
  // TODO: Load from background script
}

// Load settings
async function loadSettings() {
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || {
    autoCapture: true,
    showOverlay: true,
    verboseLogging: false,
    mcpServer: 'http://localhost:3001',
    defaultModel: 'gemini-2.0-flash'
  };
  
  document.getElementById('auto-capture').checked = settings.autoCapture;
  document.getElementById('show-overlay').checked = settings.showOverlay;
  document.getElementById('verbose-logging').checked = settings.verboseLogging;
  document.getElementById('mcp-server').value = settings.mcpServer;
  document.getElementById('default-model').value = settings.defaultModel;
}

// Save settings
async function saveSettings() {
  const settings = {
    autoCapture: document.getElementById('auto-capture').checked,
    showOverlay: document.getElementById('show-overlay').checked,
    verboseLogging: document.getElementById('verbose-logging').checked,
    mcpServer: document.getElementById('mcp-server').value,
    defaultModel: document.getElementById('default-model').value
  };
  
  await chrome.storage.local.set({ settings });
  showNotification('Settings saved!', 'success');
}

// Reset settings
async function resetSettings() {
  await chrome.storage.local.remove(['settings']);
  await loadSettings();
  showNotification('Settings reset!', 'success');
}

// Show loading
function showLoading(message) {
  // TODO: Implement loading overlay
  console.log('Loading:', message);
}

// Hide loading
function hideLoading() {
  console.log('Loading complete');
}

// Show notification
function showNotification(message, type = 'info') {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Auto-refresh status every 30s
setInterval(checkMCPStatus, 30000);
