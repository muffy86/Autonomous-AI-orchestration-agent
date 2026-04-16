# Quick Start Guide - Browser AI Configuration

> Get up and running with advanced AI browser automation in 15 minutes

## 📋 Table of Contents

1. [Essential Setup (5 min)](#essential-setup)
2. [Extensions & Scripts (5 min)](#extensions--scripts)
3. [Custom Search (3 min)](#custom-search)
4. [Advanced Features (2 min)](#advanced-features)

---

## Essential Setup

### 1. Enable Chrome Flags

Visit `chrome://flags` and enable these:

```
✅ #enable-webgpu
✅ #enable-parallel-downloading
✅ #enable-quic
✅ #enable-experimental-web-platform-features
```

**Restart browser after enabling**

### 2. Privacy & Performance Settings

#### Privacy (`chrome://settings/privacy`)
```
✅ Send "Do Not Track" request
✅ Use secure DNS (1.1.1.1 or 8.8.8.8)
❌ Allow sites to check payment methods
```

#### Performance (`chrome://settings/performance`)
```
✅ Memory Saver (exclude AI tools)
✅ Preload pages
✅ Use hardware acceleration
```

---

## Extensions & Scripts

### Must-Have Extensions

Install these from Chrome Web Store:

1. **[uBlock Origin](https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm)** - Ad blocker
   - After install: Import `browser-configs/configs/ublock-filters.txt`

2. **[Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)** - Userscripts
   - Import scripts from `browser-configs/scripts/`

3. **[Stylus](https://chrome.google.com/webstore/detail/stylus/clngdbkpkpeebahjckkjfobafhncgmne)** - Custom CSS
   - Import `browser-configs/styles/dark-mode-ai-sites.css`

### Install Tampermonkey Scripts

1. Click Tampermonkey icon → Dashboard
2. Utilities tab → Import from file
3. Select files from `browser-configs/scripts/`:
   - `ai-assistant-anywhere.user.js` - Floating AI assistant
   - `code-copy-enhancer.user.js` - One-click code copying
   - `smart-search-shortcuts.user.js` - Quick multi-search

### Install Custom Extension

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `browser-configs/extensions/ai-tools/` folder

---

## Custom Search

### Quick Setup

Visit `chrome://settings/searchEngines` and add these:

| Name | Keyword | URL |
|------|---------|-----|
| Perplexity | @p | https://www.perplexity.ai/search?q=%s |
| ChatGPT | @gpt | https://chat.openai.com/?q=%s |
| GitHub | @gh | https://github.com/search?q=%s |
| Stack Overflow | @so | https://stackoverflow.com/search?q=%s |

**Usage**: Type `@p` in address bar, press Tab, then type your query

### Full List

Import all engines from: `browser-configs/configs/search-engines.json`

---

## Advanced Features

### Bookmarklets

1. Show bookmarks bar: `Ctrl+Shift+B`
2. Right-click bookmarks bar → "Add page"
3. Copy bookmarklet code from `browser-configs/bookmarklets/bookmarklets.json`

**Most Useful**:
- **Ask ChatGPT**: Instantly ask about selected text
- **Copy as Markdown**: Convert page to markdown
- **Extract Links**: Get all URLs from page

### API Configuration (Optional)

If using AI APIs directly:

1. Copy `browser-configs/configs/api-keys-template.env` to `~/.ai-browser-config.env`
2. Fill in your API keys
3. Use with Tampermonkey scripts

---

## 🎯 Recommended Workflow

### For Development
```
1. Enable DevTools experiments: chrome://flags/#enable-devtools-experiments
2. Install GitHub + Stack Overflow search engines
3. Install code-copy-enhancer script
4. Use @gh and @so for quick searches
```

### For AI Research
```
1. Install all AI search engines (@p, @gpt, @claude)
2. Install ai-assistant-anywhere script
3. Configure dark mode for AI sites
4. Use smart-search-shortcuts for parallel searching
```

### For Privacy-Focused Work
```
1. Import uBlock custom filters
2. Enable "Remove tracking parameters"
3. Use Brave Search or Kagi
4. Enable DNS over HTTPS
```

---

## 🔧 Troubleshooting

### Extension not working
```bash
# Check for errors
chrome://extensions/ → Developer mode → Inspect views

# Reload extension
Click refresh icon on extension card
```

### Tampermonkey script not running
```bash
# Check if enabled
Tampermonkey icon → Dashboard → Check script is enabled

# Check URL match
Script should match current page domain
```

### Search engines not appearing
```bash
# Clear browser cache
chrome://settings/clearBrowserData

# Re-add search engine
Check URL contains %s placeholder
```

---

## ⌨️ Essential Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Search Perplexity |
| `Ctrl+Shift+G` | Ask ChatGPT |
| `Ctrl+Shift+M` | Copy as Markdown |
| `Ctrl+Shift+S` | Smart Search Menu |
| `Alt+Q` | AI Assistant (Tampermonkey) |
| `F12` | DevTools |
| `Ctrl+Shift+I` | Inspect Element |

---

## 📚 Next Steps

1. **Read Full Guide**: See `BROWSER_AI_CONFIGURATION.md` for comprehensive setup
2. **Customize**: Edit scripts and styles for your workflow
3. **Explore**: Try different AI search engines and tools
4. **Optimize**: Fine-tune based on your usage patterns

---

## ✅ Verification Checklist

- [ ] Chrome flags enabled and browser restarted
- [ ] uBlock Origin installed with custom filters
- [ ] Tampermonkey installed with at least 1 script
- [ ] Custom search engines added (at least @p, @gpt, @gh)
- [ ] AI Tools extension loaded
- [ ] Dark mode applied to AI sites
- [ ] Keyboard shortcuts tested
- [ ] Privacy settings configured

---

## 🆘 Common Issues

**Q: WebGPU not working?**
```javascript
// Test in console (F12):
(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    console.log(adapter ? '✅ WebGPU works!' : '❌ Not supported');
})();
```

**Q: Scripts conflicting?**
```
Disable one at a time in Tampermonkey to identify culprit
```

**Q: Search engines disappeared?**
```
Chrome may reset after updates - re-import from JSON file
```

---

## 🚀 Pro Tips

1. **Use Profiles**: Create separate Chrome profiles for work/personal
2. **Pin Extensions**: Right-click extension icon → Pin
3. **Export Settings**: Backup your config periodically
4. **Sync Carefully**: Disable sync for sensitive extensions
5. **Test First**: Try new scripts on test pages first

---

**Ready to go?** Start with the Essential Setup, then add features as needed!

**Need help?** Check the full documentation in `BROWSER_AI_CONFIGURATION.md`
