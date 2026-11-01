import * as ImagePicker from 'expo-image-picker';

const imageTypes = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function validatePhoto(asset) {
  if (!asset?.uri) throw new Error('No se pudo leer la imagen seleccionada.');
  const extension = (asset.fileName || asset.uri.split('?')[0]).split('.').pop()?.toLowerCase();
  const type = asset.mimeType || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' })[extension];
  if (!imageTypes[type]) throw new Error('Elegí una foto JPG, PNG o WebP.');
  if (asset.fileSize > 5 * 1024 * 1024) throw new Error('La foto no puede superar los 5 MB.');
  if (asset.width > 4096 || asset.height > 4096) throw new Error('Usá una foto de hasta 4096 píxeles por lado.');
  return { ...asset, mimeType: type, fileName: `foto-paciente.${imageTypes[type]}` };
}

export async function pickPatientPhoto(source) {
  const camera = source === 'camera';
  const permission = await (camera ? ImagePicker.requestCameraPermissionsAsync() : ImagePicker.requestMediaLibraryPermissionsAsync());
  if (!permission.granted) {
    const resource = camera ? 'la cámara' : 'la galería';
    throw new Error(permission.canAskAgain ? `Se necesita permiso para acceder a ${resource}. Podés intentarlo nuevamente.` :
      `Habilitá el acceso a ${resource} desde la configuración del dispositivo.`);
  }
  const options = { mediaTypes: /** @type {ImagePicker.MediaType[]} */ (['images']), allowsEditing: true, aspect: /** @type {[number, number]} */ ([1, 1]), quality: 0.75 };
  const result = await (camera ? ImagePicker.launchCameraAsync(options) : ImagePicker.launchImageLibraryAsync(options));
  return result.canceled ? null : validatePhoto(result.assets[0]);
}

export function photoUpload(asset) {
  const image = validatePhoto(asset);
  const body = new FormData();
  // React Native envía archivos por URI; el navegador proporciona un File.
  body.append('Archivo', image.file || /** @type {any} */ ({ uri: image.uri, name: image.fileName, type: image.mimeType }));
  return body;
}
