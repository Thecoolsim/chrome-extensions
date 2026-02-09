# CSS Scanner Pro

![CSS Scanner Pro](https://raw.githubusercontent.com/Thecoolsim/chrome-extensions/main/css-scanner-pro/img/icon128.png)

**The fastest and easiest way to inspect, copy and analyze CSS styles on any webpage**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://github.com/Thecoolsim/chrome-extensions/tree/main/css-scanner-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/Thecoolsim/chrome-extensions/main/css-scanner-pro/LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.2-green.svg)](https://raw.githubusercontent.com/Thecoolsim/chrome-extensions/main/css-scanner-pro/manifest.json)

---

## 🚀 Features

### Core Functionality

- 🎯 **Instant CSS Inspection** — Hover over any element to see its complete CSS.
- 📋 **One-Click Copy** — Copy CSS, HTML, or both instantly.
- 🎨 **Syntax Highlighting** — Clear, color-coded output.
- 👶 **Include Children** — Extract nested component CSS.
- ✏️ **Live CSS Editor** — Edit and apply styles in real time.
- 🖼️ **CodePen Export** — Export components in a click.
- ⚡ **Optimized Output** — Clean, compressed CSS.

### Advanced Features

- 📐 **Grid Overlay**
- 📌 **Pin Inspector Mode**
- 🔍 **Parent Element Scanner**
- 💾 **Settings Persistence**
- 🌍 **Multi-language Support**

### Developer Tools

- 🔄 Real-time updates  
- 📊 Complete computed styles  
- 🎭 Cross-origin stylesheet support  
- ⌨️ Keyboard shortcuts  

---

## 📦 Installation

### Chrome Web Store  
(https://chromewebstore.google.com/detail/css-scanner-pro/liopagplapnlephgjfibgmkbghlocchk)

### Manual Installation

1. **Download the extension**

   ZIP file:  
   https://github.com/Thecoolsim/chrome-extensions/raw/refs/heads/main/css-scanner-pro/css-scanner-pro-production.zip

   Or clone:
   ```bash
   git clone https://github.com/Thecoolsim/chrome-extensions.git
   cd chrome-extensions/css-scanner-pro
   ```

2. **Install in Chrome**
   - Open `chrome://extensions/`
   - Enable *Developer mode*
   - Click **Load unpacked**
   - Select the `css-scanner-pro` folder

3. **Start using**
   - Click the icon  
   - Or press `Ctrl+Shift+S` / `Cmd+Shift+S`  
   - Hover any element to inspect

---

## 🎯 Usage

### Quick Workflow

1. Activate the scanner  
2. Hover any element  
3. Copy CSS or HTML  
4. Use the editor for live changes  
5. Export to CodePen  

### Tabs

| Tab | Description |
|-----|-------------|
| **CSS** | Computed CSS properties |
| **HTML** | Element structure |
| **Source** | Original stylesheet rules |
| **Editor** | Real-time CSS editing |

---

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Activate Scanner | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| Toggle Grid Overlay | `Ctrl+Shift+G` | `Cmd+Shift+G` |
| Scan Parent Element | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| Pin Inspector | `Space` | `Space` |
| Close | `Esc` | `Esc` |

Customize via:  
`chrome://extensions/shortcuts`

---

## 🌍 Languages

CSS Scanner Pro supports:

- 🇬🇧 English
- 🇫🇷 French
- 🇪🇸 Spanish
- 🇩🇪 German
- 🇧🇷 Portuguese
- 🇯🇵 Japanese

I18N documentation:  
https://github.com/Thecoolsim/chrome-extensions/tree/main/css-scanner-pro/I18N_README.md

---

## 🛠️ Settings

| Setting | Description |
|---------|-------------|
| Include child elements | Capture nested CSS |
| Copy HTML with CSS | Combined copy |
| Auto-copy on click | Speed up workflow |
| Pin with Space | Freeze inspector |
| Grid overlay | Show layout |

---

## 🧩 Compatibility

Works with:

- Chrome  
- Edge  
- Brave  
- Opera  
- Vivaldi  

**Minimum:** Chrome 88+

---

## 🚧 Known Limitations

- Cannot inspect `chrome://` or extension pages  
- CORS may hide remote CSS  
- Inline SVG not fully supported  

---

## 🤝 Contributing

### Reporting Issues  
https://github.com/Thecoolsim/chrome-extensions/issues

### Feature Suggestions  
Open a discussion or feature request.

### Code Contributions

```bash
fork → branch → commit → pull request
```

### Add Translations  
See I18N guide.

---

## 📝 License

MIT License  
https://github.com/Thecoolsim/chrome-extensions/blob/main/css-scanner-pro/CHROME_WEB_STORE_SUBMISSION.md

---

## 👨‍💻 Author

**Simon Adjatan**  
🌐 https://adjatan.org/  
🐙 GitHub: https://github.com/Thecoolsim  
🐦 X: https://x.com/adjatan  
📘 Facebook: https://facebook.com/adjatan  

---

## 🙏 Acknowledgments

- Built with vanilla JavaScript  
- Inspired by web dev tools  
- Thanks to contributors  

---

## 📊 Project Stats

- ~3,600 lines of code
- 25+ files
- 6 languages
- ~120 KB

---

## 🗺️ Roadmap

### v1.0.2
- CSS variable extraction
- JSFiddle export
- Light/Dark theme toggle
- SCSS export
- Specificity calculator
- Animation inspector
- Box model visualization
- Color palette extraction
- Portuguese & Japanese translations (6 languages total)

### v1.1.0 (Current)
- Responsive breakpoint indicator with media query badges
- Enhanced keyboard navigation (1-4 tab switch, arrow sibling nav, Ctrl+C quick copy, Tab section cycling)
- Performance optimizations (rAF throttle, stylesheet cache, lazy tab updates, computed style cache)

### v1.2 (Planned)
- Chrome Web Store update
- Custom breakpoint configuration
- CSS property search/filter
- Export history

---

## 💡 Tips

- Enable "Include Children" for full component extraction  
- Use the Live Editor before copying  
- Pin inspector for stable view  
- Use Parent Scan to explore DOM hierarchy  