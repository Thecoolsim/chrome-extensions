import { parentPort } from 'worker_threads';
import { optimizeCSS } from '../services/optimizer';

parentPort?.on('message', (css: string) => {
    const optimizedCSS = optimizeCSS(css);
    parentPort?.postMessage(optimizedCSS);
});