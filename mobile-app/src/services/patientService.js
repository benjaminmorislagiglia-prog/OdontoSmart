import { request, requestList } from './api';
import { photoUpload } from './photoService';

function patientFromDTO(dto) {
  return {
    id: String(dto.idPaciente),
    name: `${dto.nombre} ${dto.apellido}`.trim(),
    dni: dto.dni, phone: dto.telefono || '', email: dto.correo || '',
    birthDate: dto.fechaNacimiento, active: dto.activo === true,
    photoPath: dto.fotoUrl || null, coverageId: dto.idObraSocial, addressId: dto.idDireccion,
  };
}

export const patientService = {
  async list(active = true, options = {}) {
    return (await requestList(`/api/Pacientes?activo=${active}`, options)).map(patientFromDTO);
  },
  async getById(id, options = {}) {
    return patientFromDTO(await request(`/api/Pacientes/${encodeURIComponent(id)}?incluirInactivos=true`, options));
  },
  async catalogs(options = {}) {
    const [coverages, addresses, localities] = await Promise.all([
      requestList('/api/obrasociales', options), requestList('/api/direcciones', options), requestList('/api/localidades', options),
    ]);
    return { coverages, addresses, localities };
  },
  async uploadPhoto(id, asset) {
    return patientFromDTO(await request(`/api/Pacientes/${encodeURIComponent(id)}/foto`, { method: 'PUT', body: photoUpload(asset) }));
  },
};

export function patientCoverage(patient, catalogs) {
  if (!patient.coverageId) return 'Sin obra social';
  return catalogs?.coverages.find(item => item.idObraSocial === patient.coverageId)?.nombre || 'Obra social sin consultar';
}

export function patientAddress(patient, catalogs) {
  const address = catalogs?.addresses.find(item => item.idDireccion === patient.addressId);
  if (!address) return 'Dirección sin consultar';
  const locality = catalogs.localities.find(item => item.idLocalidad === address.idLocalidad);
  return [`${address.calle} ${address.numero}`, address.barrio, locality?.nombre, address.cp].filter(Boolean).join(', ');
}
