# Features To Add - Complete CSS Scan Functionality

Based on your description of the CSS Scan extension, here are ALL the features that need to be implemented:

## 1. Tabbed Interface ✨ NEW

Instead of just showing CSS, the extension should have TABS:

### Tab 1: CSS (Current + Enhanced)
- **Current**: Shows computed CSS ✅
- **To Add**:
  - "Copy Code" button
  - "Export to CodePen" button
  - "Pin" button
  - Option to include child elements' CSS

### Tab 2: HTML ✨ NEW
- Show the HTML code of the selected element
- "Copy HTML" button
- Checkbox: "Include children" (show full HTML tree or just the element)
- Formatted/pretty-printed HTML

### Tab 3: Source ✨ NEW
- List all CSS files (stylesheets) that apply to this element
- Show the URL of each stylesheet
- Show how many rules from each file apply to the element
- Example:
  ```
  https://example.com/style.css (15 rules)
  https://example.com/theme.css (3 rules)
  inline styles (2 rules)
  ```

### Tab 4: Editor (Live CSS Editor) ✨ NEW
- Show current CSS in an editable text area
- "Apply Changes" button - applies CSS live to the page
- "Reset" button - removes live changes
- **Live editing**: User can modify CSS and see changes in real-time

## 2. Options Panel ✨ NEW

A settings/options panel with these sections:

### On click:
- [ ] Copy code automatically when clicking element
- [ ] Pin window when pressing Space

### Child elements' CSS:
- [ ] Include child elements (get CSS for all nested elements)
- [ ] Don't include (only selected element)

### HTML code:
- [ ] Copy HTML along with CSS
- [ ] Don't copy HTML

### Display:
- [ ] Show grid overlay
- [ ] Guidelines
- [ ] Other visual helpers

