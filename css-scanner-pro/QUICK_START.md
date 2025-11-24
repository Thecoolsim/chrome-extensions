# Quick Start - Debugging CSS Scanner Pro

## 🚀 Fast Track: 3 Steps to Debug

### Step 1: Use Diagnostic Version
```bash
cd /Users/simon/Downloads/Chrome/copy-html-css-extension
./switch-version.sh
# Choose option 2 (Diagnostic)
```

Or manually:
```bash
mv manifest.json manifest-production.json
cp manifest-diagnostic.json manifest.json
```

### Step 2: Reload Extension
1. Go to `chrome://extensions/`
2. Find "CSS Scanner Pro"
3. Click the refresh/reload icon ↻

### Step 3: Test & Watch Console
1. Open [test.html](test.html) in Chrome
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Click the extension icon
5. **Watch for logs with emojis** 🔍 ✅ ❌

## What You Should See

### In Page Console:
```
[CSS Scanner] 🔍 Diagnostic version loading...
[CSS Scanner] ✅ Instance marker set
[CSS Scanner] Testing environment...
[CSS Scanner] 🚀 Activating scanner...
[CSS Scanner] Creating overlay...
[CSS Scanner] ✅ Overlay created and added
[CSS Scanner] Creating inspector block...
[CSS Scanner] ✅ Inspector block created and added
[CSS Scanner] 📢 Notification: ✅ CSS Scanner Diagnostic Active!
[CSS Scanner] ✅ Scanner fully activated
```

### In Service Worker Console:
1. Go to `chrome://extensions/`
2. Click **Service worker** (blue link)
3. You should see:
```
[Background] 🔍 CSS Scanner Pro - Diagnostic background worker loaded
[Background] 🖱️ Extension icon clicked
[Background] Tab URL: file:///...test.html
[Background] 💉 Attempting to inject scanner-diagnostic.js...
[Background] ✅ Script injected successfully
[Background] 📤 Sending TOGGLE_SCANNER message...
```

### Visually:
- ✅ Green notification appears at top
- ✅ Dark inspector block on right side
- ✅ Blue overlay when hovering elements
- ✅ CSS code updates as you hover

## ❌ If It Doesn't Work

### Common Error Messages:

#### "Cannot run on this page type"
**Meaning:** Wrong page type
**Fix:** Use test.html or any http:// or https:// website

#### "Failed to inject scanner"
**Meaning:** Permission or page issue
**Fix:**
- Refresh the page (F5)
- Use test.html
- Check chrome://extensions/ for errors

#### "Extension context invalidated"
**Meaning:** Extension was reloaded
**Fix:** Refresh the page (F5)

#### Nothing in console at all
**Meaning:** Script not loading
**Fix:**
1. Check chrome://extensions/ for errors
2. Verify files exist:
   ```bash
   ls js/background-diagnostic.js
   ls js/scanner-diagnostic.js
   ```
3. Reload extension

## 🔧 Manual Diagnostic

If still not working, run this in console:

```javascript
// Check if script loaded
console.log('Script loaded:', window.__CSS_SCANNER_LOADED__);

// Check if elements exist
console.log('Inspector:', document.getElementById('css-scanner-block-diagnostic'));
console.log('Overlay:', document.getElementById('css-scanner-overlay-diagnostic'));

// Check Chrome API
console.log('Chrome available:', typeof chrome !== 'undefined');
console.log('Runtime:', typeof chrome !== 'undefined' && !!chrome.runtime);
```

## 📁 Files Created for You

- **[test.html](test.html)** - Test page with styled elements
- **[scanner-diagnostic.js](js/scanner-diagnostic.js)** - Logged version of scanner
- **[background-diagnostic.js](js/background-diagnostic.js)** - Logged background worker
- **[DEBUGGING.md](DEBUGGING.md)** - Full debugging guide
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Complete testing instructions
- **[WHAT_I_FOUND.md](WHAT_I_FOUND.md)** - Code analysis

## 🎯 What To Do Next

1. **Start with diagnostic version** ← You are here!
2. **Check console output** - See what logs appear
3. **Take note of the last message** - Shows where it fails
4. **Check both consoles** - Page AND service worker
5. **Report what you see** - Share the console output

## ⚡ Quick Commands

```bash
# Switch to diagnostic
./switch-version.sh
# Choose: 2

# Switch to production
./switch-version.sh
# Choose: 1

# Check current version
./switch-version.sh
# Choose: 3
```

## 📞 Need More Help?

Read in this order:
1. **QUICK_START.md** ← You are here
2. **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Detailed testing steps
3. **[DEBUGGING.md](DEBUGGING.md)** - Advanced debugging
4. **[WHAT_I_FOUND.md](WHAT_I_FOUND.md)** - Technical analysis

## ✅ Success Checklist

Extension works when:
- [ ] Notification appears when clicking icon
- [ ] Inspector block visible on right side
- [ ] Blue overlay follows mouse cursor
- [ ] CSS updates when hovering elements
- [ ] Pressing ESC closes scanner
- [ ] No errors in console

---

**Start with Step 1 above!** The diagnostic version will show you exactly what's happening.

---

## 👨‍💻 Created by Simon Adjatan

🌐 [adjatan.org](https://adjatan.org/) | 💻 [GitHub](https://github.com/Thecoolsim) | 🐦 [X](https://x.com/adjatan) | 📘 [Facebook](https://www.facebook.com/adjatan)
