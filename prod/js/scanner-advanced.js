// CSS Scanner Pro - Advanced Version with Full Features
// Based on CSS Scan functionality
(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__CSS_SCANNER_ADVANCED_LOADED__) {
    return;
  }
  window.__CSS_SCANNER_ADVANCED_LOADED__ = true;

  // State management
  const state = {
    active: false,
    frozen: false,
    gridEnabled: false,
    currentElement: null,
    hoveredElement: null,
    pinnedBlocks: [],
    currentTab: 'css',
    liveEditMode: false,
    settings: {
      copyOnClick: true,
      pinOnSpace: true,
      showGrid: false,
      ignoreInherited: true,
      ignorePrefixes: true,
      ignoreBoxSizing: false,
      convertFontSizeToPx: false,
      nestPseudos: false,
      copyOriginalSelectors: false,
      smartSelectors: true,
      includeChildCSS: false,
      copyHTMLCode: true,
      absoluteURLs: false
    }
  };

  // UI Elements
  let scannerUI = {
    mainBlock: null,
    toolbar: null,
    grid: null,
    notification: null,
    optionsPanel: null
  };

  // Load settings from storage
  function loadSettings() {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response && response.settings) {
        Object.assign(state.settings, response.settings);
      }
    });
  }

  // Save settings to storage
  function saveSettings() {
    chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings: state.settings
    });
  }

  // Create main scanner block with tabs
  function createMainBlock() {
    const block = document.createElement('div');
    block.id = 'css-scanner-main';
    block.className = 'css-scanner-main';

    block.innerHTML = `
      <div class="scanner-header">
        <div class="element-info-header">
          <span class="element-tag-display"></span>
          <span class="element-selector-display"></span>
          <span class="element-dimensions"></span>
        </div>
        <div class="header-actions">
          <button class="scanner-icon-btn" data-action="options" title="Options">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m-6-6h6m6 0h6"></path>
            </svg>
          </button>
          <button class="scanner-icon-btn" data-action="close" title="Close (Esc)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="scanner-breadcrumb"></div>

      <div class="scanner-tabs">
        <button class="tab-btn active" data-tab="css">CSS</button>
        <button class="tab-btn" data-tab="html">HTML</button>
        <button class="tab-btn" data-tab="source">Source</button>
        <button class="tab-btn" data-tab="editor">Editor</button>
      </div>

      <div class="scanner-content">
        <!-- CSS Tab -->
        <div class="tab-content active" data-tab-content="css">
          <div class="content-toolbar">
            <button class="tool-btn" data-action="copy-css" title="Copy CSS">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Code
            </button>
            <button class="tool-btn" data-action="codepen" title="Export to CodePen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              CodePen
            </button>
            <button class="tool-btn" data-action="pin" title="Pin (Space)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              </svg>
              Pin
            </button>
          </div>
          <pre class="code-display css-code"></pre>
        </div>

        <!-- HTML Tab -->
        <div class="tab-content" data-tab-content="html">
          <div class="content-toolbar">
            <button class="tool-btn" data-action="copy-html">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy HTML
            </button>
            <label class="checkbox-label">
              <input type="checkbox" id="includeChildHTML" checked>
              Include children
            </label>
          </div>
          <pre class="code-display html-code"></pre>
        </div>

        <!-- Source Tab -->
        <div class="tab-content" data-tab-content="source">
          <div class="source-files-list"></div>
        </div>

        <!-- Editor Tab -->
        <div class="tab-content" data-tab-content="editor">
          <div class="editor-toolbar">
            <button class="tool-btn" data-action="apply-changes">Apply Changes</button>
            <button class="tool-btn" data-action="reset-changes">Reset</button>
          </div>
          <div class="css-editor" contenteditable="true"></div>
        </div>
      </div>

      <div class="scanner-footer">
        <span class="hint-text">Click to copy • Space to pin • Esc to close</span>
      </div>
    `;

    // Add event listeners
    setupBlockEventListeners(block);
    makeDraggable(block);

    return block;
  }

  // Setup event listeners for the main block
  function setupBlockEventListeners(block) {
    // Header actions
    block.querySelector('[data-action="options"]').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleOptionsPanel();
    });

    block.querySelector('[data-action="close"]').addEventListener('click', (e) => {
      e.stopPropagation();
      deactivateScanner();
    });

    // Tab switching
    block.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchTab(btn.dataset.tab);
      });
    });

    // Toolbar actions
    block.querySelector('[data-action="copy-css"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      copyCSSToClipboard();
    });

    block.querySelector('[data-action="codepen"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      exportToCodePen();
    });

    block.querySelector('[data-action="pin"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      pinCurrentBlock();
    });

    block.querySelector('[data-action="copy-html"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      copyHTMLToClipboard();
    });

    block.querySelector('[data-action="apply-changes"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      applyLiveCSS();
    });

    block.querySelector('[data-action="reset-changes"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      resetLiveCSS();
    });
  }

  // Switch tabs
  function switchTab(tabName) {
    if (!scannerUI.mainBlock) return;

    state.currentTab = tabName;

    // Update tab buttons
    scannerUI.mainBlock.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    scannerUI.mainBlock.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.tabContent === tabName);
    });

    // Refresh content for the new tab
    if (state.currentElement) {
      updateTabContent(tabName, state.currentElement);
    }
  }

  // Update content for specific tab
  function updateTabContent(tabName, element) {
    switch(tabName) {
      case 'css':
        updateCSSTab(element);
        break;
      case 'html':
        updateHTMLTab(element);
        break;
      case 'source':
        updateSourceTab(element);
        break;
      case 'editor':
        updateEditorTab(element);
        break;
    }
  }

  // Update CSS tab
  function updateCSSTab(element) {
    const cssCode = scannerUI.mainBlock.querySelector('.css-code');
    if (!cssCode) return;

    const css = extractCSS(element);
    cssCode.textContent = css;
  }

  // Update HTML tab
  function updateHTMLTab(element) {
    const htmlCode = scannerUI.mainBlock.querySelector('.html-code');
    if (!htmlCode) return;

    const includeChildren = scannerUI.mainBlock.querySelector('#includeChildHTML').checked;
    const html = extractHTML(element, includeChildren);
    htmlCode.textContent = html;
  }

  // Update Source tab
  function updateSourceTab(element) {
    const sourceList = scannerUI.mainBlock.querySelector('.source-files-list');
    if (!sourceList) return;

    const sources = extractSourceFiles(element);

    if (sources.length === 0) {
      sourceList.innerHTML = '<div class="no-sources">No external stylesheets found</div>';
      return;
    }

    sourceList.innerHTML = sources.map(source => `
      <div class="source-item">
        <div class="source-url">${source.url}</div>
        <div class="source-rules">${source.rules} rules</div>
      </div>
    `).join('');
  }

  // Update Editor tab
  function updateEditorTab(element) {
    const editor = scannerUI.mainBlock.querySelector('.css-editor');
    if (!editor) return;

    const css = extractCSS(element);
    editor.textContent = css;
  }

  // Extract CSS from element
  function extractCSS(element) {
    const computed = window.getComputedStyle(element);
    const selector = getSelector(element);

    let css = `${selector} {\n`;

    // Get all computed styles
    const allProps = Array.from(computed);
    const filteredProps = allProps.filter(prop => {
      const value = computed.getPropertyValue(prop);

      // Filter based on settings
      if (!value || value === 'none' || value === 'normal' || value === 'auto') return false;

      if (state.settings.ignorePrefixes &&
          (prop.startsWith('-webkit-') || prop.startsWith('-moz-') || prop.startsWith('-ms-'))) {
        return false;
      }

      if (state.settings.ignoreBoxSizing && prop === 'box-sizing') {
        return false;
      }

      if (state.settings.ignoreInherited) {
        const parent = element.parentElement;
        if (parent) {
          const parentComputed = window.getComputedStyle(parent);
          if (parentComputed.getPropertyValue(prop) === value) {
            return false;
          }
        }
      }

      return true;
    });

    filteredProps.forEach(prop => {
      let value = computed.getPropertyValue(prop);

      // Convert font-size to px if needed
      if (state.settings.convertFontSizeToPx && prop === 'font-size') {
        const px = parseFloat(computed.fontSize);
        value = `${px}px`;
      }

      css += `  ${prop}: ${value};\n`;
    });

    css += '}';

    // Add child elements CSS if enabled
    if (state.settings.includeChildCSS) {
      const children = element.querySelectorAll('*');
      children.forEach(child => {
        const childSelector = getSelector(child);
        const childComputed = window.getComputedStyle(child);
        css += `\n\n${childSelector} {\n`;
        // Simplified child CSS (only important props)
        ['display', 'position', 'margin', 'padding', 'color', 'background-color'].forEach(prop => {
          const value = childComputed.getPropertyValue(prop);
          if (value && value !== 'none' && value !== 'normal') {
            css += `  ${prop}: ${value};\n`;
          }
        });
        css += '}';
      });
    }

    return css;
  }

  // Extract HTML from element
  function extractHTML(element, includeChildren = true) {
    if (includeChildren) {
      return formatHTML(element.outerHTML);
    } else {
      // Clone and remove children
      const clone = element.cloneNode(false);
      return formatHTML(clone.outerHTML);
    }
  }

  // Format HTML with proper indentation
  function formatHTML(html) {
    const tab = '  ';
    let result = '';
    let indent = '';

    html.split(/>\s*</).forEach((element) => {
      if (element.match(/^\/\w/)) {
        indent = indent.substring(tab.length);
      }

      result += indent + '<' + element + '>\n';

      if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith("input")) {
        indent += tab;
      }
    });

    return result.substring(1, result.length - 2);
  }

  // Extract source files
  function extractSourceFiles(element) {
    const sources = [];
    const seenURLs = new Set();

    for (const sheet of document.styleSheets) {
      try {
        const href = sheet.href || 'inline';
        if (seenURLs.has(href)) continue;
        seenURLs.add(href);

        let ruleCount = 0;
        for (const rule of sheet.cssRules) {
          if (rule.selectorText) {
            try {
              if (element.matches(rule.selectorText)) {
                ruleCount++;
              }
            } catch(e) {}
          }
        }

        if (ruleCount > 0) {
          sources.push({
            url: href,
            rules: ruleCount
          });
        }
      } catch(e) {
        // Cross-origin stylesheets
        if (sheet.href) {
          sources.push({
            url: sheet.href,
            rules: '?'
          });
        }
      }
    }

    return sources;
  }

  // Get selector for element
  function getSelector(element) {
    if (element.id && state.settings.smartSelectors) {
      return `#${element.id}`;
    }

    if (element.className && typeof element.className === 'string' && state.settings.smartSelectors) {
      const classes = element.className.trim().split(/\s+/);
      if (classes[0]) {
        return `${element.tagName.toLowerCase()}.${classes[0]}`;
      }
    }

    // Generate path selector
    const path = [];
    let current = element;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/);
        if (classes[0]) {
          selector += `.${classes[0]}`;
        }
      }
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  // Copy CSS to clipboard
  function copyCSSToClipboard() {
    if (!state.currentElement) return;

    const css = extractCSS(state.currentElement);
    navigator.clipboard.writeText(css).then(() => {
      showNotification('✓ CSS copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      showNotification('✗ Failed to copy CSS');
    });
  }

  // Copy HTML to clipboard
  function copyHTMLToClipboard() {
    if (!state.currentElement) return;

    const includeChildren = scannerUI.mainBlock.querySelector('#includeChildHTML').checked;
    const html = extractHTML(state.currentElement, includeChildren);

    navigator.clipboard.writeText(html).then(() => {
      showNotification('✓ HTML copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      showNotification('✗ Failed to copy HTML');
    });
  }

  // Export to CodePen
  function exportToCodePen() {
    if (!state.currentElement) return;

    const html = extractHTML(state.currentElement, true);
    const css = extractCSS(state.currentElement);

    const data = {
      title: 'Exported from CSS Scanner Pro',
      html: html,
      css: css,
      js: ''
    };

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
    document.body.removeChild(form);

    showNotification('✓ Opening in CodePen...');
  }

  // Apply live CSS changes
  function applyLiveCSS() {
    if (!state.currentElement) return;

    const editor = scannerUI.mainBlock.querySelector('.css-editor');
    const newCSS = editor.textContent;

    // Parse and apply CSS
    try {
      // Remove existing inline styles
      const styleAttr = state.currentElement.getAttribute('data-scanner-live-style');
      if (styleAttr) {
        state.currentElement.removeAttribute('style');
      }

      // Apply new styles
      const styleElement = document.createElement('style');
      styleElement.textContent = newCSS;
      styleElement.setAttribute('data-scanner-live', 'true');
      document.head.appendChild(styleElement);

      showNotification('✓ CSS applied!');
    } catch(e) {
      showNotification('✗ Invalid CSS');
    }
  }

  // Reset live CSS
  function resetLiveCSS() {
    // Remove all live styles
    document.querySelectorAll('[data-scanner-live]').forEach(el => el.remove());

    if (state.currentElement) {
      updateEditorTab(state.currentElement);
    }

    showNotification('✓ CSS reset');
  }

  // Create options panel
  function createOptionsPanel() {
    const panel = document.createElement('div');
    panel.className = 'scanner-options-panel';
    panel.innerHTML = `
      <div class="options-header">
        <h3>Options</h3>
        <button class="close-options">×</button>
      </div>
      <div class="options-content">
        <div class="option-section">
          <h4>On click:</h4>
          <label><input type="checkbox" id="opt-copy-click" ${state.settings.copyOnClick ? 'checked' : ''}> Copy code</label>
          <label><input type="checkbox" id="opt-pin-space" ${state.settings.pinOnSpace ? 'checked' : ''}> Pin on Space</label>
        </div>

        <div class="option-section">
          <h4>Child elements' CSS:</h4>
          <label><input type="checkbox" id="opt-child-css" ${state.settings.includeChildCSS ? 'checked' : ''}> Include child elements</label>
        </div>

        <div class="option-section">
          <h4>HTML code:</h4>
          <label><input type="checkbox" id="opt-html-code" ${state.settings.copyHTMLCode ? 'checked' : ''}> Include HTML code</label>
        </div>

        <div class="option-section">
          <h4>Display:</h4>
          <label><input type="checkbox" id="opt-grid" ${state.settings.showGrid ? 'checked' : ''}> Show grid</label>
        </div>

        <div class="option-section">
          <h4>Copying preferences for CSS selectors:</h4>
          <label><input type="checkbox" id="opt-smart-selectors" ${state.settings.smartSelectors ? 'checked' : ''}> Smartly generate selectors</label>
          <label><input type="checkbox" id="opt-original-selectors" ${state.settings.copyOriginalSelectors ? 'checked' : ''}> Copy original selectors</label>
        </div>

        <div class="option-section">
          <h4>Other copying preferences:</h4>
          <label><input type="checkbox" id="opt-ignore-inherited" ${state.settings.ignoreInherited ? 'checked' : ''}> Ignore inherited styles</label>
          <label><input type="checkbox" id="opt-ignore-prefixes" ${state.settings.ignorePrefixes ? 'checked' : ''}> Ignore browser vendor prefixes</label>
          <label><input type="checkbox" id="opt-ignore-boxsizing" ${state.settings.ignoreBoxSizing ? 'checked' : ''}> Ignore box-sizing</label>
          <label><input type="checkbox" id="opt-convert-fontsize" ${state.settings.convertFontSizeToPx ? 'checked' : ''}> Convert font-size to px</label>
          <label><input type="checkbox" id="opt-nest-pseudos" ${state.settings.nestPseudos ? 'checked' : ''}> Nest pseudo-classes (for SASS/LESS)</label>
          <label><input type="checkbox" id="opt-absolute-urls" ${state.settings.absoluteURLs ? 'checked' : ''}> Convert relative URLs to absolute</label>
        </div>
      </div>
    `;

    // Add event listeners for options
    panel.querySelector('.close-options').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    // Save settings on change
    panel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const optionMap = {
          'opt-copy-click': 'copyOnClick',
          'opt-pin-space': 'pinOnSpace',
          'opt-child-css': 'includeChildCSS',
          'opt-html-code': 'copyHTMLCode',
          'opt-grid': 'showGrid',
          'opt-smart-selectors': 'smartSelectors',
          'opt-original-selectors': 'copyOriginalSelectors',
          'opt-ignore-inherited': 'ignoreInherited',
          'opt-ignore-prefixes': 'ignorePrefixes',
          'opt-ignore-boxsizing': 'ignoreBoxSizing',
          'opt-convert-fontsize': 'convertFontSizeToPx',
          'opt-nest-pseudos': 'nestPseudos',
          'opt-absolute-urls': 'absoluteURLs'
        };

        const settingKey = optionMap[checkbox.id];
        if (settingKey) {
          state.settings[settingKey] = checkbox.checked;
          saveSettings();

          if (settingKey === 'showGrid') {
            toggleGrid();
          }
        }
      });
    });

    return panel;
  }

  // Toggle options panel
  function toggleOptionsPanel() {
    if (!scannerUI.optionsPanel) {
      scannerUI.optionsPanel = createOptionsPanel();
      document.documentElement.appendChild(scannerUI.optionsPanel);
    }

    const isVisible = scannerUI.optionsPanel.style.display === 'block';
    scannerUI.optionsPanel.style.display = isVisible ? 'none' : 'block';
  }

  // Continue in next message due to length...

  console.log('CSS Scanner Pro Advanced - Part 1 loaded');
})();
