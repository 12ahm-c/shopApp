import { Loader2 } from 'lucide-react';

export default function DataTable({ columns, data, loading, emptyMessage, renderCard, onRowClick }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-green-500" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-800">
        {data.map((row, idx) => (
          <div
            key={row._id || idx}
            onClick={() => onRowClick?.(row)}
            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors"
          >
            {renderCard ? renderCard(row) : (
              <div className="space-y-2">
                {columns.slice(0, 3).map((col) => (
                  <div key={col.key} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{col.label}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden sm:block">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-6 py-4 font-medium ${col.align === 'right' ? 'text-right' : ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.map((row, idx) => (
              <tr
                key={row._id || idx}
                onClick={() => onRowClick?.(row)}
                className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors cursor-pointer"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
