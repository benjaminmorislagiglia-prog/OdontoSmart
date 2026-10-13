import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { getPacienteById } from '../services/pacienteService';
import usePacienteQuery from '../hooks/usePacienteQuery';
import { formatDate } from '../utils/formatters';
export default function PacienteDetailPage() {
 const { id } = useParams();
 const loader = useCallback(options => getPacienteById(id, options), [id]);
 const { data: p, loading, error, reload } = usePacienteQuery(loader);
 return <><PageHeader eyebrow="PACIENTES" title="Detalle del paciente" description="Información registrada en la clínica."><Link to="/pacientes" className="btn btn-outline-secondary">Volver a pacientes</Link></PageHeader>{loading ? <LoadingState message="Cargando paciente…" /> : error ? <ErrorState message={error} onAction={reload} /> : <section className="panel patient-form"><h2>{[p.nombre, p.apellido].filter(Boolean).join(' ') || 'Sin nombre registrado'}</h2><dl className="row patient-details">{[['DNI', p.dni], ['Teléfono', p.telefono], ['Correo', p.correo], ['Fecha de nacimiento', formatDate(p.fechaNacimiento)], ['Estado', p.activo === true ? 'Activo' : p.activo === false ? 'Inactivo' : 'Sin informar'], ['ID de obra social', p.idObraSocial], ['ID de dirección', p.idDireccion]].map(([label, value]) => <div className="col-12 col-md-6" key={label}><dt>{label}</dt><dd>{value ?? 'Sin informar'}</dd></div>)}</dl><p className="form-help">Los nombres de obras sociales y los datos completos de direcciones estarán disponibles cuando se incorporen sus catálogos.</p><Link to={'/pacientes/' + p.idPaciente + '/editar'} className="btn btn-primary">Editar paciente</Link></section>}</>;
}
