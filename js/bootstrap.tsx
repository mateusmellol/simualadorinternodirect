import React from 'react';
import { createRoot } from 'react-dom/client';
import DirectConApp from '../components/DirectConApp';

const root = document.getElementById('simulador-root');
if (root) createRoot(root).render(<DirectConApp />);
