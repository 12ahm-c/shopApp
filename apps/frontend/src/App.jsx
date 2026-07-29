import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import useLanguageStore from './stores/languageStore';
import useSettingsStore from './stores/settingsStore';
import { authApi } from './api/auth';
import { registerFCMToken, onForegroundMessage } from './lib/firebase';
import { Loader2 } from 'lucide-react';

import Login from './pages/Login';
import ShellLayout from './components/layout/ShellLayout';
import { isMini } from './config/appMode';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Employees = lazy(() => import('./pages/admin/Employees'));
const Settings = lazy(() => import('./pages/Settings'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const CustomerDetail = lazy(() => import('./pages/admin/CustomerDetail'));
const Suppliers = lazy(() => import('./pages/admin/Suppliers'));
const Expenses = lazy(() => import('./pages/Expenses'));
const SupplierDetail = lazy(() => import('./pages/admin/SupplierDetail'));
const ProductsList = lazy(() => import('./pages/products/ProductsList'));
const ProductForm = lazy(() => import('./pages/products/ProductForm'));
const ProductDetail = lazy(() => import('./pages/products/ProductDetail'));
const POS = lazy(() => import('./pages/pos/POS'));
const PurchasesPage = lazy(() => import('./pages/purchases/PurchasesPage'));
const PublicInvoice = lazy(() => import('./pages/PublicInvoice'));
const MiniDashboard = lazy(() => import('./pages/MiniDashboard'));

function PageLoader() {
  return (
    <div className="flex h-[60dvh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
    </div>
  );
}

function RoleGuard({ children, allowedRoles }) {
  const role = useAuthStore(state => state.role);
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/settings" replace />;
  }
  return children;
}

function FullModeGuard({ children }) {
  if (isMini) return <Navigate to="/mini-dashboard" replace />;
  return children;
}

function RootRedirect() {
  const role = useAuthStore(state => state.role);
  if (isMini) return <Navigate to="/mini-dashboard" replace />;
  return <Navigate to={role === 'admin' ? '/admin' : '/pos'} replace />;
}

export default function App() {
  const { language, dir } = useLanguageStore();
  const { fetchSettings } = useSettingsStore();
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (token) {
      authApi.getMe().then(res => {
        if (res?.data) {
          useAuthStore.getState().login(res.data, token);
        } else {
          useAuthStore.getState().logout();
        }
      }).catch(() => {
        useAuthStore.getState().logout();
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSettings().then(settings => {
        const hasLocalLang = (() => {
          try { return !!localStorage.getItem('shopmanager_language'); } catch { return false; }
        })();
        if (!hasLocalLang && settings?.language) {
          useLanguageStore.getState().setLanguage(settings.language);
        }
      });

      registerFCMToken();

      const unsubscribe = onForegroundMessage((payload) => {
        if (payload.notification) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/icons/icon-192.png'
          });
        }
      });

      return () => unsubscribe();
    }
  }, [user, fetchSettings]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    if (dir === 'rtl') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [language, dir]);

  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('fade-out');
      const timer = setTimeout(() => splash.remove(), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/invoices/view/:id" element={<PublicInvoice />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<ShellLayout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/dashboard" element={<RootRedirect />} />
            <Route 
              path="/admin" 
              element={<FullModeGuard><RoleGuard allowedRoles={['admin']}><Dashboard /></RoleGuard></FullModeGuard>} 
            />
            <Route 
              path="/employee" 
              element={<FullModeGuard><RoleGuard allowedRoles={['employee']}><Dashboard /></RoleGuard></FullModeGuard>} 
            />
            
            <Route 
              path="/employees" 
              element={<FullModeGuard><RoleGuard allowedRoles={['admin']}><Employees /></RoleGuard></FullModeGuard>} 
            />
            <Route 
              path="/admin/employees" 
              element={<FullModeGuard><RoleGuard allowedRoles={['admin']}><Employees /></RoleGuard></FullModeGuard>} 
            />
            <Route path="/activity-logs" element={<FullModeGuard><ActivityLogs /></FullModeGuard>} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/notifications" element={<FullModeGuard><Notifications /></FullModeGuard>} />
            <Route path="/settings" element={<Settings />} />
            <Route 
              path="/admin/customers" 
              element={<FullModeGuard><RoleGuard allowedRoles={['admin']}><Customers /></RoleGuard></FullModeGuard>} 
            />
            <Route 
              path="/admin/customers/:id" 
              element={<FullModeGuard><RoleGuard allowedRoles={['admin']}><CustomerDetail /></RoleGuard></FullModeGuard>} 
            />
            <Route 
              path="/admin/suppliers" 
              element={<FullModeGuard><RoleGuard allowedRoles={['admin']}><Suppliers /></RoleGuard></FullModeGuard>} 
            />
            <Route
              path="/admin/suppliers/:id"
              element={<FullModeGuard><RoleGuard allowedRoles={['admin']}><SupplierDetail /></RoleGuard></FullModeGuard>}
            />
            <Route
              path="/expenses"
              element={<FullModeGuard><RoleGuard allowedRoles={['admin']}><Expenses /></RoleGuard></FullModeGuard>}
            />

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

            <Route path="/pos" element={<POS />} />
            <Route path="/mini-dashboard" element={<MiniDashboard />} />

            <Route
              path="/purchases"
              element={<RoleGuard allowedRoles={['admin']}><PurchasesPage /></RoleGuard>}
            />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
