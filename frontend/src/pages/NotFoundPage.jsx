import { Link } from 'react-router-dom';
import { FiMapPin, FiArrowLeft } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';

export default function NotFoundPage() {
  return (
    <>
      <PageHeader eyebrow="ERROR 404" title="Página no encontrada" description="La dirección que buscás no existe o ya no está disponible." />
      <section className="panel pending-panel">
        <FiMapPin aria-hidden="true" />
        <h2>Volvamos a un lugar conocido</h2>
        <p>Podés continuar trabajando desde el Dashboard o usar el menú lateral.</p>
        <Link to="/dashboard" className="btn btn-primary"><FiArrowLeft aria-hidden="true" /> Volver al Dashboard</Link>
      </section>
    </>
  );
}
