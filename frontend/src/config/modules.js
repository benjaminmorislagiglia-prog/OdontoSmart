import { FiGrid, FiCalendar, FiUsers, FiUserCheck, FiFileText, FiPackage, FiActivity, FiShield, FiSettings } from 'react-icons/fi';

// Fuera del alcance del Sprint 1: los módulos con enabled: false se conservan para un sprint futuro.
export const modules = [
  { path: '/dashboard', title: 'Dashboard', icon: FiGrid, enabled: true },
  { path: '/agenda', title: 'Agenda / Turnos', icon: FiCalendar, enabled: true },
  { path: '/pacientes', title: 'Pacientes', icon: FiUsers, enabled: true },
  { path: '/empleados', title: 'Empleados', icon: FiUsers, enabled: true },
  { path: '/odontologos', title: 'Odontólogos', icon: FiUserCheck, enabled: true },
  { path: '/especialidades', title: 'Especialidades', icon: FiActivity, enabled: true, sidebar: false },
  { path: '/estados-turno', title: 'Estados de turno', icon: FiCalendar, enabled: true, sidebar: false },
  { path: '/historia-clinica', title: 'Historia clínica', icon: FiFileText, enabled: true },
  { path: '/insumos', title: 'Insumos', icon: FiPackage, enabled: false },
  { path: '/prestaciones', title: 'Prestaciones', icon: FiActivity, enabled: false },
  { path: '/obras-sociales', title: 'Obras sociales', icon: FiShield, enabled: false },
  { path: '/configuracion', title: 'Configuración', icon: FiSettings, enabled: true },
];

export const activeModules = modules.filter(module => module.enabled);
export const isModuleEnabled = path => modules.some(module => module.path === path && module.enabled);
