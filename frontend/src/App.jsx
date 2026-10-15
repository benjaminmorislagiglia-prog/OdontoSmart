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
import AgendaPage from './pages/AgendaPage';
import ClinicEntityPage from './pages/ClinicEntityPage';
import { clinicPages } from './config/clinicPages';

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
            <Route path="/agenda" element={<AgendaPage />} />
            {[['/odontologos','odontologos'],['/especialidades','especialidades'],['/consultorios','consultorios'],['/historia-clinica','historias'],['/estados-turno','estados'],['/odontologos/especialidades','asociaciones'],['/odontologos/empleados','empleados'],['/pacientes/direcciones','direcciones']].map(([path,key]) => <Route key={path} path={path} element={<ClinicEntityPage key={key} config={clinicPages[key]}/>} />)}
            {activeModules.filter(item => !['/dashboard', '/pacientes','/agenda','/odontologos','/especialidades','/consultorios','/historia-clinica','/estados-turno'].includes(item.path)).map(item => (
              <Route key={item.path} path={item.path} element={<PendingPage title={item.title} />} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
