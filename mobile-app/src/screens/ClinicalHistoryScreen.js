import { FlatList, Text, View } from 'react-native';
import { useClinicalHistory, useAppointments } from '../hooks/useClinicQueries';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { formatDate } from '../utils/formatters';

export default function ClinicalHistoryScreen({ route }) {
  const { styles } = useTheme();
  const history = useClinicalHistory(route.params.id);
  const appointments = useAppointments();
  if (history.isPending) return <LoadingState />;
  if (history.error) return <ErrorState message={history.error.message} onRetry={() => history.refetch()} />;
  const records = history.data.map(item => ({ ...item, appointment: appointments.data?.find(turn => turn.id === item.appointmentId) }))
    .sort((a, b) => (b.appointment?.date || '').localeCompare(a.appointment?.date || '') || Number(b.appointmentId) - Number(a.appointmentId));
  return (
    <FlatList style={styles.screen} contentContainerStyle={styles.content} data={records} keyExtractor={item => item.id}
      refreshing={history.isRefetching} onRefresh={() => history.refetch()}
      ListHeaderComponent={<View style={{ gap: 12 }}>
        <ScreenHeader title="Historia clínica" subtitle="Registros de atención vinculados al paciente" />
        {appointments.isPending && <Text style={styles.muted}>Consultando fechas y odontólogos…</Text>}
        {appointments.error && <ErrorState message={appointments.error.message} onRetry={() => appointments.refetch()} />}
      </View>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{item.appointment ? formatDate(item.appointment.date) : `Turno ${item.appointmentId}`}</Text>
          <Text style={styles.muted}>{item.appointment?.dentist || 'Odontólogo sin consultar'}</Text>
          {item.annulled && <Text style={styles.error}>Registro anulado: {item.annulmentReason}</Text>}
          <Text style={styles.label}>Diagnóstico</Text><Text style={styles.body}>{item.diagnosis || 'Sin registrar'}</Text>
          <Text style={styles.label}>Tratamiento realizado</Text><Text style={styles.body}>{item.treatment || 'Sin registrar'}</Text>
          <Text style={styles.label}>Observaciones</Text><Text style={styles.body}>{item.notes || 'Sin observaciones.'}</Text>
        </View>
      )}
      ListEmptyComponent={<EmptyState title="Este paciente no tiene historia clínica registrada." />}
    />
  );
}
