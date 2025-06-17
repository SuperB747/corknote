import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App';
import { FirebaseProvider } from './providers/FirebaseProvider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <HelmetProvider>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </HelmetProvider>
); 