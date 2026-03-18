// ==UserScript==
// @name         Smart Search Shortcuts
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Quick search selected text across multiple engines
// @author       You
// @match        *://*/*
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    const searchEngines = {
        google: 'https://www.google.com/search?q=',
        perplexity: 'https://www.perplexity.ai/search?q=',
        github: 'https://github.com/search?q=',
        stackoverflow: 'https://stackoverflow.com/search?q=',
        mdn: 'https://developer.mozilla.org/en-US/search?q=',
        npm: 'https://www.npmjs.com/search?q=',
        reddit: 'https://www.reddit.com/search/?q=',
        youtube: 'https://www.youtube.com/results?search_query=',
        arxiv: 'https://arxiv.org/search/?query=',
        scholar: 'https://scholar.google.com/scholar?q=',
        twitter: 'https://twitter.com/search?q=',
        hn: 'https://hn.algolia.com/?q=',
        crates: 'https://crates.io/search?q=',
        pypi: 'https://pypi.org/search/?q=',
        docker: 'https://hub.docker.com/search?q=',
        chatgpt: 'https://chat.openai.com/?q=',
        claude: 'https://claude.ai/new?q='
    };

    const style = document.createElement('style');
    style.textContent = `
        .smart-search-menu {
            position: fixed;
            background: white;
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            padding: 12px;
            z-index: 999999;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 8px;
            max-width: 450px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .smart-search-item {
            padding: 10px 16px;
            background: #f0f0f0;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            cursor: pointer;
            text-align: center;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
            white-space: nowrap;
        }
        
        .smart-search-item:hover {
            background: #667eea;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .smart-search-header {
            grid-column: 1 / -1;
            font-size: 14px;
            font-weight: 600;
            color: #333;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
            margin-bottom: 4px;
        }
        
        .smart-search-query {
            grid-column: 1 / -1;
            padding: 8px;
            background: #f9f9f9;
            border-radius: 6px;
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    `;
    document.head.appendChild(style);

    let searchMenu = null;
    let selectedText = '';

    const createSearchMenu = (x, y, query) => {
        // Remove existing menu
        if (searchMenu) {
            searchMenu.remove();
        }

        searchMenu = document.createElement('div');
        searchMenu.className = 'smart-search-menu';
        searchMenu.style.left = x + 'px';
        searchMenu.style.top = y + 'px';

        // Header
        const header = document.createElement('div');
        header.className = 'smart-search-header';
        header.textContent = '🔍 Search with...';
        searchMenu.appendChild(header);

        // Query display
        const queryDisplay = document.createElement('div');
        queryDisplay.className = 'smart-search-query';
        queryDisplay.textContent = query.length > 50 ? query.substring(0, 50) + '...' : query;
        searchMenu.appendChild(queryDisplay);

        // Search engine buttons
        Object.keys(searchEngines).forEach(engine => {
            const item = document.createElement('div');
            item.className = 'smart-search-item';
            item.textContent = engine.charAt(0).toUpperCase() + engine.slice(1);
            
            item.addEventListener('click', () => {
                const url = searchEngines[engine] + encodeURIComponent(query);
                GM_openInTab(url, { active: true, insert: true, setParent: true });
                searchMenu.remove();
                searchMenu = null;
            });
            
            searchMenu.appendChild(item);
        });

        document.body.appendChild(searchMenu);

        // Adjust position if menu goes off screen
        const rect = searchMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            searchMenu.style.left = (window.innerWidth - rect.width - 20) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            searchMenu.style.top = (window.innerHeight - rect.height - 20) + 'px';
        }
    };

    // Show menu on text selection
    document.addEventListener('mouseup', (e) => {
        setTimeout(() => {
            selectedText = window.getSelection().toString().trim();
            
            if (selectedText && selectedText.length > 0) {
                // Double-click to trigger menu
                if (e.detail === 2) {
                    createSearchMenu(e.pageX, e.pageY, selectedText);
                }
            }
        }, 10);
    });

    // Keyboard shortcut: Ctrl+Shift+S
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            selectedText = window.getSelection().toString().trim();
            
            if (selectedText) {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                createSearchMenu(
                    rect.left + window.scrollX,
                    rect.bottom + window.scrollY + 5,
                    selectedText
                );
            }
        }
    });

    // Close menu on click outside
    document.addEventListener('mousedown', (e) => {
        if (searchMenu && !searchMenu.contains(e.target)) {
            searchMenu.remove();
            searchMenu = null;
        }
    });

    // Register menu commands
    GM_registerMenuCommand('Search on Perplexity', () => {
        const query = prompt('Search Perplexity:');
        if (query) {
            GM_openInTab(searchEngines.perplexity + encodeURIComponent(query), { active: true });
        }
    });

    GM_registerMenuCommand('Search on GitHub', () => {
        const query = prompt('Search GitHub:');
        if (query) {
            GM_openInTab(searchEngines.github + encodeURIComponent(query), { active: true });
        }
    });

    console.log('Smart Search Shortcuts loaded! Double-click text or press Ctrl+Shift+S');
})();
