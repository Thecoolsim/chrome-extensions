# Internationalization (i18n) - CSS Scanner Pro

## Overview

CSS Scanner Pro now supports **4 languages** out of the box:
- 🇬🇧 **English** (default)
- 🇫🇷 **French** (Français)
- 🇪🇸 **Spanish** (Español)
- 🇩🇪 **German** (Deutsch)

The extension **automatically detects** the browser's language and displays the UI in that language.

## How It Works

### Automatic Language Detection

Chrome automatically detects the browser language and loads the appropriate translation from the `_locales` folder:

```
_locales/
├── en/          ← English (default)
│   └── messages.json
├── fr/          ← French
│   └── messages.json
├── es/          ← Spanish
│   └── messages.json
└── de/          ← German
    └── messages.json
```

### What Gets Translated

✅ **Extension Metadata:**
- Extension name
- Extension description
- Extension tooltip
- Keyboard command descriptions

✅ **Guide Overlay:**
- All section titles (Quick Start, How to Use, Features)
- All step-by-step instructions
- Feature descriptions
- Pro tips

✅ **Notifications:**
- "CSS Scanner activated!"
- "CSS Scanner deactivated"
- "Copied to clipboard!"
- And more...

## For Users

### Changing the Language

The extension uses your browser's default language. To change it:

**Chrome:**
1. Go to Settings → Languages
2. Move your preferred language to the top
3. Restart Chrome
4. The extension will now use that language

**Edge:**
1. Go to Settings → Languages
2. Add your preferred language
3. Set as display language
4. Restart Edge

**Brave/Opera:**
- Same as Chrome

### Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English | `en` | ✅ Complete |
| French | `fr` | ✅ Complete |
| Spanish | `es` | ✅ Complete |
| German | `de` | ✅ Complete |

If your language is not listed, the extension will default to English.

## For Developers

### Adding a New Language

Want to add support for another language? Follow these steps:

#### 1. Create Language Folder

Create a new folder in `_locales/` with the language code:

```bash
mkdir _locales/ja  # For Japanese
mkdir _locales/zh_CN  # For Chinese (Simplified)
mkdir _locales/pt_BR  # For Portuguese (Brazil)
```

Language codes follow [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) standard.

#### 2. Copy English Messages

Copy the English messages.json as a template:

```bash
cp _locales/en/messages.json _locales/ja/messages.json
```

#### 3. Translate Messages

Edit the new `messages.json` and translate the `"message"` values:

```json
{
  "extName": {
    "message": "CSS Scanner Pro"  ← Keep same (it's a product name)
  },
  "extDescription": {
    "message": "ウェブページ上のCSSスタイルを検査、コピー、分析する最速かつ最も簡単な方法"
  },
  "guideTitle": {
    "message": "CSS Scanner Pro - クイックガイド"
  }
}
```

**Translation Guidelines:**
- Keep placeholder syntax intact: `$SHORTCUT$`, `$CSS$`, etc.
- Don't translate product names: "CSS Scanner Pro", "CodePen"
- Keep HTML tags: `<strong>`, `<kbd>`, etc.
- Test with your browser set to that language

#### 4. Test Your Translation

1. Load the extension in Chrome
2. Change browser language to your new language
3. Restart browser
4. Activate the extension and check all UI elements

### Message Format

Each message follows this structure:

```json
{
  "messageName": {
    "message": "The translated text",
    "description": "Optional: What this message is for"
  }
}
```

#### Messages with Placeholders

Some messages include placeholders for dynamic content:

```json
{
  "guideStep1": {
    "message": "Press $SHORTCUT$ or click the extension icon to activate",
    "placeholders": {
      "shortcut": {
        "content": "$1"
      }
    }
  }
}
```

In the code, this is used as:
```javascript
i18n('guideStep1', 'Cmd+Shift+S')
// Output: "Press Cmd+Shift+S or click the extension icon to activate"
```

### Using i18n in Code

The extension uses a helper function `i18n()`:

```javascript
// Simple message
const title = i18n('guideTitle');
// Output: "CSS Scanner Pro - Quick Guide"

// Message with single placeholder
const step1 = i18n('guideStep1', 'Ctrl+Shift+S');
// Output: "Press Ctrl+Shift+S or click the extension icon to activate"

// Message with multiple placeholders
const step3 = i18n('guideStep3', ['CSS', 'HTML', 'Source', 'Editor']);
// Output: "Use tabs: CSS, HTML, Source, Editor"
```

