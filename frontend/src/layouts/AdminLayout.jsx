import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Offcanvas from 'react-bootstrap/Offcanvas';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Dropdown from 'react-bootstrap/Dropdown';
import { Link } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { version } from '../../package.json';
import { FiChevronLeft } from 'react-icons/fi';
import ThemeToggle from '../components/ThemeToggle';
import useStoredPreference from '../hooks/useStoredPreference';
import { FiMenu, FiChevronRight } from 'react-icons/fi';
import { activeModules } from '../config/modules';
import { FaTooth as LuTooth } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

const navigation = activeModules;

function SidebarContent({ onNavigate, collapsed = false }) {
  return <>
    <div className="brand"><span className="brand-mark"><LuTooth aria-hidden="true" /></span><div>Odonto<span>Smart</span><small>GESTIÓN ODONTOLÓGICA</small></div></div>
    <p className="nav-caption">ESPACIO DE TRABAJO</p>
    <nav aria-label="Navegación principal">
      {navigation.map(({ path, title, icon: Icon }) => {
        const link = <NavLink to={path} end={path === '/dashboard'} aria-label={collapsed ? title : undefined} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon aria-hidden="true" /><span>{title}</span></NavLink>;
        return collapsed
          ? <OverlayTrigger key={path} placement="right" overlay={<Tooltip id={`nav-${path.slice(1)}`}>{title}</Tooltip>}>{link}</OverlayTrigger>
          : <span className="nav-entry" key={path}>{link}</span>;
      })}
    </nav>
    <div className="sidebar-footer">Gestión odontológica<small>OdontoSmart v{version}</small></div>
  </>;
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useStoredPreference('odontosmart.sidebar-collapsed', false, value => typeof value === 'boolean');
  const { pathname } = useLocation();
  const section = navigation.find(item => item.path === pathname || pathname.startsWith(item.path + '/'))?.title || 'Página no encontrada';
  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <aside className="desktop-sidebar" id="desktop-navigation">
        <button className="icon-button sidebar-toggle" type="button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'} title={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'} aria-expanded={!collapsed} aria-controls="desktop-navigation">{collapsed ? <FiChevronRight /> : <FiChevronLeft />}</button>
        <SidebarContent collapsed={collapsed} />
      </aside>
      <Offcanvas show={menuOpen} onHide={() => setMenuOpen(false)} className="mobile-sidebar">
        <Offcanvas.Header closeButton><Offcanvas.Title>Menú</Offcanvas.Title></Offcanvas.Header>
        <Offcanvas.Body><SidebarContent onNavigate={() => setMenuOpen(false)} /></Offcanvas.Body>
      </Offcanvas>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb-line">
            <button type="button" className="menu-toggle" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}><FiMenu /></button>
            <nav aria-label="Ubicación actual" className="location-breadcrumb">
              <Link to="/dashboard" className="clinic-label">Inicio</Link>
              <FiChevronRight aria-hidden="true" /><span aria-current="page">{section}</span>
            </nav>
          </div>
          <div className="demo-user">
            <ThemeToggle />
            <Dropdown align="end">
              <Dropdown.Toggle id="user-menu" className="user-menu-toggle" variant="link" aria-label={`Menú de usuario: ${user.username}`}>
                <span className="user-avatar">{user.username.slice(0, 2).toUpperCase()}</span>
                <span className="user-menu-name">{user.username}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Header>{user.username}</Dropdown.Header>
                <Dropdown.Divider />
                <Dropdown.Item as="button" onClick={logout}><FiLogOut aria-hidden="true" className="me-2" />Cerrar sesión</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}><Outlet /></main>
        <footer className="workspace-footer">OdontoSmart v{version} <span>Gestión de clínica odontológica</span></footer>
      </div>
    </div>
  );
}
