import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/global.css';

const rootElement = document.getElementById('root');

if (rootElement) {
    ReactDOM.render(<App />, rootElement);
} else {
    console.error('Root element not found');
}