import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted variable fonts (no third-party font requests, no FOUT from a CDN).
import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

import './styles/tokens.css';
import './styles/base.css';
import './app.css';

import App from './App';
import { MotionProvider } from './lib/useMotion';

const container = document.getElementById('root');
if (!container) throw new Error('ob4cl portfolio: #root container is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <MotionProvider>
      <App />
    </MotionProvider>
  </StrictMode>
);
