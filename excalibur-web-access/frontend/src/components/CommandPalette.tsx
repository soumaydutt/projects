import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  AlertCircle,
  DollarSign,
  ClipboardList,
  Search,
  Settings,
  LogOut,
  Plus,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  const handleSelect = useCallback(
    (callback: () => void) => {
      callback();
      onClose();
      setSearch('');
    },
    [onClose]
  );

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  }, [darkMode]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Go to Dashboard', shortcut: 'G D', action: () => navigate('/') },
    { icon: Users, label: 'Go to Accounts', shortcut: 'G A', action: () => navigate('/accounts') },
    { icon: FileText, label: 'Go to Invoices', shortcut: 'G I', action: () => navigate('/invoices') },
    { icon: CreditCard, label: 'Go to Payments', shortcut: 'G P', action: () => navigate('/payments') },
    { icon: AlertCircle, label: 'Go to Collections', shortcut: 'G C', action: () => navigate('/collections') },
    { icon: DollarSign, label: 'Go to Price Plans', shortcut: 'G R', action: () => navigate('/price-plans') },
    { icon: ClipboardList, label: 'Go to Audit Logs', shortcut: 'G L', action: () => navigate('/audit-logs') },
  ];

  const actionItems = [
    { icon: Plus, label: 'New Account', shortcut: 'N A', action: () => navigate('/accounts/new') },
    { icon: Plus, label: 'Record Payment', shortcut: 'N P', action: () => navigate('/payments/new') },
    { icon: Plus, label: 'New Price Plan', shortcut: 'N R', action: () => navigate('/price-plans?new=true') },
  ];

  const settingsItems = [
    { icon: darkMode ? Sun : Moon, label: darkMode ? 'Light Mode' : 'Dark Mode', shortcut: 'T D', action: toggleDarkMode },
    { icon: Settings, label: 'Settings', shortcut: ',', action: () => navigate('/settings') },
    { icon: LogOut, label: 'Logout', shortcut: 'Q', action: () => logout() },
  ];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Command palette">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <Command
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          loop
        >
          <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex-1 px-4 py-4 text-sm bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-400"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              {navigationItems.map((item) => (
                <Command.Item
                  key={item.label}
                  value={item.label}
                  onSelect={() => handleSelect(item.action)}
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">
                    {item.shortcut}
                  </kbd>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mt-2">
              {actionItems.map((item) => (
                <Command.Item
                  key={item.label}
                  value={item.label}
                  onSelect={() => handleSelect(item.action)}
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">
                    {item.shortcut}
                  </kbd>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Settings" className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mt-2">
              {settingsItems.map((item) => (
                <Command.Item
                  key={item.label}
                  value={item.label}
                  onSelect={() => handleSelect(item.action)}
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">
                    {item.shortcut}
                  </kbd>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd>
                  <span>Close</span>
                </span>
              </div>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
