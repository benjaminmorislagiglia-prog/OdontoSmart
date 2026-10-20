import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PacienteForm from '../components/PacienteForm';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { getPacienteById, createPaciente, updatePaciente } from '../services/pacienteService';
import { apiErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import usePacienteQuery from '../hooks/usePacienteQuery';
import { loadPacienteCatalogs } from '../services/clinicService';
export default function PacienteFormPage() {
 const { id } = useParams();
 const editing = !!id;
 const navigate = useNavigate();
 const { notify } = useNotification();
 const loader = useCallback(async options => {
  const [patient, catalogs] = await Promise.all([id ? getPacienteById(id, options) : Promise.resolve(null), loadPacienteCatalogs(options)]);
  return {patient, catalogs};
 }, [id]);
 const { data, loading, error, reload } = usePacienteQuery(loader);
 async function save(values) {
  try {
   if (editing) await updatePaciente(id, values); else await createPaciente(values);
   notify(editing ? 'Paciente actualizado correctamente.' : 'Paciente registrado correctamente.', 'success');
   // Refetch en destino: PUT no documenta un cuerpo de respuesta.
   navigate(editing ? '/pacientes/' + id : '/pacientes');
  } catch (e) { const message = apiErrorMessage(e); notify(message, 'error'); throw new Error(message); }
 }
 return <><PageHeader eyebrow="PACIENTES" title={editing ? 'Editar paciente' : 'Registrar paciente'} description="Completá los datos personales del paciente."><Link to="/pacientes" className="btn btn-outline-secondary">Ver pacientes</Link></PageHeader>{loading ? <LoadingState message="Cargando formulario…" /> : error ? <ErrorState message={error} onAction={reload} /> : editing && data.patient.activo !== true ? <ErrorState title="Paciente desactivado" message="Reactivá al paciente desde el listado antes de modificar sus datos." /> : <PacienteForm key={id || 'new'} patient={data.patient} catalogs={data.catalogs} onSave={save} cancelTo={editing ? '/pacientes/' + id : '/pacientes'} />}</>;
}
