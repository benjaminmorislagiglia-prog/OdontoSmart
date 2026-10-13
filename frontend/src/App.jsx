import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import { activeModules } from './config/modules';
import DashboardPage from './pages/DashboardPage';
import PendingPage from './pages/PendingPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import NotFoundPage from './pages/NotFoundPage';
import PacientesPage from './pages/PacientesPage';
import PacienteDetailPage from './pages/PacienteDetailPage';
import PacienteFormPage from './pages/PacienteFormPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pacientes" element={<PacientesPage />} />
            <Route path="/pacientes/nuevo" element={<PacienteFormPage />} />
            <Route path="/pacientes/:id" element={<PacienteDetailPage />} />
            <Route path="/pacientes/:id/editar" element={<PacienteFormPage />} />
            {activeModules.filter(item => !['/dashboard', '/pacientes'].includes(item.path)).map(item => (
              <Route key={item.path} path={item.path} element={<PendingPage title={item.title} />} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
