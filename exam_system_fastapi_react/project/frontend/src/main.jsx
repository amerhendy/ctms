  import React from 'react'
  import ReactDOM from 'react-dom/client'

  import App from './App'
  import './styles/index.css'
  import axios from 'axios';
/*
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
  */
  // تشغيل تطبيق React بعد تحميل الإعدادات
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );