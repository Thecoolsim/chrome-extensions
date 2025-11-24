// CSS Scanner Pro - Main Content Script
(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__CSS_SCANNER_LOADED__) {
    return;
  }
  window.__CSS_SCANNER_LOADED__ = true;

  // State management
  const state = {
    active: false,
    frozen: false,
    gridEnabled: false,
    currentElement: null,
    hoveredElement: null,
    pinnedBlocks: [],
    settings: {
      copyOnClick: true,
      pinOnSpace: true,
      showGrid: false,
      ignoreInherited: false,
      ignorePrefixes: true,
      convertFontSizeToPx: false,
      nestPseudos: false
    }
  };

  // UI Elements
  let scannerUI = {
    cssBlock: null,
    toolbar: null,
    grid: null,
    notification: null
  };

  // Load settings from storage
  function loadSettings() {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response && response.settings) {
        Object.assign(state.settings, response.settings);
      }
    });
  }

  // Create main CSS block for displaying styles
  function createCSSBlock() {
    const block = document.createElement('div');
    block.id = 'css-scanner-block';
    block.className = 'css-scanner-block';
    block.innerHTML = `
      <div class="css-scanner-header">
        <div class="css-scanner-element-info">
          <span class="element-tag"></span>
          <span class="element-selector"></span>
        </div>
        <div class="css-scanner-actions">
          <button class="css-scanner-btn" data-action="copy" title="Copy CSS (Click)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="css-scanner-btn" data-action="pin" title="Pin CSS (Space)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </button>
          <button class="css-scanner-btn" data-action="close" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="css-scanner-breadcrumb"></div>
      <div class="css-scanner-content">
        <pre class="css-code"></pre>
      </div>
      <div class="css-scanner-hint">Click to copy • Space to pin • Esc to close</div>
    `;

    // Add event listeners
    block.querySelector('[data-action="copy"]').addEventListener('click', (e) => {
      e.stopPropagation();
      copyCSSToClipboard();
    });

    block.querySelector('[data-action="pin"]').addEventListener('click', (e) => {
      e.stopPropagation();
      pinCurrentBlock();
    });

    block.querySelector('[data-action="close"]').addEventListener('click', (e) => {
      e.stopPropagation();
      block.style.display = 'none';
    });

    // Make draggable
    makeDraggable(block);

    return block;
  }

  // Create toolbar
  function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'css-scanner-toolbar';
    toolbar.className = 'css-scanner-toolbar';
    toolbar.innerHTML = `
      <div class="toolbar-title">CSS Scanner Pro</div>
      <div class="toolbar-actions">
        <button class="toolbar-btn" data-action="grid" title="Toggle Grid (Ctrl+Shift+G)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </button>
        <button class="toolbar-btn" data-action="pause" title="Pause (Backspace)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        </button>
        <button class="toolbar-btn" data-action="close" title="Close Scanner (Esc)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    // Add event listeners
    toolbar.querySelector('[data-action="grid"]').addEventListener('click', toggleGrid);
    toolbar.querySelector('[data-action="pause"]').addEventListener('click', toggleFreeze);
    toolbar.querySelector('[data-action="close"]').addEventListener('click', deactivateScanner);

    return toolbar;
  }

  // Create grid overlay
  function createGrid() {
    const grid = document.createElement('div');
    grid.id = 'css-scanner-grid';
    grid.className = 'css-scanner-grid';
    grid.style.display = 'none';
    return grid;
  }

  // Make element draggable
  function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.css-scanner-header');

    if (header) {
      header.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + 'px';
      element.style.left = (element.offsetLeft - pos1) + 'px';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Update CSS block with element data
  function updateCSSBlock(element) {
    if (!scannerUI.cssBlock || !element) return;

    state.currentElement = element;

    const computed = window.getComputedStyle(element);
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${element.className.toString().split(' ')[0]}` : '';

    // Update header
    scannerUI.cssBlock.querySelector('.element-tag').textContent = `<${tag}${id}${classes}>`;
    scannerUI.cssBlock.querySelector('.element-selector').textContent = getSelector(element);

    // Build breadcrumb
    buildBreadcrumb(element);

    // Get CSS
    const css = extractCSS(element, computed);
    scannerUI.cssBlock.querySelector('.css-code').textContent = css;

    // Position the block
    positionBlock(scannerUI.cssBlock, element);
    scannerUI.cssBlock.style.display = 'block';
  }

  // Build parent breadcrumb
  function buildBreadcrumb(element) {
    const breadcrumb = scannerUI.cssBlock.querySelector('.css-scanner-breadcrumb');
    const parents = [];
    let current = element;

    while (current && current !== document.body && parents.length < 5) {
      parents.unshift(current);
      current = current.parentElement;
    }

    breadcrumb.innerHTML = parents.map((parent, index) => {
      const tag = parent.tagName.toLowerCase();
      const id = parent.id ? `#${parent.id}` : '';
      const cls = parent.className && typeof parent.className === 'string'
        ? `.${parent.className.split(' ')[0]}`
        : '';
      const isLast = index === parents.length - 1;

      return `<span class="breadcrumb-item ${isLast ? 'active' : ''}" data-index="${index}">${tag}${id}${cls}</span>`;
    }).join('<span class="breadcrumb-separator">›</span>');

    // Add click handlers
    breadcrumb.querySelectorAll('.breadcrumb-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        updateCSSBlock(parents[index]);
        highlightElement(parents[index]);
      });
    });
  }

  // Extract CSS from element
  function extractCSS(element, computed) {
    const importantProps = [
      'display', 'position', 'top', 'right', 'bottom', 'left',
      'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
      'color', 'background', 'background-color', 'background-image',
      'border', 'border-radius', 'border-width', 'border-style', 'border-color',
      'box-shadow', 'text-shadow',
      'opacity', 'z-index', 'overflow', 'cursor',
      'flex', 'flex-direction', 'justify-content', 'align-items', 'flex-wrap',
      'grid', 'grid-template-columns', 'grid-template-rows', 'grid-gap', 'gap',
      'transform', 'transition', 'animation'
    ];

    let css = '';
    const selector = getSelector(element);

    css += `${selector} {\n`;

    for (const prop of importantProps) {
      const value = computed.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== '0px') {
        // Skip inherited styles if setting is enabled
        if (state.settings.ignoreInherited) {
          const parent = element.parentElement;
          if (parent) {
            const parentComputed = window.getComputedStyle(parent);
            if (parentComputed.getPropertyValue(prop) === value) {
              continue;
            }
          }
        }

        // Skip vendor prefixes if setting is enabled
        if (state.settings.ignorePrefixes && (prop.startsWith('-webkit-') || prop.startsWith('-moz-') || prop.startsWith('-ms-'))) {
          continue;
        }

        css += `  ${prop}: ${value};\n`;
      }
    }

    css += `}`;

    return css;
  }

  // Get selector for element
  function getSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className && typeof element.className === 'string') {
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

  // Position block near element
  function positionBlock(block, element) {
    const rect = element.getBoundingClientRect();
    const blockWidth = 400;
    const blockHeight = block.offsetHeight || 300;

    let left = rect.right + 20;
    let top = rect.top;

    // Keep within viewport
    if (left + blockWidth > window.innerWidth - 20) {
      left = rect.left - blockWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }

    if (top + blockHeight > window.innerHeight - 20) {
      top = window.innerHeight - blockHeight - 20;
    }
    if (top < 20) {
      top = 20;
    }

    block.style.left = (left + window.scrollX) + 'px';
    block.style.top = (top + window.scrollY) + 'px';
  }

  // Highlight element
  function highlightElement(element) {
    // Remove previous highlights
    document.querySelectorAll('.css-scanner-highlight').forEach(el => {
      el.classList.remove('css-scanner-highlight');
    });

    if (element) {
      element.classList.add('css-scanner-highlight');
      state.hoveredElement = element;
    }
  }

  // Copy CSS to clipboard
  function copyCSSToClipboard() {
    if (!state.currentElement) return;

    const computed = window.getComputedStyle(state.currentElement);
    const css = extractCSS(state.currentElement, computed);

    navigator.clipboard.writeText(css).then(() => {
      showNotification('CSS copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      showNotification('Failed to copy CSS');
    });
  }

  // Pin current block
  function pinCurrentBlock() {
    if (!scannerUI.cssBlock) return;

    const clone = scannerUI.cssBlock.cloneNode(true);
    clone.classList.add('pinned');
    clone.style.borderColor = '#4ade80';

    // Offset position
    const offset = state.pinnedBlocks.length * 30;
    clone.style.left = (parseInt(scannerUI.cssBlock.style.left) + offset) + 'px';
    clone.style.top = (parseInt(scannerUI.cssBlock.style.top) + offset) + 'px';

    // Add close handler
    const closeBtn = clone.querySelector('[data-action="close"]');
    closeBtn.addEventListener('click', () => {
      clone.remove();
      state.pinnedBlocks = state.pinnedBlocks.filter(b => b !== clone);
    });

    // Remove copy and pin buttons from pinned block
    clone.querySelector('[data-action="copy"]').style.display = 'none';
    clone.querySelector('[data-action="pin"]').style.display = 'none';

    makeDraggable(clone);
    document.documentElement.appendChild(clone);
    state.pinnedBlocks.push(clone);

    showNotification('Block pinned! Drag to reposition.');
  }

  // Toggle grid
  function toggleGrid() {
    state.gridEnabled = !state.gridEnabled;
    if (scannerUI.grid) {
      scannerUI.grid.style.display = state.gridEnabled ? 'block' : 'none';
    }
  }

  // Toggle freeze
  function toggleFreeze() {
    state.frozen = !state.frozen;

    const pauseBtn = scannerUI.toolbar.querySelector('[data-action="pause"]');
    if (state.frozen) {
      pauseBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
      pauseBtn.title = 'Resume';
      if (scannerUI.cssBlock) {
        scannerUI.cssBlock.style.borderColor = '#fbbf24';
      }
    } else {
      pauseBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
      pauseBtn.title = 'Pause';
      if (scannerUI.cssBlock) {
        scannerUI.cssBlock.style.borderColor = '';
      }
    }

    showNotification(state.frozen ? '⏸ Paused' : '▶ Resumed');
  }

  // Show notification
  function showNotification(message) {
    if (scannerUI.notification) {
      scannerUI.notification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'css-scanner-notification';
    notification.textContent = message;
    document.documentElement.appendChild(notification);
    scannerUI.notification = notification;

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // Mouse move handler
  function handleMouseMove(e) {
    if (!state.active || state.frozen) return;

    const element = document.elementFromPoint(e.clientX, e.clientY);

    // Ignore scanner UI elements
    if (!element ||
        element.closest('#css-scanner-block') ||
        element.closest('#css-scanner-toolbar') ||
        element.closest('.css-scanner-block.pinned')) {
      return;
    }

    if (element !== state.hoveredElement) {
      highlightElement(element);
      updateCSSBlock(element);
    }
  }

  // Click handler
  function handleClick(e) {
    if (!state.active) return;

    // Ignore clicks on scanner UI
    if (e.target.closest('#css-scanner-block') ||
        e.target.closest('#css-scanner-toolbar') ||
        e.target.closest('.css-scanner-block.pinned')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (state.settings.copyOnClick) {
      copyCSSToClipboard();
    }
  }

  // Keyboard handler
  function handleKeyboard(e) {
    if (!state.active) return;

    // Space: Pin
    if (e.key === ' ' && state.settings.pinOnSpace) {
      e.preventDefault();
      pinCurrentBlock();
    }

    // Backspace: Toggle freeze
    if (e.key === 'Backspace') {
      e.preventDefault();
      toggleFreeze();
    }

    // Escape: Close
    if (e.key === 'Escape') {
      e.preventDefault();
      deactivateScanner();
    }

    // Arrow Up: Parent element
    if (e.key === 'ArrowUp' && state.currentElement) {
      e.preventDefault();
      const parent = state.currentElement.parentElement;
      if (parent && parent !== document.body) {
        updateCSSBlock(parent);
        highlightElement(parent);
      }
    }

    // Arrow Down: First child
    if (e.key === 'ArrowDown' && state.currentElement) {
      e.preventDefault();
      const firstChild = state.currentElement.children[0];
      if (firstChild) {
        updateCSSBlock(firstChild);
        highlightElement(firstChild);
      }
    }
  }

  // Inject styles
  function injectStyles() {
    if (document.getElementById('css-scanner-styles')) return;

    const style = document.createElement('style');
    style.id = 'css-scanner-styles';
    style.textContent = `
      .css-scanner-highlight {
        outline: 2px dashed #3b82f6 !important;
        outline-offset: 2px !important;
      }

      #css-scanner-block,
      .css-scanner-block.pinned {
        position: absolute !important;
        z-index: 2147483646 !important;
        width: 400px !important;
        max-height: 80vh !important;
        background: #111827 !important;
        color: #f3f4f6 !important;
        border: 1px solid rgba(59, 130, 246, 0.5) !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
        overflow: hidden !important;
        transition: border-color 0.2s !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }

      .css-scanner-block.pinned {
        border-color: #4ade80;
      }

      .css-scanner-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 12px 16px !important;
        margin: 0 !important;
        background: #1f2937 !important;
        border-bottom: 1px solid rgba(75, 85, 99, 0.5) !important;
        cursor: move !important;
        box-sizing: border-box !important;
      }

      .css-scanner-element-info {
        flex: 1 !important;
        min-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .element-tag {
        color: #60a5fa !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }

      .element-selector {
        display: block !important;
        color: #9ca3af !important;
        font-size: 11px !important;
        font-family: 'Monaco', 'Menlo', monospace !important;
        margin-top: 2px !important;
        margin-bottom: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        padding: 0 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        background: transparent !important;
      }

      .css-scanner-actions {
        display: flex;
        gap: 6px;
        margin-left: 12px;
      }

      .css-scanner-btn {
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.4);
        color: #60a5fa;
        padding: 6px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .css-scanner-btn:hover {
        background: rgba(59, 130, 246, 0.3);
        border-color: #60a5fa;
      }

      .css-scanner-breadcrumb {
        padding: 8px 16px !important;
        margin: 0 !important;
        background: #1f2937 !important;
        border-bottom: 1px solid rgba(75, 85, 99, 0.3) !important;
        font-size: 11px !important;
        font-family: 'Monaco', 'Menlo', monospace !important;
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 4px !important;
        align-items: center !important;
        box-sizing: border-box !important;
      }

      .breadcrumb-item {
        color: #9ca3af !important;
        cursor: pointer !important;
        padding: 2px 6px !important;
        margin: 0 !important;
        border-radius: 3px !important;
        transition: all 0.2s !important;
        background: transparent !important;
        font-size: 11px !important;
      }

      .breadcrumb-item:hover {
        background: rgba(59, 130, 246, 0.2) !important;
        color: #60a5fa !important;
      }

      .breadcrumb-item.active {
        color: #60a5fa !important;
        background: rgba(59, 130, 246, 0.2) !important;
      }

      .breadcrumb-separator {
        color: #6b7280 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }

      .css-scanner-content {
        max-height: 50vh !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        padding: 16px !important;
        margin: 0 !important;
        background: #111827 !important;
        box-sizing: border-box !important;
      }

      .css-scanner-content::-webkit-scrollbar {
        width: 6px;
      }

      .css-scanner-content::-webkit-scrollbar-track {
        background: transparent;
      }

      .css-scanner-content::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.3);
        border-radius: 3px;
      }

      .css-code {
        color: #e5e7eb !important;
        font-family: 'Monaco', 'Menlo', monospace !important;
        font-size: 12px !important;
        line-height: 1.6 !important;
        margin: 0 !important;
        padding: 0 !important;
        white-space: pre-wrap !important;
        word-break: break-all !important;
        user-select: text !important;
        background: transparent !important;
        border: none !important;
      }

      .css-scanner-hint {
        padding: 8px 16px !important;
        margin: 0 !important;
        background: #1f2937 !important;
        border-top: 1px solid rgba(75, 85, 99, 0.3) !important;
        font-size: 11px !important;
        color: #9ca3af !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }

      #css-scanner-toolbar {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        background: rgba(17, 24, 39, 0.98);
        border: 1px solid rgba(59, 130, 246, 0.5);
        border-radius: 8px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
      }

      .toolbar-title {
        color: #f3f4f6;
        font-weight: 600;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .toolbar-actions {
        display: flex;
        gap: 6px;
      }

      .toolbar-btn {
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.4);
        color: #60a5fa;
        padding: 6px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .toolbar-btn:hover {
        background: rgba(59, 130, 246, 0.3);
        border-color: #60a5fa;
      }

      .css-scanner-grid {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2147483645;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
        background-size: 20px 20px;
      }

      .css-scanner-notification {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: #10b981;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 2147483647;
        opacity: 0;
        transition: all 0.3s;
      }

      .css-scanner-notification.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;

    document.head.appendChild(style);
  }

  // Activate scanner
  function activateScanner() {
    if (state.active) return;

    state.active = true;
    injectStyles();
    loadSettings();

    // Create UI
    scannerUI.cssBlock = createCSSBlock();
    scannerUI.toolbar = createToolbar();
    scannerUI.grid = createGrid();

    document.documentElement.appendChild(scannerUI.cssBlock);
    document.documentElement.appendChild(scannerUI.toolbar);
    document.documentElement.appendChild(scannerUI.grid);

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyboard, true);

    document.body.style.cursor = 'crosshair';
    showNotification('CSS Scanner activated! Hover to inspect, click to copy, space to pin');
  }

  // Deactivate scanner
  function deactivateScanner() {
    if (!state.active) return;

    state.active = false;

    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyboard, true);

    // Remove UI
    if (scannerUI.cssBlock) scannerUI.cssBlock.remove();
    if (scannerUI.toolbar) scannerUI.toolbar.remove();
    if (scannerUI.grid) scannerUI.grid.remove();

    // Remove pinned blocks
    state.pinnedBlocks.forEach(block => block.remove());
    state.pinnedBlocks = [];

    // Remove highlights
    document.querySelectorAll('.css-scanner-highlight').forEach(el => {
      el.classList.remove('css-scanner-highlight');
    });

    document.body.style.cursor = '';
    scannerUI = { cssBlock: null, toolbar: null, grid: null, notification: null };
  }

  // Toggle scanner
  function toggleScanner() {
    if (state.active) {
      deactivateScanner();
    } else {
      activateScanner();
    }
  }

  // Listen for messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TOGGLE_SCANNER') {
      toggleScanner();
      sendResponse({ success: true });
    } else if (request.type === 'ACTIVATE_SCANNER') {
      activateScanner();
      sendResponse({ success: true });
    } else if (request.type === 'DEACTIVATE_SCANNER') {
      deactivateScanner();
      sendResponse({ success: true });
    } else if (request.type === 'TOGGLE_GRID') {
      state.gridEnabled = request.enabled;
      if (scannerUI.grid) {
        scannerUI.grid.style.display = state.gridEnabled ? 'block' : 'none';
      }
      sendResponse({ success: true });
    } else if (request.type === 'SCAN_PARENT') {
      if (state.currentElement && state.currentElement.parentElement) {
        updateCSSBlock(state.currentElement.parentElement);
        highlightElement(state.currentElement.parentElement);
      }
      sendResponse({ success: true });
    }
    return true;
  });

  console.log('CSS Scanner Pro content script loaded');
})();
