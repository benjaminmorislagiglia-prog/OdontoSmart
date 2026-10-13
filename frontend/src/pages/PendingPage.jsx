import { Link } from 'react-router-dom';
import { FiTool, FiArrowLeft } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';

export default function PendingPage({ title }) {
  return <><PageHeader eyebrow="ODONTOSMART" title={title} description="Esta sección no está disponible." /><section className="panel pending-panel"><FiTool aria-hidden="true" /><h2>Continuá desde el Dashboard</h2><p>Podés consultar el resumen de la clínica desde el Dashboard.</p><Link to="/dashboard" className="btn btn-primary"><FiArrowLeft aria-hidden="true" /> Volver al Dashboard</Link></section></>;
}
