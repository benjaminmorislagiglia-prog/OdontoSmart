import { useEffect, useState } from 'react';
import { usePreferences } from '../context/PreferencesContext';

export default function PaginatedRows({ rows, filterKey, children }) {
  const { rowsPerPage } = usePreferences();
  const [position, setPosition] = useState({ key: '', page: 1 });
  const key = JSON.stringify([filterKey, rowsPerPage]);
  useEffect(() => setPosition({ key, page: 1 }), [key]);
  const pages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const page = position.key === key ? Math.min(position.page, pages) : 1;
  const start = (page - 1) * rowsPerPage;
  const changePage = next => setPosition({ key, page: next });
  return <>{children(rows.slice(start, start + rowsPerPage))}{rows.length > 0 && <nav className="table-footer list-pagination" aria-label="Paginación del listado"><p aria-live="polite">{start + 1}–{Math.min(start + rowsPerPage, rows.length)} de {rows.length} registros</p><div className="patient-actions"><button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => changePage(page - 1)}>Anterior</button><span>Página {page} de {pages}</span><button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === pages} onClick={() => changePage(page + 1)}>Siguiente</button></div></nav>}</>;
}
