import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { clinicalHistoryService } from '../services/clinicalHistoryService';

export const clinicKeys = {
  patients: ['patients'],
  patient: id => ['patients', 'detail', String(id)],
  appointments: ['appointments'],
  appointment: id => ['appointments', 'detail', String(id)],
};

export function usePatients(active = true) {
  return useQuery({
    queryKey: [...clinicKeys.patients, 'list', active],
    queryFn: ({ signal }) => patientService.list(active, { signal }),
  });
}

export function usePatient(id, enabled = true) {
  return useQuery({
    queryKey: clinicKeys.patient(id), enabled,
    queryFn: ({ signal }) => patientService.getById(id, { signal }),
  });
}

export function usePatientCatalogs(enabled = true) {
  return useQuery({
    queryKey: ['patient-catalogs'], enabled, staleTime: 5 * 60 * 1000,
    queryFn: ({ signal }) => patientService.catalogs({ signal }),
  });
}

export function useAppointments() {
  return useQuery({
    queryKey: [...clinicKeys.appointments, 'list'], refetchInterval: 30000,
    queryFn: ({ signal }) => appointmentService.list({ signal }),
  });
}

export function useAppointment(id) {
  return useQuery({
    queryKey: clinicKeys.appointment(id), refetchInterval: 15000,
    queryFn: ({ signal }) => appointmentService.getById(id, { signal }),
  });
}

export function useAppointmentStates() {
  return useQuery({
    queryKey: ['appointment-states'], staleTime: 5 * 60 * 1000,
    queryFn: ({ signal }) => appointmentService.states({ signal }),
  });
}

export function useBookingCatalogs() {
  return useQuery({
    queryKey: ['booking-catalogs'], staleTime: 60000,
    queryFn: ({ signal }) => appointmentService.bookingCatalogs({ signal }),
  });
}

export function useCreateAppointment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (/** @type {{ patientId: string, dentistId: string, roomId: string, date: string, time: string }} */ values) => appointmentService.create(values),
    onSuccess: async appointment => {
      client.setQueryData(clinicKeys.appointment(appointment.id), appointment);
      // Agenda, Dashboard y turnos del paciente comparten esta familia de consultas.
      await client.invalidateQueries({ queryKey: clinicKeys.appointments });
    },
  });
}

export function useClinicalHistory(id) {
  return useQuery({
    queryKey: ['clinical-history', String(id)],
    queryFn: ({ signal }) => clinicalHistoryService.listByPatient(id, { signal }),
  });
}

export function useUpdateAppointmentStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (/** @type {{ id: string, stateId: number }} */ change) => appointmentService.updateStatus(change.id, change.stateId),
    // También se consulta de nuevo tras un rechazo: otro usuario pudo cambiar el turno.
    onSettled: () => client.invalidateQueries({ queryKey: clinicKeys.appointments }),
  });
}

export function useUploadPatientPhoto() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (/** @type {{ id: string, asset: import('expo-image-picker').ImagePickerAsset }} */ photo) => patientService.uploadPhoto(photo.id, photo.asset),
    onSuccess: async patient => {
      client.setQueryData(clinicKeys.patient(patient.id), patient);
      await client.invalidateQueries({ queryKey: clinicKeys.patients });
    },
  });
}
