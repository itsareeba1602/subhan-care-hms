import EmptyState from './EmptyState';
import './Table.css';

// columns: [{ key, header, render? }]
// emptyMessage: shown as the EmptyState's descriptive sub-line (kept as the
// prop name for backward compatibility with existing callers). Pass
// emptyIcon/emptyTitle too for a fully designed empty state.
function Table({ columns, data, emptyMessage = 'No records found', emptyIcon, emptyTitle }) {
  if (!data || data.length === 0) {
    return emptyTitle ? (
      <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
    ) : (
      <EmptyState icon={emptyIcon} title={emptyMessage} />
    );
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
