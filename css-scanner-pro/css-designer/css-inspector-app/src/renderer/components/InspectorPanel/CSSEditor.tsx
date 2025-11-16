import React, { useState, useEffect } from 'react';

const CSSEditor = ({ selectedElement }) => {
    const [cssProperties, setCssProperties] = useState({});
    const [editedCss, setEditedCss] = useState('');

    useEffect(() => {
        if (selectedElement) {
            const computedStyles = window.getComputedStyle(selectedElement);
            const css = {};
            for (let i = 0; i < computedStyles.length; i++) {
                const property = computedStyles[i];
                css[property] = computedStyles.getPropertyValue(property);
            }
            setCssProperties(css);
            setEditedCss(JSON.stringify(css, null, 2));
        }
    }, [selectedElement]);

    const handleCssChange = (event) => {
        setEditedCss(event.target.value);
    };

    const applyCss = () => {
        const styles = JSON.parse(editedCss);
        Object.keys(styles).forEach((property) => {
            selectedElement.style[property] = styles[property];
        });
    };

    const copyCss = () => {
        navigator.clipboard.writeText(editedCss).then(() => {
            alert('CSS copied to clipboard!');
        });
    };

    return (
        <div className="css-editor">
            <h2>CSS Editor</h2>
            <textarea
                value={editedCss}
                onChange={handleCssChange}
                rows={10}
                cols={50}
            />
            <div className="editor-buttons">
                <button onClick={applyCss}>Apply CSS</button>
                <button onClick={copyCss}>Copy CSS</button>
            </div>
        </div>
    );
};

export default CSSEditor;