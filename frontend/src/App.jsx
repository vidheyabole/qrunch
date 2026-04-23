import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';
import DashboardHome from './pages/dashboard/DashboardHome';
import MenuPage from './pages/dashboard/MenuPage';
import TablesPage from './pages/dashboard/TablesPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import InventoryPage from './pages/dashboard/InventoryPage';
import CustomerLandingPage from './pages/customer/CustomerLandingPage';
import CustomerMenuPage from './pages/customer/CustomerMenuPage';
import CartPage from './pages/customer/CartPage';
import OrderConfirmationPage from './pages/customer/OrderConfirmationPage';
import Layout from './components/common/Layout';
import Loader from './components/common/Loader';

const PrivateRoute = ({ children }) => {
  const { owner, loading } = useAuth();
  if (loading) return <Loader />;
  return owner ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login"                element={<LoginPage />} />
      <Route path="/register"             element={<RegisterPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      <Route path="/dashboard"            element={<PrivateRoute><DashboardHome /></PrivateRoute>} />
      <Route path="/dashboard/menu"       element={<PrivateRoute><MenuPage /></PrivateRoute>} />
      <Route path="/dashboard/tables"     element={<PrivateRoute><TablesPage /></PrivateRoute>} />
      <Route path="/dashboard/orders"     element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
      <Route path="/dashboard/analytics"  element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
      <Route path="/dashboard/inventory"  element={<PrivateRoute><InventoryPage /></PrivateRoute>} />

      <Route path="/order/:restaurantId/:tableId"                    element={<CustomerLandingPage />} />
      <Route path="/order/:restaurantId/:tableId/menu"               element={<CustomerMenuPage />} />
      <Route path="/order/:restaurantId/:tableId/cart"               element={<CartPage />} />
      <Route path="/order/:restaurantId/:tableId/confirmed/:orderId" element={<OrderConfirmationPage />} />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}