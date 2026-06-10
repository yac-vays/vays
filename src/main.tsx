/**
 * Entry point for the React application.
 *
 * This file sets up the root of the React application and renders the main App component
 * within a Router for handling client-side routing.
 */

import 'flatpickr/dist/flatpickr.min.css';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './view/styles/style.css';
import './view/thirdparty/styles/satoshi.css';

// A data router (single catch-all rendering <App/>, whose descendant <Routes>
// keep working as before) so navigation blocking (`useBlocker`, used by the edit
// page to warn about unsaved changes) is available. All navigation here uses
// absolute paths, so the descendant routing is unaffected.
const router = createBrowserRouter([{ path: '*', element: <App /> }]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <RouterProvider router={router} />,
);
