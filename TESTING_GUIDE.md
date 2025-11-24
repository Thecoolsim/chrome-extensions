# CSS Scanner Pro - Complete Testing Guide

## Quick Fix: Use Diagnostic Version

I've created a diagnostic version with extensive console logging to help identify the issue.

### Step 1: Switch to Diagnostic Version

1. **Rename the current manifest:**
   ```bash
   # In the extension folder
   mv manifest.json manifest-production.json
   mv manifest-diagnostic.json manifest.json
   ```

2. **Or manually edit manifest.json:**
   - Change line 22: `"service_worker": "js/background-diagnostic.js"`
   - The diagnostic version will use `scanner-diagnostic.js`

### Step 2: Reload Extension

1. Go to `chrome://extensions/`
2. Find "CSS Scanner Pro"
3. Click the **Refresh** icon (circular arrow)
4. Check for any errors on the extension card

### Step 3: Test & Check Console

1. Open [test.html](test.html) in Chrome
2. Open DevTools (`F12`) and go to **Console** tab
3. Click the extension icon
4. You should see detailed logs like:
   ```
   [CSS Scanner] 🔍 Diagnostic version loading...
   [CSS Scanner] ✅ Instance marker set
   [CSS Scanner] 🚀 Activating scanner...
   [CSS Scanner] ✅ Scanner fully activated
   ```

5. **Also check the Background Service Worker console:**
   - Go to `chrome://extensions/`
   - Click **Service worker** link
   - You should see:
     ```
     [Background] 🔍 CSS Scanner Pro - Diagnostic background worker loaded
     [Background] 🖱️ Extension icon clicked
     [Background] ✅ Script injected successfully
     ```

## What to Look For

### If you see these messages, it's WORKING:
- ✅ `[CSS Scanner] Diagnostic version loading...`
- ✅ `[CSS Scanner] ✅ Scanner fully activated`
- ✅ Green notification appears
- ✅ Inspector block visible on right side
- ✅ Blue overlay appears when hovering

### If you see these errors, here's the fix:

#### Error: "Document is not ready"
**Solution:** The page loaded before the script. Just refresh the page.

#### Error: "Cannot access chrome.runtime"
**Solution:** Extension was reloaded. Refresh the page (F5).

#### Error: "Failed to inject scanner"
**Solution:**
1. Make sure you're on an `http://` or `https://` page
2. Can't inject on `chrome://` pages - use test.html instead

#### Error: "Service worker not found"
**Solution:**
1. Go to `chrome://extensions/`
2. Click "Errors" if there's a button
3. Reload the extension

## Testing Checklist

### Basic Functionality

1. **Icon Click Test**
   - [ ] Click extension icon
   - [ ] See green notification
   - [ ] Inspector block appears
   - [ ] No errors in console

2. **Hover Test**
   - [ ] Move mouse over elements
   - [ ] Blue overlay follows mouse
   - [ ] CSS updates in inspector
   - [ ] Element tag name shows correctly

3. **Keyboard Test**
   - [ ] Press `Escape` - scanner closes
   - [ ] Press `Ctrl+Shift+S` - scanner opens
   - [ ] Console shows keyboard events

4. **Close Test**
   - [ ] Click "Close" button
   - [ ] Scanner disappears
   - [ ] No errors in console

### Advanced Testing (Production Version)

Switch back to production version:
```bash
mv manifest.json manifest-diagnostic.json
mv manifest-production.json manifest.json
```

Then reload extension and test:

1. **Full Feature Test**
   - [ ] Click icon to activate
   - [ ] Hover shows CSS
   - [ ] Click "CSS" tab
   - [ ] Click "HTML" tab
   - [ ] Click "Source" tab
   - [ ] Click "Editor" tab
   - [ ] Copy button works
   - [ ] CodePen button works
   - [ ] Pin button works
   - [ ] Settings button works

2. **Keyboard Shortcuts**
   - [ ] `Ctrl+Shift+S` - Activate
   - [ ] `Space` - Freeze/pin
   - [ ] `Backspace` - Freeze toggle
   - [ ] `Escape` - Close
   - [ ] `↑` - Parent element
   - [ ] `↓` - Child element

3. **UI Interaction**
   - [ ] Drag inspector block
   - [ ] Click breadcrumb items
   - [ ] Toggle checkboxes
   - [ ] Edit CSS in editor tab
   - [ ] Apply live CSS

## Common Issues & Solutions

### Issue 1: Extension Loads But Nothing Happens

**Diagnosis Steps:**
1. Open `chrome://extensions/`
2. Click **Service worker**
3. Click the extension icon
4. Check console for messages

**Common Causes:**
- Script path is wrong → Check manifest.json line 22
- Script has syntax error → Check browser console
- Page blocks injection → Try different page

