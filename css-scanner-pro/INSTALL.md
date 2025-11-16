# Installation Guide - CSS Scanner Pro

## Quick Installation (Chrome/Edge)

### Step 1: Download the Extension
- If you have the folder already, skip to Step 2
- Otherwise, download or clone this repository to your computer

### Step 2: Open Extensions Page
1. Open Chrome or Edge browser
2. Type in the address bar: `chrome://extensions/`
3. Press Enter

### Step 3: Enable Developer Mode
- Look for a toggle switch in the **top right** corner
- It says "Developer mode"
- **Turn it ON** (the toggle should be blue)

### Step 4: Load the Extension
1. Click the button **"Load unpacked"** (top left area)
2. Navigate to the `copy-html-css-extension` folder
3. Select the folder and click "Select Folder" or "Open"

### Step 5: Verify Installation
- You should see "CSS Scanner Pro" in your extensions list
- The extension icon should appear in your toolbar
- If you don't see the icon, click the puzzle piece icon and pin it

## First Use

1. **Go to any website** (like https://example.com)
2. **Click the CSS Scanner Pro icon** in your toolbar
3. **Or press** `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
4. **Hover over elements** - you'll see CSS appear in a floating box!
5. **Click any element** to copy its CSS
6. **Press Space** to pin the CSS box
7. **Press Escape** to close

## Keyboard Shortcut Setup (Optional)

If the default shortcut doesn't work:

1. Go to `chrome://extensions/shortcuts`
2. Find "CSS Scanner Pro"
3. Click the edit icon
4. Set your preferred shortcuts:
   - Activate CSS Scanner
   - Toggle grid
   - Scan parent element

## Troubleshooting

### "Load unpacked" button is greyed out
- **Solution**: Make sure Developer mode is enabled (toggle in top right)

### Extension not appearing after loading
- **Solution**: Check for error messages in the extensions page
- Make sure you selected the correct folder (should contain manifest.json)

### Icon not visible in toolbar
- **Solution**: Click the puzzle piece icon in toolbar
- Find "CSS Scanner Pro" and click the pin icon

### Keyboard shortcut not working
- **Solution**:
  - Make sure the webpage is focused (click on the page)
  - Check `chrome://extensions/shortcuts` for conflicts
  - Try clicking the icon instead

### Scanner won't activate on a page
- **Solution**:
  - Reload the page (F5)
  - Some pages (like chrome:// pages) can't be inspected
  - Check browser console for errors (F12)

## Updating the Extension

When you make changes to the code:

1. Go to `chrome://extensions/`
2. Find "CSS Scanner Pro"
3. Click the **refresh icon** (circular arrow)
4. Reload any open webpages where you want to use it

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "CSS Scanner Pro"
3. Click **"Remove"**
4. Confirm removal

## Permissions Explained

The extension requests these permissions:

- **activeTab**: To inspect elements on the current page
- **storage**: To save your settings and preferences
- **contextMenus**: To add "Inspect with CSS Scanner" to right-click menu
- **clipboardWrite**: To copy CSS to your clipboard
- **scripting**: To inject the scanner into webpages
- **<all_urls>**: To work on all websites you visit

## System Requirements

- **Browser**: Chrome 88+, Edge 88+, or any Chromium-based browser
- **OS**: Windows, Mac, or Linux
- **Space**: < 1MB

## Next Steps

After installation:
1. Read the [README.md](README.md) for full feature list
2. Try the keyboard shortcuts
3. Practice on different websites
4. Check out the tips & tricks section

Happy scanning! 🎨
