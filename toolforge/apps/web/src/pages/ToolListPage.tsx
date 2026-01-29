import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import type { ToolSchema, PaginatedResponse } from '@toolforge/shared';
import { canCreate, canUpdate, canDelete } from '@toolforge/shared';
import { recordsApi } from '../services/api';
import { subscribeToTool, unsubscribeFromTool, onRecordChange } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Table, Pagination, Input, Select, Modal } from '../components/ui';

type RecordData = Record<string, unknown> & { _id: string };

export function ToolListPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const { schemas } = useOutletContext<{ schemas: ToolSchema[] }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<RecordData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [bulkActionValue, setBulkActionValue] = useState('');

  const schema = schemas.find((s) => s.toolId === toolId);

  const fetchRecords = useCallback(async () => {
    if (!toolId || !schema) return;

    setIsLoading(true);
    try {
      const result = await recordsApi.query(toolId, {
        search,
        page: pagination.page,
        pageSize: pagination.pageSize,
        sort: sortField ? { field: sortField, direction: sortDirection } : undefined,
      });
      setRecords(result.data as RecordData[]);
      setPagination(result.pagination);
    } catch (error) {
      showToast('Failed to load records', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toolId, schema, search, pagination.page, pagination.pageSize, sortField, sortDirection, showToast]);

  // Fetch records on mount and when query params change
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!toolId) return;

    subscribeToTool(toolId);
    const unsubscribe = onRecordChange((event) => {
      if (event.toolId === toolId) {
        fetchRecords();
      }
    });

    return () => {
      unsubscribeFromTool(toolId);
      unsubscribe();
    };
  }, [toolId, fetchRecords]);

  if (!schema) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">Tool not found</h2>
          <p className="mt-2 text-sm text-gray-500">The requested tool does not exist or you don't have access.</p>
        </div>
      </div>
    );
  }

  const userRole = user?.role || 'viewer';
  const canCreateRecords = canCreate(userRole, schema.permissions);
  const canUpdateRecords = canUpdate(userRole, schema.permissions);
  const canDeleteRecords = canDelete(userRole, schema.permissions);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === records.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(records.map((r) => r._id)));
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkActionValue || selectedRows.size === 0) return;

    try {
      await recordsApi.bulkUpdate(toolId!, Array.from(selectedRows), 'status', bulkActionValue);
      showToast(`Updated ${selectedRows.size} records`, 'success');
      setBulkActionModal(false);
      setBulkActionValue('');
      setSelectedRows(new Set());
      fetchRecords();
    } catch (error) {
      showToast('Failed to update records', 'error');
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await recordsApi.delete(toolId!, recordId);
      showToast('Record deleted', 'success');
      fetchRecords();
    } catch (error) {
      showToast('Failed to delete record', 'error');
    }
  };

  // Build columns from schema
  const columns = schema.listView.columns.map((col) => ({
    key: col.key,
    label: col.label,
    sortable: col.sortable,
    render: (value: unknown, row: RecordData) => {
      // Status badges
      if (col.key === 'status') {
        const statusColors: Record<string, string> = {
          new: 'bg-blue-100 text-blue-800',
          open: 'bg-yellow-100 text-yellow-800',
          pending: 'bg-orange-100 text-orange-800',
          resolved: 'bg-green-100 text-green-800',
          closed: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[value as string] || 'bg-gray-100 text-gray-800'}`}>
            {value as string}
          </span>
        );
      }

      // Priority badges
      if (col.key === 'priority') {
        const priorityColors: Record<string, string> = {
          low: 'bg-gray-100 text-gray-800',
          medium: 'bg-yellow-100 text-yellow-800',
          high: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[value as string] || 'bg-gray-100 text-gray-800'}`}>
            {value as string}
          </span>
        );
      }

      return undefined; // Use default rendering
    },
  }));

  // Add actions column
  columns.push({
    key: '_actions',
    label: 'Actions',
    sortable: false,
    render: (_: unknown, row: RecordData) => (
      <div className="flex items-center gap-2">
        <Link
          to={`/tools/${toolId}/records/${row._id}`}
          className="text-primary-600 hover:text-primary-700 text-sm"
        >
          View
        </Link>
        {canUpdateRecords && (
          <Link
            to={`/tools/${toolId}/records/${row._id}/edit`}
            className="text-gray-600 hover:text-gray-700 text-sm"
          >
            Edit
          </Link>
        )}
        {canDeleteRecords && (
          <button
            onClick={() => handleDelete(row._id)}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        )}
      </div>
    ),
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{schema.name}</h1>
        {schema.description && (
          <p className="mt-1 text-sm text-gray-500">{schema.description}</p>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && canUpdateRecords && (
            <Button variant="secondary" onClick={() => setBulkActionModal(true)}>
              Bulk Update ({selectedRows.size})
            </Button>
          )}
          {canCreateRecords && (
            <Button onClick={() => navigate(`/tools/${toolId}/records/new`)}>
              Create New
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          data={records}
          isLoading={isLoading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          selectedRows={canUpdateRecords ? selectedRows : undefined}
          onSelectRow={canUpdateRecords ? handleSelectRow : undefined}
          onSelectAll={canUpdateRecords ? handleSelectAll : undefined}
        />
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={bulkActionModal}
        onClose={() => setBulkActionModal(false)}
        title="Bulk Update Status"
      >
        <div className="space-y-4">
          <Select
            label="New Status"
            options={[
              { value: 'new', label: 'New' },
              { value: 'open', label: 'Open' },
              { value: 'pending', label: 'Pending' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
            value={bulkActionValue}
            onChange={setBulkActionValue}
            placeholder="Select status"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBulkActionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkStatusChange} disabled={!bulkActionValue}>
              Update {selectedRows.size} Records
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
