# CSS Scanner Pro - Debugging Guide

## Testing the Extension

### Step 1: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select this folder: `/Users/simon/Downloads/Chrome/copy-html-css-extension`
5. The extension should appear with the name "CSS Scanner Pro"

### Step 2: Check for Load Errors

After loading, check for any errors:
- Look at the extension card for any error messages (red text)
- Click on **Errors** button if it appears
- Common issues:
  - Missing files (manifest, icons, JS files)
  - Syntax errors in JavaScript
  - Permission issues

### Step 3: Test the Extension

#### Method 1: Use the Test Page
1. Open [test.html](test.html) in Chrome (File > Open File)
2. Click the extension icon in the toolbar
3. You should see a notification "CSS Scanner activated!"
4. Hover over elements to see CSS

#### Method 2: Test on Any Website
1. Navigate to any website (e.g., https://google.com)
2. Click the extension icon OR press `Ctrl+Shift+S` (Mac: `Cmd+Shift+S`)
3. Hover over elements

### Step 4: Debug Console Errors

If it's not working:

1. **Open DevTools**: Press `F12` or right-click > Inspect
2. **Go to Console tab**
3. Look for errors (red text)
4. Common errors and solutions:

#### Error: "Cannot access chrome"
- **Cause**: File opened as `file://` protocol
- **Solution**: Load test page on localhost or live server

#### Error: "Extension context invalidated"
- **Cause**: Extension was reloaded while page was open
- **Solution**: Refresh the page (F5)

#### Error: No response from background script
- **Cause**: Service worker not running
- **Solution**: Go to `chrome://extensions/` and click "Refresh" on the extension

#### Error: CSP violation
- **Cause**: Website has strict Content Security Policy
- **Solution**: Try on different website (test.html should always work)

### Step 5: Check Background Service Worker

1. Go to `chrome://extensions/`
2. Find "CSS Scanner Pro"
3. Click **Service worker** link (under "Inspect views")
4. Check the console for errors
5. You should see: "CSS Scanner Pro - Background service worker loaded"

### Step 6: Verify Content Script Injection

1. Open test.html in Chrome
2. Click the extension icon
3. Open DevTools (F12)
4. In Console, type: `window.__CSS_SCANNER_LOADED__`
5. Should return: `true`
6. If `undefined`, the script didn't inject

### Step 7: Manual Testing Checklist

Test these features:

- [ ] Extension icon appears in toolbar
- [ ] Clicking icon activates scanner
- [ ] Notification appears when activated
- [ ] Hovering over elements shows blue highlight
- [ ] Inspector block appears on right side
- [ ] CSS tab shows element styles
- [ ] HTML tab shows element HTML
- [ ] Source tab shows CSS files
- [ ] Editor tab has live CSS editor
- [ ] Copy button works
- [ ] CodePen export button works
- [ ] Pin button works
- [ ] Settings button opens panel
- [ ] Keyboard shortcut `Ctrl+Shift+S` works
- [ ] Space key freezes/unfreezes
- [ ] Escape key closes scanner
- [ ] Dragging inspector block works
- [ ] Tab switching works

## Common Issues & Solutions

### Issue: Extension icon does nothing when clicked

**Diagnosis:**
1. Check background service worker console
2. Look for errors when clicking

**Solutions:**
- Refresh the page
- Reload the extension
- Check if page URL starts with `http://` or `https://` (won't work on `chrome://` pages)

### Issue: No CSS showing when hovering

**Diagnosis:**
1. Open page console (F12)
2. Hover over elements
3. Look for JavaScript errors

**Solutions:**
- Check if inspector block is created (look in Elements tab)
- Verify styles are injected (look for `<style id="css-scanner-styles">`)
- Check z-index conflicts

### Issue: Inspector block appears but is empty

**Diagnosis:**
- Click on inspector block in Elements tab
- Check if it has content

**Solutions:**
- Verify `extractCSS()` function is working
- Check browser console for errors
- Try different elements

### Issue: Copy to clipboard doesn't work

**Solutions:**
- Check clipboard permissions in manifest
- Try using HTTPS instead of HTTP
- Some browsers block clipboard on file:// URLs

### Issue: Keyboard shortcuts don't work

**Solutions:**
1. Go to `chrome://extensions/shortcuts`
2. Verify shortcuts are configured
3. Check for conflicts with other extensions
4. Make sure page is focused (click on page first)

## Testing Commands

### Test in Browser Console

After activating scanner, test in console:

```javascript
// Check if loaded
window.__CSS_SCANNER_LOADED__

// Should be true
```

### Manually Activate (if icon doesn't work)

```javascript
// Inject script manually for testing
const script = document.createElement('script');
script.src = chrome.runtime.getURL('js/scanner-full.js');
document.head.appendChild(script);
```

## File Verification

Ensure these files exist:

```bash
# Check from terminal
ls -la manifest.json
ls -la js/background.js
ls -la js/scanner-full.js
ls -la img/icon16.png
ls -la img/icon48.png
ls -la img/icon128.png
```

## Reset Everything

If nothing works:

1. **Remove extension**: Chrome Extensions > Remove
2. **Clear cache**: DevTools > Application > Clear storage
3. **Close all tabs**
4. **Restart Chrome**
5. **Reload extension**: Load unpacked again
6. **Test on test.html first**

## Advanced Debugging

### Enable Verbose Logging

Add to beginning of scanner-full.js:

```javascript
const DEBUG = true;
function log(...args) {
  if (DEBUG) console.log('[CSS Scanner]', ...args);
}
```

Then add `log()` calls throughout:

```javascript
function activateScanner() {
  log('Activating scanner...');
  // ... rest of code
}
```

### Check Element Visibility

In console after activation:

```javascript
// Check if inspector block exists
document.getElementById('css-scanner-block')

// Check if it's visible
const block = document.getElementById('css-scanner-block');
if (block) {
  console.log('Display:', block.style.display);
  console.log('Visibility:', block.style.visibility);
  console.log('Z-Index:', getComputedStyle(block).zIndex);
}
```

## Performance Testing

Monitor performance:

```javascript
// In console
performance.measure('scanner-activation');
```

Check memory:
1. DevTools > Performance
2. Record while using scanner
3. Check for memory leaks

## Browser Compatibility

Tested on:
- ✅ Chrome 88+
- ✅ Edge 88+
- ❌ Firefox (needs Manifest V2 version)
- ❌ Safari (needs different extension format)

## Getting Help

If still not working:

1. Check console errors (F12)
2. Check background service worker console
3. Check extension manifest errors
4. Take screenshot of error
5. Note Chrome version: `chrome://version/`
6. Note which features work and which don't

## Expected Behavior

When working correctly:

1. Click icon → See "CSS Scanner activated!" notification
2. Hover over any element → See blue outline
3. Continue hovering → See inspector block with CSS on right side
4. Click copy → See "Copied to clipboard!" notification
5. Press Space → Inspector stays visible (frozen)
6. Press Esc → Scanner closes

## Quick Diagnostic Script

Run this in console to diagnose:

```javascript
console.log('=== CSS Scanner Diagnostics ===');
console.log('Script loaded:', !!window.__CSS_SCANNER_LOADED__);
console.log('Inspector block:', !!document.getElementById('css-scanner-block'));
console.log('Overlay:', !!document.getElementById('css-scanner-overlay'));
console.log('Styles:', !!document.getElementById('css-scanner-styles'));
console.log('Chrome runtime:', !!chrome.runtime);
console.log('Extension ID:', chrome.runtime.id);
```

This should help identify where the issue is!
