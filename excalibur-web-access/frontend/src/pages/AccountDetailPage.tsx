import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/services/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Wifi,
  FileText,
  CreditCard,
  MessageSquare,
  Clock,
  Plus,
  Edit,
  Power,
  PowerOff,
} from 'lucide-react';

type TabType = 'services' | 'invoices' | 'payments' | 'notes' | 'audit';

interface Account360 {
  account: {
    id: string;
    accountNumber: string;
    name: string;
    type: string;
    status: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    balance: number;
    creditLimit: number;
    createdAt: string;
  };
  subscribers: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    services: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      monthlyRate: number;
      activatedAt: string;
    }>;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    total: number;
    balance: number;
    status: string;
  }>;
  recentPayments: Array<{
    id: string;
    paymentDate: string;
    amount: number;
    method: string;
    reference: string;
    status: string;
  }>;
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    createdByName: string;
  }>;
  auditLogs: Array<{
    id: string;
    actionType: string;
    entityType: string;
    changes: string;
    timestamp: string;
    userEmail: string;
  }>;
}

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [noteContent, setNoteContent] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['account-360', id],
    queryFn: () => accountsApi.get360(id!).then((res) => res.data as Account360),
    enabled: !!id,
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => accountsApi.addNote(id!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-360', id] });
      setNoteContent('');
      toast.success('Note added successfully');
    },
    onError: () => {
      toast.error('Failed to add note');
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'Terminated':
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Pending':
      case 'PendingActivation':
        return 'bg-blue-100 text-blue-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Account not found</p>
      </div>
    );
  }

  const { account, subscribers, recentInvoices, recentPayments, notes, auditLogs } = data;

  const tabs = [
    { id: 'services' as TabType, label: 'Services', icon: Wifi, count: subscribers.reduce((acc, s) => acc + s.services.length, 0) },
    { id: 'invoices' as TabType, label: 'Invoices', icon: FileText, count: recentInvoices.length },
    { id: 'payments' as TabType, label: 'Payments', icon: CreditCard, count: recentPayments.length },
    { id: 'notes' as TabType, label: 'Notes', icon: MessageSquare, count: notes.length },
    { id: 'audit' as TabType, label: 'Audit Trail', icon: Clock, count: auditLogs.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/accounts')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{account.name}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
              {account.status}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {account.accountNumber} &bull; {account.type}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          {account.status === 'Active' ? (
            <button className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
              <PowerOff className="h-4 w-4" />
              <span>Suspend</span>
            </button>
          ) : account.status === 'Suspended' ? (
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              <Power className="h-4 w-4" />
              <span>Reactivate</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Contact Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Contact Info</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 dark:text-white">{account.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 dark:text-white">{account.phone}</span>
            </div>
            <div className="flex items-start space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <span className="text-gray-900 dark:text-white">
                {account.address1}
                {account.address2 && <>, {account.address2}</>}
                <br />
                {account.city}, {account.state} {account.zipCode}
              </span>
            </div>
          </div>
        </div>

        {/* Account Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Account Balance</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Balance</span>
              <span className={`text-lg font-bold ${account.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(account.balance)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Credit Limit</span>
              <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(account.creditLimit)}</span>
            </div>
            {account.balance > account.creditLimit && (
              <div className="flex items-center space-x-2 text-red-600 text-sm mt-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Over credit limit</span>
              </div>
            )}
          </div>
        </div>

        {/* Billing Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Billing Summary</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Open Invoices</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {recentInvoices.filter((i) => i.status !== 'Paid').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Overdue Amount</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(recentInvoices.filter((i) => i.status === 'Overdue').reduce((acc, i) => acc + i.balance, 0))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Active Services</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {subscribers.reduce((acc, s) => acc + s.services.filter((svc) => svc.status === 'Active').length, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Account Details</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Account Type</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{account.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Created</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {new Date(account.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Subscribers</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{subscribers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {subscribers.map((subscriber) => (
                <div key={subscriber.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{subscriber.name}</p>
                      <p className="text-sm text-gray-500">{subscriber.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscriber.status)}`}>
                      {subscriber.status}
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="text-left py-2 px-4 font-medium text-gray-500">Service</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-500">Type</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-500">Status</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-500">Monthly Rate</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-500">Activated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {subscriber.services.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-2 px-4 font-medium text-gray-900 dark:text-white">{service.name}</td>
                          <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{service.type}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                              {service.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right text-gray-900 dark:text-white">
                            {formatCurrency(service.monthlyRate)}
                          </td>
                          <td className="py-2 px-4 text-gray-500">
                            {new Date(service.activatedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <button className="flex items-center space-x-2 text-primary hover:text-primary/80 text-sm font-medium">
                <Plus className="h-4 w-4" />
                <span>Add Service</span>
              </button>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Invoice #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Issue Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Due Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Balance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                    >
                      <td className="py-3 px-4 font-medium text-primary">{invoice.invoiceNumber}</td>
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
                        <span className={invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(invoice.balance)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Reference</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{payment.method}</td>
                      <td className="py-3 px-4 text-gray-500">{payment.reference}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() => navigate(`/payments/new?accountId=${id}`)}
                className="mt-4 flex items-center space-x-2 text-primary hover:text-primary/80 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Record Payment</span>
              </button>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Add note form */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => addNoteMutation.mutate(noteContent)}
                    disabled={!noteContent.trim() || addNoteMutation.isPending}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </div>

              {/* Notes list */}
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                      <span>{note.createdByName}</span>
                      <span>&bull;</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === 'audit' && (
            <div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Entity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Changes</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.actionType === 'Create'
                              ? 'bg-green-100 text-green-800'
                              : log.actionType === 'Update'
                              ? 'bg-blue-100 text-blue-800'
                              : log.actionType === 'Delete'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{log.entityType}</td>
                      <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{log.changes}</td>
                      <td className="py-3 px-4 text-gray-500">{log.userEmail}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
