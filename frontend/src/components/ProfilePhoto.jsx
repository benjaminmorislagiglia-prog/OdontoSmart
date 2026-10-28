import { useEffect, useId, useRef, useState } from 'react';
import { profilePhotoUrl } from '../services/profileService';
import { validateProfilePhoto } from '../utils/profile';

export function ProfileAvatar({ person = {}, preview = null }) {
  const src = preview || profilePhotoUrl(person.fotoUrl);
  const [failed, setFailed] = useState(null);
  const name = [person.nombre, person.apellido].filter(Boolean).join(' ');
  const initials =
    [person.nombre, person.apellido]
      .map((part) => part?.trim()[0] || '')
      .join('')
      .toLocaleUpperCase('es') || '?';
  return (
    <span className="profile-avatar">
      {src && failed !== src ? (
        <img src={src} alt={'Foto de ' + (name || 'perfil')} onError={() => setFailed(src)} />
      ) : (
        <span role="img" aria-label={'Sin foto de ' + (name || 'perfil')}>
          {initials}
        </span>
      )}
    </span>
  );
}
export function ProfileHeader({ person }) {
  return (
    <div className="profile-header">
      <ProfileAvatar person={person} />
      <div>
        <p className="eyebrow">FICHA PERSONAL</p>
        <h2>
          {[person.nombre, person.apellido].filter(Boolean).join(' ') || 'Sin nombre registrado'}
        </h2>
        <p className="form-help mb-0">DNI {person.dni || 'Sin informar'}</p>
      </div>
    </div>
  );
}
export default function ProfilePhotoPicker({ person = {}, file, onChange, disabled }) {
  const id = useId();
  const input = useRef(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function select(event) {
    const next = event.target.files?.[0] || null;
    const message = validateProfilePhoto(next);
    setError(message);
    if (message) {
      event.target.value = '';
      onChange(null);
      return;
    }
    onChange(next);
  }
  return (
    <div className="profile-photo-picker">
      <ProfileAvatar person={person} preview={preview} />
      <div className="profile-photo-control">
        <label htmlFor={id} className="form-label">
          Foto de perfil (opcional)
        </label>
        <input
          ref={input}
          id={id}
          className="form-control"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={select}
          aria-invalid={!!error}
          aria-describedby={id + '-help' + (error ? ' ' + id + '-error' : '')}
        />
        <p className="form-help" id={id + '-help'}>
          JPG, JPEG, PNG o WebP. Máximo 5 MB y 4096 píxeles por lado.
        </p>
        {error && (
          <p id={id + '-error'} className="text-danger" role="alert">
            {error}
          </p>
        )}
        {file && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setError('');
              if (input.current) input.current.value = '';
            }}
          >
            Descartar foto seleccionada
          </button>
        )}
      </div>
    </div>
  );
}
