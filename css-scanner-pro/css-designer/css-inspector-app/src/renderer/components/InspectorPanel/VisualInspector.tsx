import React, { useEffect, useState } from 'react';
import { getSelectedElementCSS, updateElementCSS } from '../../services/cssParser';
import { useInspector } from '../../hooks/useInspector';
import CSSViewer from './CSSViewer';
import CSSEditor from './CSSEditor';
import TailwindConverter from './TailwindConverter';
import OptimizerPanel from './OptimizerPanel';
import PseudoStateSimulator from './PseudoStateSimulator';
import DOMNavigator from './DOMNavigator';
import LayoutTools from './LayoutTools';
import ConsistencyChecker from './ConsistencyChecker';
import SettingsPanel from './SettingsPanel';

const VisualInspector: React.FC = () => {
    const { selectedElement, setSelectedElement } = useInspector();
    const [css, setCss] = useState<string>('');

    useEffect(() => {
        if (selectedElement) {
            const elementCSS = getSelectedElementCSS(selectedElement);
            setCss(elementCSS);
        }
    }, [selectedElement]);

    const handleCSSUpdate = (newCSS: string) => {
        setCss(newCSS);
        updateElementCSS(selectedElement, newCSS);
    };

    return (
        <div className="visual-inspector">
            <h1>CSS Inspector</h1>
            <CSSViewer css={css} />
            <CSSEditor css={css} onUpdate={handleCSSUpdate} />
            <TailwindConverter css={css} />
            <OptimizerPanel css={css} />
            <PseudoStateSimulator />
            <DOMNavigator />
            <LayoutTools />
            <ConsistencyChecker />
            <SettingsPanel />
        </div>
    );
};

export default VisualInspector;