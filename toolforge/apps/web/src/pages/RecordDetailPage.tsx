import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import type { ToolSchema, AuditLog } from '@toolforge/shared';
import { canUpdate, canDelete, canViewAuditLog } from '@toolforge/shared';
import { recordsApi, auditApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui';

type RecordData = Record<string, unknown> & { _id: string };

export function RecordDetailPage() {
  const { toolId, recordId } = useParams<{ toolId: string; recordId: string }>();
  const navigate = useNavigate();
  const { schemas } = useOutletContext<{ schemas: ToolSchema[] }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [record, setRecord] = useState<RecordData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAudit, setShowAudit] = useState(false);

  const schema = schemas.find((s) => s.toolId === toolId);

  useEffect(() => {
    if (!toolId || !recordId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await recordsApi.getById(toolId, recordId);
        setRecord(data as RecordData);
      } catch (error) {
        showToast('Failed to load record', 'error');
        navigate(`/tools/${toolId}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toolId, recordId, navigate, showToast]);

  useEffect(() => {
    if (!toolId || !recordId || !showAudit) return;

    const fetchAudit = async () => {
      try {
        const { data } = await auditApi.getByRecordId(toolId, recordId);
        setAuditLogs(data);
      } catch {
        // Ignore
      }
    };

    fetchAudit();
  }, [toolId, recordId, showAudit]);

  if (!schema) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">Tool not found</h2>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">Record not found</h2>
        </div>
      </div>
    );
  }

  const userRole = user?.role || 'viewer';
  const canEditRecord = canUpdate(userRole, schema.permissions);
  const canDeleteRecord = canDelete(userRole, schema.permissions);
  const canViewAudit = canViewAuditLog(userRole, schema.permissions);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await recordsApi.delete(toolId!, recordId!);
      showToast('Record deleted', 'success');
      navigate(`/tools/${toolId}`);
    } catch (error) {
      showToast('Failed to delete record', 'error');
    }
  };

  const formatValue = (field: typeof schema.fields[0], value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>;
    }

    if (field.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (field.type === 'date' || field.type === 'datetime') {
      return new Date(value as string).toLocaleString();
    }

    if (field.type === 'multiselect' && Array.isArray(value)) {
      return value.join(', ');
    }

    if (field.type === 'json') {
      return (
        <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return String(value);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to={`/tools/${toolId}`} className="hover:text-primary-600">
              {schema.name}
            </Link>
            <span>/</span>
            <span>Record Detail</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {record.title as string || record.name as string || `Record ${recordId}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {canViewAudit && (
            <Button variant="secondary" onClick={() => setShowAudit(!showAudit)}>
              {showAudit ? 'Hide Audit Log' : 'View Audit Log'}
            </Button>
          )}
          {canEditRecord && (
            <Button onClick={() => navigate(`/tools/${toolId}/records/${recordId}/edit`)}>
              Edit
            </Button>
          )}
          {canDeleteRecord && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className={showAudit ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {schema.formView.sections.map((section, idx) => (
              <div key={idx} className={idx > 0 ? 'border-t border-gray-200' : ''}>
                <div className="px-6 py-4 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-900">{section.title}</h3>
                  {section.description && (
                    <p className="mt-1 text-xs text-gray-500">{section.description}</p>
                  )}
                </div>
                <div className="px-6 py-4 space-y-4">
                  {section.fields.map((fieldKey) => {
                    const field = schema.fields.find((f) => f.key === fieldKey);
                    if (!field) return null;

                    return (
                      <div key={fieldKey}>
                        <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {formatValue(field, record[fieldKey])}
                        </dd>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit log sidebar */}
        {showAudit && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Audit Log</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">No audit logs</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log._id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900">
                          {log.actionType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        by {log.actorEmail}
                      </p>
                      {log.diff.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {log.diff.slice(0, 3).map((change, i) => (
                            <li key={i} className="text-xs text-gray-600">
                              <span className="font-medium">{change.field}:</span>{' '}
                              {String(change.before ?? '-')} → {String(change.after ?? '-')}
                            </li>
                          ))}
                          {log.diff.length > 3 && (
                            <li className="text-xs text-gray-400">
                              +{log.diff.length - 3} more changes
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
