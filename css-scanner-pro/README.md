# CSS Scanner Pro

<div align="center">

![CSS Scanner Pro](img/icon128.png)

**The fastest and easiest way to inspect, copy and analyze CSS styles on any webpage**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://github.com/Thecoolsim/css-scanner-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](manifest.json)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Keyboard Shortcuts](#keyboard-shortcuts) • [Languages](#languages) • [Contributing](#contributing)

</div>

---

## 🚀 Features

### Core Functionality
- **🎯 Instant CSS Inspection** - Hover over any element to see its complete CSS
- **📋 One-Click Copy** - Copy CSS, HTML, or both to clipboard instantly
- **🎨 Syntax Highlighting** - Color-coded CSS and HTML for easy reading
- **👶 Include Children** - Extract CSS for entire components with nested elements
- **✏️ Live CSS Editor** - Edit and apply CSS changes in real-time
- **🖼️ CodePen Export** - Export components directly to CodePen with one click
- **⚡ Optimized Output** - Clean CSS with shorthand properties

### Advanced Features
- **📐 Grid Overlay** - Visual grid to understand element layout
- **📌 Pin Inspector** - Lock inspector to analyze elements without hovering
- **🔍 Parent Element Scanner** - Navigate up the DOM tree
- **💾 Settings Persistence** - Your preferences are saved automatically
- **🌍 Multi-Language Support** - English, French, Spanish, German

### Developer Tools
- **🔄 Real-time Updates** - See changes as you hover
- **📊 Complete Computed Styles** - All CSS properties, not just inline styles
- **🎭 Cross-origin Support** - Works on most websites
- **⌨️ Keyboard Shortcuts** - Fast workflow with keyboard commands

---

## 📦 Installation

### From Chrome Web Store
Coming soon...

### Manual Installation (Developer Mode)

