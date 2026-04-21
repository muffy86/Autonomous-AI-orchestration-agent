/**
 * Autonomous AI Agent - Background Service Worker
 * Handles browser automation, context capture, and task orchestration
 */

const MCP_SERVER_URL = 'http://localhost:3001';
let activeTasks = new Map();
let browserContext = {};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Autonomous AI Agent installed');
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'ai-agent-analyze',
    title: 'Analyze with AI Agent',
    contexts: ['page', 'selection', 'link', 'image']
  });
  
  chrome.contextMenus.create({
    id: 'ai-agent-fill-form',
    title: 'AI Fill Form',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'ai-agent-extract',
    title: 'Extract Data',
    contexts: ['page', 'selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'ai-agent-analyze':
      await analyzeContent(tab, info);
      break;
    case 'ai-agent-fill-form':
      await fillForm(tab);
      break;
    case 'ai-agent-extract':
      await extractData(tab, info);
      break;
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  switch (message.type) {
    case 'CAPTURE_CONTEXT':
      handleCaptureContext(sender.tab).then(sendResponse);
      return true;
      
    case 'EXECUTE_TASK':
      handleExecuteTask(message.task, sender.tab).then(sendResponse);
      return true;
      
    case 'FILL_FORM':
      handleFillForm(message.data, sender.tab).then(sendResponse);
      return true;
      
    case 'NAVIGATE':
      handleNavigate(message.url, sender.tab).then(sendResponse);
      return true;
      
    case 'CLICK_ELEMENT':
      handleClickElement(message.selector, sender.tab).then(sendResponse);
      return true;
      
    case 'TYPE_TEXT':
      handleTypeText(message.selector, message.text, sender.tab).then(sendResponse);
      return true;
      
    case 'GET_MCP_STATUS':
      getMCPStatus().then(sendResponse);
      return true;
  }
});

// Keyboard command handler
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  switch (command) {
    case 'capture_context':
      await handleCaptureContext(tab);
      break;
    case 'execute_task':
      await showTaskPrompt(tab);
      break;
  }
});

// Tab update listener - track browser context
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateBrowserContext(tab);
  }
});

// Capture page context
async function handleCaptureContext(tab) {
  try {
    // Inject content script if needed
    await ensureContentScript(tab.id);
    
    // Get page data
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: capturePageData
    });
    
    const context = {
      url: tab.url,
      title: tab.title,
      timestamp: new Date().toISOString(),
      ...result.result
    };
    
    // Store context
    browserContext[tab.id] = context;
    
    // Send to MCP server
    await fetch(`${MCP_SERVER_URL}/api/mcp/tools/browser_context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context)
    });
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon-128.png',
      title: 'Context Captured',
      message: `Captured context from: ${tab.title}`
    });
    
    return { success: true, context };
  } catch (error) {
    console.error('Context capture error:', error);
    return { success: false, error: error.message };
  }
}

// Execute autonomous task
async function handleExecuteTask(task, tab) {
  try {
    const taskId = `task_${Date.now()}`;
    
    // Create task
    activeTasks.set(taskId, {
      id: taskId,
      task,
      tab,
      status: 'running',
      startTime: Date.now()
    });
    
    // Send to MCP server for execution
    const response = await fetch(`${MCP_SERVER_URL}/api/skills/automation/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow: {
          name: task,
          steps: await analyzeTaskSteps(task, tab)
        },
        context: browserContext[tab.id]
      })
    });
    
    const result = await response.json();
    
    // Update task status
    activeTasks.get(taskId).status = 'completed';
    activeTasks.get(taskId).result = result;
    
    return { success: true, taskId, result };
  } catch (error) {
    console.error('Task execution error:', error);
    return { success: false, error: error.message };
  }
}

