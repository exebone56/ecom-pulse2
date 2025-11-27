// src/components/Table/DataTable.jsx

import { useMemo } from 'react';
import EditableCell from './EditableCell';

const DataTable = ({ 
  data = [], 
  column = [], 
  theadColor = 'gray-800',
  hasBorder = true,
  pagination,
  onPageChange,
  onCellUpdate,
  loading,
  rowClassName,
  cellClassName,
  renderCell,
  maxItemsPerPage = 5
}) => {
  const safeData = useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);

  const displayData = useMemo(() => {
    return pagination ? safeData : safeData.slice(0, maxItemsPerPage);
  }, [safeData, pagination, maxItemsPerPage]);

  const handleCellSave = (rowId, field, newValue) => {
    console.log('Сохранение ячейки:', { rowId, field, newValue });
    if (onCellUpdate) {
      onCellUpdate(rowId, field, newValue);
    }
  };

  return (
    <div className={`${hasBorder && 'border-2 border-gray-600'} rounded-xl overflow-hidden`}>
      <div>
        <table className="w-full border-collapse">
          <thead className={`sticky top-0 bg-${theadColor} z-10`}>
            <tr>
              {column.map((col) => (
                <th 
                  key={col.key} 
                  className="p-4 text-left text-white font-medium"
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length > 0 ? (
              displayData.map((row, rowIndex) => (
                <tr 
                  key={row.id || `row-${rowIndex}`} 
                  className={`
                    border-b border-gray-700 hover:bg-gray-800/50
                    ${rowClassName ? rowClassName(row) : ''}
                  `}
                >
                  {column.map((col) => {
                    const cellClass = [
                      col.cellClassName || 'py-4 px-4',
                      'text-white',
                      cellClassName ? cellClassName(row, col) : ''
                    ].join(' ').trim();

                    let cellValue;

                    if (col.editable) {
                      cellValue = (
                        <EditableCell
                          value={row[col.key]}
                          onSave={(newValue) => handleCellSave(row.id, col.key, newValue)}
                          className="py-2 px-3"
                          validate={col.validate}
                        />
                      );
                    } 
                    else if (renderCell) {
                      cellValue = renderCell(row[col.key], row, col);
                    }
                    else if (col.render) {
                      cellValue = col.render(row[col.key], row);
                    }
                    else {
                      cellValue = row[col.key] ?? '—';
                    }

                    return (
                      <td 
                        key={col.key}
                        className={cellClass}
                      >
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={column.length} 
                  className="py-8 text-center text-white/60"
                >
                  {loading ? 'Загрузка...' : 'Нет данных'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {pagination && onPageChange && (
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-700">
          <div className="text-gray-400 mb-2 sm:mb-0">
            Показано {displayData.length} из {pagination.count} товаров
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(pagination.previous)}
              disabled={!pagination.previous}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition text-white"
            >
              Назад
            </button>
            <span className="px-4 py-2 bg-gray-800 rounded-lg text-white">
              Страница {pagination.currentPage}
            </span>
            <button
              onClick={() => onPageChange(pagination.next)}
              disabled={!pagination.next}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition text-white"
            >
              Вперед
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;