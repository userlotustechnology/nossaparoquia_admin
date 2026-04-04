import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/contexts/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import ActivityLogs from '@/pages/ActivityLogs';
import Parishes from '@/pages/Parishes';
import ParishEdit from '@/pages/ParishEdit';
import Plans from '@/pages/Plans';
import CmsPages from '@/pages/Pages';
import CmsPosts from '@/pages/Posts';
import CmsCategories from '@/pages/Categories';
import CmsFaq from '@/pages/Faq';
import CmsBanners from '@/pages/Banners';
import SystemSettings from '@/pages/SystemSettings';
import Permissions from '@/pages/Permissions';
import IpRestrictions from '@/pages/IpRestrictions';
import Webhooks from '@/pages/Webhooks';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      {/* Usuários */}
                      <Route path="/usuarios" element={<Users />} />
                      <Route path="/logs" element={<ActivityLogs />} />
                      {/* Paróquias */}
                      <Route path="/paroquias" element={<Parishes />} />
                      <Route path="/paroquias/:id" element={<ParishEdit />} />
                      <Route path="/planos" element={<Plans />} />
                      {/* CMS */}
                      <Route path="/paginas" element={<CmsPages />} />
                      <Route path="/posts" element={<CmsPosts />} />
                      <Route path="/categorias" element={<CmsCategories />} />
                      <Route path="/faq" element={<CmsFaq />} />
                      <Route path="/banners" element={<CmsBanners />} />
                      {/* Sistema */}
                      <Route path="/configuracoes" element={<SystemSettings />} />
                      <Route path="/permissoes" element={<Permissions />} />
                      <Route path="/ip-restricoes" element={<IpRestrictions />} />
                      <Route path="/webhooks" element={<Webhooks />} />
                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
        <Analytics />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
