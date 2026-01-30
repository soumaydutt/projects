import { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './stores/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { useGlobalShortcuts } from './hooks/useKeyboardShortcuts';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { AccountDetailPage } from './pages/AccountDetailPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { PricePlansPage } from './pages/PricePlansPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const openCommandPalette = useCallback(() => {
    if (isAuthenticated) {
      setCommandPaletteOpen(true);
    }
  }, [isAuthenticated]);

  useGlobalShortcuts(openCommandPalette);

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          classNames: {
            toast: 'group',
            title: 'font-semibold',
          },
        }}
      />

      {isAuthenticated && (
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      )}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout onOpenCommandPalette={openCommandPalette}>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/accounts" element={<AccountsPage />} />
                    <Route path="/accounts/:id" element={<AccountDetailPage />} />
                    <Route path="/invoices" element={<InvoicesPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/collections" element={<CollectionsPage />} />
                    <Route path="/price-plans" element={<PricePlansPage />} />
                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                  </Routes>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
