import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import useLanguageStore from './stores/languageStore';

import Login from './pages/Login';
import Profile from './pages/Profile';
import Employees from './pages/admin/Employees';
import ShellLayout from './components/layout/ShellLayout';

// Simple Role Guard
function RoleGuard({ children, allowedRoles }) {
  const role = useAuthStore(state => state.role);
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/profile" replace />;
  }
  return children;
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
          {/* Default redirect depending on role - for Phase 1 just to profile/employees */}
          <Route path="/" element={<Navigate to="/profile" replace />} />
          
          <Route path="/profile" element={<Profile />} />
          
          {/* Admin only routes */}
          <Route 
            path="/admin/employees" 
            element={
              <RoleGuard allowedRoles={['admin']}>
                <Employees />
              </RoleGuard>
            } 
          />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
