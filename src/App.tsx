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
import PrayerCategories from '@/pages/PrayerCategories';
import Prayers from '@/pages/Prayers';
import BibleMeditations from '@/pages/BibleMeditations';
import Novenas from '@/pages/Novenas';
import FormationCourses from '@/pages/FormationCourses';
import FormationCourseManage from '@/pages/FormationCourseManage';
import Certificates from '@/pages/Certificates';
import GamificationActions from '@/pages/GamificationActions';
import GamificationLevels from '@/pages/GamificationLevels';
import GamificationPrizes from '@/pages/GamificationPrizes';
import GamificationReport from '@/pages/GamificationReport';
import GamificationUserLog from '@/pages/GamificationUserLog';
import GamificationUserPrizes from '@/pages/GamificationUserPrizes';
import LoginAudit from '@/pages/LoginAudit';
import ParishLinkRequests from '@/pages/ParishLinkRequests';
import PermissionCatalog from '@/pages/PermissionCatalog';
import SlackWebhookConfigs from '@/pages/SlackWebhookConfigs';
import SpiritualDirections from '@/pages/SpiritualDirections';
import NovenaReport from '@/pages/NovenaReport';

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
                      <Route path="/auditoria-login" element={<LoginAudit />} />
                      <Route path="/vinculos-paroquia" element={<ParishLinkRequests />} />
                      {/* Paróquias */}
                      <Route path="/paroquias" element={<Parishes />} />
                      <Route path="/paroquias/:uuid" element={<ParishEdit />} />
                      <Route path="/planos" element={<Plans />} />
                      {/* Espiritual / Formação / Gamificação */}
                      <Route path="/oracoes/categorias" element={<PrayerCategories />} />
                      <Route path="/oracoes" element={<Prayers />} />
                      <Route path="/meditacoes" element={<BibleMeditations />} />
                      <Route path="/novenas/relatorio" element={<NovenaReport />} />
                      <Route path="/novenas" element={<Novenas />} />
                      <Route path="/direcao-espiritual" element={<SpiritualDirections />} />
                      <Route path="/cursos/:courseUuid" element={<FormationCourseManage />} />
                      <Route path="/cursos" element={<FormationCourses />} />
                      <Route path="/certificados" element={<Certificates />} />
                      <Route path="/gamificacao/acoes" element={<GamificationActions />} />
                      <Route path="/gamificacao/niveis" element={<GamificationLevels />} />
                      <Route path="/gamificacao/premios" element={<GamificationPrizes />} />
                      <Route path="/gamificacao/relatorio/usuario/:uuid" element={<GamificationUserLog />} />
                      <Route path="/gamificacao/relatorio" element={<GamificationReport />} />
                      <Route path="/gamificacao/premios-pendentes" element={<GamificationUserPrizes />} />
                      {/* CMS */}
                      <Route path="/paginas" element={<CmsPages />} />
                      <Route path="/posts" element={<CmsPosts />} />
                      <Route path="/categorias" element={<CmsCategories />} />
                      <Route path="/faq" element={<CmsFaq />} />
                      <Route path="/banners" element={<CmsBanners />} />
                      {/* Sistema */}
                      <Route path="/configuracoes" element={<SystemSettings />} />
                      <Route path="/permissoes/catalogo" element={<PermissionCatalog />} />
                      <Route path="/permissoes" element={<Permissions />} />
                      <Route path="/integracoes/slack" element={<SlackWebhookConfigs />} />
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
