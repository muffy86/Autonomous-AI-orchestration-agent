// Popup functionality for AI Tools extension

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  
  // Handle tool button clicks
  document.querySelectorAll('.tool-btn[data-url]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      const useInput = btn.dataset.input === 'search';
      
      if (useInput) {
        const query = searchInput.value.trim();
        if (query) {
          chrome.tabs.create({ url: url + encodeURIComponent(query) });
        } else {
          searchInput.focus();
        }
      } else {
        chrome.tabs.create({ url });
      }
    });
  });

  // Handle Enter key in search box
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        // Default to Perplexity
        chrome.tabs.create({ 
          url: 'https://www.perplexity.ai/search?q=' + encodeURIComponent(query) 
        });
      }
    }
  });

  // Copy as Markdown
  document.getElementById('copyMarkdown').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: copyPageAsMarkdown
    });
    
    showNotification('Copying as Markdown...');
  });

  // Extract Links
  document.getElementById('extractLinks').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractAllLinks
    });
    
    showNotification('Extracting links...');
  });

  // Dark Mode Toggle
  document.getElementById('darkMode').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: toggleDarkMode
    });
    
    showNotification('Dark mode toggled!');
  });

  // Read Mode
  document.getElementById('readMode').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: activateReadMode
    });
    
    showNotification('Loading read mode...');
  });

  // Load selected text into search box
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => window.getSelection().toString()
    }, (results) => {
      if (results && results[0] && results[0].result) {
        searchInput.value = results[0].result.trim();
      }
    });
  });
});

// Injected functions
function copyPageAsMarkdown() {
  const title = document.title;
  const url = window.location.href;
  const selection = window.getSelection().toString();
  
  let markdown;
  if (selection) {
    markdown = `# ${title}\n\n**Source**: ${url}\n\n---\n\n${selection}`;
  } else {
    const bodyText = document.body.innerText;
    markdown = `# ${title}\n\n**Source**: ${url}\n\n---\n\n${bodyText}`;
  }
  
  navigator.clipboard.writeText(markdown).then(() => {
    showTempMessage('✓ Copied as Markdown!');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showTempMessage('❌ Failed to copy');
  });
}

function extractAllLinks() {
  const links = [...document.querySelectorAll('a')]
    .map(a => a.href)
    .filter(Boolean)
    .filter(href => href.startsWith('http'));
  
  const uniqueLinks = [...new Set(links)].sort();
  const text = uniqueLinks.join('\n');
  
  navigator.clipboard.writeText(text).then(() => {
    showTempMessage(`✓ Copied ${uniqueLinks.length} links!`);
  }).catch(err => {
    console.error('Failed to copy:', err);
    showTempMessage('❌ Failed to copy');
  });
}

function toggleDarkMode() {
  const html = document.documentElement;
  const currentFilter = html.style.filter;
  
  if (currentFilter === 'invert(90%) hue-rotate(180deg)') {
    html.style.filter = '';
    document.querySelectorAll('img, video, iframe').forEach(el => {
      el.style.filter = '';
    });
    showTempMessage('🌞 Light mode enabled');
  } else {
    html.style.filter = 'invert(90%) hue-rotate(180deg)';
    document.querySelectorAll('img, video, iframe').forEach(el => {
      el.style.filter = 'invert(110%) hue-rotate(180deg)';
    });
    showTempMessage('🌙 Dark mode enabled');
  }
}

function activateReadMode() {
  // Simple read mode - removes most elements except main content
  document.body.innerHTML = `
    <style>
      body {
        max-width: 800px !important;
        margin: 40px auto !important;
        padding: 20px !important;
        font-family: Georgia, serif !important;
        line-height: 1.8 !important;
        font-size: 18px !important;
        background: white !important;
        color: #333 !important;
      }
      h1, h2, h3 { color: #222 !important; }
      img { max-width: 100% !important; height: auto !important; }
      a { color: #0066cc !important; }
    </style>
    ${document.body.innerHTML}
  `;
  
  showTempMessage('📖 Read mode activated');
}

function showTempMessage(message) {
  const div = document.createElement('div');
  div.textContent = message;
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #667eea;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
  `;
  
  document.body.appendChild(div);
  
  setTimeout(() => {
    div.style.transition = 'opacity 0.3s';
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 300);
  }, 2000);
}

function showNotification(message) {
  // Show notification in popup
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #667eea;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 9999;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transition = 'opacity 0.3s';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}
