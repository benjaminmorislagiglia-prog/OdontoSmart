import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import useResource from '../hooks/useResource';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppButton from '../components/AppButton';
import AppointmentCard from '../components/AppointmentCard';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { dateKey } from '../utils/dates';
import { formatDate } from '../utils/formatters';
export default function PatientDetailScreen({ route, navigation }) {
 const { styles } = useTheme();
 const loader = useCallback(async () => {
  const [patient, appointments] = await Promise.all([patientService.getById(route.params.id), appointmentService.listByPatient(route.params.id)]);
  return { patient, appointments };
 }, [route.params.id]);
 const { data, loading, error, retry } = useResource(loader);
 if (loading) return <LoadingState />;
 if (error) return <ErrorState message={error} onRetry={retry} />;
 if (!data.patient) return <EmptyState title="El paciente no está disponible" />;
 const p = data.patient;
 const now = dateKey() + ' ' + new Date().toTimeString().slice(0, 5);
 const upcoming = data.appointments.filter(a => a.date + ' ' + a.time >= now && ['Pendiente', 'Confirmado'].includes(a.status));
 const previous = data.appointments.filter(a => !upcoming.some(item => item.id === a.id)).slice().reverse();
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><ScreenHeader title={p.name} subtitle={'DNI: ' + p.dni} /><View style={styles.card}>{[['Nacimiento', formatDate(p.birthDate)], ['Teléfono', p.phone], ['Correo', p.email], ['Obra social', p.coverage], ['Dirección', p.address]].map(([label, value]) => <View key={label} style={{ gap: 4, marginBottom: 8 }}><Text style={styles.label}>{label}</Text><Text selectable style={styles.body}>{value || 'Sin registrar'}</Text></View>)}</View><AppButton title="Ver historia clínica" onPress={() => navigation.navigate('ClinicalHistory', { id: p.id })} />{[['Próximos turnos', upcoming], ['Últimos turnos', previous]].map(([title, items]) => <View key={title} style={{ gap: 12 }}><Text style={styles.sectionTitle}>{title}</Text>{items.length ? items.map(a => <AppointmentCard key={a.id} appointment={a} onPress={() => navigation.navigate('AppointmentDetail', { id: a.id })} />) : <EmptyState title="No hay turnos en esta sección" />}</View>)}</ScrollView>;
}
