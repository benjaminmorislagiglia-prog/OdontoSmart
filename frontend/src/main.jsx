import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/app.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import './styles/enhancements.css';
import './styles/pacientes.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider><NotificationProvider><BrowserRouter><App /></BrowserRouter></NotificationProvider></ThemeProvider>
  </React.StrictMode>,
);
