import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ToolSchema } from '@toolforge/shared';
import { schemaApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Modal } from '../components/ui';

export function SchemaEditorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [schemas, setSchemas] = useState<ToolSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editingSchema, setEditingSchema] = useState<ToolSchema | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Only admins can access
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  useEffect(() => {
    const fetchSchemas = async () => {
      setIsLoading(true);
      try {
        const { data } = await schemaApi.getAll();
        setSchemas(data);
      } catch (error) {
        showToast('Failed to load schemas', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchemas();
  }, [showToast]);

  const handleEdit = (schema: ToolSchema) => {
    setEditingSchema(schema);
    setJsonInput(JSON.stringify({
      toolId: schema.toolId,
      name: schema.name,
      description: schema.description,
      icon: schema.icon,
      resource: schema.resource,
      fields: schema.fields,
      listView: schema.listView,
      formView: schema.formView,
      actions: schema.actions,
      permissions: schema.permissions,
      audit: schema.audit,
    }, null, 2));
    setJsonError('');
    setEditModal(true);
  };

  const handleCreate = () => {
    setEditingSchema(null);
    setJsonInput(JSON.stringify({
      toolId: 'new-tool',
      name: 'New Tool',
      description: '',
      resource: 'new_collection',
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          required: true,
        },
      ],
      listView: {
        columns: [{ key: 'name', label: 'Name', sortable: true }],
        defaultSort: { field: 'createdAt', direction: 'desc' },
        pageSize: 20,
        searchableFields: ['name'],
      },
      formView: {
        sections: [{ title: 'Basic Info', fields: ['name'] }],
      },
      permissions: {
        canAccessTool: ['admin'],
        canCreate: ['admin'],
        canRead: ['admin'],
        canUpdate: ['admin'],
        canDelete: ['admin'],
        canViewAuditLog: ['admin'],
      },
      audit: { enabled: true },
    }, null, 2));
    setJsonError('');
    setEditModal(true);
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonError('');

      // Validate
      const validation = await schemaApi.validate(parsed);
      if (!validation.valid) {
        setJsonError(validation.errors?.join('\n') || 'Invalid schema');
        return;
      }

      setIsSaving(true);

      if (editingSchema) {
        await schemaApi.update(editingSchema._id!, parsed);
        showToast('Schema updated', 'success');
      } else {
        await schemaApi.create(parsed);
        showToast('Schema created', 'success');
      }

      // Refresh list
      const { data } = await schemaApi.getAll();
      setSchemas(data);
      setEditModal(false);
    } catch (error) {
      if (error instanceof SyntaxError) {
        setJsonError('Invalid JSON syntax');
      } else {
        setJsonError((error as Error).message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (schema: ToolSchema) => {
    try {
      if (schema.isPublished) {
        await schemaApi.unpublish(schema._id!);
        showToast('Schema unpublished', 'success');
      } else {
        await schemaApi.publish(schema._id!);
        showToast('Schema published', 'success');
      }

      // Refresh list
      const { data } = await schemaApi.getAll();
      setSchemas(data);
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  const handleDelete = async (schema: ToolSchema) => {
    if (!confirm(`Are you sure you want to delete "${schema.name}"?`)) return;

    try {
      await schemaApi.delete(schema._id!);
      showToast('Schema deleted', 'success');
      setSchemas((prev) => prev.filter((s) => s._id !== schema._id));
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schema Editor</h1>
          <p className="mt-1 text-sm text-gray-500">Manage tool schemas</p>
        </div>
        <Button onClick={handleCreate}>Create Schema</Button>
      </div>

      {/* Schemas list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : schemas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No schemas yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemas.map((schema) => (
            <div
              key={schema._id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{schema.name}</h3>
                  <p className="text-sm text-gray-500">{schema.toolId}</p>
                </div>
                <span
                  className={`
                    inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${schema.isPublished
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }
                  `}
                >
                  {schema.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              {schema.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{schema.description}</p>
              )}
              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleEdit(schema)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePublish(schema)}
                >
                  {schema.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(schema)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title={editingSchema ? 'Edit Schema' : 'Create Schema'}
        size="xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schema JSON
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setJsonError('');
              }}
              rows={20}
              className={`
                block w-full rounded-md border px-3 py-2 text-sm font-mono shadow-sm
                focus:outline-none focus:ring-1
                ${jsonError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }
              `}
            />
            {jsonError && (
              <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">{jsonError}</pre>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
