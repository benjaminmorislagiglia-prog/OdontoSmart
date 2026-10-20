import EmptyState from './EmptyState';
import PaginatedRows from './PaginatedRows';

export default function RecordListSection({ title, rows, idKey, columns, actions, filterKey, emptyMessage = 'No hay registros.' }) {
  return <section className="panel mb-3" aria-label={title}>
    <div className="panel-heading"><h2>{title} <span className="count-pill">{rows.length}</span></h2></div>
    {rows.length ? <PaginatedRows rows={rows} filterKey={filterKey}>{visibleRows =>
      <div className="table-responsive" tabIndex={0} role="region" aria-label={'Listado: ' + title}>
        <table className="table appointments-table"><caption className="visually-hidden">{title}</caption>
          <thead><tr>{columns.map(c => <th scope="col" key={c.key}>{c.label}</th>)}<th scope="col">Acciones</th></tr></thead>
          <tbody>{visibleRows.map(row => <tr key={row[idKey]}>{columns.map(c => <td key={c.key}>{c.render(row)}</td>)}<td><div className="patient-actions">{actions(row)}</div></td></tr>)}</tbody>
        </table>
      </div>}
    </PaginatedRows> : <EmptyState title={emptyMessage} />}
  </section>;
}
