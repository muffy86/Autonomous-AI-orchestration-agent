/**
 * Autonomous AI Agent - Content Script
 * Injected into every page for context awareness and interaction
 */

console.log('AI Agent content script loaded');

let agentOverlay = null;
let highlightedElements = [];

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  switch (message.type) {
    case 'HIGHLIGHT_ELEMENT':
      highlightElement(message.selector);
      sendResponse({ success: true });
      break;
      
    case 'EXECUTE_ACTION':
      executeAction(message.action).then(sendResponse);
      return true;
      
    case 'CAPTURE_SCREENSHOT':
      captureVisibleArea().then(sendResponse);
      return true;
      
    case 'INJECT_UI':
      injectAgentUI().then(sendResponse);
      return true;
  }
});

// Highlight element
function highlightElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.style.outline = '3px solid #00ff00';
    element.style.outlineOffset = '2px';
    highlightedElements.push(element);
    
    setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }, 3000);
  }
}

// Execute page action
async function executeAction(action) {
  try {
    switch (action.type) {
      case 'click':
        const clickEl = document.querySelector(action.selector);
        clickEl?.click();
        return { success: true, action: 'clicked' };
        
      case 'input':
        const inputEl = document.querySelector(action.selector);
        if (inputEl) {
          inputEl.value = action.value;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return { success: true, action: 'typed' };
        
      case 'scroll':
        window.scrollTo({
          top: action.y || 0,
          left: action.x || 0,
          behavior: 'smooth'
        });
        return { success: true, action: 'scrolled' };
        
      case 'navigate':
        window.location.href = action.url;
        return { success: true, action: 'navigating' };
        
      case 'extract':
        const extractEl = document.querySelector(action.selector);
        return { 
          success: true, 
          data: extractEl ? extractEl.textContent : null 
        };
        
      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Capture visible area
async function captureVisibleArea() {
  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    scroll: {
      x: window.scrollX,
      y: window.scrollY
    },
    elements: getVisibleElements()
  };
}

// Get visible elements
function getVisibleElements() {
  const elements = [];
  const all = document.querySelectorAll('*');
  
  for (const el of all) {
    const rect = el.getBoundingClientRect();
    if (rect.top >= 0 && rect.left >= 0 && 
        rect.bottom <= window.innerHeight && 
        rect.right <= window.innerWidth) {
      
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || 
          el.tagName === 'SELECT' || el.tagName === 'BUTTON' || 
          el.tagName === 'A') {
        elements.push({
          tag: el.tagName,
          type: el.type,
          id: el.id,
          name: el.name,
          text: el.textContent?.substring(0, 100),
          value: el.value,
          href: el.href,
          position: {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
          }
        });
      }
    }
  }
  
  return elements;
}

// Inject agent UI overlay
async function injectAgentUI() {
  if (agentOverlay) return { success: true, exists: true };
  
  agentOverlay = document.createElement('div');
  agentOverlay.id = 'ai-agent-overlay';
  agentOverlay.innerHTML = `
    <div class="ai-agent-panel">
      <div class="ai-agent-header">
        <h3>AI Agent</h3>
        <button class="ai-agent-close">×</button>
      </div>
      <div class="ai-agent-content">
        <div class="ai-agent-status">
          <span class="status-indicator"></span>
          <span class="status-text">Connected</span>
        </div>
        <div class="ai-agent-actions">
          <button class="action-btn" data-action="capture">Capture Context</button>
          <button class="action-btn" data-action="analyze">Analyze Page</button>
          <button class="action-btn" data-action="extract">Extract Data</button>
          <button class="action-btn" data-action="fill">Fill Form</button>
        </div>
        <div class="ai-agent-console">
          <div class="console-output"></div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(agentOverlay);
  
  // Add event listeners
  agentOverlay.querySelector('.ai-agent-close').addEventListener('click', () => {
    agentOverlay.remove();
    agentOverlay = null;
  });
  
  agentOverlay.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      log(`Executing: ${action}`);
      
      const response = await chrome.runtime.sendMessage({
        type: action === 'capture' ? 'CAPTURE_CONTEXT' : 
              action === 'fill' ? 'FILL_FORM' :
              action === 'analyze' ? 'EXECUTE_TASK' :
              action === 'extract' ? 'EXTRACT_DATA' : 'UNKNOWN',
        data: { action }
      });
      
      log(`Result: ${JSON.stringify(response)}`);
    });
  });
  
  return { success: true };
}

// Log to console
function log(message) {
  if (!agentOverlay) return;
  
  const console = agentOverlay.querySelector('.console-output');
  const entry = document.createElement('div');
  entry.className = 'console-entry';
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  console.appendChild(entry);
  console.scrollTop = console.scrollHeight;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+I - Inject UI
  if (e.ctrlKey && e.shiftKey && e.key === 'I') {
    e.preventDefault();
    injectAgentUI();
  }
  
  // Ctrl+Shift+C - Capture context
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'CAPTURE_CONTEXT' });
  }
});

// Monitor page changes
const observer = new MutationObserver((mutations) => {
  // Notify background script of changes
  if (mutations.length > 10) {
    chrome.runtime.sendMessage({
      type: 'PAGE_CHANGED',
      mutations: mutations.length
    });
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true
});

// Auto-detect forms
window.addEventListener('load', () => {
  const forms = document.querySelectorAll('form');
  if (forms.length > 0) {
    chrome.runtime.sendMessage({
      type: 'FORMS_DETECTED',
      count: forms.length
    });
  }
});

console.log('AI Agent ready');
