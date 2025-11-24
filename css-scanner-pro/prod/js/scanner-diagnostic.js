/**
 * CSS Scanner Pro - Diagnostic/Debug Version
 * Minimal version with extensive logging for troubleshooting
 */

(function() {
  'use strict';

  console.log('[CSS Scanner] 🔍 Diagnostic version loading...');

  // Prevent multiple instances
  if (window.__CSS_SCANNER_LOADED__) {
    console.log('[CSS Scanner] ⚠️ Already loaded, skipping re-injection');
    return;
  }
  window.__CSS_SCANNER_LOADED__ = true;
  console.log('[CSS Scanner] ✅ Instance marker set');

  // Test basic functionality
  console.log('[CSS Scanner] Testing environment...');
  console.log('[CSS Scanner] - Document ready:', document.readyState);
  console.log('[CSS Scanner] - Body exists:', !!document.body);
  console.log('[CSS Scanner] - Chrome runtime:', typeof chrome !== 'undefined');

  // Simple state
  const state = {
    active: false
  };

  // Create simple notification
  function showNotification(message) {
    console.log('[CSS Scanner] 📢 Notification:', message);

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: #10b981 !important;
      color: white !important;
      padding: 16px 32px !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);
    console.log('[CSS Scanner] ✅ Notification element added to DOM');

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Create simple overlay
  function createOverlay() {
    console.log('[CSS Scanner] Creating overlay...');
    const overlay = document.createElement('div');
    overlay.id = 'css-scanner-overlay-diagnostic';
    overlay.style.cssText = `
      position: absolute !important;
      pointer-events: none !important;
      border: 3px solid #3b82f6 !important;
      background: rgba(59, 130, 246, 0.15) !important;
      z-index: 2147483646 !important;
      display: none !important;
    `;
    document.body.appendChild(overlay);
    console.log('[CSS Scanner] ✅ Overlay created and added');
    return overlay;
  }

  // Create simple inspector
  function createInspector() {
    console.log('[CSS Scanner] Creating inspector block...');
    const block = document.createElement('div');
    block.id = 'css-scanner-block-diagnostic';
    block.style.cssText = `
      position: fixed !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      top: 100px !important;
      right: 20px !important;
      width: 400px !important;
      max-height: 500px !important;
      background: #1f2937 !important;
      color: #f3f4f6 !important;
      border: 2px solid #3b82f6 !important;
      border-radius: 12px !important;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 13px !important;
      z-index: 2147483646 !important;
      overflow: hidden !important;
    `;

    block.innerHTML = `
      <div style="padding: 16px; background: #111827; border-bottom: 1px solid #374151;">
        <div style="font-weight: 600; color: #60a5fa; margin-bottom: 8px;" class="element-info">
          Hover over an element...
        </div>
        <button onclick="this.parentElement.parentElement.remove(); console.log('[CSS Scanner] Inspector closed manually');"
                style="position: absolute; top: 12px; right: 12px; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.5); color: #ef4444; border-radius: 4px; padding: 4px 12px; cursor: pointer; font-size: 12px;">
          Close
        </button>
      </div>
      <div style="padding: 16px; max-height: 400px; overflow-y: auto;">
        <pre class="css-output" style="margin: 0; font-family: 'Monaco', monospace; font-size: 11px; line-height: 1.6; color: #e5e7eb; white-space: pre-wrap;">
          Waiting for element...
        </pre>
      </div>
      <div style="padding: 12px; background: #111827; border-top: 1px solid #374151; text-align: center; font-size: 11px; color: #9ca3af;">
        Diagnostic Mode Active
      </div>
    `;

    document.body.appendChild(block);
    console.log('[CSS Scanner] ✅ Inspector block created and added');
    return block;
  }

  // Activate scanner
  function activate() {
    console.log('[CSS Scanner] 🚀 Activating scanner...');

    if (state.active) {
      console.log('[CSS Scanner] ⚠️ Already active');
      return;
    }

    state.active = true;

    // Create UI
    const overlay = createOverlay();
    const inspector = createInspector();

    // Mouse move handler
    function handleMouseMove(e) {
      const target = e.target;

      // Ignore our own elements
      if (target.closest('#css-scanner-block-diagnostic') ||
          target.closest('#css-scanner-overlay-diagnostic')) {
        return;
      }

      // Update overlay
      const rect = target.getBoundingClientRect();
      overlay.style.display = 'block';
      overlay.style.top = (rect.top + window.scrollY) + 'px';
      overlay.style.left = (rect.left + window.scrollX) + 'px';
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';

      // Update inspector
      const tag = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : '';
      const classes = target.className ? `.${target.className.toString().split(' ')[0]}` : '';

      inspector.querySelector('.element-info').textContent = `<${tag}${id}${classes}>`;

      // Get computed styles
      const computed = window.getComputedStyle(target);
      const importantProps = [
        'display', 'position', 'width', 'height',
        'margin', 'padding', 'background-color', 'color',
        'font-size', 'font-weight', 'border', 'border-radius'
      ];

      let css = `${tag}${id}${classes} {\n`;
      importantProps.forEach(prop => {
        const value = computed.getPropertyValue(prop);
        if (value && value !== 'none' && value !== 'normal') {
          css += `  ${prop}: ${value};\n`;
        }
      });
      css += '}';

      inspector.querySelector('.css-output').textContent = css;
    }

    document.addEventListener('mousemove', handleMouseMove, true);
    console.log('[CSS Scanner] ✅ Event listener attached');

    // Escape to close
    function handleKeyboard(e) {
      if (e.key === 'Escape') {
        console.log('[CSS Scanner] ⌨️ Escape pressed, closing...');
        document.removeEventListener('mousemove', handleMouseMove, true);
        document.removeEventListener('keydown', handleKeyboard, true);
        overlay.remove();
        inspector.remove();
        state.active = false;
        showNotification('CSS Scanner closed');
      }
    }

    document.addEventListener('keydown', handleKeyboard, true);

    showNotification('✅ CSS Scanner Diagnostic Active! Press ESC to close.');
    console.log('[CSS Scanner] ✅ Scanner fully activated');
  }

  // Listen for activation message
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('[CSS Scanner] Setting up message listener...');
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[CSS Scanner] 📨 Message received:', message);
      if (message.type === 'TOGGLE_SCANNER' || message.type === 'ACTIVATE_SCANNER') {
        activate();
        sendResponse({ success: true });
      }
      return true;
    });
    console.log('[CSS Scanner] ✅ Message listener ready');
  }

  // Auto-activate for testing
  console.log('[CSS Scanner] ⏰ Auto-activating in 500ms...');
  setTimeout(() => {
    console.log('[CSS Scanner] 🎬 Auto-activate triggered!');
    activate();
  }, 500);

  console.log('[CSS Scanner] 🎉 Diagnostic script fully loaded!');
})();
