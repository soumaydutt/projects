import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/services/api';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
} from 'lucide-react';

interface AuditLog {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  entityName: string;
  oldValues: string | null;
  newValues: string | null;
  changes: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  timestamp: string;
}

export function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { search, action: actionFilter, entity: entityFilter, dateFrom, dateTo, page, pageSize }],
    queryFn: () =>
      auditApi
        .getAll({ search, action: actionFilter, entity: entityFilter, dateFrom, dateTo, page, pageSize })
        .then((res) => res.data),
  });

  const logs: AuditLog[] = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Create':
        return 'bg-green-100 text-green-800';
      case 'Update':
        return 'bg-blue-100 text-blue-800';
      case 'Delete':
        return 'bg-red-100 text-red-800';
      case 'Login':
        return 'bg-purple-100 text-purple-800';
      case 'Logout':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity', 'User', 'IP Address', 'Changes'];
    const rows = logs.map((log) => [
      log.timestamp,
      log.actionType,
      log.entityType,
      log.entityName,
      log.userEmail,
      log.ipAddress,
      log.changes,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
    a.click();
  };

  const formatJson = (jsonStr: string | null) => {
    if (!jsonStr) return null;
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track all system activities and changes
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by entity, user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Action filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            >
              <option value="">All Actions</option>
              <option value="Create">Create</option>
              <option value="Update">Update</option>
              <option value="Delete">Delete</option>
              <option value="Login">Login</option>
              <option value="Logout">Logout</option>
            </select>
          </div>

          {/* Entity filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
          >
            <option value="">All Entities</option>
            <option value="Account">Account</option>
            <option value="Subscriber">Subscriber</option>
            <option value="Service">Service</option>
            <option value="Invoice">Invoice</option>
            <option value="Payment">Payment</option>
            <option value="CollectionCase">Collection Case</option>
            <option value="PricePlan">Price Plan</option>
            <option value="User">User</option>
          </select>

          {/* Date range */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Action
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Entity Type
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Entity
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      IP Address
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Changes
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getActionColor(
                            log.actionType
                          )}`}
                        >
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 dark:text-white">{log.entityName}</p>
                        <p className="text-gray-500 text-xs">{log.entityId}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {log.userEmail}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                        {log.ipAddress}
                      </td>
                      <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                        {log.changes}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, data?.total || 0)} of {data?.total || 0} logs
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Audit Log Details
                </h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Timestamp</label>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Action</label>
                    <p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getActionColor(selectedLog.actionType)}`}>
                        {selectedLog.actionType}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Entity Type</label>
                    <p className="text-gray-900 dark:text-white">{selectedLog.entityType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Entity ID</label>
                    <p className="text-gray-900 dark:text-white font-mono text-sm">{selectedLog.entityId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User</label>
                    <p className="text-gray-900 dark:text-white">{selectedLog.userEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IP Address</label>
                    <p className="text-gray-900 dark:text-white font-mono">{selectedLog.ipAddress}</p>
                  </div>
                </div>

                {selectedLog.oldValues && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Previous Values</label>
                    <pre className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-200 overflow-x-auto">
                      {formatJson(selectedLog.oldValues)}
                    </pre>
                  </div>
                )}

                {selectedLog.newValues && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">New Values</label>
                    <pre className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-200 overflow-x-auto">
                      {formatJson(selectedLog.newValues)}
                    </pre>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Changes Summary</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedLog.changes}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
