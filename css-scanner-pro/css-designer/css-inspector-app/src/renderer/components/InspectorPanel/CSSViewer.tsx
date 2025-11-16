import React from 'react';

const CSSViewer: React.FC<{ css: string }> = ({ css }) => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(css).then(() => {
            alert('CSS copied to clipboard!');
        });
    };

    return (
        <div className="css-viewer">
            <h2>CSS Viewer</h2>
            <pre>{css}</pre>
            <button onClick={copyToClipboard}>Copy CSS</button>
        </div>
    );
};

export default CSSViewer;