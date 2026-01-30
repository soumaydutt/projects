import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoicesApi } from '@/services/api';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  accountName: string;
  accountNumber: string;
  issueDate: string;
  dueDate: string;
  total: number;
  balance: number;
  status: string;
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { search, status: statusFilter, dateFrom, dateTo, page, pageSize }],
    queryFn: () =>
      invoicesApi
        .getAll({ search, status: statusFilter, dateFrom, dateTo, page, pageSize })
        .then((res) => res.data),
  });

  const invoices: Invoice[] = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'PartiallyPaid':
        return 'bg-yellow-100 text-yellow-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Issued':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportCsv = () => {
    const headers = ['Invoice #', 'Account', 'Issue Date', 'Due Date', 'Total', 'Balance', 'Status'];
    const rows = invoices.map((i) => [
      i.invoiceNumber,
      i.accountName,
      i.issueDate,
      i.dueDate,
      i.total,
      i.balance,
      i.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
        <p className="text-gray-500 dark:text-gray-400">View and manage customer invoices</p>
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
                placeholder="Search by invoice #, account..."
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
              <option value="Draft">Draft</option>
              <option value="Issued">Issued</option>
              <option value="Paid">Paid</option>
              <option value="PartiallyPaid">Partially Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Voided">Voided</option>
            </select>
          </div>

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

          {/* Export */}
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
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
                      Invoice
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Account
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Issue Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Due Date
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Total
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Balance
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <span className="font-medium text-primary">{invoice.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 dark:text-white">{invoice.accountName}</p>
                        <p className="text-gray-500 text-xs">{invoice.accountNumber}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={invoice.balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          {formatCurrency(invoice.balance)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoices/${invoice.id}`);
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
                {Math.min(page * pageSize, data?.total || 0)} of {data?.total || 0} invoices
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
