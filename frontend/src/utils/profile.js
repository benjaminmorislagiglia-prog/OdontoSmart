export const maxPhotoBytes = 5 * 1024 * 1024;
export function validateProfilePhoto(file) {
 if (!file) return '';
 if (!file.size || file.size > maxPhotoBytes) return 'La foto debe pesar como máximo 5 MB y no estar vacía.';
 const extension = file.name.split('.').pop().toLowerCase();
 const mime = {jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[extension];
 return mime && file.type === mime ? '' : 'Seleccioná una imagen JPG, JPEG, PNG o WebP.';
}
export function profileAddress(direction, localities = [], provinces = []) {
 if (!direction) return {lines:[], mapsUrl:null};
 const clean = value => typeof value === 'string' ? value.trim() : '';
 const locality = localities.find(l=>l.idLocalidad===direction.idLocalidad);
 const province = provinces.find(p=>p.idProvincia===locality?.idProvincia);
 const street = clean(direction.calle);
 const number = Number.isInteger(direction.numero) && direction.numero > 0 ? String(direction.numero) : '';
 const city = clean(locality?.nombre);
 const region = clean(province?.nombre);
 const country = clean(province?.pais);
 const lines = [[street,number].filter(Boolean).join(' '),[city,region].filter(Boolean).join(', '),clean(direction.barrio)].filter(Boolean);
 let mapsUrl = null;
 if (street && number && city && region) {
  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api','1');
  url.searchParams.set('query',[[street,number].join(' '),city,region,country].filter(Boolean).join(', '));
  mapsUrl = url.href;
 }
 return {lines,mapsUrl};
}
