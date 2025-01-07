import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './view/styles/style.css';
import './view/styles/satoshi.css';
import 'flatpickr/dist/flatpickr.min.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // TODO: Need to remove this for deployment
  // <React.StrictMode>
  <Router>
    <App />
  </Router>,
  // </React.StrictMode>,
);
