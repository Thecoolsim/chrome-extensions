import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import VisualInspector from './components/InspectorPanel/VisualInspector';
import CSSViewer from './components/InspectorPanel/CSSViewer';
import CSSEditor from './components/InspectorPanel/CSSEditor';
import TailwindConverter from './components/InspectorPanel/TailwindConverter';
import OptimizerPanel from './components/InspectorPanel/OptimizerPanel';
import PseudoStateSimulator from './components/InspectorPanel/PseudoStateSimulator';
import DOMNavigator from './components/InspectorPanel/DOMNavigator';
import LayoutTools from './components/InspectorPanel/LayoutTools';
import ConsistencyChecker from './components/InspectorPanel/ConsistencyChecker';
import SettingsPanel from './components/InspectorPanel/SettingsPanel';
import './styles/global.css';

const App: React.FC = () => {
    return (
        <Router>
            <Switch>
                <Route path="/" exact component={VisualInspector} />
                <Route path="/css-viewer" component={CSSViewer} />
                <Route path="/css-editor" component={CSSEditor} />
                <Route path="/tailwind-converter" component={TailwindConverter} />
                <Route path="/optimizer" component={OptimizerPanel} />
                <Route path="/pseudo-state" component={PseudoStateSimulator} />
                <Route path="/dom-navigator" component={DOMNavigator} />
                <Route path="/layout-tools" component={LayoutTools} />
                <Route path="/consistency-checker" component={ConsistencyChecker} />
                <Route path="/settings" component={SettingsPanel} />
            </Switch>
        </Router>
    );
};

export default App;