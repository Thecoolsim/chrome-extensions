// Background Service Worker for CSS Scanner Pro - DIAGNOSTIC VERSION
console.log('[Background] 🔍 CSS Scanner Pro - Diagnostic background worker loaded');

// Store state
let scannerState = {
  gridEnabled: false
};

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[Background] 🖱️ Extension icon clicked');
  console.log('[Background] Tab URL:', tab.url);
  console.log('[Background] Tab ID:', tab.id);

  if (!tab.url.startsWith('http') && !tab.url.startsWith('file')) {
    console.log('[Background] ⚠️ Cannot run on this page type:', tab.url);
    return;
  }

  try {
    console.log('[Background] 💉 Attempting to inject scanner-diagnostic.js...');

    // Inject the diagnostic scanner
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['js/scanner-diagnostic.js']
    });

    console.log('[Background] ✅ Script injected successfully');

    // Send activation message
    console.log('[Background] 📤 Sending TOGGLE_SCANNER message...');
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SCANNER' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[Background] ⚠️ Message error:', chrome.runtime.lastError.message);
      } else {
        console.log('[Background] ✅ Message sent successfully, response:', response);
      }
    });
  } catch (error) {
    console.error('[Background] ❌ Failed to inject scanner:', error);
    console.error('[Background] Error stack:', error.stack);
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[Background] ⌨️ Keyboard command:', command);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    console.log('[Background] ⚠️ No active tab found');
    return;
  }

  console.log('[Background] Active tab:', tab.id, tab.url);

  if (command === 'toggle-grid') {
    scannerState.gridEnabled = !scannerState.gridEnabled;
    console.log('[Background] 🎛️ Grid toggled:', scannerState.gridEnabled);
    chrome.tabs.sendMessage(tab.id, {
      type: 'TOGGLE_GRID',
      enabled: scannerState.gridEnabled
    });
  } else if (command === 'scan-parent') {
    console.log('[Background] 👆 Scan parent command');
    chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PARENT' });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] 📨 Message from content script:', request);

  if (request.type === 'COPY_TO_CLIPBOARD') {
    console.log('[Background] 📋 Clipboard request');
    sendResponse({ success: true });
  } else if (request.type === 'GET_SETTINGS') {
    console.log('[Background] ⚙️ Settings request');
    chrome.storage.sync.get(null, (settings) => {
      console.log('[Background] Settings:', settings);
      sendResponse({ settings });
    });
    return true; // Keep channel open for async response
  } else if (request.type === 'SAVE_SETTINGS') {
    console.log('[Background] 💾 Save settings request');
    chrome.storage.sync.set(request.settings, () => {
      console.log('[Background] ✅ Settings saved');
      sendResponse({ success: true });
    });
    return true;
  }
});

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] 📦 Extension installed/updated');

  chrome.contextMenus.create({
    id: 'css-scanner-inspect',
    title: 'Inspect with CSS Scanner (Diagnostic)',
    contexts: ['all']
  }, () => {
    if (chrome.runtime.lastError) {
      console.log('[Background] Context menu error:', chrome.runtime.lastError);
    } else {
      console.log('[Background] ✅ Context menu created');
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('[Background] 🖱️ Context menu clicked');

  if (info.menuItemId === 'css-scanner-inspect') {
    try {
      console.log('[Background] 💉 Injecting diagnostic scanner...');

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/scanner-diagnostic.js']
      });

      console.log('[Background] ✅ Diagnostic scanner injected');

      chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_SCANNER' });
    } catch (error) {
      console.error('[Background] ❌ Failed to activate scanner:', error);
    }
  }
});

console.log('[Background] 🎉 Background worker setup complete');
