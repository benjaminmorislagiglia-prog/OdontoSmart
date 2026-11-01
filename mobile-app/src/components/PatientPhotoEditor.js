import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUploadPatientPhoto } from '../hooks/useClinicQueries';
import { resolvePhotoURL } from '../services/api';
import { pickPatientPhoto } from '../services/photoService';
import AppButton from './AppButton';

export default function PatientPhotoEditor({ patient }) {
  const { styles } = useTheme();
  const [draft, setDraft] = useState(null);
  const [picking, setPicking] = useState(false);
  const [message, setMessage] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const upload = useUploadPatientPhoto();
  const busy = picking || upload.isPending;
  const uri = draft?.uri || resolvePhotoURL(patient.photoPath);

  async function choose(source) {
    if (busy) return;
    setPicking(true);
    setMessage('');
    upload.reset();
    try {
      const image = await pickPatientPhoto(source);
      if (image) { setDraft(image); setPreviewError(false); }
    } catch (error) {
      setMessage(error.message || 'No se pudo abrir el selector de fotos. Intentá nuevamente.');
    } finally { setPicking(false); }
  }

  async function save() {
    if (!draft || busy) return;
    setMessage('');
    try {
      await upload.mutateAsync({ id: patient.id, asset: draft });
      setDraft(null);
      setPreviewError(false);
    } catch { /* El mensaje del servidor se muestra desde la mutación. */ }
  }

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {uri ? <Image key={uri} source={{ uri }} accessibilityLabel={draft ? 'Vista previa de la foto seleccionada' : `Foto de ${patient.name}`} style={{ width: 96, height: 96, borderRadius: 16 }} onError={() => setPreviewError(true)} /> :
          <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}><Text style={styles.muted}>Sin foto</Text></View>}
        <View style={{ flex: 1, gap: 8 }}>
          <Text accessibilityRole="header" style={styles.title}>{patient.name}</Text>
          <Text style={styles.body}>DNI: {patient.dni}</Text>
          <Text style={styles.muted}>{patient.active ? 'Activo' : 'Inactivo'}</Text>
        </View>
      </View>
      {previewError && <Text style={styles.error}>No se pudo mostrar la imagen. Podés seleccionar otra foto o volver a consultar el paciente.</Text>}
      <AppButton title="Elegir de la galería" secondary disabled={busy} onPress={() => choose('gallery')} />
      <AppButton title="Tomar fotografía" secondary disabled={busy} onPress={() => choose('camera')} />
      {picking && <Text style={styles.muted}>Abriendo el selector de fotos…</Text>}
      {draft && <>
        <Text style={styles.muted}>Vista previa. La foto se guardará al presionar Guardar foto.</Text>
        <AppButton title="Guardar foto" loading={upload.isPending} disabled={picking || previewError} onPress={save} />
        <AppButton title="Cancelar selección" secondary disabled={busy} onPress={() => { setDraft(null); setMessage(''); setPreviewError(false); upload.reset(); }} />
      </>}
      {upload.isSuccess && <Text style={styles.body} accessibilityLiveRegion="polite">Foto guardada correctamente.</Text>}
      {(message || upload.error) && <Text style={styles.error} accessibilityLiveRegion="assertive">{message || upload.error.message}</Text>}
      <Text style={styles.muted}>JPG, PNG o WebP. Hasta 5 MB y 4096 píxeles por lado.</Text>
    </View>
  );
}
