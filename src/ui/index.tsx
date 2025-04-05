import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './components/App';
import CommandsView from './components/CommandsView';
import ScriptEditor from './components/ScriptEditor';

import './styles.css';

interface RouteMap {
  [key: string]: React.ReactNode;
}

const routeMap: RouteMap = {
  '/': <App />,
  '/commands': <CommandsView />,
  '/script-editor': <ScriptEditor />
};

// Determine which component to render based on the current URL path
const path = window.location.pathname;
const Component = routeMap[path] || routeMap['/'];

// Render the component to the DOM
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(Component);
} 