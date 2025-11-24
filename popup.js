/**
 * CSS Scanner Pro - Popup Script
 *
 * Handles the popup menu functionality when users click the extension icon.
 * Shows quick guide and manages "don't show again" setting.
 *
 * @author Simon Adjatan (https://adjatan.org/)
 * @link https://github.com/Thecoolsim
 */

// Activate scanner and close popup automatically
async function activateScanner() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || (!tab.url.startsWith('http') && !tab.url.startsWith('file'))) {
      console.log('Cannot activate on this page');
      return false;
    }

    // Inject and activate the scanner
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['js/scanner-full.js']
    });

    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SCANNER' });
    return true;
  } catch (error) {
    console.error('Error activating scanner:', error);
    return false;
  }
}

// Detect platform and update keyboard shortcuts
document.addEventListener('DOMContentLoaded', async () => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Update keyboard shortcuts based on platform
  const shortcuts = document.querySelectorAll('.shortcut-key');
  shortcuts.forEach(shortcut => {
    if (isMac && shortcut.textContent.includes('Ctrl')) {
      shortcut.textContent = shortcut.textContent.replace('Ctrl', 'Cmd');
    }
  });

  // Update kbd elements in features
  const kbds = document.querySelectorAll('kbd');
  kbds.forEach(kbd => {
    if (isMac && kbd.textContent.includes('Ctrl')) {
      kbd.textContent = kbd.textContent.replace('Ctrl', 'Cmd');
    }
  });

  // Check if user wants to hide popup and activate directly
  try {
    const result = await chrome.storage.local.get(['hidePopupGuide']);
    if (result.hidePopupGuide) {
      // User doesn't want to see guide - activate immediately and close
      await activateScanner();
      window.close();
      return; // Exit early
    }
  } catch (error) {
    console.error('Error checking preference:', error);
  }

  // Activate scanner in background while showing guide
  activateScanner();

  // Handle "Don't show again" checkbox
  const dontShowCheckbox = document.getElementById('dontShowAgain');

  // Load saved preference to set checkbox state
  try {
    const result = await chrome.storage.local.get(['hidePopupGuide']);
    if (result.hidePopupGuide) {
      dontShowCheckbox.checked = true;
    }
  } catch (error) {
    console.error('Error loading preference:', error);
  }

  // Save preference when changed
  dontShowCheckbox.addEventListener('change', async (e) => {
    try {
      await chrome.storage.local.set({ hidePopupGuide: e.target.checked });
      console.log('Popup preference saved:', e.target.checked);

      // If checked, close popup immediately
      if (e.target.checked) {
        setTimeout(() => window.close(), 300);
      }
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  });

  // Handle close button
  const closeBtn = document.getElementById('closeBtn');
  closeBtn.addEventListener('click', () => {
    window.close();
  });

  // Add click tracking for links (optional analytics)
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      // Links will open in new tab automatically due to target="_blank"
      console.log('Link clicked:', link.href);
    });
  });

  // Add animation on load
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '1';
  }, 10);
});
