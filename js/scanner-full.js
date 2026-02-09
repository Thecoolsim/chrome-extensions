/**
 * CSS Scanner Pro - Full Featured Version
 * Complete CSS Scanner with tabs, CodePen export, live editor, and more
 *
 * @author Simon Adjatan
 * @website https://adjatan.org/
 * @github https://github.com/Thecoolsim
 * @X https://x.com/adjatan
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
  // I18N HELPER WITH LANGUAGE OVERRIDE
  // ========================================

  // Available languages
  const AVAILABLE_LANGUAGES = {
    'auto': 'Auto-detect',
    'en': 'English',
    'fr': 'Français',
    'es': 'Español',
    'de': 'Deutsch',
    'pt': 'Português',
    'ja': '日本語'
  };

  // Translation cache for manual language override
  let translationCache = {};
  let currentLanguage = 'auto';

  // Load translations for a specific language
  async function loadTranslations(lang) {
    if (lang === 'auto') {
      translationCache = {};
      return;
    }

    try {
      const response = await fetch(chrome.runtime.getURL(`_locales/${lang}/messages.json`));
      const messages = await response.json();
      translationCache = messages; // Store the full message objects, not just the message text
    } catch (e) {
      console.error(`Failed to load translations for ${lang}:`, e);
      translationCache = {};
    }
  }

  // i18n function with language override support
  const i18n = (messageName, substitutions) => {
    if (typeof chrome === 'undefined' || !chrome.i18n) {
      return messageName;
    }

    let message;

    // Use cached translation if manual language is selected
    if (currentLanguage !== 'auto' && translationCache[messageName]) {
      const messageData = translationCache[messageName];
      message = messageData.message || messageData;

      // Handle substitutions for manual translations
      if (substitutions) {
        if (Array.isArray(substitutions)) {
          // Replace numbered placeholders: $1$, $2$, $3$, etc.
          substitutions.forEach((sub, index) => {
            const placeholder = new RegExp('\\$' + (index + 1) + '\\$', 'g');
            message = message.replace(placeholder, sub);
          });

          // Also handle named placeholders if they exist in the message data
          if (messageData.placeholders) {
            for (const placeholderName in messageData.placeholders) {
              const placeholderDef = messageData.placeholders[placeholderName];
              // Extract the index from content like "$1", "$2", etc.
              const match = placeholderDef.content.match(/\$(\d+)/);
              if (match) {
                const index = parseInt(match[1]) - 1;
                if (index < substitutions.length) {
                  const namedPlaceholder = new RegExp('\\$' + placeholderName.toUpperCase() + '\\$', 'gi');
                  message = message.replace(namedPlaceholder, substitutions[index]);
                }
              }
            }
          }
        } else {
          // Replace $1$ with single substitution
          message = message.replace(/\$1\$/g, substitutions);
          // Also replace named placeholders for single substitution
          if (messageData.placeholders) {
            for (const placeholderName in messageData.placeholders) {
              const namedPlaceholder = new RegExp('\\$' + placeholderName.toUpperCase() + '\\$', 'gi');
              message = message.replace(namedPlaceholder, substitutions);
            }
          }
        }
      }
    } else {
      // Use Chrome's default i18n (handles substitutions automatically)
      message = chrome.i18n.getMessage(messageName, substitutions) || messageName;
    }

    return message;
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
      maxBreadcrumbDepth: 4, // Maximum depth for breadcrumb navigation (0 = unlimited)

      // Language
      language: 'auto', // 'auto', 'en', 'fr', 'es', 'de'

      // Other preferences
      ignoreInherited: false,
      ignoreVendorPrefixes: true,
      ignoreBoxSizing: false,
      convertFontSizeToPx: false,
      nestPseudoClasses: false,
      convertRelativeURLs: true,
      includeChildrenHTML: true,

      // Theme
      inspectorTheme: 'dark' // 'dark' or 'light'
    },
    inspectorBlock: null,
    overlay: null,
    breadcrumb: null,
    optionsPanel: null,
    // Performance: rAF throttle, stylesheet cache, dirty tabs, computed style cache
    _rafPending: false,
    _stylesheetCache: null,
    _dirtyTabs: { css: true, html: true, source: true, editor: true },
    _computedStyleCache: null,
    _resizeHandler: null,
    _currentSectionIndex: -1
  };

  // ========================================
  // PERFORMANCE HELPERS
  // ========================================

  /**
   * Build a flat cache of all stylesheet rules (called once on activation)
   * Each entry: { rule, mediaText, sheet }
   */
  function buildStylesheetCache() {
    const cache = [];
    try {
      for (const sheet of document.styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          collectRulesFlat(rules, sheet, null, cache);
        } catch(e) {
          // Cross-origin stylesheet — store reference for source tab
          cache.push({ rule: null, mediaText: null, sheet, crossOrigin: true });
        }
      }
    } catch(e) { /* error */ }
    state._stylesheetCache = cache;
  }

  function collectRulesFlat(rules, sheet, mediaText, cache) {
    for (const rule of rules) {
      if (rule.style && rule.selectorText) {
        cache.push({ rule, mediaText, sheet, crossOrigin: false });
      } else if (rule.cssRules) {
        // @media, @supports, etc.
        const media = rule.media ? rule.media.mediaText : (rule.conditionText || null);
        collectRulesFlat(Array.from(rule.cssRules), sheet, media || mediaText, cache);
      }
    }
  }

  /**
   * Get cached computed style for an element (WeakMap-based)
   */
  function getCachedComputedStyle(element) {
    if (!state._computedStyleCache) {
      state._computedStyleCache = new WeakMap();
    }
    let cached = state._computedStyleCache.get(element);
    if (!cached) {
      cached = window.getComputedStyle(element);
      state._computedStyleCache.set(element, cached);
    }
    return cached;
  }

  // ========================================
  // RESPONSIVE BREAKPOINT DETECTION
  // ========================================

  const BREAKPOINTS = [
    { name: 'xs', label: 'breakpointXS', maxWidth: 575, color: '#ef4444' },
    { name: 'sm', label: 'breakpointSM', minWidth: 576, maxWidth: 767, color: '#f97316' },
    { name: 'md', label: 'breakpointMD', minWidth: 768, maxWidth: 991, color: '#eab308' },
    { name: 'lg', label: 'breakpointLG', minWidth: 992, maxWidth: 1199, color: '#22c55e' },
    { name: 'xl', label: 'breakpointXL', minWidth: 1200, maxWidth: 1399, color: '#3b82f6' },
    { name: 'xxl', label: 'breakpointXXL', minWidth: 1400, color: '#8b5cf6' }
  ];

  function getActiveBreakpoint() {
    const width = window.innerWidth;
    for (const bp of BREAKPOINTS) {
      const min = bp.minWidth || 0;
      const max = bp.maxWidth || Infinity;
      if (width >= min && width <= max) {
        return { ...bp, width };
      }
    }
    return { name: 'xxl', label: 'breakpointXXL', color: '#8b5cf6', width };
  }

  function updateBreakpointBadge() {
    if (!state.inspectorBlock) return;
    const badge = state.inspectorBlock.querySelector('.breakpoint-badge');
    if (!badge) return;
    const bp = getActiveBreakpoint();
    badge.textContent = `${bp.name.toUpperCase()} · ${bp.width}px`;
    badge.style.background = bp.color + '33';
    badge.style.color = bp.color;
    badge.style.borderColor = bp.color + '66';
    badge.title = i18n(bp.label) + ` (${bp.width}px)`;
  }

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
    const computed = getCachedComputedStyle(element);
    const matchedRules = [];

    // Collect all matching CSS rules (use cache if available)
    if (state._stylesheetCache) {
      for (const entry of state._stylesheetCache) {
        if (entry.crossOrigin || !entry.rule) continue;
        try {
          const selectors = entry.rule.selectorText.split(',').map(s => s.trim());
          for (const selector of selectors) {
            if (element.matches(selector)) {
              matchedRules.push(entry.rule);
              break;
            }
          }
        } catch(e) { /* invalid selector */ }
      }
    } else {
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
   * Extract significant computed styles from an element
   * Used as fallback when no CSS rules match
   */
  function extractComputedStyles(element) {
    const computed = getCachedComputedStyle(element);
    const cssProperties = [];

    // List of commonly useful properties to extract
    const significantProps = [
      'display', 'position', 'top', 'right', 'bottom', 'left',
      'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border', 'border-width', 'border-style', 'border-color', 'border-radius',
      'background', 'background-color', 'background-image',
      'color', 'font-family', 'font-size', 'font-weight', 'font-style',
      'text-align', 'text-decoration', 'text-transform', 'line-height',
      'letter-spacing', 'word-spacing',
      'opacity', 'visibility', 'overflow', 'overflow-x', 'overflow-y',
      'z-index', 'cursor', 'pointer-events',
      'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
      'grid-template-columns', 'grid-template-rows', 'gap',
      'transform', 'transition', 'animation',
      'box-shadow', 'text-shadow'
    ];

    significantProps.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value) {
        cssProperties.push({ prop, value });
      }
    });

    return cssProperties;
  }

  // ========================================
  // CSS VARIABLE EXTRACTION
  // ========================================

  function extractCSSVariables(element) {
    const computed = getCachedComputedStyle(element);
    const defined = [];
    const used = [];
    const seenDefined = new Set();
    const seenUsed = new Set();

    // Use stylesheet cache if available
    const entries = state._stylesheetCache || [];

    // 1. Find CSS custom properties defined on this element via matched rules
    if (entries.length > 0) {
      for (const entry of entries) {
        if (entry.crossOrigin || !entry.rule) continue;
        try {
          if (element.matches(entry.rule.selectorText)) {
            for (let i = 0; i < entry.rule.style.length; i++) {
              const prop = entry.rule.style[i];
              if (prop.startsWith('--') && !seenDefined.has(prop)) {
                seenDefined.add(prop);
                const value = entry.rule.style.getPropertyValue(prop).trim();
                const resolved = computed.getPropertyValue(prop).trim();
                defined.push({
                  name: prop,
                  value: value,
                  resolved: resolved,
                  source: entry.sheet.href || 'inline'
                });
              }
            }
          }
        } catch(e) { /* invalid selector */ }
      }
      // 2. Also check :root / html variables
      const rootComputed = getCachedComputedStyle(document.documentElement);
      for (const entry of entries) {
        if (entry.crossOrigin || !entry.rule) continue;
        if (entry.rule.selectorText && /^(:root|html)$/i.test(entry.rule.selectorText.trim())) {
          for (let i = 0; i < entry.rule.style.length; i++) {
            const prop = entry.rule.style[i];
            if (prop.startsWith('--') && !seenDefined.has(prop)) {
              seenDefined.add(prop);
              defined.push({
                name: prop,
                value: entry.rule.style.getPropertyValue(prop).trim(),
                resolved: rootComputed.getPropertyValue(prop).trim(),
                source: entry.sheet.href || ':root'
              });
            }
          }
        }
      }
    } else {
      // Fallback: iterate stylesheets directly
      try {
        for (const sheet of document.styleSheets) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              if (rule.style && rule.selectorText) {
                try {
                  if (element.matches(rule.selectorText)) {
                    for (let i = 0; i < rule.style.length; i++) {
                      const prop = rule.style[i];
                      if (prop.startsWith('--') && !seenDefined.has(prop)) {
                        seenDefined.add(prop);
                        const value = rule.style.getPropertyValue(prop).trim();
                        const resolved = computed.getPropertyValue(prop).trim();
                        defined.push({
                          name: prop,
                          value: value,
                          resolved: resolved,
                          source: sheet.href || 'inline'
                        });
                      }
                    }
                  }
                } catch(e) { /* invalid selector */ }
              }
            }
          } catch(e) { /* cross-origin */ }
        }
      } catch(e) { /* error */ }

      try {
        const rootComputed = getCachedComputedStyle(document.documentElement);
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.selectorText && /^(:root|html)$/i.test(rule.selectorText.trim())) {
                for (let i = 0; i < rule.style.length; i++) {
                  const prop = rule.style[i];
                  if (prop.startsWith('--') && !seenDefined.has(prop)) {
                    seenDefined.add(prop);
                    defined.push({
                      name: prop,
                      value: rule.style.getPropertyValue(prop).trim(),
                      resolved: rootComputed.getPropertyValue(prop).trim(),
                      source: sheet.href || ':root'
                    });
                  }
                }
              }
            }
          } catch(e) { /* cross-origin */ }
        }
      } catch(e) { /* error */ }
    }

    // 3. Find var() usage in the element's matched properties
    const allProps = extractCSS(element, false);
    allProps.forEach(({ prop, value }) => {
      const varMatches = value.matchAll(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g);
      for (const match of varMatches) {
        const varName = match[1];
        if (!seenUsed.has(varName + ':' + prop)) {
          seenUsed.add(varName + ':' + prop);
          const fallback = match[2] || null;
          const resolvedValue = computed.getPropertyValue(varName).trim();
          used.push({
            name: varName,
            usedIn: prop,
            fallback: fallback,
            resolved: resolvedValue || fallback || 'unset'
          });
        }
      }
    });

    return { defined, used };
  }

  // ========================================
  // SPECIFICITY CALCULATOR
  // ========================================

  function calculateSpecificity(selector) {
    let sel = selector.trim();
    let ids = 0;
    let classes = 0;
    let elements = 0;

    // Remove :not() wrapper but count its contents
    sel = sel.replace(/:not\(([^)]+)\)/g, ' $1 ');
    // Remove :where() (specificity 0)
    sel = sel.replace(/:where\([^)]*\)/g, '');
    // Count pseudo-elements as element selectors and remove
    const pseudoElements = sel.match(/::(before|after|first-line|first-letter|placeholder|selection|marker|backdrop)/g);
    if (pseudoElements) elements += pseudoElements.length;
    sel = sel.replace(/::(before|after|first-line|first-letter|placeholder|selection|marker|backdrop)/g, '');

    // Count IDs
    const idMatches = sel.match(/#[\w-]+/g);
    if (idMatches) ids += idMatches.length;
    sel = sel.replace(/#[\w-]+/g, '');

    // Count classes, attribute selectors, pseudo-classes
    const classMatches = sel.match(/\.[\w-]+/g);
    if (classMatches) classes += classMatches.length;
    sel = sel.replace(/\.[\w-]+/g, '');

    const attrMatches = sel.match(/\[[^\]]+\]/g);
    if (attrMatches) classes += attrMatches.length;
    sel = sel.replace(/\[[^\]]+\]/g, '');

    const pseudoClassMatches = sel.match(/:[\w-]+(\([^)]*\))?/g);
    if (pseudoClassMatches) classes += pseudoClassMatches.length;
    sel = sel.replace(/:[\w-]+(\([^)]*\))?/g, '');

    // Count element selectors (remaining tag names)
    const elemMatches = sel.match(/[a-zA-Z][\w-]*/g);
    if (elemMatches) {
      elemMatches.forEach(m => {
        if (m !== 'not' && m !== 'where' && m !== 'is' && m !== 'has') {
          elements++;
        }
      });
    }

    return { ids, classes, elements };
  }

  function formatSpecificity(spec) {
    return `(${spec.ids},${spec.classes},${spec.elements})`;
  }

  // ========================================
  // ANIMATION INSPECTOR
  // ========================================

  function extractAnimations(element) {
    const computed = getCachedComputedStyle(element);
    const result = {
      transitions: [],
      animations: [],
      keyframes: []
    };

    // Extract transitions
    const transitionProp = computed.getPropertyValue('transition');
    if (transitionProp && transitionProp !== 'all 0s ease 0s' && transitionProp !== 'none' && transitionProp !== '') {
      const tProperty = computed.getPropertyValue('transition-property');
      const tDuration = computed.getPropertyValue('transition-duration');
      const tTiming = computed.getPropertyValue('transition-timing-function');
      const tDelay = computed.getPropertyValue('transition-delay');

      // Split by comma for multiple transitions
      const props = tProperty.split(',').map(s => s.trim());
      const durations = tDuration.split(',').map(s => s.trim());
      const timings = tTiming.split(',').map(s => s.trim());
      const delays = tDelay.split(',').map(s => s.trim());

      props.forEach((prop, i) => {
        if (prop === 'all' && durations[0] === '0s') return;
        result.transitions.push({
          property: prop,
          duration: durations[i] || durations[0],
          timing: timings[i] || timings[0],
          delay: delays[i] || delays[0]
        });
      });
    }

    // Extract animations
    const animationName = computed.getPropertyValue('animation-name');
    if (animationName && animationName !== 'none' && animationName !== '') {
      const names = animationName.split(',').map(n => n.trim());
      const durations = computed.getPropertyValue('animation-duration').split(',').map(s => s.trim());
      const timings = computed.getPropertyValue('animation-timing-function').split(',').map(s => s.trim());
      const delays = computed.getPropertyValue('animation-delay').split(',').map(s => s.trim());
      const iterations = computed.getPropertyValue('animation-iteration-count').split(',').map(s => s.trim());
      const directions = computed.getPropertyValue('animation-direction').split(',').map(s => s.trim());
      const fillModes = computed.getPropertyValue('animation-fill-mode').split(',').map(s => s.trim());

      names.forEach((name, i) => {
        if (name === 'none') return;
        result.animations.push({
          name: name,
          duration: (durations[i] || durations[0]),
          timing: (timings[i] || timings[0]),
          delay: (delays[i] || delays[0]),
          iterationCount: (iterations[i] || iterations[0]),
          direction: (directions[i] || directions[0]),
          fillMode: (fillModes[i] || fillModes[0])
        });
      });

      // Find @keyframes definitions
      try {
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule instanceof CSSKeyframesRule && names.includes(rule.name)) {
                let keyframeCSS = `@keyframes ${rule.name} {\n`;
                for (const kf of rule.cssRules) {
                  keyframeCSS += `  ${kf.keyText} {\n`;
                  for (let j = 0; j < kf.style.length; j++) {
                    const p = kf.style[j];
                    keyframeCSS += `    ${p}: ${kf.style.getPropertyValue(p)};\n`;
                  }
                  keyframeCSS += '  }\n';
                }
                keyframeCSS += '}';
                result.keyframes.push({ name: rule.name, css: keyframeCSS });
              }
            }
          } catch(e) { /* cross-origin */ }
        }
      } catch(e) { /* error */ }
    }

    return result;
  }

  // ========================================
  // BOX MODEL VISUALIZATION
  // ========================================

  function renderBoxModel(element) {
    const computed = getCachedComputedStyle(element);
    const get = (prop) => computed.getPropertyValue(prop) || '0px';

    const margin = {
      top: get('margin-top'), right: get('margin-right'),
      bottom: get('margin-bottom'), left: get('margin-left')
    };
    const border = {
      top: get('border-top-width'), right: get('border-right-width'),
      bottom: get('border-bottom-width'), left: get('border-left-width')
    };
    const padding = {
      top: get('padding-top'), right: get('padding-right'),
      bottom: get('padding-bottom'), left: get('padding-left')
    };
    const width = Math.round(element.getBoundingClientRect().width);
    const height = Math.round(element.getBoundingClientRect().height);

    return `
      <div class="box-model-diagram">
        <div class="box-model-margin" style="position: relative;">
          <span class="box-model-label">margin</span>
          <div class="box-model-value-top"><span class="box-model-value">${margin.top}</span></div>
          <div class="box-model-value-sides">
            <span class="box-model-value">${margin.left}</span>
            <div class="box-model-border" style="position: relative; flex: 1;">
              <span class="box-model-label">border</span>
              <div class="box-model-value-top"><span class="box-model-value">${border.top}</span></div>
              <div class="box-model-value-sides">
                <span class="box-model-value">${border.left}</span>
                <div class="box-model-padding" style="position: relative; flex: 1;">
                  <span class="box-model-label">padding</span>
                  <div class="box-model-value-top"><span class="box-model-value">${padding.top}</span></div>
                  <div class="box-model-value-sides">
                    <span class="box-model-value">${padding.left}</span>
                    <div class="box-model-content">${width} x ${height}</div>
                    <span class="box-model-value">${padding.right}</span>
                  </div>
                  <div class="box-model-value-bottom"><span class="box-model-value">${padding.bottom}</span></div>
                </div>
                <span class="box-model-value">${border.right}</span>
              </div>
              <div class="box-model-value-bottom"><span class="box-model-value">${border.bottom}</span></div>
            </div>
            <span class="box-model-value">${margin.right}</span>
          </div>
          <div class="box-model-value-bottom"><span class="box-model-value">${margin.bottom}</span></div>
        </div>
      </div>
    `;
  }

  // ========================================
  // COLOR PALETTE EXTRACTION
  // ========================================

  function extractColors(properties) {
    const colors = new Map();

    const namedColors = ['red','blue','green','black','white','gray','grey','orange','purple','pink',
      'yellow','cyan','magenta','brown','navy','teal','olive','maroon','aqua','lime',
      'silver','fuchsia','indigo','violet','coral','crimson','gold','khaki','lavender',
      'salmon','sienna','tan','tomato','turquoise','wheat'];

    properties.forEach(({ prop, value }) => {
      // hex colors
      const hexMatches = value.matchAll(/#([0-9a-fA-F]{3,8})\b/g);
      for (const m of hexMatches) {
        const hex = m[0].toLowerCase();
        if (!colors.has(hex)) colors.set(hex, hex);
      }

      // rgb/rgba
      const rgbMatches = value.matchAll(/rgba?\([^)]+\)/gi);
      for (const m of rgbMatches) {
        const rgb = m[0];
        if (!colors.has(rgb) && rgb !== 'rgba(0, 0, 0, 0)') colors.set(rgb, rgb);
      }

      // hsl/hsla
      const hslMatches = value.matchAll(/hsla?\([^)]+\)/gi);
      for (const m of hslMatches) {
        const hsl = m[0];
        if (!colors.has(hsl)) colors.set(hsl, hsl);
      }

      // Named colors (only for color-related properties)
      if (/color|background|border|shadow|outline/i.test(prop)) {
        const words = value.split(/[\s,]+/);
        words.forEach(word => {
          const lower = word.toLowerCase();
          if (namedColors.includes(lower) && !colors.has(lower)) {
            colors.set(lower, lower);
          }
        });
      }
    });

    return Array.from(colors.values());
  }

  // ========================================
  // SCSS EXPORT
  // ========================================

  function convertToSCSS(element) {
    const selector = getElementSelector(element, state.settings.selectorMode);
    const props = extractCSS(element, false);
    const optimizedProps = optimizeCSSProperties(props);

    // Collect all elements and their CSS
    const allElements = [{ selector, props: optimizedProps }];
    const valueOccurrences = new Map();

    if (state.settings.includeChildren) {
      const children = element.querySelectorAll('*');
      const MAX_CHILDREN = 200;
      const childrenArray = Array.from(children).slice(0, MAX_CHILDREN);

      childrenArray.forEach(child => {
        const childSelector = getElementSelector(child, state.settings.selectorMode);
        let childProps = extractCSS(child, false);
        if (childProps.length === 0) childProps = extractComputedStyles(child);
        const optimized = optimizeCSSProperties(childProps);
        if (optimized.length > 0) {
          allElements.push({ selector: childSelector, props: optimized });
        }
      });
    }

    // Detect repeated color/font values for SCSS variables
    allElements.forEach(({ props: elProps }) => {
      elProps.forEach(({ prop, value }) => {
        if (/^(#|rgb|hsl)/.test(value) || /^(color|background|border-color|font-size|font-family)$/.test(prop)) {
          valueOccurrences.set(value, (valueOccurrences.get(value) || 0) + 1);
        }
      });
    });

    const scssVars = new Map();
    let varIndex = 0;
    const varPrefixes = ['primary', 'secondary', 'accent', 'text-color', 'bg-color', 'border-color', 'font-size', 'font-family'];

    valueOccurrences.forEach((count, value) => {
      if (count >= 2) {
        const name = varIndex < varPrefixes.length ? varPrefixes[varIndex] : `var-${varIndex}`;
        scssVars.set(value, `$${name}`);
        varIndex++;
      }
    });

    // Build SCSS output
    let scss = '';

    if (scssVars.size > 0) {
      scss += '// SCSS Variables\n';
      scssVars.forEach((varName, value) => {
        scss += `${varName}: ${value};\n`;
      });
      scss += '\n';
    }

    scss += `${selector} {\n`;
    optimizedProps.forEach(({ prop, value }) => {
      const scssValue = scssVars.get(value) || value;
      scss += `  ${prop}: ${scssValue};\n`;
    });

    // Nest children under parent
    if (state.settings.includeChildren && allElements.length > 1) {
      allElements.slice(1).forEach(({ selector: childSel, props: childProps }) => {
        scss += `\n  ${childSel} {\n`;
        childProps.forEach(({ prop, value }) => {
          const scssValue = scssVars.get(value) || value;
          scss += `    ${prop}: ${scssValue};\n`;
        });
        scss += '  }\n';
      });
    }

    scss += '}\n';
    return scss;
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

    // Process the HTML line by line to avoid regex catastrophic backtracking
    // and prevent double-highlighting of already highlighted content
    const lines = highlighted.split('\n');
    const processedLines = lines.map(line => {
      // Skip if line is empty or just whitespace
      if (!line.trim()) return line;

      let result = line;

      // Highlight comments (do this first to prevent other processing)
      result = result.replace(
        /&lt;!--(.*?)--&gt;/g,
        '<span style="color: #6b7280; font-style: italic;">&lt;!--$1--&gt;</span>'
      );

      // Only process if not a comment
      if (!result.includes('&lt;!--')) {
        // Highlight closing tags first (e.g., </div>)
        result = result.replace(
          /&lt;\/(\w[\w-]*)&gt;/g,
          '&lt;<span style="color: #f87171;">/</span><span style="color: #fbbf24; font-weight: 600;">$1</span><span style="color: #f87171;">&gt;</span>'
        );

        // Highlight self-closing and opening tags
        result = result.replace(
          /&lt;(\w[\w-]*)((?:\s+[\w-]+(?:=&quot;[^&"]*&quot;)?)*)\s*(\/?)&gt;/g,
          (match, tagName, attrs, selfClosing) => {
            let output = '&lt;<span style="color: #fbbf24; font-weight: 600;">' + tagName + '</span>';

            // Highlight attributes if present
            if (attrs) {
              output += attrs.replace(
                /\s+([\w-]+)(?:=(&quot;[^&"]*&quot;))?/g,
                (attrMatch, attrName, attrValue) => {
                  let attrOutput = ' <span style="color: #60a5fa;">' + attrName + '</span>';
                  if (attrValue) {
                    attrOutput += '=<span style="color: #34d399;">' + attrValue + '</span>';
                  }
                  return attrOutput;
                }
              );
            }

            // Add self-closing slash and closing bracket
            if (selfClosing) {
              output += '<span style="color: #f87171;">/&gt;</span>';
            } else {
              output += '<span style="color: #f87171;">&gt;</span>';
            }

            return output;
          }
        );
      }

      return result;
    });

    return processedLines.join('\n');
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

    // Always extract children when this function is called
    const children = element.querySelectorAll('*');
    const seenRules = new Map(); // Track unique selector + CSS combinations

    // Limit to prevent browser freeze on large DOM trees
    const MAX_CHILDREN = 200;
    const childrenArray = Array.from(children).slice(0, MAX_CHILDREN);

    // Add warning if we hit the limit
    if (children.length > MAX_CHILDREN) {
      css += `\n/* Warning: Only showing first ${MAX_CHILDREN} of ${children.length} child elements */\n`;
    }

    childrenArray.forEach(child => {
      const childSelector = getElementSelector(child, state.settings.selectorMode);

      // Try extractCSS first (gets styles from CSS rules)
      let childProps = extractCSS(child, false);

      // If no CSS rules match, extract significant computed styles
      if (childProps.length === 0) {
        childProps = extractComputedStyles(child);
      }

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
  // JSFIDDLE EXPORT
  // ========================================

  function exportToJSFiddle() {
    const html = extractHTML(state.currentElement, state.settings.includeChildren);

    let fullCSS = '';
    if (state.settings.includeChildren) {
      fullCSS = extractWithChildren(state.currentElement);
    } else {
      const css = state.displayedCSS.map(({ prop, value }) =>
        `  ${prop}: ${value};`
      ).join('\n');
      const selector = getElementSelector(state.currentElement, state.settings.selectorMode);
      fullCSS = `${selector} {\n${css}\n}`;
    }

    const form = document.createElement('form');
    form.action = 'https://jsfiddle.net/api/post/library/pure/';
    form.method = 'POST';
    form.target = '_blank';

    const fields = {
      'title': 'CSS Scanner Pro - Export by Simon Adjatan',
      'html': html,
      'css': fullCSS,
      'js': '',
      'wrap': 'b'
    };

    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    showNotification('Opening in JSFiddle...');
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
          <span class="breakpoint-badge"></span>
        </div>
        <div class="inspector-actions">
          <button class="btn-guide" title="${i18n('btnGuide')}">?</button>
          <button class="btn-settings" title="${i18n('btnSettings')}">⚙</button>
          <button class="btn-close" title="${i18n('btnClose')}">×</button>
        </div>
      </div>

      <div class="inspector-breadcrumb"></div>

      <div class="inspector-tabs">
        <button class="tab-btn scanner-tab active" data-tab="css">${i18n('tabCSS')}</button>
        <button class="tab-btn scanner-tab" data-tab="html">${i18n('tabHTML')}</button>
        <button class="tab-btn scanner-tab" data-tab="source">${i18n('tabSource')}</button>
        <button class="tab-btn scanner-tab" data-tab="editor">${i18n('tabEditor')}</button>
      </div>

      <div class="inspector-toolbar">
        <button class="btn-copy-code btn-copy">${i18n('btnCopy')}</button>
        <button class="btn-codepen">${i18n('btnCodePen')}</button>
        <button class="btn-jsfiddle">${i18n('btnJSFiddle')}</button>
        <button class="btn-scss">${i18n('btnSCSS')}</button>
        <button class="btn-pin">${i18n('btnPin')}</button>
      </div>

      <div class="inspector-content">
        <div class="tab-content active" data-tab="css">
          <div class="css-options">
            <label for="include-children-css">
              <input type="checkbox" id="include-children-css">
              ${i18n('optionIncludeChildren')}
            </label>
          </div>
          <pre class="css-code"></pre>
          <div class="collapsible-section css-variables-section" style="display: none;">
            <div class="collapsible-header" data-section="variables">
              <span>${i18n('cssVariablesTitle')}</span>
              <span class="arrow">&#9654;</span>
            </div>
            <div class="collapsible-body css-variables-content"></div>
          </div>
          <div class="collapsible-section animations-section" style="display: none;">
            <div class="collapsible-header" data-section="animations">
              <span>${i18n('animationsTitle')}</span>
              <span class="arrow">&#9654;</span>
            </div>
            <div class="collapsible-body animations-content"></div>
          </div>
          <div class="collapsible-section box-model-section">
            <div class="collapsible-header" data-section="boxmodel">
              <span>${i18n('boxModelTitle')}</span>
              <span class="arrow">&#9654;</span>
            </div>
            <div class="collapsible-body box-model-content-area"></div>
          </div>
          <div class="collapsible-section color-palette-section" style="display: none;">
            <div class="collapsible-header" data-section="colors">
              <span>${i18n('colorPaletteTitle')}</span>
              <span class="arrow">&#9654;</span>
            </div>
            <div class="collapsible-body color-palette-content"></div>
          </div>
        </div>

        <div class="tab-content" data-tab="html">
          <div class="html-options">
            <label for="include-children-html">
              <input type="checkbox" id="include-children-html" checked>
              ${i18n('optionIncludeChildren')}
            </label>
          </div>
          <pre class="html-code"></pre>
        </div>

        <div class="tab-content" data-tab="source">
          <div class="source-list"></div>
        </div>

        <div class="tab-content" data-tab="editor">
          <div class="editor-controls">
            <button class="btn-apply-css btn-apply">${i18n('btnApply')}</button>
            <button class="btn-reset-css btn-reset">${i18n('btnReset')}</button>
          </div>
          <div class="editor-wrapper">
            <pre class="editor-highlight" aria-hidden="true"></pre>
            <textarea class="css-editor" placeholder="${i18n('tabEditor')}..." spellcheck="false"></textarea>
          </div>
        </div>
      </div>

      <div class="inspector-footer">
        <span>${i18n('footerSpace')} ${i18n('footerTo')} ${state.frozen ? i18n('footerUnfreeze') : i18n('footerFreeze')} • ${i18n('footerBackspace')} ${i18n('footerTo')} ${state.frozen ? i18n('footerFreeze') : i18n('footerUnfreeze')} • ${i18n('footerEsc')} ${i18n('footerTo')} ${i18n('footerClose')}</span>
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

    const jsfiddleBtn = block.querySelector('.btn-jsfiddle');
    jsfiddleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportToJSFiddle();
    });

    const scssBtn = block.querySelector('.btn-scss');
    scssBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const scss = convertToSCSS(state.currentElement);
      copyToClipboard(scss, i18n('notificationSCSSCopied'));
    });

    // Collapsible section toggles
    const collapsibleHeaders = block.querySelectorAll('.collapsible-header');
    collapsibleHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        header.classList.toggle('open');
        const body = header.nextElementSibling;
        if (body) body.classList.toggle('open');
      });
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

    // Sync scroll between editor and highlight using transform
    cssEditor.addEventListener('scroll', (e) => {
      if (editorHighlight) {
        editorHighlight.style.transform = `translate(${-e.target.scrollLeft}px, ${-e.target.scrollTop}px)`;
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
        <h3>${i18n('settingsTitle')}</h3>
        <button class="btn-close-options">×</button>
      </div>

      <div class="options-content">
        <div class="options-section">
          <h4>${i18n('settingsSectionOnClick')}</h4>
          <label>
            <input type="checkbox" id="opt-copy-on-click">
            ${i18n('settingsOptionCopyOnClick')}
          </label>
          <label>
            <input type="checkbox" id="opt-pin-on-space" checked>
            ${i18n('settingsOptionPinOnSpace')}
          </label>
        </div>

        <div class="options-section">
          <h4>${i18n('settingsSectionChildCSS')}</h4>
          <label>
            <input type="radio" name="children-css" value="include">
            ${i18n('settingsOptionIncludeChildren')}
          </label>
          <label>
            <input type="radio" name="children-css" value="exclude" checked>
            ${i18n('settingsOptionExcludeChildren')}
          </label>
        </div>

        <div class="options-section">
          <h4>${i18n('settingsSectionHTML')}</h4>
          <label>
            <input type="checkbox" id="opt-copy-html">
            ${i18n('settingsOptionCopyHTML')}
          </label>
        </div>

        <div class="options-section">
          <h4>${i18n('settingsSectionDisplay')}</h4>
          <label>
            <input type="checkbox" id="opt-show-grid">
            ${i18n('settingsOptionShowGrid')}
          </label>
          <label>
            <input type="checkbox" id="opt-show-guidelines">
            ${i18n('settingsOptionGuidelines')}
          </label>
        </div>

        <div class="options-section">
          <h4>${i18n('settingsSectionTheme')}</h4>
          <label>
            <input type="radio" name="inspector-theme" value="dark" checked>
            ${i18n('settingsThemeDark')}
          </label>
          <label>
            <input type="radio" name="inspector-theme" value="light">
            ${i18n('settingsThemeLight')}
          </label>
        </div>

        <div class="options-section">
          <h4>${i18n('settingsSectionLanguage')}</h4>
          <select id="opt-language" style="width: 100%; padding: 8px; background: var(--scanner-bg-tertiary, #374151); color: var(--scanner-text-primary, #f3f4f6); border: 1px solid var(--scanner-text-muted, #4b5563); border-radius: 4px; font-size: 14px;">
            <option value="auto">${i18n('settingsLanguageAuto')}</option>
            <option value="en">English</option>
            <option value="fr">Français (French)</option>
            <option value="es">Español (Spanish)</option>
            <option value="de">Deutsch (German)</option>
            <option value="pt">Português (Portuguese)</option>
            <option value="ja">日本語 (Japanese)</option>
          </select>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 4px; margin-bottom: 0;">
            ${i18n('settingsLanguageHelp')}
          </p>
        </div>

        <div class="options-section">
          <h4>${i18n('settingsSectionSelectors')}</h4>
          <label>
            <input type="radio" name="selector-mode" value="smart" checked>
            ${i18n('settingsSelectorSmart')}
          </label>
          <label>
            <input type="radio" name="selector-mode" value="original">
            ${i18n('settingsSelectorOriginal')}
          </label>
          <label>
            <input type="radio" name="selector-mode" value="none">
            ${i18n('settingsSelectorNone')}
          </label>
          <label>
            <input type="radio" name="selector-mode" value="truncated">
            ${i18n('settingsSelectorTruncated')}
          </label>
        </div>

        <div class="options-section">
          <h4>${i18n('settingsSectionOther')}</h4>
          <label>
            <input type="checkbox" id="opt-ignore-inherited">
            ${i18n('settingsOptionIgnoreInherited')}
          </label>
          <label>
            <input type="checkbox" id="opt-ignore-vendor" checked>
            ${i18n('settingsOptionIgnoreVendor')}
          </label>
          <label>
            <input type="checkbox" id="opt-ignore-box-sizing">
            ${i18n('settingsOptionIgnoreBoxSizing')}
          </label>
          <label>
            <input type="checkbox" id="opt-convert-font-size">
            ${i18n('settingsOptionConvertFontSize')}
          </label>
          <label>
            <input type="checkbox" id="opt-nest-pseudo">
            ${i18n('settingsOptionNestPseudo')}
          </label>
          <label>
            <input type="checkbox" id="opt-convert-urls" checked>
            ${i18n('settingsOptionConvertURLs')}
          </label>
        </div>
      </div>

      <div class="options-footer">
        <button class="btn-save-options">${i18n('settingsSaveButton')}</button>
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

    // Load language setting
    const languageSelect = panel.querySelector('#opt-language');
    if (languageSelect) {
      languageSelect.value = state.settings.language || 'auto';
    }

    const childrenRadio = state.settings.includeChildren ? 'include' : 'exclude';
    panel.querySelector(`input[name="children-css"][value="${childrenRadio}"]`).checked = true;

    const selectorRadio = panel.querySelector(`input[name="selector-mode"][value="${state.settings.selectorMode}"]`);
    if (selectorRadio) selectorRadio.checked = true;

    const themeRadio = panel.querySelector(`input[name="inspector-theme"][value="${state.settings.inspectorTheme || 'dark'}"]`);
    if (themeRadio) themeRadio.checked = true;
  }

  function refreshInspectorUI() {
    if (!state.inspectorBlock) return;

    // Update tab labels
    const tabs = state.inspectorBlock.querySelectorAll('.scanner-tab');
    tabs.forEach(tab => {
      const tabType = tab.getAttribute('data-tab');
      if (tabType === 'css') tab.textContent = i18n('tabCSS');
      if (tabType === 'html') tab.textContent = i18n('tabHTML');
      if (tabType === 'source') tab.textContent = i18n('tabSource');
      if (tabType === 'editor') tab.textContent = i18n('tabEditor');
    });

    // Update button labels
    const copyBtn = state.inspectorBlock.querySelector('.btn-copy');
    if (copyBtn) copyBtn.textContent = i18n('btnCopy');

    const codepenBtn = state.inspectorBlock.querySelector('.btn-codepen');
    if (codepenBtn) codepenBtn.textContent = i18n('btnCodePen');

    const jsfiddleBtn = state.inspectorBlock.querySelector('.btn-jsfiddle');
    if (jsfiddleBtn) jsfiddleBtn.textContent = i18n('btnJSFiddle');

    const scssBtn = state.inspectorBlock.querySelector('.btn-scss');
    if (scssBtn) scssBtn.textContent = i18n('btnSCSS');

    const pinBtn = state.inspectorBlock.querySelector('.btn-pin');
    if (pinBtn) {
      pinBtn.textContent = state.frozen ? i18n('btnUnpin') : i18n('btnPin');
    }

    // Update Editor tab buttons
    const applyBtn = state.inspectorBlock.querySelector('.btn-apply');
    if (applyBtn) applyBtn.textContent = i18n('btnApply');

    const resetBtn = state.inspectorBlock.querySelector('.btn-reset');
    if (resetBtn) resetBtn.textContent = i18n('btnReset');

    // Update checkboxes
    const includeChildrenLabel = state.inspectorBlock.querySelector('label[for="include-children-css"]');
    if (includeChildrenLabel) {
      const checkbox = includeChildrenLabel.querySelector('input');
      includeChildrenLabel.innerHTML = '';
      includeChildrenLabel.appendChild(checkbox);
      includeChildrenLabel.appendChild(document.createTextNode(i18n('optionIncludeChildren')));
    }

    const includeChildrenHTMLLabel = state.inspectorBlock.querySelector('label[for="include-children-html"]');
    if (includeChildrenHTMLLabel) {
      const checkbox = includeChildrenHTMLLabel.querySelector('input');
      includeChildrenHTMLLabel.innerHTML = '';
      includeChildrenHTMLLabel.appendChild(checkbox);
      includeChildrenHTMLLabel.appendChild(document.createTextNode(i18n('optionIncludeChildren')));
    }

    // Update footer
    updateFooter();

    // Refresh the current tab content
    if (state.currentTab === 'css') updateCSSTab();
    if (state.currentTab === 'html') updateHTMLTab();
    if (state.currentTab === 'source') updateSourceTab();
    if (state.currentTab === 'editor') updateEditorTab();

    // Refresh the settings panel if it exists
    if (state.optionsPanel) {
      const isVisible = state.optionsPanel.style.display !== 'none';
      const currentSettings = { ...state.settings }; // Save current settings

      // Remove and recreate the panel
      state.optionsPanel.remove();
      state.optionsPanel = createOptionsPanel();

      // Restore visibility
      if (isVisible) {
        state.optionsPanel.style.display = 'flex';
      }
    }

    // Refresh the guide overlay if it exists
    const guideOverlay = document.getElementById('css-scanner-guide-overlay');
    if (guideOverlay) {
      const isVisible = guideOverlay.style.display !== 'none';

      // Remove the old guide
      guideOverlay.remove();

      // If it was visible, recreate and show it
      if (isVisible) {
        showGuideOverlay();
      }
    }
  }

  async function saveOptions() {
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

    // Get theme setting
    const themeRadio = panel.querySelector('input[name="inspector-theme"]:checked');
    const newTheme = themeRadio ? themeRadio.value : 'dark';
    const themeChanged = state.settings.inspectorTheme !== newTheme;
    state.settings.inspectorTheme = newTheme;

    if (themeChanged) {
      applyTheme(newTheme);
    }

    // Get language setting
    const languageSelect = panel.querySelector('#opt-language');
    const newLanguage = languageSelect ? languageSelect.value : 'auto';
    const languageChanged = state.settings.language !== newLanguage;
    state.settings.language = newLanguage;

    // Apply language change
    if (languageChanged) {
      currentLanguage = newLanguage;
      if (newLanguage !== 'auto') {
        await loadTranslations(newLanguage);
      } else {
        translationCache = {};
      }

      // Refresh the UI if scanner is active
      if (state.active && state.inspectorBlock) {
        refreshInspectorUI();
      }
    }

    // Save to chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ cssScanner: state.settings }, () => {
        showNotification(i18n('settingsSave') + 'd!'); // "Settings saved!" or translated
      });
    } else {
      localStorage.setItem('cssScanner', JSON.stringify(state.settings));
      showNotification(i18n('settingsSave') + 'd!');
    }
  }

  async function loadSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['cssScanner'], async (result) => {
          if (result.cssScanner) {
            Object.assign(state.settings, result.cssScanner);

            // Apply language setting
            if (state.settings.language && state.settings.language !== 'auto') {
              currentLanguage = state.settings.language;
              await loadTranslations(currentLanguage);
            }
          }
          resolve();
        });
      } else {
        (async () => {
          const saved = localStorage.getItem('cssScanner');
          if (saved) {
            try {
              Object.assign(state.settings, JSON.parse(saved));

              // Apply language setting
              if (state.settings.language && state.settings.language !== 'auto') {
                currentLanguage = state.settings.language;
                await loadTranslations(currentLanguage);
              }
            } catch(e) {
              console.error('Failed to load settings:', e);
            }
          }
          resolve();
        })();
      }
    });
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

    // Update content for the selected tab (only if dirty)
    if (state.currentElement) {
      if (state._dirtyTabs[tabName]) {
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
        state._dirtyTabs[tabName] = false;
      }
    }
  }

  function updateCSSTab() {
    const cssCode = state.inspectorBlock.querySelector('.css-code');

    if (state.settings.includeChildren) {
      const fullCSS = extractWithChildren(state.currentElement);
      cssCode.innerHTML = highlightCSS(fullCSS);
      const props = extractCSS(state.currentElement, false);
      state.displayedCSS = optimizeCSSProperties(props);
    } else {
      const props = extractCSS(state.currentElement, false);
      const optimizedProps = optimizeCSSProperties(props);
      state.displayedCSS = optimizedProps;

      let css = '';
      optimizedProps.forEach(({ prop, value }) => {
        css += `  ${prop}: ${value};\n`;
      });

      const selector = getElementSelector(state.currentElement, state.settings.selectorMode);
      const fullCSS = `${selector} {\n${css}}`;
      cssCode.innerHTML = highlightCSS(fullCSS);
    }

    // Update CSS Variables section
    updateCSSVariablesSection();

    // Update Animations section
    updateAnimationsSection();

    // Update Box Model
    updateBoxModelSection();

    // Update Color Palette
    updateColorPaletteSection();
  }

  function updateCSSVariablesSection() {
    const section = state.inspectorBlock.querySelector('.css-variables-section');
    const content = state.inspectorBlock.querySelector('.css-variables-content');
    if (!section || !content) return;

    const vars = extractCSSVariables(state.currentElement);

    if (vars.defined.length === 0 && vars.used.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    let html = '';

    if (vars.defined.length > 0) {
      html += `<div style="margin-bottom: 8px; font-size: 11px; color: var(--scanner-text-secondary); font-weight: 600;">${i18n('cssVariablesDefined')}</div>`;
      vars.defined.forEach(v => {
        html += `<div class="var-item">
          <span class="var-name">${v.name}</span>: <span class="var-value">${v.value}</span>
          ${v.resolved !== v.value ? `<div class="var-resolved">${i18n('cssVariablesResolved')}: ${v.resolved}</div>` : ''}
        </div>`;
      });
    }

    if (vars.used.length > 0) {
      html += `<div style="margin-top: 8px; margin-bottom: 8px; font-size: 11px; color: var(--scanner-text-secondary); font-weight: 600;">${i18n('cssVariablesUsed')}</div>`;
      vars.used.forEach(v => {
        html += `<div class="var-item">
          <span class="var-name">${v.name}</span> in <span style="color: #60a5fa;">${v.usedIn}</span>
          <div class="var-resolved">${i18n('cssVariablesResolved')}: ${v.resolved}</div>
        </div>`;
      });
    }

    content.innerHTML = html;
  }

  function updateAnimationsSection() {
    const section = state.inspectorBlock.querySelector('.animations-section');
    const content = state.inspectorBlock.querySelector('.animations-content');
    if (!section || !content) return;

    const anims = extractAnimations(state.currentElement);

    if (anims.transitions.length === 0 && anims.animations.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    let html = '';

    if (anims.transitions.length > 0) {
      html += `<div style="margin-bottom: 8px; font-size: 11px; color: var(--scanner-text-secondary); font-weight: 600;">${i18n('animationsTransitions')}</div>`;
      anims.transitions.forEach(t => {
        html += `<div class="anim-item">
          <span style="color: #60a5fa;">${t.property}</span>
          <span style="color: #fb923c;">${t.duration}</span>
          <span style="color: #34d399;">${t.timing}</span>
          ${t.delay !== '0s' ? `<span style="color: #a78bfa;">delay: ${t.delay}</span>` : ''}
        </div>`;
      });
    }

    if (anims.animations.length > 0) {
      html += `<div style="margin-top: 8px; margin-bottom: 8px; font-size: 11px; color: var(--scanner-text-secondary); font-weight: 600;">${i18n('animationsAnimations')}</div>`;
      anims.animations.forEach(a => {
        html += `<div class="anim-item">
          <span style="color: #fbbf24; font-weight: 600;">${a.name}</span>
          <span style="color: #fb923c;">${a.duration}</span>
          <span style="color: #34d399;">${a.timing}</span>
          ${a.delay !== '0s' ? `<span style="color: #a78bfa;">delay: ${a.delay}</span>` : ''}
          <span style="color: var(--scanner-text-secondary);">x${a.iterationCount}</span>
          <span style="color: var(--scanner-text-secondary);">${a.direction}</span>
        </div>`;
      });
    }

    if (anims.keyframes.length > 0) {
      html += `<div style="margin-top: 8px; margin-bottom: 8px; font-size: 11px; color: var(--scanner-text-secondary); font-weight: 600;">${i18n('animationsKeyframes')}</div>`;
      anims.keyframes.forEach(k => {
        html += `<pre style="padding: 8px; background: var(--scanner-bg-secondary); border-radius: 4px; font-size: 11px; color: var(--scanner-text-primary); margin: 4px 0; white-space: pre-wrap;">${highlightCSS(k.css)}</pre>`;
      });
    }

    content.innerHTML = html;
  }

  function updateBoxModelSection() {
    const content = state.inspectorBlock.querySelector('.box-model-content-area');
    if (!content) return;
    content.innerHTML = renderBoxModel(state.currentElement);
  }

  function updateColorPaletteSection() {
    const section = state.inspectorBlock.querySelector('.color-palette-section');
    const content = state.inspectorBlock.querySelector('.color-palette-content');
    if (!section || !content) return;

    const allProps = state.settings.includeChildren
      ? (() => {
          const props = extractCSS(state.currentElement, false);
          const children = state.currentElement.querySelectorAll('*');
          Array.from(children).slice(0, 50).forEach(child => {
            props.push(...extractCSS(child, false));
          });
          return props;
        })()
      : extractCSS(state.currentElement, false);

    const colors = extractColors(allProps);

    if (colors.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    let html = '<div class="color-palette">';
    colors.forEach(color => {
      html += `<div class="color-swatch" data-color="${color}" title="Click to copy">
        <span class="color-circle" style="background: ${color};"></span>
        <span>${color}</span>
      </div>`;
    });
    html += '</div>';

    content.innerHTML = html;

    // Add click handlers for swatches
    content.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(swatch.dataset.color, i18n('notificationColorCopied'));
      });
    });
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
    const sources = getSourceFilesWithSpecificity(state.currentElement);
    state.sourceFiles = sources;

    if (sources.length === 0) {
      sourceList.innerHTML = '<p style="padding: 20px; color: var(--scanner-text-secondary);">No CSS sources found</p>';
      return;
    }

    let html = '<div style="padding: 10px;">';
    sources.forEach(({ url, ruleCount, rules }) => {
      html += `
        <div style="margin-bottom: 12px; padding: 10px; background: var(--scanner-bg-secondary); border-radius: 4px;">
          <div style="color: var(--scanner-accent); font-size: 12px; margin-bottom: 4px; word-break: break-all;">${url}</div>
          <div style="color: var(--scanner-text-secondary); font-size: 11px; margin-bottom: 6px;">${ruleCount} ${ruleCount === 1 ? 'rule' : 'rules'}</div>
      `;
      if (rules && rules.length > 0) {
        rules.forEach(rule => {
          let mediaBadge = '';
          if (rule.mediaText) {
            const isActive = window.matchMedia(rule.mediaText).matches;
            const badgeClass = isActive ? 'media-badge-active' : 'media-badge-inactive';
            const statusText = isActive ? i18n('mediaQueryActive') : i18n('mediaQueryInactive');
            mediaBadge = ` <span class="media-badge ${badgeClass}" title="@media ${rule.mediaText}">@media ${rule.mediaText} <span class="media-status">${statusText}</span></span>`;
          }
          html += `<div style="font-size: 11px; padding: 2px 0; font-family: 'Courier New', monospace; color: var(--scanner-text-primary);">
            ${rule.selector} <span class="specificity-badge">${i18n('specificityLabel')}: ${formatSpecificity(rule.specificity)}</span>${mediaBadge}
          </div>`;
        });
      }
      html += '</div>';
    });
    html += '</div>';

    sourceList.innerHTML = html;
  }

  function getSourceFilesWithSpecificity(element) {
    const sources = [];
    const sourceMap = new Map(); // url -> { rules: [], ruleCount }

    // Use stylesheet cache if available
    if (state._stylesheetCache) {
      for (const entry of state._stylesheetCache) {
        if (!entry.rule) {
          // Cross-origin stylesheet
          if (entry.crossOrigin && entry.sheet.href) {
            const url = entry.sheet.href;
            if (!sourceMap.has(url)) {
              sourceMap.set(url, { url, ruleCount: '?', rules: [] });
            }
          }
          continue;
        }
        try {
          if (element.matches(entry.rule.selectorText)) {
            const url = entry.sheet.href || 'inline styles';
            if (!sourceMap.has(url)) {
              sourceMap.set(url, { url, ruleCount: 0, rules: [] });
            }
            const source = sourceMap.get(url);
            source.ruleCount++;
            source.rules.push({
              selector: entry.rule.selectorText,
              specificity: calculateSpecificity(entry.rule.selectorText),
              mediaText: entry.mediaText || null
            });
          }
        } catch(e) { /* invalid selector */ }
      }
    } else {
      // Fallback: iterate stylesheets directly
      try {
        for (const sheet of document.styleSheets) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            const matchingRules = [];
            rules.forEach(rule => {
              try {
                if (rule.selectorText && element.matches(rule.selectorText)) {
                  matchingRules.push({
                    selector: rule.selectorText,
                    specificity: calculateSpecificity(rule.selectorText),
                    mediaText: null
                  });
                }
              } catch(e) { /* invalid selector */ }
            });

            if (matchingRules.length > 0) {
              const url = sheet.href || 'inline styles';
              if (!sourceMap.has(url)) {
                sourceMap.set(url, { url, ruleCount: matchingRules.length, rules: matchingRules });
              }
            }
          } catch(e) {
            if (sheet.href && !sourceMap.has(sheet.href)) {
              sourceMap.set(sheet.href, { url: sheet.href, ruleCount: '?', rules: [] });
            }
          }
        }
      } catch(e) { /* error */ }
    }

    // Convert map to array
    sourceMap.forEach(source => sources.push(source));

    if (element.style.length > 0) {
      sources.push({
        url: 'element.style (inline)',
        ruleCount: element.style.length,
        rules: []
      });
    }

    return sources;
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

    // Mark all tabs dirty when element changes
    if (element !== state.currentElement) {
      state._dirtyTabs = { css: true, html: true, source: true, editor: true };
      // Reset computed style cache for new element
      state._computedStyleCache = new WeakMap();
    }

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
    const fullPath = [];
    let current = element;

    // Helper function to truncate long class names
    function truncateClassName(className, maxLength = 15) {
      if (className.length <= maxLength) return className;
      return className.substring(0, maxLength) + '...';
    }

    while (current && current !== document.body) {
      const tag = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : '';
      const cls = current.classList.length > 0 ? `.${current.classList[0]}` : '';

      // Store full selector for tooltip
      const fullSelector = `${tag}${id}${cls}`;
      fullPath.unshift(fullSelector);

      // Create display version with truncated class name
      const truncatedCls = current.classList.length > 0 ? `.${truncateClassName(current.classList[0])}` : '';
      const displaySelector = `${tag}${id}${truncatedCls}`;
      path.unshift(displaySelector);

      current = current.parentElement;
    }

    // Apply depth limiting if configured
    const maxDepth = state.settings.maxBreadcrumbDepth || 0;
    const isTruncated = maxDepth > 0 && path.length > maxDepth;
    const displayPath = isTruncated ? path.slice(-maxDepth) : path;
    const displayFullPath = isTruncated ? fullPath.slice(-maxDepth) : fullPath;

    // Build breadcrumb HTML with ellipsis indicator if truncated
    let breadcrumbHTML = '';
    if (isTruncated) {
      breadcrumbHTML = `<span class="breadcrumb-ellipsis" title="Path truncated - showing last ${maxDepth} of ${path.length} levels">...</span> › `;
    }

    breadcrumbHTML += displayPath.map((item, index) => {
      const fullItem = displayFullPath[index];
      const title = fullItem !== item ? fullItem : '';
      return `<span class="breadcrumb-item" data-index="${isTruncated ? index + (path.length - maxDepth) : index}" ${title ? `title="${title}"` : ''}>${item}</span>`;
    }).join(' › ');

    breadcrumb.innerHTML = breadcrumbHTML;

    // Add click handlers for breadcrumb navigation
    breadcrumb.querySelectorAll('.breadcrumb-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const dataIndex = parseInt(item.getAttribute('data-index'));
        let target = element;
        const steps = fullPath.length - 1 - dataIndex;
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
    footer.textContent = `${i18n('footerSpace')} ${i18n('footerTo')} ${state.frozen ? i18n('footerUnfreeze') : i18n('footerFreeze')} • ${i18n('footerBackspace')} ${i18n('footerTo')} ${state.frozen ? i18n('footerFreeze') : i18n('footerUnfreeze')} • ${i18n('footerEsc')} ${i18n('footerTo')} ${i18n('footerClose')}`;
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

    // Throttle with requestAnimationFrame
    if (state._rafPending) return;
    state._rafPending = true;
    const target = e.target;
    requestAnimationFrame(() => {
      state._rafPending = false;
      if (state.active && !state.frozen) {
        updateInspector(target);
      }
    });
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

    // Check if focus is in editor textarea (don't intercept typing)
    const isInEditor = document.activeElement &&
      document.activeElement.classList.contains('css-editor');

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

    // Sibling navigation: ArrowLeft / ArrowRight
    if (e.key === 'ArrowLeft' && !isInEditor) {
      e.preventDefault();
      if (state.currentElement && state.currentElement.previousElementSibling) {
        updateInspector(state.currentElement.previousElementSibling);
      }
    }

    if (e.key === 'ArrowRight' && !isInEditor) {
      e.preventDefault();
      if (state.currentElement && state.currentElement.nextElementSibling) {
        updateInspector(state.currentElement.nextElementSibling);
      }
    }

    // Tab switching with number keys (1-4)
    if (!isInEditor) {
      const tabMap = { '1': 'css', '2': 'html', '3': 'source', '4': 'editor' };
      if (tabMap[e.key]) {
        e.preventDefault();
        switchTab(tabMap[e.key]);
      }
    }

    // Quick copy: Ctrl+C / Cmd+C when no text selected
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isInEditor) {
      const selection = window.getSelection().toString();
      if (!selection) {
        e.preventDefault();
        copyCurrentTab();
      }
    }

    // Section cycling in CSS tab: Tab / Shift+Tab
    if (e.key === 'Tab' && !isInEditor && state.currentTab === 'css') {
      e.preventDefault();
      const sections = state.inspectorBlock.querySelectorAll('.collapsible-header');
      if (sections.length > 0) {
        if (e.shiftKey) {
          state._currentSectionIndex = state._currentSectionIndex <= 0 ? sections.length - 1 : state._currentSectionIndex - 1;
        } else {
          state._currentSectionIndex = (state._currentSectionIndex + 1) % sections.length;
        }
        const target = sections[state._currentSectionIndex];
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Expand the section if collapsed
        const body = target.nextElementSibling;
        if (body && body.style.display === 'none') {
          target.click();
        }
      }
    }
  }

  // ========================================
  // ACTIVATION / DEACTIVATION
  // ========================================

  async function activateScanner() {
    if (state.active) return;

    state.active = true;

    // Load settings first
    await loadSettings();

    // Build performance caches
    buildStylesheetCache();
    state._computedStyleCache = new WeakMap();

    // Create UI elements
    state.overlay = createOverlay();
    state.inspectorBlock = createInspectorBlock();

    // Apply saved theme
    applyTheme(state.settings.inspectorTheme || 'dark');

    // Sync checkbox states after settings are loaded
    const includeChildrenCSSCheckbox = state.inspectorBlock.querySelector('#include-children-css');
    const includeChildrenHTMLCheckbox = state.inspectorBlock.querySelector('#include-children-html');
    if (includeChildrenCSSCheckbox) {
      includeChildrenCSSCheckbox.checked = state.settings.includeChildren;
    }
    if (includeChildrenHTMLCheckbox) {
      includeChildrenHTMLCheckbox.checked = state.settings.includeChildrenHTML;
    }

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyboard, true);

    // Setup breakpoint badge + resize listener
    updateBreakpointBadge();
    state._resizeHandler = () => {
      updateBreakpointBadge();
      // Rebuild stylesheet cache on resize (media queries may have changed)
      buildStylesheetCache();
    };
    window.addEventListener('resize', state._resizeHandler);

    showNotification(i18n('notificationActivated'));
  }

  function deactivateScanner() {
    if (!state.active) return;

    state.active = false;
    state.frozen = false;

    // Clear performance caches
    state._stylesheetCache = null;
    state._computedStyleCache = null;
    state._rafPending = false;
    state._currentSectionIndex = -1;

    // Remove resize listener
    if (state._resizeHandler) {
      window.removeEventListener('resize', state._resizeHandler);
      state._resizeHandler = null;
    }

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
  // THEME SYSTEM
  // ========================================

  function getThemeColors(theme) {
    if (theme === 'light') {
      return {
        bgPrimary: '#ffffff',
        bgSecondary: '#f3f4f6',
        bgTertiary: '#e5e7eb',
        textPrimary: '#1f2937',
        textSecondary: '#4b5563',
        textMuted: '#6b7280',
        border: '#d1d5db',
        accent: '#3b82f6',
        accentHover: '#2563eb',
        codeBg: '#f9fafb',
        scrollTrack: '#f3f4f6',
        scrollThumb: '#9ca3af',
        scrollThumbHover: '#6b7280',
        pinBg: '#9ca3af',
        pinBgHover: '#6b7280',
        editorApply: '#10b981',
        editorApplyHover: '#059669',
        editorReset: '#ef4444',
        editorResetHover: '#dc2626'
      };
    }
    return {
      bgPrimary: '#1f2937',
      bgSecondary: '#111827',
      bgTertiary: '#374151',
      textPrimary: '#f3f4f6',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
      border: '#374151',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      codeBg: 'transparent',
      scrollTrack: '#111827',
      scrollThumb: '#4b5563',
      scrollThumbHover: '#6b7280',
      pinBg: '#6b7280',
      pinBgHover: '#4b5563',
      editorApply: '#10b981',
      editorApplyHover: '#059669',
      editorReset: '#ef4444',
      editorResetHover: '#dc2626'
    };
  }

  function applyTheme(theme) {
    const c = getThemeColors(theme);
    const block = document.getElementById('css-scanner-block');
    if (block) {
      block.style.setProperty('--scanner-bg-primary', c.bgPrimary);
      block.style.setProperty('--scanner-bg-secondary', c.bgSecondary);
      block.style.setProperty('--scanner-bg-tertiary', c.bgTertiary);
      block.style.setProperty('--scanner-text-primary', c.textPrimary);
      block.style.setProperty('--scanner-text-secondary', c.textSecondary);
      block.style.setProperty('--scanner-text-muted', c.textMuted);
      block.style.setProperty('--scanner-border', c.border);
      block.style.setProperty('--scanner-accent', c.accent);
      block.style.setProperty('--scanner-accent-hover', c.accentHover);
      block.style.setProperty('--scanner-code-bg', c.codeBg);
      block.style.setProperty('--scanner-scroll-track', c.scrollTrack);
      block.style.setProperty('--scanner-scroll-thumb', c.scrollThumb);
      block.style.setProperty('--scanner-scroll-thumb-hover', c.scrollThumbHover);
      block.style.setProperty('--scanner-pin-bg', c.pinBg);
      block.style.setProperty('--scanner-pin-bg-hover', c.pinBgHover);
      block.style.setProperty('--scanner-editor-apply', c.editorApply);
      block.style.setProperty('--scanner-editor-apply-hover', c.editorApplyHover);
      block.style.setProperty('--scanner-editor-reset', c.editorReset);
      block.style.setProperty('--scanner-editor-reset-hover', c.editorResetHover);
    }
    // Also update options panel if it exists
    const optPanel = document.getElementById('css-scanner-options');
    if (optPanel) {
      optPanel.style.background = c.bgPrimary + ' !important';
      optPanel.style.color = c.textPrimary + ' !important';
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
        --scanner-bg-primary: #1f2937;
        --scanner-bg-secondary: #111827;
        --scanner-bg-tertiary: #374151;
        --scanner-text-primary: #f3f4f6;
        --scanner-text-secondary: #9ca3af;
        --scanner-text-muted: #6b7280;
        --scanner-border: #374151;
        --scanner-accent: #3b82f6;
        --scanner-accent-hover: #2563eb;
        --scanner-code-bg: transparent;
        --scanner-scroll-track: #111827;
        --scanner-scroll-thumb: #4b5563;
        --scanner-scroll-thumb-hover: #6b7280;
        --scanner-pin-bg: #6b7280;
        --scanner-pin-bg-hover: #4b5563;
        --scanner-editor-apply: #10b981;
        --scanner-editor-apply-hover: #059669;
        --scanner-editor-reset: #ef4444;
        --scanner-editor-reset-hover: #dc2626;

        position: fixed !important;
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        background: var(--scanner-bg-primary) !important;
        color: var(--scanner-text-primary) !important;
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
        background: var(--scanner-bg-secondary) !important;
        padding: 12px 16px !important;
        border-bottom: 1px solid var(--scanner-border) !important;
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
        color: var(--scanner-accent) !important;
        font-weight: 600 !important;
        font-size: 14px !important;
      }

      .element-size {
        color: var(--scanner-text-secondary) !important;
        font-size: 11px !important;
        margin-top: 2px !important;
      }

      .inspector-actions {
        display: flex !important;
        gap: 8px !important;
      }

      .inspector-actions button {
        background: transparent !important;
        border: 1px solid var(--scanner-text-muted) !important;
        color: var(--scanner-text-primary) !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 16px !important;
        line-height: 1 !important;
      }

      .inspector-actions button:hover {
        background: var(--scanner-bg-tertiary) !important;
      }

      .inspector-breadcrumb {
        background: var(--scanner-bg-secondary) !important;
        padding: 8px 16px !important;
        border-bottom: 1px solid var(--scanner-border) !important;
        font-size: 11px !important;
        color: var(--scanner-text-secondary) !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        white-space: nowrap !important;
        max-height: 32px !important;
        scrollbar-width: thin !important;
        scrollbar-color: var(--scanner-scroll-thumb) var(--scanner-scroll-track) !important;
      }

      .inspector-breadcrumb::-webkit-scrollbar {
        height: 4px !important;
      }

      .inspector-breadcrumb::-webkit-scrollbar-track {
        background: var(--scanner-scroll-track) !important;
      }

      .inspector-breadcrumb::-webkit-scrollbar-thumb {
        background: var(--scanner-scroll-thumb) !important;
        border-radius: 2px !important;
      }

      .inspector-breadcrumb::-webkit-scrollbar-thumb:hover {
        background: var(--scanner-scroll-thumb-hover) !important;
      }

      .breadcrumb-item {
        cursor: pointer !important;
        color: var(--scanner-accent) !important;
      }

      .breadcrumb-item:hover {
        text-decoration: underline !important;
      }

      .breadcrumb-ellipsis {
        color: #fbbf24 !important;
        font-weight: bold !important;
        cursor: help !important;
        padding: 0 4px !important;
      }

      .inspector-tabs {
        background: var(--scanner-bg-secondary) !important;
        display: block !important;
        border-bottom: 1px solid var(--scanner-border) !important;
        padding: 0 16px !important;
      }

      .tab-btn {
        background: transparent !important;
        border: none !important;
        color: var(--scanner-text-secondary) !important;
        padding: 10px 16px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        border-bottom: 2px solid transparent !important;
        margin-bottom: -1px !important;
        margin-right: 0 !important;
        white-space: nowrap !important;
        display: inline-block !important;
        vertical-align: bottom !important;
        float: none !important;
      }

      .tab-btn:hover {
        color: var(--scanner-text-primary) !important;
      }

      .tab-btn.active {
        color: var(--scanner-accent) !important;
        border-bottom-color: var(--scanner-accent) !important;
      }

      .inspector-toolbar {
        background: var(--scanner-bg-primary) !important;
        padding: 10px 16px !important;
        border-bottom: 1px solid var(--scanner-border) !important;
        display: flex !important;
        gap: 8px !important;
        flex-wrap: wrap !important;
      }

      .inspector-toolbar button {
        background: var(--scanner-accent) !important;
        border: none !important;
        color: white !important;
        padding: 6px 12px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }

      .inspector-toolbar button:hover {
        background: var(--scanner-accent-hover) !important;
      }

      .btn-pin {
        background: var(--scanner-pin-bg) !important;
      }

      .btn-pin:hover {
        background: var(--scanner-pin-bg-hover) !important;
      }

      .inspector-content {
        flex: 1 !important;
        overflow-y: auto !important;
        background: var(--scanner-bg-primary) !important;
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
        color: var(--scanner-text-primary) !important;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: 12px !important;
        line-height: 1.6 !important;
        background: var(--scanner-code-bg) !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        user-select: text !important;
        cursor: text !important;
      }

      .css-options,
      .html-options {
        padding: 12px 16px !important;
        background: var(--scanner-bg-secondary) !important;
        border-bottom: 1px solid var(--scanner-border) !important;
      }

      .css-options label,
      .html-options label {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        color: var(--scanner-text-primary) !important;
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
        background: var(--scanner-bg-secondary) !important;
        border-bottom: 1px solid var(--scanner-border) !important;
        display: flex !important;
        gap: 8px !important;
      }

      .editor-controls button {
        background: var(--scanner-editor-apply) !important;
        border: none !important;
        color: white !important;
        padding: 6px 12px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }

      .editor-controls button:hover {
        background: var(--scanner-editor-apply-hover) !important;
      }

      .btn-reset-css {
        background: var(--scanner-editor-reset) !important;
      }

      .btn-reset-css:hover {
        background: var(--scanner-editor-reset-hover) !important;
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
        min-height: 100% !important;
        padding: 16px !important;
        margin: 0 !important;
        background: var(--scanner-bg-secondary) !important;
        color: transparent !important;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: 12px !important;
        line-height: 1.6 !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        pointer-events: none !important;
        z-index: 1 !important;
        overflow: visible !important;
        will-change: transform !important;
      }

      .css-editor {
        position: relative !important;
        width: 100% !important;
        min-height: 300px !important;
        padding: 16px !important;
        background: transparent !important;
        color: var(--scanner-text-primary) !important;
        border: none !important;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: 12px !important;
        line-height: 1.6 !important;
        resize: vertical !important;
        z-index: 2 !important;
        caret-color: var(--scanner-text-primary) !important;
        scrollbar-width: none !important;
      }

      .css-editor::-webkit-scrollbar {
        display: none !important;
      }

      .css-editor:focus {
        outline: none !important;
      }

      .inspector-footer {
        background: var(--scanner-bg-secondary) !important;
        padding: 8px 16px !important;
        border-top: 1px solid var(--scanner-border) !important;
        font-size: 11px !important;
        color: var(--scanner-text-secondary) !important;
        text-align: center !important;
      }

      #css-scanner-options .options-header {
        background: var(--scanner-bg-secondary, #111827) !important;
        padding: 16px 20px !important;
        border-bottom: 1px solid var(--scanner-border, #374151) !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }

      #css-scanner-options h3 {
        margin: 0 !important;
        color: var(--scanner-text-primary, #f3f4f6) !important;
        font-size: 18px !important;
        font-weight: 600 !important;
      }

      .btn-close-options {
        background: transparent !important;
        border: 1px solid var(--scanner-text-muted, #4b5563) !important;
        color: var(--scanner-text-primary, #f3f4f6) !important;
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
        background: var(--scanner-bg-tertiary, #374151) !important;
      }

      #css-scanner-options .options-content {
        padding: 20px !important;
      }

      .options-section {
        margin-bottom: 24px !important;
      }

      .options-section h4 {
        margin: 0 0 12px 0 !important;
        color: var(--scanner-accent, #60a5fa) !important;
        font-size: 13px !important;
        font-weight: 600 !important;
      }

      .options-section label {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        margin-bottom: 8px !important;
        color: var(--scanner-text-primary, #f3f4f6) !important;
        font-size: 13px !important;
        cursor: pointer !important;
      }

      .options-section input[type="checkbox"],
      .options-section input[type="radio"] {
        cursor: pointer !important;
      }

      #css-scanner-options .options-footer {
        background: var(--scanner-bg-secondary, #111827) !important;
        padding: 16px 20px !important;
        border-top: 1px solid var(--scanner-border, #374151) !important;
        text-align: right !important;
      }

      .btn-save-options {
        background: var(--scanner-accent, #3b82f6) !important;
        border: none !important;
        color: white !important;
        padding: 10px 20px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        font-weight: 600 !important;
      }

      .btn-save-options:hover {
        background: var(--scanner-accent-hover, #2563eb) !important;
      }

      /* New feature styles */
      .collapsible-section {
        border-top: 1px solid var(--scanner-border) !important;
      }

      .collapsible-header {
        padding: 10px 16px !important;
        background: var(--scanner-bg-secondary) !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        color: var(--scanner-accent) !important;
        user-select: none !important;
      }

      .collapsible-header:hover {
        background: var(--scanner-bg-tertiary) !important;
      }

      .collapsible-header .arrow {
        transition: transform 0.2s ease !important;
        font-size: 10px !important;
      }

      .collapsible-header.open .arrow {
        transform: rotate(90deg) !important;
      }

      .collapsible-body {
        display: none !important;
        padding: 12px 16px !important;
      }

      .collapsible-body.open {
        display: block !important;
      }

      .var-item, .anim-item {
        padding: 6px 8px !important;
        margin-bottom: 4px !important;
        background: var(--scanner-bg-secondary) !important;
        border-radius: 4px !important;
        font-size: 12px !important;
        font-family: 'Courier New', Courier, monospace !important;
      }

      .var-name {
        color: var(--scanner-accent) !important;
        font-weight: 600 !important;
      }

      .var-value {
        color: #34d399 !important;
      }

      .var-resolved {
        color: var(--scanner-text-secondary) !important;
        font-size: 11px !important;
      }

      .specificity-badge {
        display: inline-block !important;
        background: var(--scanner-bg-tertiary) !important;
        color: #fbbf24 !important;
        padding: 2px 6px !important;
        border-radius: 3px !important;
        font-size: 10px !important;
        font-family: 'Courier New', Courier, monospace !important;
        margin-left: 8px !important;
      }

      .breakpoint-badge {
        display: inline-block !important;
        padding: 2px 8px !important;
        border-radius: 10px !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        border: 1px solid !important;
        margin-left: 8px !important;
        vertical-align: middle !important;
        letter-spacing: 0.5px !important;
      }

      .media-badge {
        display: inline-block !important;
        padding: 1px 6px !important;
        border-radius: 3px !important;
        font-size: 9px !important;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
        margin-left: 6px !important;
        vertical-align: middle !important;
      }

      .media-badge-active {
        background: rgba(34, 197, 94, 0.15) !important;
        color: #22c55e !important;
        border: 1px solid rgba(34, 197, 94, 0.3) !important;
      }

      .media-badge-inactive {
        background: rgba(107, 114, 128, 0.15) !important;
        color: #9ca3af !important;
        border: 1px solid rgba(107, 114, 128, 0.3) !important;
      }

      .media-status {
        font-weight: 600 !important;
        margin-left: 4px !important;
      }

      .box-model-diagram {
        padding: 16px !important;
        display: flex !important;
        justify-content: center !important;
      }

      .box-model-margin {
        background: rgba(251, 146, 60, 0.15) !important;
        border: 1px dashed #fb923c !important;
        padding: 12px !important;
        text-align: center !important;
        position: relative !important;
        min-width: 280px !important;
      }

      .box-model-border {
        background: rgba(251, 191, 36, 0.15) !important;
        border: 1px dashed #fbbf24 !important;
        padding: 12px !important;
      }

      .box-model-padding {
        background: rgba(52, 211, 153, 0.15) !important;
        border: 1px dashed #34d399 !important;
        padding: 12px !important;
      }

      .box-model-content {
        background: rgba(96, 165, 250, 0.15) !important;
        border: 1px dashed #60a5fa !important;
        padding: 8px !important;
        text-align: center !important;
        color: var(--scanner-text-primary) !important;
        font-size: 11px !important;
      }

      .box-model-label {
        position: absolute !important;
        top: 2px !important;
        left: 4px !important;
        font-size: 9px !important;
        color: var(--scanner-text-muted) !important;
        text-transform: uppercase !important;
      }

      .box-model-value {
        font-size: 10px !important;
        color: var(--scanner-text-secondary) !important;
        font-family: 'Courier New', Courier, monospace !important;
      }

      .box-model-value-top, .box-model-value-bottom {
        text-align: center !important;
        padding: 2px 0 !important;
      }

      .box-model-value-sides {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }

      .color-palette {
        padding: 12px 16px !important;
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
      }

      .color-swatch {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 4px 8px !important;
        background: var(--scanner-bg-secondary) !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 11px !important;
        font-family: 'Courier New', Courier, monospace !important;
        color: var(--scanner-text-primary) !important;
      }

      .color-swatch:hover {
        background: var(--scanner-bg-tertiary) !important;
      }

      .color-circle {
        width: 16px !important;
        height: 16px !important;
        border-radius: 50% !important;
        border: 1px solid var(--scanner-border) !important;
        flex-shrink: 0 !important;
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
