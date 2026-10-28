import { useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import { clinicalHistoryService } from '../services/clinicalHistoryService';
import useResource from '../hooks/useResource';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { formatDate } from '../utils/formatters';
export default function ClinicalHistoryScreen({ route }) {
  const { styles } = useTheme();
  const loader = useCallback(
    () => clinicalHistoryService.listByPatient(route.params.id),
    [route.params.id],
  );
  const { data, loading, error, retry } = useResource(loader);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <ScreenHeader
          title="Historia clínica"
          subtitle="Registros de atención · Más recientes primero"
        />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{formatDate(item.date)}</Text>
          <Text style={styles.muted}>{item.dentist}</Text>
          <Text style={styles.label}>Diagnóstico</Text>
          <Text style={styles.body}>{item.diagnosis}</Text>
          <Text style={styles.label}>Tratamiento realizado</Text>
          <Text style={styles.body}>{item.treatment}</Text>
          <Text style={styles.label}>Observaciones</Text>
          <Text style={styles.body}>{item.notes || 'Sin observaciones.'}</Text>
        </View>
      )}
      ListEmptyComponent={<EmptyState title="No hay registros clínicos" />}
    />
  );
}
