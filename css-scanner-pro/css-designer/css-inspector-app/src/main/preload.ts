import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    getCSS: () => ipcRenderer.invoke('get-css'),
    copyCSS: (css) => ipcRenderer.send('copy-css', css),
    extractHTMLCSS: () => ipcRenderer.invoke('extract-html-css'),
    editCSS: (css) => ipcRenderer.send('edit-css', css),
    convertToTailwind: (css) => ipcRenderer.invoke('convert-to-tailwind', css),
    optimizeCSS: (css) => ipcRenderer.invoke('optimize-css', css),
    simulatePseudoState: (selector, state) => ipcRenderer.invoke('simulate-pseudo-state', selector, state),
    navigateDOM: (direction) => ipcRenderer.send('navigate-dom', direction),
    getElementInfo: (selector) => ipcRenderer.invoke('get-element-info', selector),
    checkConsistency: () => ipcRenderer.invoke('check-consistency'),
    setSettings: (settings) => ipcRenderer.send('set-settings', settings),
    getSettings: () => ipcRenderer.invoke('get-settings'),
});