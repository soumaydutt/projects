import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { accountsApi } from '@/services/api';
import { formatCurrency, exportToCsv } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ColumnChooser, useColumnChooser, Column } from '@/components/ColumnChooser';
import {
  Search,
  Plus,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  User,
} from 'lucide-react';

const DEFAULT_COLUMNS: Column[] = [
  { id: 'account', label: 'Account', visible: true, sticky: true },
  { id: 'type', label: 'Type', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'contact', label: 'Contact', visible: true },
  { id: 'location', label: 'Location', visible: true },
  { id: 'balance', label: 'Balance', visible: true },
  { id: 'actions', label: 'Actions', visible: true },
];

interface Account {
  id: string;
  accountNumber: string;
  name: string;
  type: string;
  status: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  balance: number;
  createdAt: string;
}

export function AccountsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { columns, setColumns, visibleColumns } = useColumnChooser(DEFAULT_COLUMNS, 'accounts');

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['accounts', { search: debouncedSearch, status: statusFilter, type: typeFilter, page, pageSize }],
    queryFn: () =>
      accountsApi
        .getAll({ search: debouncedSearch, status: statusFilter, type: typeFilter, page, pageSize })
        .then((res) => res.data),
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const accounts: Account[] = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'Terminated':
        return 'bg-red-100 text-red-800';
      case 'PendingActivation':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      accounts.map((a) => ({
        accountNumber: a.accountNumber,
        name: a.name,
        type: a.type,
        status: a.status,
        email: a.email,
        phone: a.phone,
        city: a.city,
        state: a.state,
        balance: a.balance,
      })),
      'accounts',
      {
        accountNumber: 'Account #',
        name: 'Name',
        type: 'Type',
        status: 'Status',
        email: 'Email',
        phone: 'Phone',
        city: 'City',
        state: 'State',
        balance: 'Balance',
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage customer and business accounts
          </p>
        </div>
        <button
          onClick={() => navigate('/accounts/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Account</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="account-search" className="sr-only">Search accounts</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                id="account-search"
                type="search"
                placeholder="Search by name, account #, email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-describedby="search-hint"
              />
              {isFetching && search && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" aria-hidden="true"></div>
                </div>
              )}
            </div>
            <p id="search-hint" className="sr-only">Search results will update as you type</p>
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
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Terminated">Terminated</option>
              <option value="PendingActivation">Pending Activation</option>
            </select>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="Residential">Residential</option>
            <option value="Business">Business</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Government">Government</option>
          </select>

          {/* Column Chooser */}
          <ColumnChooser
            columns={columns}
            onChange={setColumns}
            storageKey="accounts"
          />

          {/* Export */}
          <button
            onClick={handleExportCsv}
            disabled={accounts.length === 0}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export accounts to CSV"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" role="region" aria-label="Accounts list">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={visibleColumns.length} />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No accounts found
            </h3>
            <p className="text-gray-500 mb-4">
              {search || statusFilter || typeFilter
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first account'}
            </p>
            <button
              onClick={() => navigate('/accounts/new')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>New Account</span>
            </button>
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
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Location
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Balance
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {accounts.map((account) => (
                    <tr
                      key={account.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => navigate(`/accounts/${account.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {account.type === 'Business' || account.type === 'Enterprise' ? (
                              <Building2 className="h-5 w-5 text-primary" />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {account.name}
                            </p>
                            <p className="text-gray-500 text-xs">{account.accountNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {account.type}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            account.status
                          )}`}
                        >
                          {account.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-900 dark:text-white">{account.email}</p>
                        <p className="text-gray-500 text-xs">{account.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {account.city}, {account.state}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-medium ${
                            account.balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {formatCurrency(account.balance)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/accounts/${account.id}`);
                          }}
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
                {Math.min(page * pageSize, data?.total || 0)} of {data?.total || 0} accounts
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
