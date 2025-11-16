import { useState, useEffect } from 'react';

const useInspector = () => {
    const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
    const [cssStyles, setCssStyles] = useState<string>('');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [tailwindClasses, setTailwindClasses] = useState<string>('');
    const [pseudoState, setPseudoState] = useState<string>('');
    const [layoutInfo, setLayoutInfo] = useState<any>(null);
    const [attributes, setAttributes] = useState<any>(null);

    useEffect(() => {
        const handleElementSelect = (element: HTMLElement) => {
            setSelectedElement(element);
            updateStyles(element);
            updateAttributes(element);
            updateLayoutInfo(element);
        };

        const updateStyles = (element: HTMLElement) => {
            const computedStyles = window.getComputedStyle(element);
            setCssStyles(computedStyles.cssText);
        };

        const updateAttributes = (element: HTMLElement) => {
            const attrs = Array.from(element.attributes).map(attr => ({
                name: attr.name,
                value: attr.value
            }));
            setAttributes(attrs);
        };

        const updateLayoutInfo = (element: HTMLElement) => {
            const rect = element.getBoundingClientRect();
            setLayoutInfo({
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left
            });
        };

        // Add event listeners or other logic to handle element selection
        // Example: document.addEventListener('click', (e) => handleElementSelect(e.target));

        return () => {
            // Cleanup event listeners if necessary
        };
    }, [selectedElement]);

    const toggleEditing = () => {
        setIsEditing(!isEditing);
    };

    const convertToTailwind = () => {
        // Logic to convert CSS to Tailwind classes
    };

    const simulatePseudoState = (state: string) => {
        setPseudoState(state);
        // Logic to simulate pseudo-classes
    };

    return {
        selectedElement,
        cssStyles,
        isEditing,
        tailwindClasses,
        pseudoState,
        layoutInfo,
        attributes,
        toggleEditing,
        convertToTailwind,
        simulatePseudoState
    };
};

export default useInspector;