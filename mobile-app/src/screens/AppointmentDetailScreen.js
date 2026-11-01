import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { availableTransitions } from '../services/appointmentService';
import { useAppointment, useAppointmentStates, usePatient, useUpdateAppointmentStatus } from '../hooks/useClinicQueries';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppButton from '../components/AppButton';
import ConfirmModal from '../components/ConfirmModal';
import AppointmentCard from '../components/AppointmentCard';
import { useTheme } from '../context/ThemeContext';

export default function AppointmentDetailScreen({ route, navigation }) {
  const { styles } = useTheme();
  const appointment = useAppointment(route.params.id);
  const states = useAppointmentStates();
  const patient = usePatient(appointment.data?.patientId, !!appointment.data);
  const update = useUpdateAppointmentStatus();
  const [selection, setSelection] = useState(null);
  const retry = () => appointment.refetch();
  async function confirm() {
    if (!selection || update.isPending) return;
    try {
      await update.mutateAsync({ id: appointment.data.id, stateId: selection.id });
      setSelection(null);
    } catch { /* La mutación conserva y muestra el rechazo del servidor. */ }
  }
  if (appointment.isPending) return <LoadingState />;
  if (appointment.error) return <ErrorState message={appointment.error.message} onRetry={retry} />;
  const data = appointment.data;
  if (!data) return <EmptyState title="El turno no está disponible" />;
  const allowed = availableTransitions(data, states.data || []);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {route.params.created && <Text style={styles.body} accessibilityLiveRegion="polite">Turno agendado correctamente.</Text>}
      <AppointmentCard appointment={data} />
      <AppButton title="Actualizar turno" secondary disabled={update.isPending || appointment.isFetching} onPress={retry} />
      <View style={styles.card}>
        <Text style={styles.label}>Contacto del paciente</Text>
        {patient.isPending ? <Text style={styles.muted}>Cargando contacto…</Text> : patient.error ?
          <ErrorState message={patient.error.message} onRetry={() => patient.refetch()} /> :
          <Text selectable style={styles.body}>{patient.data?.phone || 'Sin teléfono registrado'}</Text>}
      </View>
      <AppButton title="Ver paciente" secondary onPress={() => navigation.navigate('PatientDetail', { id: data.patientId })} />
      {update.isSuccess && <Text style={styles.body} accessibilityLiveRegion="polite">Cambio de estado registrado correctamente.</Text>}
      {update.error && <Text accessibilityLiveRegion="assertive" style={styles.error}>{update.error.message}</Text>}
      {states.isPending && <Text style={styles.muted}>Consultando estados disponibles…</Text>}
      {states.error && <ErrorState message={states.error.message} onRetry={() => states.refetch()} />}
      {!states.isPending && !states.error && !allowed.length && <Text style={styles.muted}>La API no permite cambios de estado para este turno en este momento.</Text>}
      {allowed.map(state => (
        <AppButton key={state.id} title={{ Confirmado: 'Confirmar turno', Atendido: 'Marcar atendido', Cancelado: 'Cancelar turno', Ausente: 'Marcar ausente' }[state.name] || `Cambiar a ${state.name}`}
          secondary={state.name === 'Cancelado'} disabled={update.isPending || appointment.isFetching}
          onPress={() => { update.reset(); setSelection(state); }} />
      ))}
      <ConfirmModal visible={!!selection} title="Cambiar estado del turno"
        message={`¿Querés cambiar el turno de ${data.patient} a ${selection?.name || ''}?`}
        error={update.error?.message || ''} busy={update.isPending}
        onClose={() => { setSelection(null); update.reset(); }} onConfirm={confirm} />
    </ScrollView>
  );
}