// Fill form intelligently
async function handleFillForm(data, tab) {
  try {
    await ensureContentScript(tab.id);
    
    // Analyze form fields
    const [formAnalysis] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: analyzeForm
    });
    
    // Use AI to map data to fields
    const response = await fetch(`${MCP_SERVER_URL}/api/skills/automation/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow: {
          name: 'intelligent_form_fill',
          steps: [
            { action: 'analyze_form', fields: formAnalysis.result },
            { action: 'map_data', data },
            { action: 'fill_fields' },
            { action: 'validate' }
          ]
        }
      })
    });
    
    const fillInstructions = await response.json();
    
    // Execute filling
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillFormFields,
      args: [fillInstructions]
    });
    
    return { success: true, filled: true };
  } catch (error) {
    console.error('Form fill error:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions that run in page context
function capturePageData() {
  return {
    html: document.documentElement.outerHTML,
    text: document.body.innerText,
    forms: Array.from(document.forms).map(form => ({
      action: form.action,
      method: form.method,
      fields: Array.from(form.elements).map(el => ({
        name: el.name,
        type: el.type,
        value: el.value,
        placeholder: el.placeholder,
        required: el.required
      }))
    })),
    links: Array.from(document.links).map(a => ({
      href: a.href,
      text: a.textContent
    })),
    images: Array.from(document.images).map(img => ({
      src: img.src,
      alt: img.alt
    })),
    meta: {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      keywords: document.querySelector('meta[name="keywords"]')?.content
    },
    selection: window.getSelection().toString(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    }
  };
}

function analyzeForm() {
  const forms = Array.from(document.forms);
  return forms.map(form => ({
    id: form.id,
    name: form.name,
    action: form.action,
    method: form.method,
    fields: Array.from(form.elements).map(el => ({
      id: el.id,
      name: el.name,
      type: el.type,
      placeholder: el.placeholder,
      label: findLabel(el),
      required: el.required,
      pattern: el.pattern,
      value: el.value
    }))
  }));
  
  function findLabel(element) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent;
    
    const parentLabel = element.closest('label');
    return parentLabel?.textContent || '';
  }
}

function fillFormFields(instructions) {
  for (const instruction of instructions.fields) {
    const element = document.querySelector(instruction.selector);
    if (element) {
      element.value = instruction.value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

// Navigate to URL
async function handleNavigate(url, tab) {
  await chrome.tabs.update(tab.id, { url });
  return { success: true };
}

// Click element
async function handleClickElement(selector, tab) {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel) => {
      const element = document.querySelector(sel);
      element?.click();
    },
    args: [selector]
  });
  return { success: true };
}

// Type text
async function handleTypeText(selector, text, tab) {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sel, txt) => {
      const element = document.querySelector(sel);
      if (element) {
        element.value = txt;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
    args: [selector, text]
  });
  return { success: true };
}

// Analyze task into steps
async function analyzeTaskSteps(task, tab) {
  // Use AI to break down task into executable steps
  const response = await fetch(`${MCP_SERVER_URL}/api/mcp/tools/web_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `How to: ${task}`,
      context: browserContext[tab.id]
    })
  });
  
  return [
    { action: 'analyze_page', description: 'Understand current page' },
    { action: 'plan_actions', description: 'Plan execution steps' },
    { action: 'execute', description: 'Execute task' },
    { action: 'verify', description: 'Verify completion' }
  ];
}

// Ensure content script is injected
async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content-script.js']
    });
  } catch (error) {
    console.log('Content script already injected or error:', error);
  }
}

// Update browser context
function updateBrowserContext(tab) {
  browserContext[tab.id] = {
    ...browserContext[tab.id],
    url: tab.url,
    title: tab.title,
    lastUpdated: Date.now()
  };
}

// Get MCP server status
async function getMCPStatus() {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    const data = await response.json();
    return { online: true, ...data };
  } catch (error) {
    return { online: false, error: error.message };
  }
}

// Analyze content
async function analyzeContent(tab, info) {
  const context = await handleCaptureContext(tab);
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/icon-128.png',
    title: 'Analyzing...',
    message: 'AI is analyzing the content'
  });
}

// Extract data
async function extractData(tab, info) {
  await ensureContentScript(tab.id);
  
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return {
        selection: window.getSelection().toString(),
        tables: Array.from(document.querySelectorAll('table')).map(t => t.outerHTML),
        lists: Array.from(document.querySelectorAll('ul, ol')).map(l => l.innerText)
      };
    }
  });
  
  console.log('Extracted data:', result.result);
}

// Fill form
async function fillForm(tab) {
  await handleFillForm({}, tab);
}

// Show task prompt
async function showTaskPrompt(tab) {
  chrome.action.openPopup();
}

console.log('Background service worker initialized');