### Manifest.json

The manifest uses special syntax for i18n:

```json
{
  "name": "__MSG_extName__",
  "description": "__MSG_extDescription__",
  "default_locale": "en"
}
```

Chrome automatically replaces `__MSG_*__` with the translated message.

## Complete Message List

### Extension Metadata
- `extName` - Extension name
- `extDescription` - Extension description
- `extTitle` - Extension icon tooltip
- `cmdActivateScanner` - Activate scanner command
- `cmdToggleGrid` - Toggle grid command
- `cmdScanParent` - Scan parent command

### Guide Overlay
- `guideTitle` - Guide modal title
- `guideQuickStart` - "Quick Start" section
- `guideHowToUse` - "How to Use" section
- `guideFeatures` - "Features" section
- `guideProTip` - "Pro Tip:" label
- `shortcutActivateScanner` - "Activate Scanner"
- `shortcutToggleGrid` - "Toggle Grid"
- `shortcutScanParent` - "Scan Parent"
- `guideStep1` through `guideStep5` - Usage steps
- `featureSyntaxHighlighting` through `featureOptimizedCSS` - Feature descriptions
- `proTipMessage` - Pro tip content

### UI Elements
- `tabCSS`, `tabHTML`, `tabSource`, `tabEditor` - Tab names
- `btnCopy`, `btnCodePen`, `btnPin`, `btnUnpin` - Button labels
- `btnApply`, `btnReset`, `btnSettings`, `btnGuide`, `btnClose` - More buttons

### Settings/Options
- `optionIncludeChildren` - Include children checkbox
- `optionCopyHTML` - Copy HTML checkbox
- `optionCopyOnClick` - Copy on click checkbox
- `optionPinOnSpace` - Pin with space checkbox
- `optionShowGrid` - Show grid checkbox
- `settingsTitle` - "Settings" title
- `settingsSave` - "Save" button

### Notifications
- `notificationActivated` - Scanner activated message
- `notificationDeactivated` - Scanner deactivated message
- `notificationCopied` - Copied to clipboard message
- `notificationPinned` - Inspector pinned message
- `notificationUnpinned` - Inspector unpinned message
- `notificationApplied` - CSS applied message

## Contributing Translations

Want to contribute a translation? Here's how:

1. **Fork** the repository
2. **Create** a new language folder in `_locales/`
3. **Translate** all messages in `messages.json`
4. **Test** thoroughly with your browser language
5. **Submit** a pull request

### Translation Checklist

- [ ] All messages translated
- [ ] Placeholders kept intact
- [ ] HTML tags preserved
- [ ] Tested in browser
- [ ] No typos or grammar errors
- [ ] Natural-sounding translations (not literal)
- [ ] UI fits in available space (some languages are longer)

## Technical Details

### Browser Support

i18n is supported in all Chromium-based browsers:
- ✅ Chrome
- ✅ Edge
- ✅ Brave
- ✅ Opera
- ✅ Vivaldi

### Fallback Behavior

If a translation is missing:
1. Chrome looks for the message in the current language
2. If not found, it falls back to `default_locale` (English)
3. If still not found, it returns the message key itself

### Performance

- Translations are loaded once when the extension starts
- No performance impact on runtime
- Total size: ~15KB for all 4 languages

## Future Languages

Planning to add more languages? Consider:
- 🇯🇵 Japanese (ja)
- 🇨🇳 Chinese Simplified (zh_CN)
- 🇹🇼 Chinese Traditional (zh_TW)
- 🇰🇷 Korean (ko)
- 🇮🇹 Italian (it)
- 🇵🇹 Portuguese (pt_BR)
- 🇷🇺 Russian (ru)
- 🇳🇱 Dutch (nl)
- 🇵🇱 Polish (pl)
- 🇹🇷 Turkish (tr)

---

**Created by Simon Adjatan**

🌐 [adjatan.org](https://adjatan.org/) | 💻 [GitHub](https://github.com/Thecoolsim) | 🐦 [X](https://x.com/adjatan) | 📘 [Facebook](https://www.facebook.com/adjatan)
