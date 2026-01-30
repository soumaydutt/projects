import { useState, useEffect, useCallback } from 'react';
import { Settings2, GripVertical, Eye, EyeOff, Save, RotateCcw } from 'lucide-react';

export interface Column {
  id: string;
  label: string;
  visible: boolean;
  sticky?: boolean;
  width?: number;
}

interface ColumnChooserProps {
  columns: Column[];
  onChange: (columns: Column[]) => void;
  storageKey?: string;
}

export function ColumnChooser({ columns, onChange, storageKey }: ColumnChooserProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load saved column preferences
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`columns_${storageKey}`);
      if (saved) {
        try {
          const savedColumns = JSON.parse(saved) as Column[];
          // Merge with current columns to handle new columns
          const merged = columns.map((col) => {
            const savedCol = savedColumns.find((sc) => sc.id === col.id);
            return savedCol ? { ...col, ...savedCol } : col;
          });
          setLocalColumns(merged);
          onChange(merged);
        } catch {
          setLocalColumns(columns);
        }
      }
    }
  }, [storageKey]);

  const toggleColumn = useCallback((columnId: string) => {
    setLocalColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  }, []);

  const toggleSticky = useCallback((columnId: string) => {
    setLocalColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, sticky: !col.sticky } : col
      )
    );
  }, []);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newColumns = [...localColumns];
    const [draggedColumn] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, draggedColumn);
    setLocalColumns(newColumns);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const applyChanges = () => {
    onChange(localColumns);
    if (storageKey) {
      localStorage.setItem(`columns_${storageKey}`, JSON.stringify(localColumns));
    }
    setIsOpen(false);
  };

  const resetToDefault = () => {
    setLocalColumns(columns.map((col) => ({ ...col, visible: true, sticky: false })));
    if (storageKey) {
      localStorage.removeItem(`columns_${storageKey}`);
    }
  };

  const showAll = () => {
    setLocalColumns((prev) => prev.map((col) => ({ ...col, visible: true })));
  };

  const hideAll = () => {
    setLocalColumns((prev) =>
      prev.map((col, idx) => ({ ...col, visible: idx === 0 })) // Keep at least first column
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Configure columns"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Settings2 className="h-4 w-4" aria-hidden="true" />
        <span>Columns</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
            role="dialog"
            aria-label="Column settings"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Configure Columns
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Drag to reorder, toggle visibility
              </p>
            </div>

            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={showAll}
                  className="px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded"
                >
                  Show All
                </button>
                <button
                  onClick={hideAll}
                  className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Hide All
                </button>
              </div>
              <button
                onClick={resetToDefault}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2">
              {localColumns.map((column, index) => (
                <div
                  key={column.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center space-x-2 p-2 rounded-lg cursor-move hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    draggedIndex === index ? 'opacity-50 bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <GripVertical
                    className="h-4 w-4 text-gray-400 flex-shrink-0"
                    aria-hidden="true"
                  />

                  <button
                    onClick={() => toggleColumn(column.id)}
                    className={`p-1 rounded ${
                      column.visible
                        ? 'text-primary'
                        : 'text-gray-400'
                    }`}
                    aria-label={column.visible ? 'Hide column' : 'Show column'}
                  >
                    {column.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>

                  <span
                    className={`flex-1 text-sm ${
                      column.visible
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    {column.label}
                  </span>

                  <button
                    onClick={() => toggleSticky(column.id)}
                    className={`px-2 py-0.5 text-xs rounded ${
                      column.sticky
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    aria-label={column.sticky ? 'Unpin column' : 'Pin column'}
                  >
                    {column.sticky ? 'Pinned' : 'Pin'}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={applyChanges}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Hook for managing column state
export function useColumnChooser(defaultColumns: Column[], storageKey?: string) {
  const [columns, setColumns] = useState<Column[]>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`columns_${storageKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultColumns;
        }
      }
    }
    return defaultColumns;
  });

  const visibleColumns = columns.filter((col) => col.visible);
  const stickyColumns = columns.filter((col) => col.sticky && col.visible);

  return {
    columns,
    setColumns,
    visibleColumns,
    stickyColumns,
  };
}
