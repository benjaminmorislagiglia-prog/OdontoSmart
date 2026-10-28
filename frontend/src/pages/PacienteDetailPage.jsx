import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { getPacienteById } from '../services/pacienteService';
import usePacienteQuery from '../hooks/usePacienteQuery';
import { formatDate } from '../utils/formatters';
import { loadPacienteCatalogs, resourceService } from '../services/clinicService';
import PersonProfile from '../components/PersonProfile';
export default function PacienteDetailPage() {
  const { id } = useParams();
  const loader = useCallback(
    async (options) => {
      const [patient, catalogs, localidades, provincias] = await Promise.all([
        getPacienteById(id, options),
        loadPacienteCatalogs(options),
        resourceService('localidades').list(options),
        resourceService('provincias').list(options),
      ]);
      return { ...patient, catalogs: { ...catalogs, localidades, provincias } };
    },
    [id],
  );
  const { data: p, loading, error, reload } = usePacienteQuery(loader);
  return (
    <>
      <PageHeader eyebrow="PACIENTES" title="Detalle del paciente">
        <Link to="/pacientes" className="btn btn-outline-secondary">
          Volver a pacientes
        </Link>
      </PageHeader>
      {loading ? (
        <LoadingState message="Cargando paciente…" />
      ) : error ? (
        <ErrorState message={error} onAction={reload} />
      ) : (
        <section className="panel patient-form">
          <PersonProfile
            person={p}
            direction={p.catalogs.direcciones.find((d) => d.idDireccion === p.idDireccion)}
            localities={p.catalogs.localidades}
            provinces={p.catalogs.provincias}
            extraFields={[
              ['Fecha de nacimiento', formatDate(p.fechaNacimiento)],
              ['Estado', p.activo === true ? 'Activo' : 'Inactivo'],
              [
                'Obra social',
                p.catalogs.obrasSociales.find((o) => o.idObraSocial === p.idObraSocial)?.nombre ||
                  (p.idObraSocial ? 'Referencia ' + p.idObraSocial : 'Sin obra social'),
              ],
            ]}
          />
          <Link to={'/pacientes/' + p.idPaciente + '/editar'} className="btn btn-primary">
            Modificar paciente
          </Link>
        </section>
      )}
    </>
  );
}
