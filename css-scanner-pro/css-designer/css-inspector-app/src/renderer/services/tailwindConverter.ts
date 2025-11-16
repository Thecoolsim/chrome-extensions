import { CSSProperties } from 'react';

const tailwindMap: Record<string, string> = {
    'margin': 'm',
    'marginTop': 'mt',
    'marginRight': 'mr',
    'marginBottom': 'mb',
    'marginLeft': 'ml',
    'padding': 'p',
    'paddingTop': 'pt',
    'paddingRight': 'pr',
    'paddingBottom': 'pb',
    'paddingLeft': 'pl',
    'fontSize': 'text',
    'fontWeight': 'font',
    'color': 'text',
    'backgroundColor': 'bg',
    'border': 'border',
    'borderColor': 'border',
    'display': 'block',
    'flex': 'flex',
    'grid': 'grid',
    'width': 'w',
    'height': 'h',
    // Add more mappings as needed
};

export const convertToTailwind = (styles: CSSProperties): string => {
    return Object.entries(styles)
        .map(([key, value]) => {
            const tailwindKey = tailwindMap[key as keyof typeof tailwindMap];
            if (tailwindKey) {
                return `${tailwindKey}-${value}`;
            }
            return '';
        })
        .filter(Boolean)
        .join(' ');
};