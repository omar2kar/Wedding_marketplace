import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './scale-fix.css'; // إعدادات تصغير حجم الموقع
import App from './App';
import { Toaster } from 'react-hot-toast';
import { CompareProvider } from './context/CompareContext';
import { ThemeProvider } from './context/ThemeContext';
import reportWebVitals from './reportWebVitals';
import './i18n'; // Initialize i18n

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <CompareProvider>
        <>
          <Toaster position="top-center" reverseOrder={false} />
          <App />
        </>
      </CompareProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