**Option 1: Download the ZIP archive**  
Download the extension from [here](https://github.com/Thecoolsim/chrome-extensions/blob/main/css-scanner-pro/css-scanner-pro-v1.0.0-production.zip) and unzip it to a folder, then follow step 2 below to load it in Chrome.
**Option 2: Download the Extension**
   ```bash
   git clone https://github.com/Thecoolsim/css-scanner-pro.git
   cd css-scanner-pro
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `css-scanner-pro` folder

3. **Start Using**
   - Click the extension icon or press `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
   - Hover over any element on a webpage to inspect its CSS

---

## 🎯 Usage

### Quick Start

1. **Activate the Scanner**
   - Click the CSS Scanner Pro icon in your toolbar
   - Or press `Ctrl+Shift+S` (Windows/Linux) / `Cmd+Shift+S` (Mac)

2. **Inspect Elements**
   - Hover over any element to see its CSS
   - The inspector shows live CSS, HTML, source code, and an editor

3. **Copy CSS**
   - Click the **Copy** button to copy CSS to clipboard
   - Enable "Include children" to get CSS for nested elements
   - Enable "Copy HTML along with CSS" to get both

4. **Live Editing**
   - Switch to the **Editor** tab
   - Modify CSS properties in real-time
   - Click **Apply** to see changes immediately
   - Click **Reset** to restore original styles

5. **Export to CodePen**
   - Click the **CodePen** button
   - Your component opens in CodePen with HTML and CSS ready

### Tabs Explained

| Tab | Description |
|-----|-------------|
| **CSS** | Shows computed CSS styles with syntax highlighting |
| **HTML** | Displays the element's HTML structure |
| **Source** | Shows original CSS rules from stylesheets |
| **Editor** | Live CSS editor with apply/reset functionality |

---

## ⌨️ Keyboard Shortcuts

### Default Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Activate Scanner | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| Toggle Grid Overlay | `Ctrl+Shift+G` | `Cmd+Shift+G` |
| Scan Parent Element | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| Pin/Unpin Inspector | `Space` | `Space` |
| Close Scanner | `Esc` | `Esc` |

### Customizing Shortcuts

1. Go to `chrome://extensions/shortcuts`
2. Find "CSS Scanner Pro"
3. Click the pencil icon to edit shortcuts
4. Set your preferred key combinations

---

## 🌍 Languages

CSS Scanner Pro supports **4 languages** with automatic detection:

- 🇬🇧 **English** (default)
- 🇫🇷 **French** (Français)
- 🇪🇸 **Spanish** (Español)
- 🇩🇪 **German** (Deutsch)

The extension automatically uses your browser's language setting. See [I18N_README.md](I18N_README.md) for translation details.

---

## 🛠️ Settings

Access settings by clicking the **⚙️** button in the inspector:

| Setting | Description |
|---------|-------------|
| **Include child elements CSS** | Extract CSS from nested elements |
| **Copy HTML along with CSS** | Include HTML structure when copying |
| **Copy CSS on click** | Auto-copy when clicking elements |
| **Pin/Unpin with Space** | Use spacebar to freeze inspector |
| **Show grid overlay** | Display visual grid on elements |

---

## 🧩 Browser Compatibility

CSS Scanner Pro works on all Chromium-based browsers:

- ✅ Google Chrome (recommended)
- ✅ Microsoft Edge
- ✅ Brave Browser
- ✅ Opera
- ✅ Vivaldi

**Minimum Version:** Chrome 88+ (Manifest V3 support)

---

## 🚧 Known Limitations

- Cannot inspect CSS on Chrome internal pages (`chrome://`, `chrome-extension://`)
- Some cross-origin stylesheets may show limited CSS due to CORS
- Inline SVG styles may not be fully captured
- Browser extension pages are not accessible

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Report Bugs
Open an issue on [GitHub Issues](https://github.com/Thecoolsim/css-scanner-pro/issues) with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser version and OS

### Suggest Features
We'd love to hear your ideas! Open a feature request with:
- Use case description
- Why this feature would be useful
- Proposed implementation (optional)

### Add Translations
See [I18N_README.md](I18N_README.md) for instructions on adding new languages.

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Simon Adjatan**

- 🌐 Website: [adjatan.org](https://adjatan.org/)
- 💻 GitHub: [@Thecoolsim](https://github.com/Thecoolsim)
- 🐦 Twitter: [@adjatan](https://x.com/adjatan)
- 📘 Facebook: [adjatan](https://www.facebook.com/adjatan)

---

## 🙏 Acknowledgments

- Built with vanilla JavaScript for maximum performance
- Inspired by browser DevTools and the web development community
- Thanks to all contributors and users!

---

## 📊 Project Stats

- **Lines of Code:** ~2,400
- **Files:** 20+
- **Languages Supported:** 4
- **File Size:** ~80KB (uncompressed)

---

## 🗺️ Roadmap

### Version 1.1 (Upcoming)
- [ ] Chrome Web Store publication
- [ ] CSS variables extraction
- [ ] Export to JSFiddle
- [ ] Dark/Light theme toggle

### Version 1.2 (Future)
- [ ] Sass/SCSS export
- [ ] CSS specificity calculator
- [ ] Animation inspector
- [ ] More language translations

---

## 💡 Tips & Tricks

**Pro Tip #1:** Enable "Include child elements CSS" to extract complete UI components with all nested styles!

**Pro Tip #2:** Use the Live Editor tab to experiment with CSS changes before copying them.

**Pro Tip #3:** Pin the inspector (Space key) to keep it visible while you interact with the page.

**Pro Tip #4:** Use the Parent Scanner (Ctrl+Shift+E) to quickly navigate up the DOM tree.

---

## 📞 Support

Need help? Here's how to get support:

- 📖 Read the [documentation](https://github.com/Thecoolsim/css-scanner-pro/wiki)
- 🐛 [Report a bug](https://github.com/Thecoolsim/css-scanner-pro/issues)
- 💬 [Ask a question](https://github.com/Thecoolsim/css-scanner-pro/discussions)
- ✉️ Contact: via [adjatan.org](https://adjatan.org/)

---

<div align="center">

**If you find CSS Scanner Pro useful, please ⭐ star this repository!**

Made with ❤️ by [Simon Adjatan](https://adjatan.org/)

</div>
