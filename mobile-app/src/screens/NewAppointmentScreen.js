import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useBookingCatalogs, useCreateAppointment, usePatient } from '../hooks/useClinicQueries';
import { useTheme } from '../context/ThemeContext';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppButton from '../components/AppButton';
import DateTimeField from '../components/DateTimeField';
import SelectionField from '../components/SelectionField';
import ScreenHeader from '../components/ScreenHeader';
import { dateKey, timeKey } from '../utils/dates';

export default function NewAppointmentScreen({ route, navigation }) {
  const { styles } = useTheme();
  const patient = usePatient(route.params.patientId);
  const catalogs = useBookingCatalogs();
  const creation = useCreateAppointment();
  const [dentistId, setDentistId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [validation, setValidation] = useState('');
  const submitting = useRef(false);
  const busy = creation.isPending || creation.isSuccess;

  async function save() {
    if (submitting.current || busy) return;
    const errors = [];
    if (!dentistId) errors.push('Seleccioná un odontólogo.');
    if (!roomId) errors.push('Seleccioná un consultorio.');
    if (!date) errors.push('Seleccioná la fecha del turno.');
    if (!time) errors.push('Seleccioná la hora del turno.');
    setValidation(errors.join('\n'));
    if (errors.length) return;
    submitting.current = true;
    try {
      const appointment = await creation.mutateAsync({ patientId: patient.data.id, dentistId, roomId, date: dateKey(date), time: timeKey(time) });
      if (navigation.isFocused()) navigation.replace('AppointmentDetail', { id: appointment.id, created: true });
    } catch { /* El rechazo del servidor queda visible en el formulario. */ }
    finally { submitting.current = false; }
  }

  const retry = () => { patient.refetch(); catalogs.refetch(); };
  if (patient.isPending || catalogs.isPending) return <LoadingState message="Preparando el nuevo turno…" />;
  const error = patient.error || catalogs.error;
  if (error) return <ErrorState message={error.message} onRetry={retry} />;
  if (!patient.data?.active) return <EmptyState title="El paciente está inactivo" message="Es necesario reactivarlo antes de agendar un turno." />;
  const { dentists, rooms } = catalogs.data;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Agendar turno" />
      <View style={styles.card}>
        <Text style={styles.label}>Paciente</Text>
        <Text style={styles.sectionTitle}>{patient.data.name}</Text>
        <Text style={styles.body}>DNI: {patient.data.dni}</Text>
      </View>
      <View style={styles.card}>
        <SelectionField label="Odontólogo" options={dentists} value={dentistId} onChange={setDentistId} disabled={busy} />
        {!dentists.length && <EmptyState title="No hay odontólogos activos para agendar turnos" />}
        <Text style={styles.muted}>Los horarios informados son una referencia de atención. La reserva se confirma al guardar.</Text>
        <SelectionField label="Consultorio" options={rooms} value={roomId} onChange={setRoomId} disabled={busy} />
        {!rooms.length && <EmptyState title="No hay consultorios registrados para reservar" />}
        {(!dentists.length || !rooms.length) && <AppButton title="Actualizar opciones" secondary onPress={() => catalogs.refetch()} disabled={busy || catalogs.isFetching} />}
        <DateTimeField label="Fecha" mode="date" value={date} onChange={setDate} disabled={busy} />
        <DateTimeField label="Hora" mode="time" value={time} onChange={setTime} disabled={busy} />
      </View>
      {validation && <Text style={styles.error} accessibilityLiveRegion="assertive">{validation}</Text>}
      {creation.error && <Text style={styles.error} accessibilityLiveRegion="assertive">{creation.error.message}</Text>}
      <AppButton title="Guardar turno" loading={creation.isPending} loadingText="Agendando turno…" disabled={busy || !dentists.length || !rooms.length} onPress={save} />
      <AppButton title="Volver al paciente" secondary disabled={busy} onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}
