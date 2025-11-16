/**
 * CSS Scanner Pro - Full Featured Version
 * Complete CSS Scanner with tabs, CodePen export, live editor, and more
 *
 * @author Simon Adjatan
 * @website https://adjatan.org/
 * @github https://github.com/Thecoolsim
 * @twitter https://x.com/adjatan
 * @facebook https://www.facebook.com/adjatan
 * @license MIT
 */

(function() {
  'use strict';

  // Prevent multiple instances
  if (window.__CSS_SCANNER_LOADED__) {
    return;
  }
  window.__CSS_SCANNER_LOADED__ = true;

  // ========================================
  // I18N HELPER
  // ========================================
  const i18n = (messageName, substitutions) => {
    if (typeof chrome !== 'undefined' && chrome.i18n) {
      return chrome.i18n.getMessage(messageName, substitutions) || messageName;
    }
    return messageName;
  };

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const state = {
    active: false,
    frozen: false,
    currentElement: null,
    currentTab: 'css',
    displayedCSS: [],
    displayedHTML: '',
    sourceFiles: [],
    liveCSS: '',
    originalCSS: '',
    settings: {
      // On click
      copyOnClick: false,
      pinOnSpace: true,

      // Child elements
      includeChildren: false,

      // HTML code
      copyHTMLWithCSS: false,

      // Display
      showGrid: false,
      showGuidelines: false,

      // CSS selectors
      selectorMode: 'smart', // 'smart', 'original', 'none', 'truncated'

      // Other preferences
      ignoreInherited: false,
      ignoreVendorPrefixes: true,
      ignoreBoxSizing: false,
      convertFontSizeToPx: false,
      nestPseudoClasses: false,
      convertRelativeURLs: true,
      includeChildrenHTML: true
    },
    inspectorBlock: null,
    overlay: null,
    breadcrumb: null,
    optionsPanel: null
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  /**
   * Generate a smart CSS selector for an element
   */
  function getElementSelector(element, mode = 'smart') {
    if (!element || element === document.body) return 'body';
    if (element === document.documentElement) return 'html';

    if (mode === 'smart') {
      // Use ID if available
      if (element.id) {
        return `#${element.id}`;
      }

      // Use unique class if available
      if (element.classList.length > 0) {
        const className = Array.from(element.classList)[0];
        return `${element.tagName.toLowerCase()}.${className}`;
      }

      // Use tag name with nth-child
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element) + 1;
        return `${element.tagName.toLowerCase()}:nth-child(${index})`;
      }
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Extract CSS for an element - Get ALL matching CSS rules like CSS Scan does
   */
  function extractCSS(element, includeChildren = false) {
    const computed = window.getComputedStyle(element);
    const matchedRules = [];

    // Collect all matching CSS rules
    try {
      for (const sheet of document.styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          processRules(rules, element, matchedRules);
        } catch(e) {
          // Cross-origin stylesheet, can't access
        }
      }
    } catch(e) {
      console.error('Error reading stylesheets:', e);
    }

    // Deduplicate and get final computed values
    const allProps = new Set();
    matchedRules.forEach(rule => {
      for (let i = 0; i < rule.style.length; i++) {
        allProps.add(rule.style[i]);
      }
    });

    // Add inline styles
    if (element.style.length > 0) {
      for (let i = 0; i < element.style.length; i++) {
        allProps.add(element.style[i]);
      }
    }

    // Filter based on settings
    const filteredProps = Array.from(allProps).filter(prop => {
      if (state.settings.ignoreVendorPrefixes && (
        prop.startsWith('-webkit-') ||
        prop.startsWith('-moz-') ||
        prop.startsWith('-ms-') ||
        prop.startsWith('-o-')
      )) {
        return false;
      }

      if (state.settings.ignoreBoxSizing && prop === 'box-sizing') {
        return false;
      }

      return true;
    });

    // Get computed values
    const cssProperties = [];
    filteredProps.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value) {
        cssProperties.push({ prop, value });
      }
    });

    return cssProperties;
  }

  /**
   * Process CSS rules recursively (handles media queries, supports, etc.)
   */
  function processRules(rules, element, matchedRules) {
    for (const rule of rules) {
      // Handle regular style rules
      if (rule.style && rule.selectorText) {
        try {
          const selectors = rule.selectorText.split(',').map(s => s.trim());
          for (const selector of selectors) {
            if (element.matches(selector)) {
              matchedRules.push(rule);
              break;
            }
          }
        } catch(e) {
          // Invalid selector, skip
        }
      }
      // Handle media queries
      else if (rule.cssRules) {
        processRules(Array.from(rule.cssRules), element, matchedRules);
      }
    }
  }

  /**
   * Check if a CSS value is likely a browser default
   */
  function isDefaultValue(prop, value) {
    // Normalize value
    const normalizedValue = value.trim();

    // Common default values
    const defaults = {
      'position': ['static'],
      'float': ['none'],
      'clear': ['none'],
      'margin': ['0px'],
      'margin-top': ['0px'],
      'margin-right': ['0px'],
      'margin-bottom': ['0px'],
      'margin-left': ['0px'],
      'padding': ['0px'],
      'padding-top': ['0px'],
      'padding-right': ['0px'],
      'padding-bottom': ['0px'],
      'padding-left': ['0px'],
      'border': ['none', '0px none', 'medium none'],
      'border-top': ['none', '0px none'],
      'border-right': ['none', '0px none'],
      'border-bottom': ['none', '0px none'],
      'border-left': ['none', '0px none'],
      'border-radius': ['0px'],
      'background': ['rgba(0, 0, 0, 0)', 'transparent', 'none'],
      'background-color': ['rgba(0, 0, 0, 0)', 'transparent'],
      'background-image': ['none'],
      'opacity': ['1'],
      'z-index': ['auto'],
      'transform': ['none'],
      'transition': ['all 0s ease 0s', 'none'],
      'animation': ['none'],
      'box-shadow': ['none'],
      'text-shadow': ['none'],
      'overflow': ['visible'],
      'overflow-x': ['visible'],
      'overflow-y': ['visible'],
      'visibility': ['visible'],
      'cursor': ['auto'],
      'pointer-events': ['auto']
    };

    if (defaults[prop]) {
      return defaults[prop].includes(normalizedValue);
    }

    // Check for 0 values (0px, 0em, 0%, etc. are all default for spacing)
    if (/^0(px|em|rem|%)?$/.test(normalizedValue)) {
      return true;
    }

    return false;
  }

  /**
   * Convert longhand CSS properties to shorthand
   */
  function optimizeCSSProperties(properties) {
    const propsMap = new Map();
    const optimized = [];

    // Build a map of all properties
    properties.forEach(({ prop, value }) => {
      propsMap.set(prop, value);
    });

    const processed = new Set();

    // Helper to check if all sides are equal
    function allEqual(...values) {
      return values.every(v => v === values[0]);
    }

    // Helper to get shorthand for 4-sided properties
    function getFourSideShorthand(values) {
      const [top, right, bottom, left] = values;
      if (allEqual(top, right, bottom, left)) return top;
      if (top === bottom && right === left) return `${top} ${right}`;
      if (right === left) return `${top} ${right} ${bottom}`;
      return `${top} ${right} ${bottom} ${left}`;
    }

    // Process properties in order
    properties.forEach(({ prop, value }) => {
      if (processed.has(prop)) return;

      // Skip default values
      if (isDefaultValue(prop, value)) return;

      // Margin shorthand
      if (prop === 'margin-top' && propsMap.has('margin-right') &&
          propsMap.has('margin-bottom') && propsMap.has('margin-left')) {
        const shorthand = getFourSideShorthand([
          propsMap.get('margin-top'),
          propsMap.get('margin-right'),
          propsMap.get('margin-bottom'),
          propsMap.get('margin-left')
        ]);
        if (!isDefaultValue('margin', shorthand)) {
          optimized.push({ prop: 'margin', value: shorthand });
        }
        processed.add('margin-top');
        processed.add('margin-right');
        processed.add('margin-bottom');
        processed.add('margin-left');
        return;
      }

      // Padding shorthand
      if (prop === 'padding-top' && propsMap.has('padding-right') &&
          propsMap.has('padding-bottom') && propsMap.has('padding-left')) {
        const shorthand = getFourSideShorthand([
          propsMap.get('padding-top'),
          propsMap.get('padding-right'),
          propsMap.get('padding-bottom'),
          propsMap.get('padding-left')
        ]);
        if (!isDefaultValue('padding', shorthand)) {
          optimized.push({ prop: 'padding', value: shorthand });
        }
        processed.add('padding-top');
        processed.add('padding-right');
        processed.add('padding-bottom');
        processed.add('padding-left');
        return;
      }

      // Border-radius shorthand
      if (prop === 'border-top-left-radius' && propsMap.has('border-top-right-radius') &&
          propsMap.has('border-bottom-right-radius') && propsMap.has('border-bottom-left-radius')) {
        const tl = propsMap.get('border-top-left-radius');
        const tr = propsMap.get('border-top-right-radius');
        const br = propsMap.get('border-bottom-right-radius');
        const bl = propsMap.get('border-bottom-left-radius');

        if (allEqual(tl, tr, br, bl)) {
          if (!isDefaultValue('border-radius', tl)) {
            optimized.push({ prop: 'border-radius', value: tl });
          }
        } else {
          optimized.push({ prop: 'border-radius', value: `${tl} ${tr} ${br} ${bl}` });
        }
        processed.add('border-top-left-radius');
        processed.add('border-top-right-radius');
        processed.add('border-bottom-right-radius');
        processed.add('border-bottom-left-radius');
        return;
      }

      // Border shorthand (combine width, style, color)
      if (prop === 'border-top-width' &&
          propsMap.has('border-top-style') &&
          propsMap.has('border-top-color')) {
        const width = propsMap.get('border-top-width');
        const style = propsMap.get('border-top-style');
        const color = propsMap.get('border-top-color');

        // Check if all borders are the same
        const allBordersSame =
          propsMap.get('border-right-width') === width &&
          propsMap.get('border-bottom-width') === width &&
          propsMap.get('border-left-width') === width &&
          propsMap.get('border-right-style') === style &&
          propsMap.get('border-bottom-style') === style &&
          propsMap.get('border-left-style') === style &&
          propsMap.get('border-right-color') === color &&
          propsMap.get('border-bottom-color') === color &&
          propsMap.get('border-left-color') === color;

        if (allBordersSame && style !== 'none') {
          optimized.push({ prop: 'border', value: `${width} ${style} ${color}` });
          processed.add('border-top-width');
          processed.add('border-right-width');
          processed.add('border-bottom-width');
          processed.add('border-left-width');
          processed.add('border-top-style');
          processed.add('border-right-style');
          processed.add('border-bottom-style');
          processed.add('border-left-style');
          processed.add('border-top-color');
          processed.add('border-right-color');
          processed.add('border-bottom-color');
          processed.add('border-left-color');
          processed.add('border-image-source');
          processed.add('border-image-slice');
          processed.add('border-image-width');
          processed.add('border-image-outset');
          processed.add('border-image-repeat');
          return;
        }
      }

      // Background shorthand - simplified
      if (prop === 'background-color' &&
          propsMap.get('background-image') === 'none' &&
          propsMap.get('background-repeat') === 'repeat' &&
          propsMap.get('background-attachment') === 'scroll' &&
          propsMap.get('background-position-x') === '0%' &&
          propsMap.get('background-position-y') === '0%') {
        optimized.push({ prop: 'background', value });
        processed.add('background-color');
        processed.add('background-image');
        processed.add('background-repeat');
        processed.add('background-attachment');
        processed.add('background-position');
        processed.add('background-position-x');
        processed.add('background-position-y');
        processed.add('background-size');
        processed.add('background-origin');
        processed.add('background-clip');
        return;
      }

      // Skip individual background/border/margin/padding properties if already processed
      if (processed.has(prop)) return;

      // Skip redundant background properties
      if (prop.startsWith('background-') &&
          (prop === 'background-position-x' ||
           prop === 'background-position-y' ||
           prop === 'background-repeat' ||
           prop === 'background-attachment' ||
           prop === 'background-origin' ||
           prop === 'background-clip' ||
           prop === 'background-size') &&
          propsMap.get('background-image') === 'none') {
        processed.add(prop);
        return;
      }

      // Skip border-image properties if no border image
      if (prop.startsWith('border-image-') &&
          propsMap.get('border-image-source') === 'none') {
        processed.add(prop);
        return;
      }

      // Add the property if not default
      processed.add(prop);
      optimized.push({ prop, value });
    });

    return optimized;
  }

  /**
   * Apply syntax highlighting to CSS code
   * Colors CSS syntax elements for easier reading
   * @param {string} cssCode - The CSS code to highlight
   * @returns {string} HTML string with syntax highlighting
   */
  function highlightCSS(cssCode) {
    // Escape HTML to prevent XSS
    const escapeHTML = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    let highlighted = escapeHTML(cssCode);

    // Use unique placeholders to prevent overlapping replacements
    const MARKER = '\u0000'; // Null character as marker
    let markerIndex = 0;
    const replacements = [];

    function addMarker(html) {
      const marker = `${MARKER}${markerIndex++}${MARKER}`;
      replacements.push({ marker, html });
      return marker;
    }

    // Process line by line to avoid conflicts
    const lines = highlighted.split('\n');
    const processedLines = lines.map(line => {
      // Check if this is a selector line (ends with {, no : before {)
      if (/^[^:]*\{/.test(line)) {
        return line.replace(/^([^{]+)(\{.*)$/, (match, selector, rest) => {
          const coloredSelector = addMarker(`<span style="color: #fbbf24; font-weight: 600;">${selector}</span>`);
          const coloredBrace = rest.replace(/\{/g, () => addMarker('<span style="color: #f87171; font-weight: bold;">{</span>'));
          return coloredSelector + coloredBrace;
        });
      }
      // Check if this is a closing brace line
      else if (/^\s*\}/.test(line)) {
        return line.replace(/\}/g, () => addMarker('<span style="color: #f87171; font-weight: bold;">}</span>'));
      }
      // Otherwise, it's a property line
      else if (/:/.test(line)) {
        return line.replace(/^(\s+)([a-zA-Z-]+)(\s*):\s*([^;]+)(;?)(.*)$/, (match, indent, prop, sp, value, semi, rest) => {
          // Color the value parts
          let coloredValue = value;

          // Replace rgb/rgba
          coloredValue = coloredValue.replace(/(rgba?\([^)]+\))/gi, (m) =>
            addMarker(`<span style="color: #a78bfa; font-weight: 600;">${m}</span>`)
          );

          // Replace hex colors
          coloredValue = coloredValue.replace(/(#[0-9a-fA-F]{3,8})\b/g, (m) =>
            addMarker(`<span style="color: #a78bfa; font-weight: 600;">${m}</span>`)
          );

          // Replace numbers with units
          coloredValue = coloredValue.replace(/\b(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|deg|s|ms|fr)\b/g, (m) =>
            addMarker(`<span style="color: #fb923c;">${m}</span>`)
          );

          // Replace !important
          coloredValue = coloredValue.replace(/!important\b/g, (m) =>
            addMarker(`<span style="color: #ef4444; font-weight: 600;">${m}</span>`)
          );

          const coloredProp = addMarker(`<span style="color: #60a5fa;">${prop}</span>`);
          const finalValue = addMarker(`<span style="color: #34d399;">${coloredValue}</span>`);

          return `${indent}${coloredProp}${sp}: ${finalValue}${semi}${rest}`;
        });
      }
      return line;
    });

    highlighted = processedLines.join('\n');

    // Replace all markers with actual HTML
    replacements.forEach(({ marker, html }) => {
      highlighted = highlighted.replace(marker, html);
    });

    return highlighted;
  }

  /**
   * Apply syntax highlighting to HTML code
   * Colors HTML syntax elements for easier reading
   * @param {string} htmlCode - The HTML code to highlight
   * @returns {string} HTML string with syntax highlighting
   */
  function highlightHTML(htmlCode) {
    // Escape HTML to prevent XSS
    const escapeHTML = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    let highlighted = escapeHTML(htmlCode);

    // Highlight tag names (opening and closing tags)
    highlighted = highlighted.replace(
      /&lt;(\/)?([\w-]+)/g,
      '&lt;<span style="color: #f87171;">$1</span><span style="color: #fbbf24; font-weight: 600;">$2</span>'
    );

    // Highlight attribute names
    highlighted = highlighted.replace(
      /\s+([\w-]+)=/g,
      ' <span style="color: #60a5fa;">$1</span>='
    );

    // Highlight attribute values
    highlighted = highlighted.replace(
      /=&quot;([^&]*)&quot;/g,
      '=<span style="color: #34d399;">&quot;$1&quot;</span>'
    );

    // Highlight closing bracket
    highlighted = highlighted.replace(
      /\/?&gt;/g,
      '<span style="color: #f87171;">$&</span>'
    );

    // Highlight comments
    highlighted = highlighted.replace(
      /&lt;!--([^-]*)--&gt;/g,
      '<span style="color: #6b7280; font-style: italic;">&lt;!--$1--&gt;</span>'
    );

    return highlighted;
  }

  /**
   * Extract CSS with child elements
   */
  function extractWithChildren(element) {
    let css = '';
    const selector = getElementSelector(element, state.settings.selectorMode);
    const props = extractCSS(element, false);
    const optimizedProps = optimizeCSSProperties(props);

    css += `${selector} {\n`;
    optimizedProps.forEach(({ prop, value }) => {
      css += `  ${prop}: ${value};\n`;
    });
    css += '}\n';

    if (state.settings.includeChildren) {
      const children = element.querySelectorAll('*');
      const seenRules = new Map(); // Track unique selector + CSS combinations

      children.forEach(child => {
        const childSelector = getElementSelector(child, state.settings.selectorMode);
        const childProps = extractCSS(child, false);
        const optimizedChildProps = optimizeCSSProperties(childProps);

        // Only add if there are properties to show
        if (optimizedChildProps.length > 0) {
          // Create a unique key from selector + CSS properties
          const cssString = optimizedChildProps
            .map(({ prop, value }) => `${prop}:${value}`)
            .sort()
            .join(';');
          const ruleKey = `${childSelector}::${cssString}`;

          // Only add if we haven't seen this exact combination
          if (!seenRules.has(ruleKey)) {
            seenRules.set(ruleKey, true);

            css += `\n${childSelector} {\n`;
            optimizedChildProps.forEach(({ prop, value }) => {
              css += `  ${prop}: ${value};\n`;
            });
            css += '}\n';
          }
        }
      });
    }

    return css;
  }

  /**
   * Extract HTML for an element
   */
  function extractHTML(element, includeChildren = true) {
    let html;

    if (includeChildren) {
      html = element.outerHTML;
    } else {
      const clone = element.cloneNode(false);
      html = clone.outerHTML.replace('></','>\u2026</');
    }

    return formatHTML(html);
  }

  /**
   * Format HTML with proper indentation
   */
  function formatHTML(html) {
    let formatted = '';
    let indent = 0;
    const tab = '  ';

    html.split(/(<[^>]+>)/g).forEach(part => {
      if (!part.trim()) return;

      if (part.startsWith('</')) {
        indent = Math.max(0, indent - 1);
        formatted += tab.repeat(indent) + part + '\n';
      } else if (part.startsWith('<')) {
        formatted += tab.repeat(indent) + part + '\n';
        if (!part.endsWith('/>') && !part.startsWith('</') && !part.startsWith('<!')) {
          indent++;
        }
      } else {
        formatted += tab.repeat(indent) + part.trim() + '\n';
      }
    });

    return formatted.trim();
  }

  /**
   * Get source files that affect an element
   */
  function getSourceFiles(element) {
    const sources = [];
    const seenURLs = new Set();

    try {
      for (const sheet of document.styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          const matchingRules = rules.filter(rule => {
            try {
              if (rule.selectorText) {
                return element.matches(rule.selectorText);
              }
            } catch(e) {
              return false;
            }
            return false;
          });

          if (matchingRules.length > 0) {
            const url = sheet.href || 'inline styles';
            if (!seenURLs.has(url)) {
              seenURLs.add(url);
              sources.push({
                url: url,
                ruleCount: matchingRules.length
              });
            }
          }
        } catch(e) {
          // Cross-origin stylesheet
          if (sheet.href && !seenURLs.has(sheet.href)) {
            seenURLs.add(sheet.href);
            sources.push({
              url: sheet.href,
              ruleCount: '?' // Can't access due to CORS
            });
          }
        }
      }
    } catch(e) {
      console.error('Error getting source files:', e);
    }

    // Check for inline styles
    if (element.style.length > 0) {
      sources.push({
        url: 'element.style (inline)',
        ruleCount: element.style.length
      });
    }

    return sources;
  }

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text, successMessage = null) {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(successMessage || i18n('notificationCopied'));
    } catch(err) {
      console.error('Failed to copy:', err);
      showNotification(i18n('Failed to copy'), 'error');
    }
  }

  /**
   * Show notification
   */
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: ${type === 'error' ? '#ef4444' : '#10b981'} !important;
      color: white !important;
      padding: 12px 24px !important;
      border-radius: 6px !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important;
      animation: cssScannerSlideIn 0.3s ease !important;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'cssScannerSlideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // ========================================
  // CODEPEN EXPORT
  // ========================================

  function exportToCodePen() {
    // Get HTML based on settings
    const html = extractHTML(state.currentElement, state.settings.includeChildren);

    // Get CSS based on settings
    let fullCSS = '';
    if (state.settings.includeChildren) {
      // Use the full CSS with all children (same as displayed in CSS tab)
      fullCSS = extractWithChildren(state.currentElement);
    } else {
      // Use just the current element's optimized CSS
      const css = state.displayedCSS.map(({ prop, value }) =>
        `  ${prop}: ${value};`
      ).join('\n');
      const selector = getElementSelector(state.currentElement, state.settings.selectorMode);
      fullCSS = `${selector} {\n${css}\n}`;
    }

    const data = {
      title: 'CSS Scanner Pro - Export by Simon Adjatan',
      html: html,
      css: fullCSS,
      js: '',
      editors: '110' // Show HTML and CSS panels, hide JS
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

    showNotification('Opening in CodePen with ' + (state.settings.includeChildren ? 'full component CSS' : 'element CSS') + '...');
  }

  // ========================================
  // LIVE CSS EDITOR
  // ========================================

  function applyLiveCSS(cssCode) {
    let liveStyle = document.getElementById('css-scanner-live-edit');
    if (!liveStyle) {
      liveStyle = document.createElement('style');
      liveStyle.id = 'css-scanner-live-edit';
      document.head.appendChild(liveStyle);
    }
    liveStyle.textContent = cssCode;
    showNotification('Live CSS applied!');
  }

  function resetLiveCSS() {
    const liveStyle = document.getElementById('css-scanner-live-edit');
    if (liveStyle) {
      liveStyle.remove();
      showNotification('Live CSS reset!');
    }
  }

  // ========================================
  // UI CREATION
  // ========================================

  function createInspectorBlock() {
    const block = document.createElement('div');
    block.id = 'css-scanner-block';
    block.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-title">
          <span class="element-tag"></span>
          <span class="element-size"></span>
        </div>
        <div class="inspector-actions">
          <button class="btn-guide" title="Show Guide">?</button>
          <button class="btn-settings" title="Settings">⚙</button>
          <button class="btn-close" title="Close (Esc)">×</button>
        </div>
      </div>

      <div class="inspector-breadcrumb"></div>

      <div class="inspector-tabs">
        <button class="tab-btn active" data-tab="css">CSS</button>
        <button class="tab-btn" data-tab="html">HTML</button>
        <button class="tab-btn" data-tab="source">Source</button>
        <button class="tab-btn" data-tab="editor">Editor</button>
      </div>

      <div class="inspector-toolbar">
        <button class="btn-copy-code">Copy Code</button>
        <button class="btn-codepen">CodePen</button>
        <button class="btn-pin">Pin</button>
      </div>

      <div class="inspector-content">
        <div class="tab-content active" data-tab="css">
          <div class="css-options">
            <label>
              <input type="checkbox" id="include-children-css">
              Include child elements CSS
            </label>
          </div>
          <pre class="css-code"></pre>
        </div>

        <div class="tab-content" data-tab="html">
          <div class="html-options">
            <label>
              <input type="checkbox" id="include-children-html" checked>
              Include children
            </label>
          </div>
          <pre class="html-code"></pre>
        </div>

        <div class="tab-content" data-tab="source">
          <div class="source-list"></div>
        </div>

        <div class="tab-content" data-tab="editor">
          <div class="editor-controls">
            <button class="btn-apply-css">Apply Changes</button>
            <button class="btn-reset-css">Reset</button>
          </div>
          <div class="editor-wrapper">
            <pre class="editor-highlight" aria-hidden="true"></pre>
            <textarea class="css-editor" placeholder="Edit CSS here..." spellcheck="false"></textarea>
          </div>
        </div>
      </div>

      <div class="inspector-footer">
        <span>Space to ${state.frozen ? 'unfreeze' : 'freeze'} • Backspace to ${state.frozen ? 'freeze' : 'unfreeze'} • Esc to close</span>
      </div>
    `;

    // Add styles
    addStyles();

    // Add event listeners
    const tabButtons = block.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchTab(btn.dataset.tab);
      });
    });

    const closeBtn = block.querySelector('.btn-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deactivateScanner();
    });

    const guideBtn = block.querySelector('.btn-guide');
    guideBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showGuideOverlay();
    });

    const settingsBtn = block.querySelector('.btn-settings');
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleOptionsPanel();
    });

    const copyBtn = block.querySelector('.btn-copy-code');
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyCurrentTab();
    });

    const codepenBtn = block.querySelector('.btn-codepen');
    codepenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportToCodePen();
    });

    const pinBtn = block.querySelector('.btn-pin');
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePin();
    });

    const applyBtn = block.querySelector('.btn-apply-css');
    applyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const editor = block.querySelector('.css-editor');
      applyLiveCSS(editor.value);
    });

    const resetBtn = block.querySelector('.btn-reset-css');
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetLiveCSS();
      const editor = block.querySelector('.css-editor');
      const highlight = block.querySelector('.editor-highlight');
      editor.value = state.originalCSS;
      // Update syntax highlighting
      if (highlight) {
        highlight.innerHTML = highlightCSS(state.originalCSS);
      }
    });

    // Add syntax highlighting update on editor input
    const cssEditor = block.querySelector('.css-editor');
    const editorHighlight = block.querySelector('.editor-highlight');
    cssEditor.addEventListener('input', (e) => {
      if (editorHighlight) {
        editorHighlight.innerHTML = highlightCSS(e.target.value);
      }
    });

    // Sync scroll between editor and highlight
    cssEditor.addEventListener('scroll', (e) => {
      if (editorHighlight) {
        editorHighlight.scrollTop = e.target.scrollTop;
        editorHighlight.scrollLeft = e.target.scrollLeft;
      }
    });

    const includeChildrenHTMLCheckbox = block.querySelector('#include-children-html');
    includeChildrenHTMLCheckbox.addEventListener('change', (e) => {
      e.stopPropagation();
      state.settings.includeChildrenHTML = e.target.checked;
      if (state.currentElement) {
        updateHTMLTab();
      }
    });

    const includeChildrenCSSCheckbox = block.querySelector('#include-children-css');
    includeChildrenCSSCheckbox.addEventListener('change', (e) => {
      e.stopPropagation();
      state.settings.includeChildren = e.target.checked;
      if (state.currentElement) {
        updateCSSTab();
      }
    });

    // Make draggable from header only
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;

    const header = block.querySelector('.inspector-header');
    header.style.cursor = 'move';

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.inspector-actions')) return;
      isDragging = true;
      initialX = e.clientX - currentX;
      initialY = e.clientY - currentY;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        block.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    document.body.appendChild(block);
    return block;
  }

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'css-scanner-overlay';
    overlay.style.cssText = `
      position: absolute !important;
      pointer-events: none !important;
      border: 2px solid #3b82f6 !important;
      background: rgba(59, 130, 246, 0.1) !important;
      z-index: 2147483646 !important;
      transition: all 0.1s ease !important;
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function showGuideOverlay() {
    // Check if guide already exists
    let guideOverlay = document.getElementById('css-scanner-guide-overlay');
    if (guideOverlay) {
      guideOverlay.style.display = 'block';

      // Reattach event listeners to ensure they work
      const closeBtn = guideOverlay.querySelector('.guide-close');
      const backdrop = guideOverlay.querySelector('.guide-backdrop');
      const panel = guideOverlay.querySelector('.guide-panel');

      if (closeBtn) {
        console.log('Reattaching close button, element:', closeBtn);

        const handleClose = (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('Close button activated (reattached)');
          guideOverlay.style.display = 'none';
        };

        closeBtn.onclick = handleClose;
        closeBtn.onmousedown = handleClose;
        closeBtn.addEventListener('click', handleClose, true);
        closeBtn.style.cursor = 'pointer';
        console.log('Close button handlers set (onclick, onmousedown, addEventListener)');
      } else {
        console.error('Close button not found!');
      }

      if (backdrop) {
        backdrop.onclick = (e) => {
          console.log('Backdrop clicked (reattached)');
          guideOverlay.style.display = 'none';
        };
      }

      if (panel) {
        panel.onclick = (e) => {
          e.stopPropagation();
          console.log('Panel clicked - not closing (reattached)');
        };
      }

      return;
    }

    // Create guide overlay
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    guideOverlay = document.createElement('div');
    guideOverlay.id = 'css-scanner-guide-overlay';

    const shortcut = isMac ? 'Cmd+Shift+S' : 'Ctrl+Shift+S';

    guideOverlay.innerHTML = `
      <div class="guide-backdrop"></div>
      <div class="guide-panel">
        <div class="guide-header">
          <h2>${i18n('guideTitle')}</h2>
          <button class="guide-close">&times;</button>
        </div>
        <div class="guide-content">
          <div class="guide-section">
            <h3>${i18n('guideQuickStart')}</h3>
            <div class="guide-shortcuts">
              <div class="guide-shortcut">
                <span>${i18n('shortcutActivateScanner')}</span>
                <kbd>Ctrl+Shift+S</kbd>
              </div>
              <div class="guide-shortcut">
                <span>${i18n('shortcutToggleGrid')}</span>
                <kbd>Ctrl+Shift+G</kbd>
              </div>
              <div class="guide-shortcut">
                <span>${i18n('shortcutScanParent')}</span>
                <kbd>Ctrl+Shift+E</kbd>
              </div>
            </div>
          </div>

          <div class="guide-section">
            <h3>${i18n('guideHowToUse')}</h3>
            <ol class="guide-steps">
              <li>${i18n('guideStep1', shortcut)}</li>
              <li>${i18n('guideStep2')}</li>
              <li>${i18n('guideStep3', ['<strong>' + i18n('tabCSS') + '</strong>', '<strong>' + i18n('tabHTML') + '</strong>', '<strong>' + i18n('tabSource') + '</strong>', '<strong>' + i18n('tabEditor') + '</strong>'])}</li>
              <li>${i18n('guideStep4', '<strong>' + i18n('btnCopy') + '</strong>')}</li>
              <li>${i18n('guideStep5', ['<kbd>Space</kbd>', '<kbd>Esc</kbd>'])}</li>
            </ol>
          </div>

          <div class="guide-section">
            <h3>${i18n('guideFeatures')}</h3>
            <ul class="guide-features">
              <li>${i18n('featureSyntaxHighlighting')}</li>
              <li>${i18n('featureIncludeChildren')}</li>
              <li>${i18n('featureLiveEditor')}</li>
              <li>${i18n('featureCodePenExport')}</li>
              <li>${i18n('featureOptimizedCSS')}</li>
            </ul>
          </div>

          <div class="guide-tip">
            <strong>${i18n('guideProTip')}</strong> ${i18n('proTipMessage')}
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #css-scanner-guide-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
      }

      #css-scanner-guide-overlay .guide-backdrop {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.7) !important;
        cursor: pointer !important;
        z-index: 1 !important;
      }

      #css-scanner-guide-overlay .guide-panel {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 90% !important;
        max-width: 600px !important;
        max-height: 80vh !important;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
        border-radius: 12px !important;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5) !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        z-index: 2 !important;
      }

      #css-scanner-guide-overlay .guide-header {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
        padding: 20px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        position: relative !important;
        z-index: 3 !important;
      }

      #css-scanner-guide-overlay .guide-header h2 {
        margin: 0 !important;
        color: white !important;
        font-size: 20px !important;
        font-weight: 700 !important;
      }

      #css-scanner-guide-overlay .guide-close {
        background: rgba(255, 255, 255, 0.1) !important;
        border: none !important;
        color: white !important;
        width: 32px !important;
        height: 32px !important;
        border-radius: 6px !important;
        font-size: 24px !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
        pointer-events: auto !important;
        position: relative !important;
        z-index: 10 !important;
      }

      #css-scanner-guide-overlay .guide-close:hover {
        background: rgba(255, 255, 255, 0.2) !important;
        transform: scale(1.1) !important;
      }

      #css-scanner-guide-overlay .guide-content {
        padding: 24px !important;
        overflow-y: auto !important;
        color: #f1f5f9 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }

      #css-scanner-guide-overlay .guide-section {
        margin-bottom: 24px !important;
      }

      #css-scanner-guide-overlay .guide-section h3 {
        color: #60a5fa !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        margin: 0 0 12px 0 !important;
        border-left: 4px solid #3b82f6 !important;
        padding-left: 12px !important;
      }

      #css-scanner-guide-overlay .guide-shortcuts {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }

      #css-scanner-guide-overlay .guide-shortcut {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 10px 12px !important;
        background: #1e293b !important;
        border: 1px solid #334155 !important;
        border-radius: 6px !important;
        font-size: 13px !important;
        color: #cbd5e1 !important;
      }

      #css-scanner-guide-overlay kbd {
        background: #0f172a !important;
        padding: 4px 10px !important;
        border-radius: 4px !important;
        font-family: 'Courier New', monospace !important;
        font-size: 11px !important;
        color: #60a5fa !important;
        border: 1px solid #1e293b !important;
        font-weight: 600 !important;
      }

      #css-scanner-guide-overlay .guide-steps,
      #css-scanner-guide-overlay .guide-features {
        margin: 0 !important;
        padding-left: 24px !important;
      }

      #css-scanner-guide-overlay .guide-steps li,
      #css-scanner-guide-overlay .guide-features li {
        color: #cbd5e1 !important;
        font-size: 13px !important;
        line-height: 1.6 !important;
        margin-bottom: 8px !important;
      }

      #css-scanner-guide-overlay .guide-tip {
        background: #0f172a !important;
        border-left: 3px solid #fbbf24 !important;
        padding: 12px !important;
        border-radius: 4px !important;
        font-size: 13px !important;
        color: #e2e8f0 !important;
        line-height: 1.6 !important;
      }

      #css-scanner-guide-overlay .guide-tip strong {
        color: #fbbf24 !important;
      }
    `;

    guideOverlay.appendChild(style);
    document.body.appendChild(guideOverlay);

    // Add event listeners
    const closeBtn = guideOverlay.querySelector('.guide-close');
    const backdrop = guideOverlay.querySelector('.guide-backdrop');
    const panel = guideOverlay.querySelector('.guide-panel');

    const closeGuide = () => {
      console.log('Close guide called');
      guideOverlay.style.display = 'none';
    };

    // Close button - use multiple event handlers
    if (closeBtn) {
      console.log('Initial close button setup, element:', closeBtn);

      const handleClose = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('Close button activated (initial)');
        closeGuide();
      };

      closeBtn.onclick = handleClose;
      closeBtn.onmousedown = handleClose;
      closeBtn.addEventListener('click', handleClose, true);
      closeBtn.style.cursor = 'pointer';
      console.log('Initial close button handlers set (onclick, onmousedown, addEventListener)');
    } else {
      console.error('Close button not found during initial setup!');
    }

    // Backdrop click
    if (backdrop) {
      backdrop.onclick = (e) => {
        console.log('Backdrop clicked');
        closeGuide();
      };
    }

    // Prevent clicks inside panel from closing via backdrop
    if (panel) {
      panel.onclick = (e) => {
        e.stopPropagation();
        console.log('Panel clicked - not closing');
      };
    }

    // Update shortcuts for Mac
    if (isMac) {
      guideOverlay.querySelectorAll('kbd').forEach(kbd => {
        if (kbd.textContent.includes('Ctrl')) {
          kbd.textContent = kbd.textContent.replace('Ctrl', 'Cmd');
        }
      });
    }
  }

  function createOptionsPanel() {
    const panel = document.createElement('div');
    panel.id = 'css-scanner-options';
    panel.innerHTML = `
      <div class="options-header">
        <h3>Settings</h3>
        <button class="btn-close-options">×</button>
      </div>

      <div class="options-content">
        <div class="options-section">
          <h4>On click:</h4>
          <label>
            <input type="checkbox" id="opt-copy-on-click">
            Copy code automatically when clicking element
          </label>
          <label>
            <input type="checkbox" id="opt-pin-on-space" checked>
            Pin window when pressing Space
          </label>
        </div>

        <div class="options-section">
          <h4>Child elements' CSS:</h4>
          <label>
            <input type="radio" name="children-css" value="include">
            Include child elements
          </label>
          <label>
            <input type="radio" name="children-css" value="exclude" checked>
            Don't include
          </label>
        </div>

        <div class="options-section">
          <h4>HTML code:</h4>
          <label>
            <input type="checkbox" id="opt-copy-html">
            Copy HTML along with CSS
          </label>
        </div>

        <div class="options-section">
          <h4>Display:</h4>
          <label>
            <input type="checkbox" id="opt-show-grid">
            Show grid overlay
          </label>
          <label>
            <input type="checkbox" id="opt-show-guidelines">
            Guidelines
          </label>
        </div>

        <div class="options-section">
          <h4>CSS selectors:</h4>
          <label>
            <input type="radio" name="selector-mode" value="smart" checked>
            Smartly generate selectors (use #id or .class)
          </label>
          <label>
            <input type="radio" name="selector-mode" value="original">
            Copy original selectors (from stylesheet)
          </label>
          <label>
            <input type="radio" name="selector-mode" value="none">
            Don't copy CSS selectors
          </label>
          <label>
            <input type="radio" name="selector-mode" value="truncated">
            Truncated selector
          </label>
        </div>

        <div class="options-section">
          <h4>Other preferences:</h4>
          <label>
            <input type="checkbox" id="opt-ignore-inherited">
            Ignore inherited styles
          </label>
          <label>
            <input type="checkbox" id="opt-ignore-vendor" checked>
            Ignore browser vendor prefixes
          </label>
          <label>
            <input type="checkbox" id="opt-ignore-box-sizing">
            Ignore box-sizing
          </label>
          <label>
            <input type="checkbox" id="opt-convert-font-size">
            Convert font-size to px
          </label>
          <label>
            <input type="checkbox" id="opt-nest-pseudo">
            Nest pseudo-classes and media queries
          </label>
          <label>
            <input type="checkbox" id="opt-convert-urls" checked>
            Convert relative URLs to absolute
          </label>
        </div>
      </div>

      <div class="options-footer">
        <button class="btn-save-options">Save Settings</button>
      </div>
    `;

    panel.style.cssText = `
      display: none;
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: #1f2937 !important;
      color: #f3f4f6 !important;
      padding: 0 !important;
      border-radius: 8px !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
      z-index: 2147483647 !important;
      width: 500px !important;
      max-height: 80vh !important;
      overflow-y: auto !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `;

    // Event listeners
    const closeBtn = panel.querySelector('.btn-close-options');
    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });

    const saveBtn = panel.querySelector('.btn-save-options');
    saveBtn.addEventListener('click', () => {
      saveOptions();
      panel.style.display = 'none';
    });

    // Load current settings
    loadOptionsIntoPanel(panel);

    document.body.appendChild(panel);
    return panel;
  }

  function loadOptionsIntoPanel(panel) {
    panel.querySelector('#opt-copy-on-click').checked = state.settings.copyOnClick;
    panel.querySelector('#opt-pin-on-space').checked = state.settings.pinOnSpace;
    panel.querySelector('#opt-copy-html').checked = state.settings.copyHTMLWithCSS;
    panel.querySelector('#opt-show-grid').checked = state.settings.showGrid;
    panel.querySelector('#opt-show-guidelines').checked = state.settings.showGuidelines;
    panel.querySelector('#opt-ignore-inherited').checked = state.settings.ignoreInherited;
    panel.querySelector('#opt-ignore-vendor').checked = state.settings.ignoreVendorPrefixes;
    panel.querySelector('#opt-ignore-box-sizing').checked = state.settings.ignoreBoxSizing;
    panel.querySelector('#opt-convert-font-size').checked = state.settings.convertFontSizeToPx;
    panel.querySelector('#opt-nest-pseudo').checked = state.settings.nestPseudoClasses;
    panel.querySelector('#opt-convert-urls').checked = state.settings.convertRelativeURLs;

    const childrenRadio = state.settings.includeChildren ? 'include' : 'exclude';
    panel.querySelector(`input[name="children-css"][value="${childrenRadio}"]`).checked = true;

    const selectorRadio = panel.querySelector(`input[name="selector-mode"][value="${state.settings.selectorMode}"]`);
    if (selectorRadio) selectorRadio.checked = true;
  }

  function saveOptions() {
    const panel = state.optionsPanel;

    state.settings.copyOnClick = panel.querySelector('#opt-copy-on-click').checked;
    state.settings.pinOnSpace = panel.querySelector('#opt-pin-on-space').checked;
    state.settings.copyHTMLWithCSS = panel.querySelector('#opt-copy-html').checked;
    state.settings.showGrid = panel.querySelector('#opt-show-grid').checked;
    state.settings.showGuidelines = panel.querySelector('#opt-show-guidelines').checked;
    state.settings.ignoreInherited = panel.querySelector('#opt-ignore-inherited').checked;
    state.settings.ignoreVendorPrefixes = panel.querySelector('#opt-ignore-vendor').checked;
    state.settings.ignoreBoxSizing = panel.querySelector('#opt-ignore-box-sizing').checked;
    state.settings.convertFontSizeToPx = panel.querySelector('#opt-convert-font-size').checked;
    state.settings.nestPseudoClasses = panel.querySelector('#opt-nest-pseudo').checked;
    state.settings.convertRelativeURLs = panel.querySelector('#opt-convert-urls').checked;

    const childrenRadio = panel.querySelector('input[name="children-css"]:checked');
    state.settings.includeChildren = childrenRadio.value === 'include';

    const selectorRadio = panel.querySelector('input[name="selector-mode"]:checked');
    state.settings.selectorMode = selectorRadio.value;

    // Save to chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ cssScanner: state.settings }, () => {
        showNotification('Settings saved!');
      });
    } else {
      localStorage.setItem('cssScanner', JSON.stringify(state.settings));
      showNotification('Settings saved!');
    }
  }

  function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['cssScanner'], (result) => {
        if (result.cssScanner) {
          Object.assign(state.settings, result.cssScanner);
        }
      });
    } else {
      const saved = localStorage.getItem('cssScanner');
      if (saved) {
        try {
          Object.assign(state.settings, JSON.parse(saved));
        } catch(e) {
          console.error('Failed to load settings:', e);
        }
      }
    }
  }

  // ========================================
  // TAB MANAGEMENT
  // ========================================

  function switchTab(tabName) {
    state.currentTab = tabName;

    // Update tab buttons
    const tabButtons = state.inspectorBlock.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab content
    const tabContents = state.inspectorBlock.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      if (content.dataset.tab === tabName) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Update content for the selected tab
    if (state.currentElement) {
      switch(tabName) {
        case 'css':
          updateCSSTab();
          break;
        case 'html':
          updateHTMLTab();
          break;
        case 'source':
          updateSourceTab();
          break;
        case 'editor':
          updateEditorTab();
          break;
      }
    }
  }

  function updateCSSTab() {
    const cssCode = state.inspectorBlock.querySelector('.css-code');

    if (state.settings.includeChildren) {
      // Extract CSS for parent and all children
      const fullCSS = extractWithChildren(state.currentElement);
      // Apply syntax highlighting
      cssCode.innerHTML = highlightCSS(fullCSS);

      // Store optimized CSS for copying and editor
      const props = extractCSS(state.currentElement, false);
      state.displayedCSS = optimizeCSSProperties(props);
    } else {
      // Extract CSS for current element only
      const props = extractCSS(state.currentElement, false);
      const optimizedProps = optimizeCSSProperties(props);
      state.displayedCSS = optimizedProps;

      let css = '';
      optimizedProps.forEach(({ prop, value }) => {
        css += `  ${prop}: ${value};\n`;
      });

      const selector = getElementSelector(state.currentElement, state.settings.selectorMode);
      const fullCSS = `${selector} {\n${css}}`;
      // Apply syntax highlighting
      cssCode.innerHTML = highlightCSS(fullCSS);
    }
  }

  function updateHTMLTab() {
    const htmlCode = state.inspectorBlock.querySelector('.html-code');
    const includeChildren = state.settings.includeChildrenHTML;
    const html = extractHTML(state.currentElement, includeChildren);
    state.displayedHTML = html;
    // Apply syntax highlighting
    htmlCode.innerHTML = highlightHTML(html);
  }

  function updateSourceTab() {
    const sourceList = state.inspectorBlock.querySelector('.source-list');
    const sources = getSourceFiles(state.currentElement);
    state.sourceFiles = sources;

    if (sources.length === 0) {
      sourceList.innerHTML = '<p style="padding: 20px; color: #9ca3af;">No CSS sources found</p>';
      return;
    }

    let html = '<div style="padding: 10px;">';
    sources.forEach(({ url, ruleCount }) => {
      html += `
        <div style="margin-bottom: 12px; padding: 10px; background: #111827; border-radius: 4px;">
          <div style="color: #60a5fa; font-size: 12px; margin-bottom: 4px; word-break: break-all;">${url}</div>
          <div style="color: #9ca3af; font-size: 11px;">${ruleCount} ${ruleCount === 1 ? 'rule' : 'rules'}</div>
        </div>
      `;
    });
    html += '</div>';

    sourceList.innerHTML = html;
  }

  function updateEditorTab() {
    const editor = state.inspectorBlock.querySelector('.css-editor');
    const highlight = state.inspectorBlock.querySelector('.editor-highlight');
    let fullCSS = '';

    if (state.settings.includeChildren) {
      // Show full CSS with children (same as CSS tab)
      fullCSS = extractWithChildren(state.currentElement);
    } else {
      // Show only current element CSS
      const selector = getElementSelector(state.currentElement, state.settings.selectorMode);
      let css = '';

      state.displayedCSS.forEach(({ prop, value }) => {
        css += `  ${prop}: ${value};\n`;
      });

      fullCSS = `${selector} {\n${css}}`;
    }

    state.originalCSS = fullCSS;
    editor.value = fullCSS;

    // Update syntax highlighting
    if (highlight) {
      highlight.innerHTML = highlightCSS(fullCSS);
    }
  }

  function copyCurrentTab() {
    switch(state.currentTab) {
      case 'css':
        copyCSSCode();
        break;
      case 'html':
        copyHTMLCode();
        break;
      case 'source':
        copySourceList();
        break;
      case 'editor':
        copyEditorCode();
        break;
    }
  }

  function copyCSSCode() {
    let cssContent = '';

    if (state.settings.includeChildren) {
      // Copy the full CSS with children (what's displayed)
      const cssCode = state.inspectorBlock.querySelector('.css-code');
      cssContent = cssCode.textContent;
    } else {
      // Copy just the current element's CSS
      let css = '';
      state.displayedCSS.forEach(({ prop, value }) => {
        css += `  ${prop}: ${value};\n`;
      });
      const selector = getElementSelector(state.currentElement, state.settings.selectorMode);
      cssContent = `${selector} {\n${css}}`;
    }

    // Check if we should copy HTML along with CSS
    if (state.settings.copyHTMLWithCSS) {
      const htmlContent = extractHTML(state.currentElement, state.settings.includeChildren);
      const combined = `${htmlContent}\n\n<style>\n${cssContent}\n</style>`;
      copyToClipboard(combined, 'HTML + CSS copied!');
    } else {
      copyToClipboard(cssContent, state.settings.includeChildren ? 'CSS with children copied!' : 'CSS copied!');
    }
  }

  function copyHTMLCode() {
    copyToClipboard(state.displayedHTML, 'HTML copied!');
  }

  function copySourceList() {
    let text = 'CSS Sources:\n\n';
    state.sourceFiles.forEach(({ url, ruleCount }) => {
      text += `${url} (${ruleCount} rules)\n`;
    });
    copyToClipboard(text, 'Sources copied!');
  }

  function copyEditorCode() {
    const editor = state.inspectorBlock.querySelector('.css-editor');
    copyToClipboard(editor.value, 'Editor code copied!');
  }

  // ========================================
  // INSPECTOR UPDATE
  // ========================================

  function updateInspector(element) {
    if (!element || element === document.documentElement) return;

    state.currentElement = element;

    // Update overlay position
    const rect = element.getBoundingClientRect();
    state.overlay.style.top = `${rect.top + window.scrollY}px`;
    state.overlay.style.left = `${rect.left + window.scrollX}px`;
    state.overlay.style.width = `${rect.width}px`;
    state.overlay.style.height = `${rect.height}px`;

    // Update inspector title
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.classList.length > 0 ? `.${Array.from(element.classList).join('.')}` : '';
    const size = `${Math.round(rect.width)}×${Math.round(rect.height)}`;

    state.inspectorBlock.querySelector('.element-tag').textContent = `<${tag}${id}${classes}>`;
    state.inspectorBlock.querySelector('.element-size').textContent = size;

    // Update breadcrumb
    updateBreadcrumb(element);

    // Update current tab
    switchTab(state.currentTab);

    // Position inspector block
    if (!state.frozen) {
      positionInspectorBlock(rect);
    }
  }

  function positionInspectorBlock(rect) {
    const block = state.inspectorBlock;
    const blockWidth = 600;
    const blockHeight = 500;

    let left = rect.left + rect.width + 20;
    let top = rect.top;

    // Keep within viewport
    if (left + blockWidth > window.innerWidth - 10) {
      left = rect.left - blockWidth - 20;
    }
    if (left < 10) {
      left = 10;
    }

    if (top + blockHeight > window.innerHeight - 10) {
      top = window.innerHeight - blockHeight - 10;
    }
    if (top < 10) {
      top = 10;
    }

    block.style.left = `${left}px`;
    block.style.top = `${top}px`;
  }

  function updateBreadcrumb(element) {
    const breadcrumb = state.inspectorBlock.querySelector('.inspector-breadcrumb');
    const path = [];
    let current = element;

    while (current && current !== document.body) {
      const tag = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : '';
      const cls = current.classList.length > 0 ? `.${current.classList[0]}` : '';
      path.unshift(`${tag}${id}${cls}`);
      current = current.parentElement;
    }

    breadcrumb.innerHTML = path.map((item, index) =>
      `<span class="breadcrumb-item" data-index="${index}">${item}</span>`
    ).join(' › ');

    // Add click handlers for breadcrumb navigation
    breadcrumb.querySelectorAll('.breadcrumb-item').forEach((item, index) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        let target = element;
        const steps = path.length - 1 - index;
        for (let i = 0; i < steps; i++) {
          target = target.parentElement;
        }
        updateInspector(target);
      });
    });
  }

  function togglePin() {
    state.frozen = !state.frozen;

    if (state.frozen) {
      state.inspectorBlock.style.borderColor = '#ffd43b';
      state.overlay.style.borderColor = '#ffd43b';
      showNotification('Frozen - Space to unfreeze');
    } else {
      state.inspectorBlock.style.borderColor = '#3b82f6';
      state.overlay.style.borderColor = '#3b82f6';
      showNotification('Unfrozen');
    }

    updateFooter();
  }

  function updateFooter() {
    const footer = state.inspectorBlock.querySelector('.inspector-footer span');
    footer.textContent = `Space to ${state.frozen ? 'unfreeze' : 'freeze'} • Backspace to ${state.frozen ? 'freeze' : 'unfreeze'} • Esc to close`;
  }

  function toggleOptionsPanel() {
    if (!state.optionsPanel) {
      state.optionsPanel = createOptionsPanel();
    }

    if (state.optionsPanel.style.display === 'none') {
      loadOptionsIntoPanel(state.optionsPanel);
      state.optionsPanel.style.display = 'block';
    } else {
      state.optionsPanel.style.display = 'none';
    }
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  function handleMouseMove(e) {
    if (state.frozen) return;
    if (!state.active) return;

    // Don't inspect our own UI
    if (e.target.closest('#css-scanner-block') ||
        e.target.closest('#css-scanner-overlay') ||
        e.target.closest('#css-scanner-options') ||
        e.target.closest('#css-scanner-guide-overlay')) {
      return;
    }

    updateInspector(e.target);
  }

  function handleClick(e) {
    if (!state.active) return;

    // Don't handle clicks on our UI
    if (e.target.closest('#css-scanner-block') ||
        e.target.closest('#css-scanner-options') ||
        e.target.closest('#css-scanner-guide-overlay')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (state.settings.copyOnClick) {
      copyCSSCode();
    }
  }

  function handleKeyboard(e) {
    if (!state.active) return;

    if (e.key === ' ') {
      e.preventDefault();
      if (state.settings.pinOnSpace) {
        togglePin();
      }
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      state.frozen = !state.frozen;

      if (state.frozen) {
        state.inspectorBlock.style.borderColor = '#ffd43b';
        state.overlay.style.borderColor = '#ffd43b';
      } else {
        state.inspectorBlock.style.borderColor = '#3b82f6';
        state.overlay.style.borderColor = '#3b82f6';
      }

      updateFooter();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      deactivateScanner();
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.currentElement && state.currentElement.parentElement) {
        updateInspector(state.currentElement.parentElement);
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.currentElement && state.currentElement.firstElementChild) {
        updateInspector(state.currentElement.firstElementChild);
      }
    }
  }

  // ========================================
  // ACTIVATION / DEACTIVATION
  // ========================================

  function activateScanner() {
    if (state.active) return;

    state.active = true;
    loadSettings();

    // Create UI elements
    state.overlay = createOverlay();
    state.inspectorBlock = createInspectorBlock();

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyboard, true);

    showNotification(i18n('notificationActivated'));
  }

  function deactivateScanner() {
    if (!state.active) return;

    state.active = false;
    state.frozen = false;

    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyboard, true);

    // Remove UI elements
    if (state.overlay) {
      state.overlay.remove();
      state.overlay = null;
    }

    if (state.inspectorBlock) {
      state.inspectorBlock.remove();
      state.inspectorBlock = null;
    }

    if (state.optionsPanel) {
      state.optionsPanel.remove();
      state.optionsPanel = null;
    }

    // Remove live CSS
    resetLiveCSS();

    showNotification(i18n('notificationDeactivated'));
  }

  function toggleScanner() {
    if (state.active) {
      deactivateScanner();
    } else {
      activateScanner();
    }
  }

  // ========================================
  // STYLES
  // ========================================

  function addStyles() {
    if (document.getElementById('css-scanner-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'css-scanner-styles';
    styles.textContent = `
      @keyframes cssScannerSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes cssScannerSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }

      #css-scanner-block {
        position: fixed !important;
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        background: #1f2937 !important;
        color: #f3f4f6 !important;
        border: 2px solid #3b82f6 !important;
        border-radius: 8px !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Courier New', monospace !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
        width: 600px !important;
        max-height: 80vh !important;
        flex-direction: column !important;
        overflow: hidden !important;
      }

      #css-scanner-block * {
        box-sizing: border-box !important;
      }

      .inspector-header {
        background: #111827 !important;
        padding: 12px 16px !important;
        border-bottom: 1px solid #374151 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        cursor: move !important;
      }

      .inspector-title {
        display: flex !important;
        flex-direction: column !important;
      }

      .element-tag {
        color: #60a5fa !important;
        font-weight: 600 !important;
        font-size: 14px !important;
      }

      .element-size {
        color: #9ca3af !important;
        font-size: 11px !important;
        margin-top: 2px !important;
      }

      .inspector-actions {
        display: flex !important;
        gap: 8px !important;
      }

      .inspector-actions button {
        background: transparent !important;
        border: 1px solid #4b5563 !important;
        color: #f3f4f6 !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 16px !important;
        line-height: 1 !important;
      }

      .inspector-actions button:hover {
        background: #374151 !important;
      }

      .inspector-breadcrumb {
        background: #111827 !important;
        padding: 8px 16px !important;
        border-bottom: 1px solid #374151 !important;
        font-size: 11px !important;
        color: #9ca3af !important;
        overflow-x: auto !important;
        white-space: nowrap !important;
      }

      .breadcrumb-item {
        cursor: pointer !important;
        color: #60a5fa !important;
      }

      .breadcrumb-item:hover {
        text-decoration: underline !important;
      }

      .inspector-tabs {
        background: #111827 !important;
        display: flex !important;
        border-bottom: 1px solid #374151 !important;
        padding: 0 16px !important;
      }

      .tab-btn {
        background: transparent !important;
        border: none !important;
        color: #9ca3af !important;
        padding: 10px 16px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        border-bottom: 2px solid transparent !important;
        margin-bottom: -1px !important;
      }

      .tab-btn:hover {
        color: #f3f4f6 !important;
      }

      .tab-btn.active {
        color: #60a5fa !important;
        border-bottom-color: #60a5fa !important;
      }

      .inspector-toolbar {
        background: #1f2937 !important;
        padding: 10px 16px !important;
        border-bottom: 1px solid #374151 !important;
        display: flex !important;
        gap: 8px !important;
      }

      .inspector-toolbar button {
        background: #3b82f6 !important;
        border: none !important;
        color: white !important;
        padding: 6px 12px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }

      .inspector-toolbar button:hover {
        background: #2563eb !important;
      }

      .btn-pin {
        background: #6b7280 !important;
      }

      .btn-pin:hover {
        background: #4b5563 !important;
      }

      .inspector-content {
        flex: 1 !important;
        overflow-y: auto !important;
        background: #1f2937 !important;
        max-height: 50vh !important;
      }

      .tab-content {
        display: none !important;
      }

      .tab-content.active {
        display: block !important;
      }

      .css-code, .html-code {
        padding: 16px !important;
        margin: 0 !important;
        color: #f3f4f6 !important;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: 12px !important;
        line-height: 1.6 !important;
        background: transparent !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        user-select: text !important;
        cursor: text !important;
      }

      .css-options,
      .html-options {
        padding: 12px 16px !important;
        background: #111827 !important;
        border-bottom: 1px solid #374151 !important;
      }

      .css-options label,
      .html-options label {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        color: #f3f4f6 !important;
        font-size: 12px !important;
        cursor: pointer !important;
      }

      .css-options input[type="checkbox"],
      .html-options input[type="checkbox"] {
        cursor: pointer !important;
      }

      .source-list {
        min-height: 200px !important;
      }

      .editor-controls {
        padding: 12px 16px !important;
        background: #111827 !important;
        border-bottom: 1px solid #374151 !important;
        display: flex !important;
        gap: 8px !important;
      }

      .editor-controls button {
        background: #10b981 !important;
        border: none !important;
        color: white !important;
        padding: 6px 12px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }

      .editor-controls button:hover {
        background: #059669 !important;
      }

      .btn-reset-css {
        background: #ef4444 !important;
      }

      .btn-reset-css:hover {
        background: #dc2626 !important;
      }

      .editor-wrapper {
        position: relative !important;
        width: 100% !important;
        overflow: hidden !important;
        border-radius: 4px !important;
      }

      .editor-highlight {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        min-height: 300px !important;
        padding: 16px !important;
        margin: 0 !important;
        background: #111827 !important;
        color: transparent !important;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: 12px !important;
        line-height: 1.6 !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        pointer-events: none !important;
        z-index: 1 !important;
        overflow: hidden !important;
      }

      .css-editor {
        position: relative !important;
        width: 100% !important;
        min-height: 300px !important;
        padding: 16px !important;
        background: transparent !important;
        color: #f3f4f6 !important;
        border: none !important;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: 12px !important;
        line-height: 1.6 !important;
        resize: vertical !important;
        z-index: 2 !important;
        caret-color: #f3f4f6 !important;
      }

      .css-editor:focus {
        outline: none !important;
      }

      .inspector-footer {
        background: #111827 !important;
        padding: 8px 16px !important;
        border-top: 1px solid #374151 !important;
        font-size: 11px !important;
        color: #9ca3af !important;
        text-align: center !important;
      }

      #css-scanner-options .options-header {
        background: #111827 !important;
        padding: 16px 20px !important;
        border-bottom: 1px solid #374151 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }

      #css-scanner-options h3 {
        margin: 0 !important;
        color: #f3f4f6 !important;
        font-size: 18px !important;
        font-weight: 600 !important;
      }

      .btn-close-options {
        background: transparent !important;
        border: 1px solid #4b5563 !important;
        color: #f3f4f6 !important;
        width: 28px !important;
        height: 28px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 20px !important;
        line-height: 1 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .btn-close-options:hover {
        background: #374151 !important;
      }

      #css-scanner-options .options-content {
        padding: 20px !important;
      }

      .options-section {
        margin-bottom: 24px !important;
      }

      .options-section h4 {
        margin: 0 0 12px 0 !important;
        color: #60a5fa !important;
        font-size: 13px !important;
        font-weight: 600 !important;
      }

      .options-section label {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        margin-bottom: 8px !important;
        color: #f3f4f6 !important;
        font-size: 13px !important;
        cursor: pointer !important;
      }

      .options-section input[type="checkbox"],
      .options-section input[type="radio"] {
        cursor: pointer !important;
      }

      #css-scanner-options .options-footer {
        background: #111827 !important;
        padding: 16px 20px !important;
        border-top: 1px solid #374151 !important;
        text-align: right !important;
      }

      .btn-save-options {
        background: #3b82f6 !important;
        border: none !important;
        color: white !important;
        padding: 10px 20px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        font-weight: 600 !important;
      }

      .btn-save-options:hover {
        background: #2563eb !important;
      }
    `;

    document.head.appendChild(styles);
  }

  // ========================================
  // MESSAGE LISTENER
  // ========================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_SCANNER') {
      toggleScanner();
    }
  });

  // Auto-activate if this script is injected
  if (!state.active) {
    activateScanner();
  }

})();
