import { parse } from 'css';

export function parseCSS(cssString: string) {
    return parse(cssString);
}

export function extractStyles(element: HTMLElement): string {
    const computedStyles = window.getComputedStyle(element);
    let styles = '';

    for (let i = 0; i < computedStyles.length; i++) {
        const property = computedStyles[i];
        styles += `${property}: ${computedStyles.getPropertyValue(property)};\n`;
    }

    return styles;
}

export function getElementCSS(element: HTMLElement): { css: string; html: string } {
    const css = extractStyles(element);
    const html = element.outerHTML;
    return { css, html };
}

export function convertToTailwind(css: string): string {
    // Placeholder for Tailwind conversion logic
    return css; // This should be replaced with actual conversion logic
}

export function optimizeCSS(css: string): string {
    // Placeholder for CSS optimization logic
    return css; // This should be replaced with actual optimization logic
}