// Content script - runs on all pages

(function() {
  'use strict';

  // Add helper functions to the page
  console.log('AI Tools extension loaded');

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageText') {
      sendResponse({ text: document.body.innerText });
    }
    
    if (request.action === 'getSelection') {
      sendResponse({ selection: window.getSelection().toString() });
    }
    
    return true;
  });

  // Add keyboard shortcuts hint (optional, can be disabled)
  const showShortcutsHint = () => {
    if (sessionStorage.getItem('ai-tools-hint-shown')) return;
    
    const hint = document.createElement('div');
    hint.id = 'ai-tools-hint';
    hint.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 999998;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        max-width: 300px;
        cursor: pointer;
      ">
        <div style="font-weight: 600; margin-bottom: 8px;">🤖 AI Tools Extension Active</div>
        <div style="font-size: 12px; opacity: 0.9;">
          • Ctrl+Shift+P - Search Perplexity<br>
          • Ctrl+Shift+G - Ask ChatGPT<br>
          • Right-click text for more options
        </div>
        <div style="font-size: 11px; margin-top: 8px; opacity: 0.7;">Click to dismiss</div>
      </div>
    `;
    
    hint.addEventListener('click', () => {
      hint.style.transition = 'opacity 0.3s';
      hint.style.opacity = '0';
      setTimeout(() => hint.remove(), 300);
      sessionStorage.setItem('ai-tools-hint-shown', 'true');
    });
    
    document.body.appendChild(hint);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (hint.parentNode) {
        hint.style.transition = 'opacity 0.3s';
        hint.style.opacity = '0';
        setTimeout(() => {
          if (hint.parentNode) hint.remove();
        }, 300);
        sessionStorage.setItem('ai-tools-hint-shown', 'true');
      }
    }, 5000);
  };

  // Show hint on first visit (optional - comment out if annoying)
  // if (document.readyState === 'loading') {
  //   document.addEventListener('DOMContentLoaded', showShortcutsHint);
  // } else {
  //   showShortcutsHint();
  // }
})();
