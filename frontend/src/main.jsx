import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider }      from './context/AuthContext';
import { CartProvider }      from './context/CartContext';
import { ThemeProvider }     from './context/ThemeContext';
import { StaffAuthProvider } from './context/StaffAuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <StaffAuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </StaffAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);