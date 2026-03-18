# AI Tools Browser Extension

Quick access to AI services and developer tools directly from your browser.

## Features

- 🔍 **Quick Search**: Instantly search across Perplexity, ChatGPT, Claude, GitHub, and more
- 🚀 **One-Click Actions**: Copy pages as Markdown, extract links, toggle dark mode, activate read mode
- ⌨️ **Keyboard Shortcuts**: Fast access via customizable shortcuts
- 🎯 **Context Menu**: Right-click to search selected text
- 🛠️ **Developer Tools**: Quick access to Stack Overflow, npm, MDN, Regex101, etc.

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `ai-tools` folder
6. Extension is now installed!

### Icons

You'll need to add icon files to the `icons/` folder:
- `icon16.png` (16x16)
- `icon32.png` (32x32)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can generate these using an AI image generator or design tool.

## Usage

### Popup Interface

Click the extension icon to open the popup:
- **Quick Search**: Type your query and click any search engine
- **Quick Actions**: One-click tools for common tasks
- **Developer Tools**: Access documentation and package registries

### Keyboard Shortcuts

Configure in `chrome://extensions/shortcuts`:

- `Ctrl+Shift+P` (Cmd+Shift+P on Mac): Search on Perplexity
- `Ctrl+Shift+G` (Cmd+Shift+G on Mac): Ask ChatGPT
- `Ctrl+Shift+M` (Cmd+Shift+M on Mac): Copy page as Markdown

### Context Menu

Right-click selected text or anywhere on the page:
- Search on various platforms
- Ask AI assistants
- Extract data
- Convert formats

## Features in Detail

### Copy as Markdown
Converts the current page (or selected text) to Markdown format and copies to clipboard.

### Extract Links
Finds all links on the page, removes duplicates, and copies them to clipboard.

### Dark Mode Toggle
Applies instant dark mode to any website using CSS filters.

### Read Mode
Simplifies the page layout for distraction-free reading.

## Customization

### Adding Custom Search Engines

Edit `popup.html` and add new buttons:

```html
<button class="tool-btn" data-url="https://example.com/search?q=" data-input="search">
    <span class="tool-icon">🔍</span>
    Example
</button>
```

### Modifying Keyboard Shortcuts

Edit `manifest.json`:

```json
"commands": {
  "your-command": {
    "suggested_key": {
      "default": "Ctrl+Shift+X"
    },
    "description": "Your description"
  }
}
```

## Permissions

The extension requires:
- `activeTab`: Access current tab content
- `storage`: Save user preferences
- `contextMenus`: Add right-click menu items
- `clipboardWrite`: Copy to clipboard
- `scripting`: Execute scripts for features
- `<all_urls>`: Work on any website

## Privacy

This extension:
- ✅ Runs locally in your browser
- ✅ Does not collect or transmit any data
- ✅ Does not track your activity
- ✅ Open source and auditable

## Development

### File Structure

```
ai-tools/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (background tasks)
├── popup.html            # Popup interface
├── popup.js              # Popup functionality
├── content.js            # Content script (injected into pages)
├── content.css           # Content styles
├── options.html          # Settings page
├── icons/                # Extension icons
└── README.md             # This file
```

### Building

No build step required - just load the folder directly.

### Testing

1. Make changes to source files
2. Go to `chrome://extensions/`
3. Click refresh icon on your extension
4. Test your changes

## Troubleshooting

### Extension not appearing
- Make sure Developer mode is enabled
- Check that all required files are present
- Look for errors in `chrome://extensions/`

### Features not working
- Check browser console for errors (F12)
- Verify permissions in manifest.json
- Test on different websites

### Keyboard shortcuts not working
- Check `chrome://extensions/shortcuts`
- Ensure no conflicts with browser/OS shortcuts
- Try different key combinations

## Contributing

Feel free to modify and extend this extension for your needs!

## License

MIT License - feel free to use and modify
