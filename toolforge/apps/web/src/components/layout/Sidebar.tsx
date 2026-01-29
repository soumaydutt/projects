import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { ToolSchema } from '@toolforge/shared';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  schemas: ToolSchema[];
}

export function Sidebar({ schemas }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">ToolForge</h1>
        <p className="text-xs text-gray-400 mt-1">Internal Tool Builder</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-4 mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Tools
          </span>
        </div>

        {schemas.length === 0 ? (
          <p className="px-6 py-2 text-sm text-gray-500">No tools available</p>
        ) : (
          <ul className="space-y-1 px-2">
            {schemas.map((schema) => (
              <li key={schema.toolId}>
                <Link
                  to={`/tools/${schema.toolId}`}
                  className={`
                    flex items-center gap-3 px-4 py-2 rounded-md text-sm
                    ${isActive(`/tools/${schema.toolId}`)
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                    }
                  `}
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </span>
                  {schema.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Admin section */}
        {user?.role === 'admin' && (
          <>
            <div className="px-4 mt-6 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </span>
            </div>
            <ul className="space-y-1 px-2">
              <li>
                <Link
                  to="/admin/schemas"
                  className={`
                    flex items-center gap-3 px-4 py-2 rounded-md text-sm
                    ${isActive('/admin/schemas')
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  Schema Editor
                </Link>
              </li>
            </ul>
          </>
        )}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-sm font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
