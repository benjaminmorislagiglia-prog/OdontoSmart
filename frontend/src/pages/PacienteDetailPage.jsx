import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { getPacienteById } from '../services/pacienteService';
import usePacienteQuery from '../hooks/usePacienteQuery';
import { formatDate } from '../utils/formatters';
import { loadPacienteCatalogs, labelDireccion } from '../services/clinicService';
export default function PacienteDetailPage() {
 const { id } = useParams();
 const loader = useCallback(async options => {
  const [patient,catalogs] = await Promise.all([getPacienteById(id, options),loadPacienteCatalogs(options)]);
  return {...patient,catalogs};
 }, [id]);
 const { data: p, loading, error, reload } = usePacienteQuery(loader);
 return <><PageHeader eyebrow="PACIENTES" title="Detalle del paciente" description="Información registrada en la clínica."><Link to="/pacientes" className="btn btn-outline-secondary">Volver a pacientes</Link></PageHeader>{loading ? <LoadingState message="Cargando paciente…" /> : error ? <ErrorState message={error} onAction={reload} /> : <section className="panel patient-form"><h2>{[p.nombre, p.apellido].filter(Boolean).join(' ') || 'Sin nombre registrado'}</h2><dl className="row patient-details">{[['DNI', p.dni], ['Teléfono', p.telefono], ['Correo', p.correo], ['Fecha de nacimiento', formatDate(p.fechaNacimiento)], ['Estado', p.activo === true ? 'Activo' : 'Desactivado'], ['Obra social', p.catalogs.obrasSociales.find(o=>o.idObraSocial===p.idObraSocial)?.nombre || (p.idObraSocial ? 'Referencia '+p.idObraSocial : 'Sin obra social')], ['Dirección', p.catalogs.direcciones.find(d=>d.idDireccion===p.idDireccion) ? labelDireccion(p.catalogs.direcciones.find(d=>d.idDireccion===p.idDireccion)) : 'Referencia '+p.idDireccion]].map(([label, value]) => <div className="col-12 col-md-6" key={label}><dt>{label}</dt><dd>{value ?? 'Sin informar'}</dd></div>)}</dl>{p.activo===true&&<Link to={'/pacientes/' + p.idPaciente + '/editar'} className="btn btn-primary">Modificar paciente</Link>}</section>}</>;
}
