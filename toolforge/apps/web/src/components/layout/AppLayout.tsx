import React, { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import type { ToolSchema } from '@toolforge/shared';
import { useAuth } from '../../context/AuthContext';
import { schemaApi } from '../../services/api';
import { Sidebar } from './Sidebar';
import { Button } from '../ui/Button';

export function AppLayout() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [schemas, setSchemas] = useState<ToolSchema[]>([]);
  const [schemasLoading, setSchemasLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      schemaApi.getAll()
        .then(({ data }) => setSchemas(data))
        .catch(console.error)
        .finally(() => setSchemasLoading(false));
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar schemas={schemas} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {/* Breadcrumb could go here */}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {schemasLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="animate-spin h-6 w-6 mx-auto text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <Outlet context={{ schemas }} />
          )}
        </main>
      </div>
    </div>
  );
}
