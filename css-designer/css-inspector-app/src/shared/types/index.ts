export type CSSProperty = {
    name: string;
    value: string;
};

export type ElementAttributes = {
    id?: string;
    className?: string;
    [key: string]: any;
};

export type LayoutInfo = {
    width: number;
    height: number;
    margin: string;
    padding: string;
    display: string;
    position: string;
};

export type InspectorSettings = {
    enablePseudoClassSimulation: boolean;
    optimizeCSS: boolean;
    useTailwind: boolean;
    [key: string]: any;
};

export type CSSRule = {
    selector: string;
    properties: CSSProperty[];
};

export type DOMNode = {
    tagName: string;
    attributes: ElementAttributes;
    children: DOMNode[];
    layoutInfo: LayoutInfo;
};