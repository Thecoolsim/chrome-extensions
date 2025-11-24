/**
 * CSS Scanner Pro - Background Service Worker
 *
 * @author Simon Adjatan
 * @website https://adjatan.org/
 * @github https://github.com/Thecoolsim
 * @license MIT
 */

console.log('CSS Scanner Pro - Background service worker loaded');

// Store state
let scannerState = {
  gridEnabled: false
};

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url.startsWith('http') && !tab.url.startsWith('file')) {
    console.log('Cannot run on this page');
    return;
  }

  try {
    // Inject the scanner
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['js/scanner-full.js']
    });

    // Activate the scanner
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SCANNER' });
  } catch (error) {
    console.error('Failed to inject scanner:', error);
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) return;

  if (command === 'toggle-grid') {
    scannerState.gridEnabled = !scannerState.gridEnabled;
    chrome.tabs.sendMessage(tab.id, {
      type: 'TOGGLE_GRID',
      enabled: scannerState.gridEnabled
    });
  } else if (command === 'scan-parent') {
    chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PARENT' });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'COPY_TO_CLIPBOARD') {
    // Clipboard is handled in content script with modern API
    sendResponse({ success: true });
  } else if (request.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse({ settings });
    });
    return true; // Keep channel open for async response
  } else if (request.type === 'SAVE_SETTINGS') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'css-scanner-inspect',
    title: 'Inspect with CSS Scanner',
    contexts: ['all']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'css-scanner-inspect') {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/scanner-full.js']
      });

      chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_SCANNER' });
    } catch (error) {
      console.error('Failed to activate scanner:', error);
    }
  }
});
