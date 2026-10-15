import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppV4 from './AppV4';
import '../assets/fonts/fonts.css';
import './v4.css';

// The loading shell in index-v4.html lives inside #root, so React's first render replaces it.
createRoot(document.getElementById('root')!).render(<StrictMode><AppV4 /></StrictMode>);
