import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { KpiCardSkeleton, ChartSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import {
  DollarSign,
  AlertTriangle,
  Users,
  TrendingUp,
  Wifi,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';

const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#dc2626'];

export function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => dashboardApi.getKpis().then((res) => res.data),
  });

  const { data: arAging, isLoading: arAgingLoading } = useQuery({
    queryKey: ['ar-aging'],
    queryFn: () => dashboardApi.getArAging().then((res) => res.data),
  });

  const { data: paymentsTrend, isLoading: paymentsTrendLoading } = useQuery({
    queryKey: ['payments-trend'],
    queryFn: () => dashboardApi.getPaymentsTrend().then((res) => res.data),
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => dashboardApi.getRecentActivities().then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Overview of your customer care and billing operations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" role="region" aria-label="Key performance indicators">
        {kpisLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
        <KpiCard
          title="Total AR"
          value={formatCurrency(kpis?.totalAr || 0)}
          icon={DollarSign}
          color="blue"
        />
        <KpiCard
          title="Overdue AR"
          value={formatCurrency(kpis?.overdueAr || 0)}
          icon={AlertTriangle}
          color="red"
        />
        <KpiCard
          title="Collections Queue"
          value={kpis?.collectionsQueueCount || 0}
          icon={Clock}
          color="orange"
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(kpis?.monthlyRevenue || 0)}
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          title="Active Subscribers"
          value={kpis?.activeSubscribers || 0}
          icon={Users}
          color="purple"
        />
        <KpiCard
          title="Active Services"
          value={kpis?.activeServices || 0}
          icon={Wifi}
          color="cyan"
        />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" role="region" aria-label="Charts">
        {/* AR Aging Chart */}
        {arAgingLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AR Aging
            </h2>
            <div className="h-64" role="img" aria-label="Bar chart showing accounts receivable aging">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arAging || []} aria-hidden="true">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="amount" fill="#3b82f6">
                    {(arAging || []).map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Payments Trend Chart */}
        {paymentsTrendLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Payments Trend (Last 6 Months)
            </h2>
            <div className="h-64" role="img" aria-label="Line chart showing payment trends over 6 months">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paymentsTrend || []} aria-hidden="true">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6" role="region" aria-label="Recent activities">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activities
        </h2>
        {activitiesLoading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Recent system activities">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col" className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
                  <th scope="col" className="text-left py-3 px-4 font-medium text-gray-500">Entity</th>
                  <th scope="col" className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                  <th scope="col" className="text-left py-3 px-4 font-medium text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {(recentActivities || []).slice(0, 10).map((activity: {
                  id: string;
                  actionType: string;
                  entityType: string;
                  entityName?: string;
                  userEmail?: string;
                  timestamp: string;
                }) => (
                  <tr
                    key={activity.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        activity.actionType === 'Create' ? 'bg-green-100 text-green-800' :
                        activity.actionType === 'Update' ? 'bg-blue-100 text-blue-800' :
                        activity.actionType === 'Delete' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.actionType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{activity.entityType}</p>
                        <p className="text-gray-500 text-xs">{activity.entityName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{activity.userEmail}</td>
                    <td className="py-3 px-4 text-gray-500" title={new Date(activity.timestamp).toLocaleString()}>
                      {formatRelativeTime(activity.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'red' | 'green' | 'orange' | 'purple' | 'cyan';
}

function KpiCard({ title, value, icon: Icon, color }: KpiCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    cyan: 'bg-cyan-100 text-cyan-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
