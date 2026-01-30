import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { collectionsApi } from '@/services/api';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  Phone,
  Mail,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface CollectionCase {
  id: string;
  accountName: string;
  accountNumber: string;
  status: string;
  priority: string;
  totalAmountDue: number;
  oldestInvoiceDate: string;
  lastContactDate: string | null;
  assignedToName: string | null;
  createdAt: string;
}

export function CollectionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['collections', { search, status: statusFilter, priority: priorityFilter, page, pageSize }],
    queryFn: () =>
      collectionsApi
        .getAll({ search, status: statusFilter, priority: priorityFilter, page, pageSize })
        .then((res) => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      collectionsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const cases: CollectionCase[] = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800';
      case 'PaymentPlan':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'WrittenOff':
        return 'bg-gray-100 text-gray-800';
      case 'Escalated':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600';
      case 'High':
        return 'text-orange-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDaysOverdue = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collections</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage overdue accounts and collection cases</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Open Cases</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {cases.filter((c) => c.status === 'Open').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {cases.filter((c) => c.status === 'InProgress').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Plans</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {cases.filter((c) => c.status === 'PaymentPlan').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Resolved (30d)</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {cases.filter((c) => c.status === 'Resolved').length}
              </p>
            </div>
          </div>
        </div>
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
                placeholder="Search by account..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="InProgress">In Progress</option>
              <option value="PaymentPlan">Payment Plan</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
              <option value="WrittenOff">Written Off</option>
            </select>
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
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
                      Account
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Priority
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Amount Due
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Days Overdue
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Last Contact
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Assigned To
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cases.map((collectionCase) => (
                    <tr
                      key={collectionCase.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => navigate(`/collections/${collectionCase.id}`)}
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {collectionCase.accountName}
                        </p>
                        <p className="text-gray-500 text-xs">{collectionCase.accountNumber}</p>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={collectionCase.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({
                              id: collectionCase.id,
                              status: e.target.value,
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(
                            collectionCase.status
                          )}`}
                        >
                          <option value="Open">Open</option>
                          <option value="InProgress">In Progress</option>
                          <option value="PaymentPlan">Payment Plan</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Escalated">Escalated</option>
                          <option value="WrittenOff">Written Off</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${getPriorityColor(collectionCase.priority)}`}>
                          {collectionCase.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-red-600">
                          {formatCurrency(collectionCase.totalAmountDue)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-red-600 font-medium">
                          {getDaysOverdue(collectionCase.oldestInvoiceDate)} days
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {collectionCase.lastContactDate
                          ? new Date(collectionCase.lastContactDate).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {collectionCase.assignedToName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/collections/${collectionCase.id}`);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info('Calling customer...');
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="Call Customer"
                          >
                            <Phone className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info('Opening email...');
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
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
                {Math.min(page * pageSize, data?.total || 0)} of {data?.total || 0} cases
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
    </div>
  );
}
