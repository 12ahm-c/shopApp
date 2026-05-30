import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import useLanguageStore from './stores/languageStore';

import Login from './pages/Login';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import ActivityLogs from './pages/ActivityLogs';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Notifications from './pages/Notifications';
import Employees from './pages/admin/Employees';
import Settings from './pages/admin/Settings';
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import Suppliers from './pages/admin/Suppliers';
import SupplierDetail from './pages/admin/SupplierDetail';
import ProductsList from './pages/products/ProductsList';
import ProductForm from './pages/products/ProductForm';
import ProductDetail from './pages/products/ProductDetail';
import POS from './pages/pos/POS';
import ShellLayout from './components/layout/ShellLayout';

// Simple Role Guard
function RoleGuard({ children, allowedRoles }) {
  const role = useAuthStore(state => state.role);
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/profile" replace />;
  }
  return children;
}

function RootRedirect() {
  const role = useAuthStore(state => state.role);
  return <Navigate to={role === 'admin' ? '/admin' : '/pos'} replace />;
}

export default function App() {
  const { language, dir } = useLanguageStore();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    if (dir === 'rtl') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [language, dir]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes Wrapper */}
        <Route element={<ShellLayout />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/dashboard" element={<RootRedirect />} />
          <Route 
            path="/admin" 
            element={<RoleGuard allowedRoles={['admin']}><Dashboard /></RoleGuard>} 
          />
          <Route 
            path="/employee" 
            element={<RoleGuard allowedRoles={['employee']}><Dashboard /></RoleGuard>} 
          />
          
          <Route path="/profile" element={<Profile />} />
          
          {/* Admin only routes */}
          <Route 
            path="/employees" 
            element={<RoleGuard allowedRoles={['admin']}><Employees /></RoleGuard>} 
          />
          <Route 
            path="/admin/employees" 
            element={<RoleGuard allowedRoles={['admin']}><Employees /></RoleGuard>} 
          />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route 
            path="/settings" 
            element={<RoleGuard allowedRoles={['admin']}><Settings /></RoleGuard>} 
          />
          <Route 
            path="/admin/customers" 
            element={<RoleGuard allowedRoles={['admin']}><Customers /></RoleGuard>} 
          />
          <Route 
            path="/admin/customers/:id" 
            element={<RoleGuard allowedRoles={['admin']}><CustomerDetail /></RoleGuard>} 
          />
          <Route 
            path="/admin/suppliers" 
            element={<RoleGuard allowedRoles={['admin']}><Suppliers /></RoleGuard>} 
          />
          <Route 
            path="/admin/suppliers/:id" 
            element={<RoleGuard allowedRoles={['admin']}><SupplierDetail /></RoleGuard>} 
          />

          {/* Product Routes */}
          <Route path="/products" element={<ProductsList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route 
            path="/products/new" 
            element={<RoleGuard allowedRoles={['admin']}><ProductForm /></RoleGuard>} 
          />
          <Route 
            path="/products/:id/edit" 
            element={<RoleGuard allowedRoles={['admin']}><ProductForm /></RoleGuard>} 
          />

          {/* POS Route */}
          <Route path="/pos" element={<POS />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
