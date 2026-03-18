# Browser Configuration Files

Ready-to-use configuration files for advanced AI browser automation.

## Directory Structure

```
browser-configs/
├── extensions/          # Custom Chrome extensions
├── scripts/            # Tampermonkey/Greasemonkey scripts
├── styles/             # Custom CSS (Stylus/Stylish)
├── bookmarklets/       # JavaScript bookmarklets
└── configs/            # Configuration files
```

## Quick Start

### 1. Install Tampermonkey Scripts

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Click on Tampermonkey icon → Dashboard
3. Utilities → Import → Choose file from `scripts/` folder
4. Install the script

### 2. Apply Custom Styles

1. Install [Stylus](https://chrome.google.com/webstore/detail/stylus/clngdbkpkpeebahjckkjfobafhncgmne)
2. Click Stylus icon → Manage
3. Write new style → Import → Paste content from `styles/` folder
4. Save and enable

### 3. Add Bookmarklets

1. Show bookmarks bar (Ctrl+Shift+B)
2. Right-click bookmarks bar → Add page
3. Name: "Tool Name"
4. URL: Copy from `bookmarklets/` folder
5. Save

### 4. Install Chrome Extension

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select folder from `extensions/`

## Available Configurations

See individual folders for specific tools and instructions.
