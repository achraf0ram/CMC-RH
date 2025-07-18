import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import React from 'react';
import { ChatMessagesProvider } from './components/AppHeader';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChatMessagesProvider>
      <App />
    </ChatMessagesProvider>
  </React.StrictMode>
);
