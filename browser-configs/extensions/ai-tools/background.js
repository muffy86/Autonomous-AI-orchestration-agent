// Background service worker for AI Tools extension

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Main menu
  chrome.contextMenus.create({
    id: 'ai-tools-main',
    title: 'AI Tools',
    contexts: ['selection', 'page']
  });

  // Search submenu
  chrome.contextMenus.create({
    id: 'search-perplexity',
    parentId: 'ai-tools-main',
    title: 'Search on Perplexity',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'search-github',
    parentId: 'ai-tools-main',
    title: 'Search on GitHub',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'search-stackoverflow',
    parentId: 'ai-tools-main',
    title: 'Search on Stack Overflow',
    contexts: ['selection']
  });

  // AI assistance submenu
  chrome.contextMenus.create({
    id: 'ask-chatgpt',
    parentId: 'ai-tools-main',
    title: 'Ask ChatGPT',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ask-claude',
    parentId: 'ai-tools-main',
    title: 'Ask Claude',
    contexts: ['selection']
  });

  // Utility submenu
  chrome.contextMenus.create({
    id: 'separator-1',
    parentId: 'ai-tools-main',
    type: 'separator',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'copy-markdown',
    parentId: 'ai-tools-main',
    title: 'Copy as Markdown',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'extract-links',
    parentId: 'ai-tools-main',
    title: 'Extract All Links',
    contexts: ['page']
  });

  console.log('AI Tools extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText || '';
  
  const searchEngines = {
    'search-perplexity': 'https://www.perplexity.ai/search?q=',
    'search-github': 'https://github.com/search?q=',
    'search-stackoverflow': 'https://stackoverflow.com/search?q=',
    'ask-chatgpt': 'https://chat.openai.com/?q=',
    'ask-claude': 'https://claude.ai/new?q='
  };

  if (searchEngines[info.menuItemId]) {
    const url = searchEngines[info.menuItemId] + encodeURIComponent(selectedText);
    chrome.tabs.create({ url, index: tab.index + 1 });
  }

  // Handle utility functions
  if (info.menuItemId === 'copy-markdown') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: copyPageAsMarkdown
    });
  }

  if (info.menuItemId === 'extract-links') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractAllLinks
    });
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    if (command === 'search-perplexity') {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: searchSelected,
        args: ['https://www.perplexity.ai/search?q=']
      });
    }

    if (command === 'ask-chatgpt') {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: searchSelected,
        args: ['https://chat.openai.com/?q=']
      });
    }

    if (command === 'copy-as-markdown') {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: copyPageAsMarkdown
      });
    }
  });
});

// Injected functions
function searchSelected(baseUrl) {
  const selected = window.getSelection().toString().trim();
  if (selected) {
    window.open(baseUrl + encodeURIComponent(selected), '_blank');
  }
}

function copyPageAsMarkdown() {
  // Simple markdown conversion
  const title = document.title;
  const url = window.location.href;
  const bodyText = document.body.innerText;
  
  const markdown = `# ${title}\n\n**Source**: ${url}\n\n---\n\n${bodyText}`;
  
  navigator.clipboard.writeText(markdown).then(() => {
    alert('✓ Page copied as Markdown!');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

function extractAllLinks() {
  const links = [...document.querySelectorAll('a')]
    .map(a => a.href)
    .filter(Boolean)
    .filter(href => href.startsWith('http'));
  
  const uniqueLinks = [...new Set(links)];
  const markdown = uniqueLinks.join('\n');
  
  navigator.clipboard.writeText(markdown).then(() => {
    alert(`✓ Copied ${uniqueLinks.length} unique links!`);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => window.getSelection().toString()
      }, (results) => {
        sendResponse({ selection: results[0].result });
      });
    });
    return true; // Keep channel open for async response
  }
});

// Badge update
chrome.tabs.onActivated.addListener(() => {
  updateBadge();
});

function updateBadge() {
  chrome.storage.local.get(['shortcuts'], (result) => {
    const count = result.shortcuts?.length || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    }
  });
}
