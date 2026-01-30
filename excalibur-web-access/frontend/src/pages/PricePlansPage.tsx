import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Wifi,
  Tv,
  Phone,
  Package,
} from 'lucide-react';

interface PricePlan {
  id: string;
  code: string;
  name: string;
  description: string;
  serviceType: string;
  monthlyRate: number;
  setupFee: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export function PricePlansPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricePlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['price-plans', { search, type: typeFilter, showInactive }],
    queryFn: () =>
      api
        .get('/price-plans', { params: { search, type: typeFilter, includeInactive: showInactive } })
        .then((res) => res.data),
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'Internet':
        return <Wifi className="h-5 w-5 text-blue-600" />;
      case 'Television':
        return <Tv className="h-5 w-5 text-purple-600" />;
      case 'Phone':
        return <Phone className="h-5 w-5 text-green-600" />;
      case 'Bundle':
        return <Package className="h-5 w-5 text-orange-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredPlans = (plans as PricePlan[]).filter((plan) => {
    const matchesSearch =
      !search ||
      plan.name.toLowerCase().includes(search.toLowerCase()) ||
      plan.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || plan.serviceType === typeFilter;
    const matchesActive = showInactive || plan.isActive;
    return matchesSearch && matchesType && matchesActive;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Price Plans</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage service pricing and rate plans
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedPlan(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Price Plan</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="Internet">Internet</option>
            <option value="Television">Television</option>
            <option value="Phone">Phone</option>
            <option value="Bundle">Bundle</option>
            <option value="AddOn">Add-On</option>
          </select>

          {/* Show inactive toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">Show Inactive</span>
          </label>
        </div>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                !plan.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    {getServiceTypeIcon(plan.serviceType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.code}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {plan.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Monthly Rate</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(plan.monthlyRate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Setup Fee</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatCurrency(plan.setupFee)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500">
                  {plan.serviceType}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No price plans found
          </h3>
          <p className="text-gray-500 mb-4">
            {search || typeFilter
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first price plan'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>New Price Plan</span>
          </button>
        </div>
      )}

      {/* Modal placeholder - in a real app, this would be a proper modal component */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedPlan ? 'Edit Price Plan' : 'New Price Plan'}
            </h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan Code
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedPlan?.code}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., INT-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service Type
                  </label>
                  <select
                    defaultValue={selectedPlan?.serviceType || 'Internet'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Internet">Internet</option>
                    <option value="Television">Television</option>
                    <option value="Phone">Phone</option>
                    <option value="Bundle">Bundle</option>
                    <option value="AddOn">Add-On</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  defaultValue={selectedPlan?.name}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Internet 100 Mbps"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  defaultValue={selectedPlan?.description}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="Describe the plan features..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Rate ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedPlan?.monthlyRate}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Setup Fee ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedPlan?.setupFee}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  defaultChecked={selectedPlan?.isActive ?? true}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  {selectedPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
