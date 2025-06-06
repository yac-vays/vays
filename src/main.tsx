/**
 * Entry point for the React application.
 *
 * This file sets up the root of the React application and renders the main App component
 * within a Router for handling client-side routing.
 */

import 'flatpickr/dist/flatpickr.min.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './view/styles/style.css';
import './view/thirdparty/styles/satoshi.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
  <Router>
    <App />
  </Router>,
  // </React.StrictMode>,
);
