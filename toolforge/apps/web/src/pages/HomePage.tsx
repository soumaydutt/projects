import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { ToolSchema } from '@toolforge/shared';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { schemas } = useOutletContext<{ schemas: ToolSchema[] }>();
  const { user } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select a tool from the sidebar or explore available tools below.
        </p>
      </div>

      {schemas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tools available</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'admin'
              ? 'Create a new tool schema to get started.'
              : 'Contact an administrator to get access to tools.'}
          </p>
          {user?.role === 'admin' && (
            <div className="mt-6">
              <Link
                to="/admin/schemas"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                Create Schema
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemas.map((schema) => (
            <Link
              key={schema.toolId}
              to={`/tools/${schema.toolId}`}
              className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{schema.name}</h3>
                  {schema.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">{schema.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
