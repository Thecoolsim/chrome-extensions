export function getElementStyles(element: HTMLElement): CSSStyleDeclaration {
    return window.getComputedStyle(element);
}

export function getElementAttributes(element: HTMLElement): { [key: string]: string } {
    const attributes: { [key: string]: string } = {};
    Array.from(element.attributes).forEach(attr => {
        attributes[attr.name] = attr.value;
    });
    return attributes;
}

export function getElementPosition(element: HTMLElement): { top: number; left: number; width: number; height: number } {
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
    };
}

export function findParentElement(element: HTMLElement, selector: string): HTMLElement | null {
    while (element && element !== document.body) {
        if (element.matches(selector)) {
            return element;
        }
        element = element.parentElement!;
    }
    return null;
}

export function getChildrenElements(element: HTMLElement): HTMLElement[] {
    return Array.from(element.children) as HTMLElement[];
}

export function simulatePseudoClass(element: HTMLElement, pseudoClass: string): void {
    const style = document.createElement('style');
    style.innerHTML = `${element.tagName.toLowerCase()}:${pseudoClass} { /* styles here */ }`;
    document.head.appendChild(style);
}