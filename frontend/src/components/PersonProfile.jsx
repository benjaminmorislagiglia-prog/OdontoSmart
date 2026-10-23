import { FiMapPin } from 'react-icons/fi';
import { ProfileHeader } from './ProfilePhoto';
import { profileAddress } from '../utils/profile';

export default function PersonProfile({person, direction, localities, provinces, extraFields=[]}) {
 const address=profileAddress(direction,localities,provinces);
 const fields = items => <dl className="row patient-details">{items.map(([label,value])=><div key={label} className="col-12 col-md-6"><dt>{label}</dt><dd>{value??'Sin informar'}</dd></div>)}</dl>;
 return <><ProfileHeader person={person}/><section className="profile-section"><h3>Datos personales</h3>{fields(extraFields)}</section><section className="profile-section"><h3>Contacto</h3>{fields([['Teléfono',person.telefono],['Correo',person.correo]])}</section><section className="profile-section"><h3>Dirección</h3>{address.lines.length?<address>{address.lines.map((line,index)=><span key={index}>{line}</span>)}</address>:<p className="form-help">Sin dirección informada.</p>}{address.mapsUrl?<a className="btn btn-outline-secondary" href={address.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Ver en Google Maps (se abre en otra pestaña)"><FiMapPin aria-hidden="true"/> Ver en Google Maps</a>:address.lines.length>0&&<p className="form-help">La dirección está incompleta para buscarla en Google Maps.</p>}</section></>;
}
