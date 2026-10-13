import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { appointmentService, availableTransitions } from '../services/appointmentService';
import useResource from '../hooks/useResource';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppButton from '../components/AppButton';
import ConfirmModal from '../components/ConfirmModal';
import AppointmentCard from '../components/AppointmentCard';
import { useTheme } from '../context/ThemeContext';
export default function AppointmentDetailScreen({ route, navigation }) {
 const { styles } = useTheme();
 const loader = useCallback(() => appointmentService.getById(route.params.id), [route.params.id]);
 const { data, loading, error, retry } = useResource(loader);
 const [confirm, setConfirm] = useState(false);
 const [busy, setBusy] = useState(false);
 const [message, setMessage] = useState('');
 async function update(status) {
  if (busy) return;
  setBusy(true); setMessage('');
  try { await appointmentService.updateStatus(data.id, status); setConfirm(false); retry(); }
  catch (e) { setMessage(e.message || 'No se pudo actualizar el turno.'); }
  finally { setBusy(false); }
 }
 if (loading) return <LoadingState />;
 if (error) return <ErrorState message={error} onRetry={retry} />;
 if (!data) return <EmptyState title="El turno no está disponible" />;
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><AppointmentCard appointment={data} /><View style={styles.card}><Text style={styles.label}>Contacto</Text><Text selectable style={styles.body}>{data.phone || 'Sin teléfono registrado'}</Text><Text style={styles.label}>Observaciones</Text><Text style={styles.body}>{data.notes || 'Sin observaciones registradas.'}</Text></View><AppButton title="Ver paciente" secondary onPress={() => navigation.navigate('PatientDetail', { id: data.patientId })} />{message ? <Text accessibilityLiveRegion="assertive" style={styles.error}>{message}</Text> : null}{availableTransitions(data.status).map(status => <AppButton key={status} title={{ Confirmado: 'Confirmar turno', Atendido: 'Marcar atendido', Cancelado: 'Cancelar turno' }[status]} secondary={status === 'Cancelado'} disabled={busy} onPress={() => status === 'Cancelado' ? setConfirm(true) : update(status)} />)}<ConfirmModal error={message} visible={confirm} title="Cancelar turno" message={'¿Querés cancelar el turno de ' + data.patient + '?'} busy={busy} onClose={() => setConfirm(false)} onConfirm={() => update('Cancelado')} /></ScrollView>;
}
