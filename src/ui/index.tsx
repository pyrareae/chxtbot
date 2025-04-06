import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CommandsView from './components/CommandsView';
import ScriptEditor from './components/ScriptEditor';
import { ThemeProvider } from './components/theme-provider';

import './styles.css';

// This component sets up our routes
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CommandsView />} />
          <Route path="/commands" element={<CommandsView />} />
          <Route path="/script-editor" element={<ScriptEditor />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

// Initialize the app when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
  }
}); 