**Fix:**
```bash
# Verify files exist
ls js/background.js
ls js/scanner-full.js

# Check for syntax errors
node -c js/background.js
```

### Issue 2: "Failed to inject" Error

**This means:** The extension can't inject on this page

**Solution:**
- ✅ Use on regular websites (http:// or https://)
- ✅ Use test.html file
- ❌ Won't work on chrome:// pages
- ❌ Won't work on chrome web store
- ❌ Won't work on PDF files

### Issue 3: Inspector Block Not Visible

**Possible causes:**
1. **Z-index issue** - Another element is on top
2. **Display issue** - CSS display is set to none
3. **Position issue** - Block is off-screen

**Debug:**
```javascript
// Run in console after activation
const block = document.getElementById('css-scanner-block');
if (block) {
  console.log('Block exists!');
  console.log('Display:', getComputedStyle(block).display);
  console.log('Z-index:', getComputedStyle(block).zIndex);
  console.log('Position:', block.style.top, block.style.left);
} else {
  console.log('Block not found!');
}
```

**Fix:**
```javascript
// Force it to be visible
const block = document.getElementById('css-scanner-block');
if (block) {
  block.style.display = 'block';
  block.style.zIndex = '2147483647';
  block.style.position = 'fixed';
  block.style.top = '100px';
  block.style.right = '20px';
}
```

### Issue 4: Styles Not Showing

**Check:**
```javascript
// Check if styles are injected
const styles = document.getElementById('css-scanner-styles');
console.log('Styles injected:', !!styles);
```

**If false, manually inject:**
```javascript
// This is normally done automatically
// Copy the addStyles() function from scanner-full.js
```

### Issue 5: Console Shows "Script Loaded" But Nothing Happens

**This means:** Auto-activation failed

**Manual activation:**
```javascript
// In page console, after script loads
if (typeof activateScanner !== 'undefined') {
  activateScanner();
} else {
  console.error('activateScanner function not found');
}
```

## Performance Testing

Check if scanner impacts page performance:

1. Open DevTools > Performance tab
2. Click Record
3. Activate scanner and hover over elements
4. Stop recording
5. Check:
   - FPS should stay above 30
   - JavaScript time should be minimal
   - No long tasks

## Compatibility Testing

Test on different pages:

- [ ] Simple HTML page (test.html) ✅ Should work
- [ ] Complex website (Reddit, X) ✅ Should work
- [ ] Single-page app (Gmail, Figma) ✅ Should work
- [ ] chrome:// pages ❌ Won't work (browser limitation)
- [ ] PDF files ❌ Won't work
- [ ] Local files (file://) ⚠️ Needs permission

## Enable File:// Access

To test on local files:

1. Go to `chrome://extensions/`
2. Find CSS Scanner Pro
3. Click **Details**
4. Enable **"Allow access to file URLs"**
5. Now you can use on `file://` URLs

## Reset Everything

If completely broken:

1. **Remove extension**
   - chrome://extensions/
   - Click "Remove"

2. **Clear all data**
   ```javascript
   // In any page console
   localStorage.clear();
   chrome.storage.sync.clear();
   ```

3. **Restart Chrome completely**
   - Quit Chrome
   - Reopen Chrome

4. **Reload extension fresh**
   - Load unpacked
   - Test on test.html first

## Success Criteria

The extension is working correctly when:

✅ Clicking icon shows notification
✅ Inspector block appears on screen
✅ Hovering elements shows blue outline
✅ CSS updates in real-time
✅ All tabs work (CSS, HTML, Source, Editor)
✅ Copy button copies to clipboard
✅ Keyboard shortcuts work
✅ No console errors
✅ Can drag inspector block
✅ ESC closes the scanner

## Get Additional Help

If still not working after trying everything:

1. **Capture diagnostics:**
   ```javascript
   // Run in console
   console.log('=== DIAGNOSTICS ===');
   console.log('Loaded:', window.__CSS_SCANNER_LOADED__);
   console.log('Block:', !!document.getElementById('css-scanner-block'));
   console.log('Overlay:', !!document.getElementById('css-scanner-overlay'));
   console.log('Styles:', !!document.getElementById('css-scanner-styles'));
   console.log('Chrome:', typeof chrome);
   console.log('Runtime:', !!chrome.runtime);
   ```

2. **Take screenshots of:**
   - Extension card in chrome://extensions/
   - Browser console errors
   - Background service worker console
   - The page where it's not working

3. **Share info:**
   - Chrome version (chrome://version/)
   - Operating system
   - What you tried
   - Any error messages

## Next Steps

1. **Try diagnostic version first** - It has detailed logging
2. **Check all consoles** - Page console AND service worker console
3. **Test on test.html** - Eliminates page-specific issues
4. **Copy error messages** - Exact text helps diagnose

Good luck! The diagnostic version should help identify exactly where the issue is.
