import React from 'react';
import { optimizeCSS } from '../../services/optimizer';

const OptimizerPanel: React.FC = () => {
    const [cssInput, setCssInput] = React.useState<string>('');
    const [optimizedCSS, setOptimizedCSS] = React.useState<string>('');

    const handleOptimize = () => {
        const result = optimizeCSS(cssInput);
        setOptimizedCSS(result);
    };

    return (
        <div className="optimizer-panel">
            <h2>CSS Optimizer</h2>
            <textarea
                value={cssInput}
                onChange={(e) => setCssInput(e.target.value)}
                placeholder="Paste your CSS here..."
                rows={10}
                cols={50}
            />
            <button onClick={handleOptimize}>Optimize CSS</button>
            <h3>Optimized CSS</h3>
            <textarea
                value={optimizedCSS}
                readOnly
                rows={10}
                cols={50}
            />
        </div>
    );
};

export default OptimizerPanel;