import { BrowserCompatibility } from '../shared/types';

const browserSupport: BrowserCompatibility = {
    chrome: '>= 60',
    firefox: '>= 54',
    safari: '>= 10',
    edge: '>= 16',
    opera: '>= 47',
};

export const checkBrowserCompatibility = (cssProperty: string): string => {
    // Example logic to check compatibility
    const compatibilityInfo = {
        'flex': 'Supported in all major browsers',
        'grid': 'Supported in Chrome, Firefox, and Safari',
        'transform': 'Supported in all major browsers',
        // Add more properties as needed
    };

    return compatibilityInfo[cssProperty] || 'No compatibility information available';
};

export const getBrowserSupport = (): BrowserCompatibility => {
    return browserSupport;
};