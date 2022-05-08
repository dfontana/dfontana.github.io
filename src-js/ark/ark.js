import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app.js';
const container = document.getElementById('app-root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);