### Copying preferences for CSS selectors:
- [ ] Smartly generate selectors (use #id or .class when available)
- [ ] Copy original selectors (from stylesheet)
- [ ] Don't copy CSS selectors when possible
- [ ] Truncated selector (short version)

### Other copying preferences:
- [ ] Ignore inherited styles
- [ ] Ignore browser vendor prefixes (-webkit-, -moz-, etc.)
- [ ] Ignore box-sizing
- [ ] Convert font-size measure units to px
- [ ] Nest pseudo-classes, pseudo-elements, and media queries (for SASS/LESS)
- [ ] Convert relative URLs to absolute

## 3. CodePen Export ✨ NEW

When user clicks "CodePen" button:
1. Collect current HTML
2. Collect current CSS
3. Open CodePen.io in new tab
4. Pre-fill the code editors with HTML + CSS
5. User can immediately edit and save

**Implementation:**
```javascript
function exportToCodePen() {
  const data = {
    title: 'CSS Scan Export',
    html: extractedHTML,
    css: extractedCSS,
    js: ''
  };

  // POST to CodePen
  const form = document.createElement('form');
  form.action = 'https://codepen.io/pen/define';
  form.method = 'POST';
  form.target = '_blank';
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'data';
  input.value = JSON.stringify(data);
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}
```

## 4. Live CSS Editor ✨ NEW

In the "Editor" tab:
- Show current CSS in an editable textarea/contenteditable div
- As user types, can optionally apply changes live
- "Apply Changes" button: Inject the edited CSS into the page using a `<style>` tag
- "Reset" button: Remove injected styles, restore original

**Implementation:**
```javascript
function applyLiveCSS(cssCode) {
  // Create or update live style tag
  let liveStyle = document.getElementById('css-scanner-live-edit');
  if (!liveStyle) {
    liveStyle = document.createElement('style');
    liveStyle.id = 'css-scanner-live-edit';
    document.head.appendChild(liveStyle);
  }
  liveStyle.textContent = cssCode;
}
```

## 5. Source File Tracking ✨ NEW

Show which CSS files affect the element:

```javascript
function getSourceFiles(element) {
  const sources = [];

  for (const sheet of document.styleSheets) {
    try {
      const rules = Array.from(sheet.cssRules);
      const matchingRules = rules.filter(rule => {
        try {
          return element.matches(rule.selectorText);
        } catch(e) {
          return false;
        }
      });

      if (matchingRules.length > 0) {
        sources.push({
          url: sheet.href || 'inline',
          ruleCount: matchingRules.length
        });
      }
    } catch(e) {
      // Cross-origin stylesheet
      if (sheet.href) {
        sources.push({
          url: sheet.href,
          ruleCount: '?' // Can't access due to CORS
        });
      }
    }
  }

  return sources;
}
```

## 6. Child Elements CSS ✨ NEW

When enabled in options, extract CSS for ALL child elements:

```javascript
function extractWithChildren(element) {
  let css = extractCSS(element); // Parent CSS

  const children = element.querySelectorAll('*');
  children.forEach(child => {
    const childSelector = getSelector(child);
    const childCSS = extractCSS(child);
    css += `\n\n${childSelector} {\n${childCSS}\n}`;
  });

  return css;
}
```

## 7. HTML Extraction ✨ NEW

Extract and format HTML:

```javascript
function extractHTML(element, includeChildren = true) {
  let html;

  if (includeChildren) {
    html = element.outerHTML;
  } else {
    // Clone without children
    const clone = element.cloneNode(false);
    html = clone.outerHTML;
  }

  // Pretty print
  return formatHTML(html);
}

function formatHTML(html) {
  // Add proper indentation
  let formatted = '';
  let indent = 0;
  const tab = '  ';

  html.split('<').forEach(part => {
    if (!part) return;

    if (part.startsWith('/')) {
      indent--;
    }

    formatted += tab.repeat(Math.max(0, indent)) + '<' + part + '\n';

    if (!part.startsWith('/') && !part.endsWith('/>') && !part.startsWith('!')) {
      indent++;
    }
  });

  return formatted;
}
```

## 8. Settings Persistence ✨ NEW

Save all settings to chrome.storage.sync:

```javascript
// Save settings
function saveSettings() {
  chrome.runtime.sendMessage({
    type: 'SAVE_SETTINGS',
    settings: state.settings
  });
}

// Load settings
function loadSettings() {
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
    if (response && response.settings) {
      Object.assign(state.settings, response.settings);
    }
  });
}
```

## Implementation Priority

### Phase 1: Core Tabs (HIGH)
1. ✅ Create tabbed interface
2. ✅ CSS tab (already exists, enhance)
3. ✅ HTML tab
4. ✅ Source tab
5. ✅ Editor tab

### Phase 2: Features (HIGH)
6. ✅ CodePen export
7. ✅ Live CSS editor
8. ✅ Copy buttons for each tab
9. ✅ Child elements CSS extraction

### Phase 3: Options (MEDIUM)
10. ✅ Options panel UI
11. ✅ All checkbox settings
12. ✅ Settings persistence

### Phase 4: Polish (LOW)
13. Better CSS formatting (SASS/LESS nesting)
14. URL conversion (relative to absolute)
15. Font-size unit conversion
16. Original selector extraction from stylesheets

## UI Layout (Updated)

```
┌─────────────────────────────────────────┐
│ <div>.container (800x600)         [⚙][×]│ Header
├─────────────────────────────────────────┤
│ html › body › div.container             │ Breadcrumb
├─────────────────────────────────────────┤
│ [CSS] [HTML] [Source] [Editor]          │ Tabs
├─────────────────────────────────────────┤
│ [Copy Code] [CodePen] [Pin]             │ Toolbar
├─────────────────────────────────────────┤
│                                         │
│ .container {                            │
│   display: flex;                        │ Content
│   width: 800px;                         │ (varies by tab)
│   ...                                   │
│ }                                       │
│                                         │
├─────────────────────────────────────────┤
│ Click to copy • Space to pin • Esc     │ Footer
└─────────────────────────────────────────┘
```

## File Structure Changes

```
js/
├── scanner.js (current - basic)
└── scanner-full.js (new - all features)
    ├── Tab system
    ├── HTML extraction
    ├── Source tracking
    ├── Live CSS editor
    ├── CodePen export
    ├── Options panel
    └── Settings management
```

---

**Next Steps:**

Would you like me to:
1. Create the complete `scanner-full.js` with all these features?
2. Update the existing `scanner.js` to add these features incrementally?
3. Create separate modules for each feature?

Let me know and I'll implement the complete CSS Scan functionality! 🚀
