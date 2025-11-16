# Privacy Policy for CSS Scanner Pro

**Last Updated:** November 16, 2024
**Effective Date:** November 16, 2024

## Overview

CSS Scanner Pro is a developer tool designed to help web developers inspect, copy, and analyze CSS styles on any webpage. This privacy policy explains how the extension handles data.

## Our Commitment

**CSS Scanner Pro does NOT collect, store, transmit, or share any user data whatsoever.**

## Data Collection

### What We DO NOT Collect:
- ❌ Personal information
- ❌ Browsing history
- ❌ Website content or URLs
- ❌ CSS or HTML code you inspect
- ❌ User preferences or settings (except locally)
- ❌ Analytics or usage statistics
- ❌ Cookies or tracking data
- ❌ Any form of user identification

### What Happens Locally:
✅ **User Settings Storage:** Your preferences (language selection, CSS selector mode, display options) are stored locally in your browser using Chrome's `chrome.storage.sync` API. This data:
  - Stays on your device
  - Syncs across your Chrome browsers if you're signed in (via Google's sync, not our servers)
  - Is never transmitted to our servers (we don't have any servers)
  - Can be cleared by uninstalling the extension

✅ **Clipboard Access:** When you click "Copy", the extension writes CSS/HTML code to your clipboard. This:
  - Only happens when you explicitly click the "Copy" button
  - Is a local operation in your browser
  - Is not transmitted or stored anywhere

## How the Extension Works

1. **User Activation:** The extension only runs when YOU activate it by:
   - Clicking the extension icon
   - Using the keyboard shortcut (Ctrl+Shift+S or Cmd+Shift+S)

2. **Local Processing:** All CSS extraction and analysis happens entirely in your browser. No data leaves your device.

3. **CodePen Export (Optional):** When you click "CodePen" button:
   - The extension opens CodePen.io with your extracted HTML/CSS
   - This is done via a direct browser navigation (like clicking a link)
   - No data is sent through our servers
   - CodePen's privacy policy applies once you're on their site

## Permissions Explained

The extension requests the following permissions. Here's exactly why:

### Required Permissions:

**`storage`**
- **Why:** Save your preferences (language, settings) locally
- **Data Stored:** Only your extension settings
- **Location:** Your browser only

**`activeTab`**
- **Why:** Access the current tab when you activate the scanner
- **What It Does:** Allows the extension to read CSS styles from the page you're viewing
- **When:** Only when you manually activate the extension

**`clipboardWrite`**
- **Why:** Copy CSS/HTML code when you click "Copy"
- **What It Does:** Writes code to your clipboard
- **When:** Only when you click the Copy button

**`scripting`**
- **Why:** Inject the CSS scanner into pages
- **What It Does:** Adds the scanner interface to pages you're inspecting
- **When:** Only when you activate the extension

**`contextMenus`**
- **Why:** Provide right-click menu options
- **What It Does:** Adds scanner shortcuts to right-click menu
- **When:** Only appears when extension is enabled

**`<all_urls>` (Host Permission)**
- **Why:** Allow the extension to work on any website you visit
- **What It Does:** Enables CSS inspection on any webpage
- **Important:** This is a developer tool that MUST work on any site you're developing or inspecting
- **Data Collection:** NONE - This permission is only used to inject the scanner UI and read CSS styles locally

## Third-Party Services

### CodePen Integration (Optional Feature)
- When you click "Export to CodePen", you're redirected to CodePen.io
- The HTML/CSS is passed via URL parameters (standard web practice)
- CodePen's privacy policy applies: https://codepen.io/privacy
- This is entirely optional - you don't have to use this feature

### No Other Third Parties
- No analytics services (Google Analytics, etc.)
- No advertising networks
- No tracking pixels
- No external APIs or services
- No servers or databases

## Data Retention

**We retain ZERO data** because we don't collect any data in the first place.

Your local settings are stored in your browser and will be deleted when you:
- Uninstall the extension
- Clear your browser data
- Manually reset the extension settings

## Children's Privacy

CSS Scanner Pro is a professional developer tool. We do not knowingly collect data from anyone, including children under 13.

## Changes to This Policy

If we ever change this privacy policy, we will:
- Update the "Last Updated" date at the top
- Notify users via the Chrome Web Store update notes
- Maintain the same core principle: zero data collection

## Your Rights

Since we don't collect any data, there's no data to:
- Request access to
- Request deletion of
- Request correction of
- Request export of

Your settings are stored locally in your browser and you have full control over them.

## Open Source

CSS Scanner Pro's code can be reviewed. We encourage developers to:
- Inspect the extension code
- Verify there's no data collection
- Report any concerns

## Contact

If you have questions about this privacy policy:

- **GitHub Issues:** https://github.com/Thecoolsim (for technical questions)
- **Email:** Contact via GitHub profile at https://adjatan.org/

## Legal Compliance

This extension complies with:
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- Other privacy regulations

**How?** By not collecting any data in the first place.

## Summary (TL;DR)

✅ **Zero data collection**
✅ **All processing happens locally in your browser**
✅ **No servers, no databases, no tracking**
✅ **Settings stored locally only**
✅ **Optional CodePen export (handled by CodePen, not us)**
✅ **User-activated only - doesn't run automatically**
✅ **Open for inspection**

---

**CSS Scanner Pro is a privacy-first developer tool. We believe in transparency and user control.**

Version 1.0.0
© 2024 Simon Adjatan
