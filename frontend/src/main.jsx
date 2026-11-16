import React from 'react';
import ReactDOM from 'react-dom/client';
import CustomerApp from './CustomerApp';
import CustomerLoginScreen from './CustomerLoginScreen';
import AdminPage from './AdminPage';
import DriverPage from './DriverPage';
import './index.css';

function Router() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/admin') return <AdminPage />;
  if (path === '/driver') return <DriverPage />;
  
  // Route to Login Page
  if (path === '/login') {
    return <CustomerLoginScreen 
      onLoginSuccess={() => window.location.href = '/'} 
      onBack={() => window.location.href = '/'} 
    />;
  }
  
  // Default route goes to CustomerApp
  return <CustomerApp />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);