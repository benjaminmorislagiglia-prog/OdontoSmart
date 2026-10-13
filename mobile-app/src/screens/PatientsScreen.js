import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { patientService } from '../services/patientService';
import useResource from '../hooks/useResource';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppInput from '../components/AppInput';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
export default function PatientsScreen({ navigation }) {
 const { styles } = useTheme();
 const [query, setQuery] = useState('');
 const { data, loading, error, retry } = useResource(patientService.list);
 const filtered = (data || []).filter(p => (p.name + ' ' + p.dni + ' ' + p.phone).toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
 return <FlatList keyboardShouldPersistTaps="handled" style={styles.screen} contentContainerStyle={styles.content} data={loading || error ? [] : filtered} keyExtractor={p => p.id} ListHeaderComponent={<View style={{ gap: 16 }}><ScreenHeader title="Pacientes" subtitle="Información y seguimiento de cada paciente." /><AppInput label="Buscar por nombre, DNI o teléfono" value={query} onChangeText={setQuery} autoCorrect={false} /></View>} renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => navigation.navigate('PatientDetail', { id: item.id })} style={styles.card}><Text style={styles.sectionTitle}>{item.name}</Text><Text style={styles.body}>DNI: {item.dni}</Text><Text style={styles.body}>{item.phone}</Text><Text style={styles.muted}>{item.coverage || 'Sin obra social'}</Text></Pressable>} ListEmptyComponent={loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={retry} /> : <EmptyState title="No se encontraron pacientes" message="Probá con otro nombre o DNI." />} />;
}
