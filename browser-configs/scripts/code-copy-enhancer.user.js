// ==UserScript==
// @name         Code Copy Enhancer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add one-click copy to all code blocks with syntax highlighting
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        .code-copy-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            padding: 6px 12px;
            background: rgba(99, 102, 241, 0.9);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            opacity: 0;
            transition: opacity 0.2s, background 0.2s;
            z-index: 10;
        }
        
        .code-copy-btn:hover {
            background: rgba(79, 70, 229, 1);
        }
        
        .code-copy-btn.copied {
            background: rgba(34, 197, 94, 0.9);
        }
        
        pre:hover .code-copy-btn {
            opacity: 1;
        }
        
        .code-block-wrapper {
            position: relative;
        }
        
        .code-line-numbers {
            position: absolute;
            left: 0;
            top: 0;
            padding: 1em 0.5em;
            background: rgba(0, 0, 0, 0.05);
            border-right: 1px solid rgba(0, 0, 0, 0.1);
            user-select: none;
            text-align: right;
            color: #666;
            font-family: monospace;
            font-size: 0.9em;
            line-height: 1.5;
        }
        
        .code-with-numbers {
            padding-left: 3.5em !important;
        }
    `;
    document.head.appendChild(style);

    const addCopyButton = (codeBlock) => {
        // Skip if already processed
        if (codeBlock.dataset.copyEnhanced) return;
        codeBlock.dataset.copyEnhanced = 'true';

        // Wrap in container
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        codeBlock.parentNode.insertBefore(wrapper, codeBlock);
        wrapper.appendChild(codeBlock);

        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'code-copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', async () => {
            const code = codeBlock.textContent;
            
            try {
                await navigator.clipboard.writeText(code);
                copyBtn.textContent = '✓ Copied!';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyBtn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = code;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                
                copyBtn.textContent = '✓ Copied!';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyBtn.classList.remove('copied');
                }, 2000);
            }
        });
        
        wrapper.appendChild(copyBtn);

        // Add line numbers (optional)
        const lines = codeBlock.textContent.split('\n');
        if (lines.length > 3) {
            const lineNumbers = document.createElement('div');
            lineNumbers.className = 'code-line-numbers';
            lineNumbers.innerHTML = lines.map((_, i) => i + 1).join('<br>');
            wrapper.insertBefore(lineNumbers, codeBlock);
            codeBlock.classList.add('code-with-numbers');
        }

        // Make pre block relative for absolute positioning
        if (codeBlock.tagName === 'PRE') {
            codeBlock.style.position = 'relative';
        }
    };

    // Process existing code blocks
    const processCodeBlocks = () => {
        document.querySelectorAll('pre, code').forEach(block => {
            // Only process blocks with substantial code
            if (block.textContent.trim().length > 20) {
                addCopyButton(block);
            }
        });
    };

    // Initial processing
    processCodeBlocks();

    // Watch for dynamically added code blocks
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.matches('pre, code')) {
                        addCopyButton(node);
                    }
                    node.querySelectorAll('pre, code').forEach(addCopyButton);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
