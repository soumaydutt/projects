import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import type { ToolSchema, FieldDefinition } from '@toolforge/shared';
import { evaluateVisibility, canEditField } from '@toolforge/shared';
import { recordsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input, Select } from '../components/ui';

type RecordData = Record<string, unknown>;

export function RecordFormPage() {
  const { toolId, recordId } = useParams<{ toolId: string; recordId?: string }>();
  const navigate = useNavigate();
  const { schemas } = useOutletContext<{ schemas: ToolSchema[] }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<RecordData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(!!recordId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = schemas.find((s) => s.toolId === toolId);
  const isEditing = !!recordId;

  // Load existing record if editing
  useEffect(() => {
    if (!toolId || !recordId) return;

    const fetchRecord = async () => {
      setIsLoading(true);
      try {
        const data = await recordsApi.getById(toolId, recordId);
        setFormData(data);
      } catch (error) {
        showToast('Failed to load record', 'error');
        navigate(`/tools/${toolId}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecord();
  }, [toolId, recordId, navigate, showToast]);

  // Initialize defaults for new record
  useEffect(() => {
    if (!schema || isEditing) return;

    const defaults: RecordData = {};
    for (const field of schema.fields) {
      if (field.default !== undefined) {
        defaults[field.key] = field.default;
      }
    }
    setFormData(defaults);
  }, [schema, isEditing]);

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

  const userRole = user?.role || 'viewer';

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of schema.fields) {
      if (field.readonly || field.type === 'computed') continue;

      const value = formData[field.key];

      // Required validation
      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[field.key] = `${field.label} is required`;
        continue;
      }

      // Skip further validation if empty and not required
      if (value === undefined || value === null || value === '') continue;

      // Field-specific validation
      if (field.validation) {
        if (field.type === 'text' || field.type === 'textarea') {
          const strValue = String(value);
          if (field.validation.minLength && strValue.length < field.validation.minLength) {
            newErrors[field.key] = `Minimum ${field.validation.minLength} characters`;
          }
          if (field.validation.maxLength && strValue.length > field.validation.maxLength) {
            newErrors[field.key] = `Maximum ${field.validation.maxLength} characters`;
          }
          if (field.validation.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(strValue)) {
              newErrors[field.key] = field.validation.patternMessage || 'Invalid format';
            }
          }
        }

        if (field.type === 'number') {
          const numValue = Number(value);
          if (field.validation.min !== undefined && numValue < field.validation.min) {
            newErrors[field.key] = `Minimum value is ${field.validation.min}`;
          }
          if (field.validation.max !== undefined && numValue > field.validation.max) {
            newErrors[field.key] = `Maximum value is ${field.validation.max}`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the validation errors', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Filter out readonly and computed fields
      const submitData: RecordData = {};
      for (const field of schema.fields) {
        if (!field.readonly && field.type !== 'computed') {
          if (formData[field.key] !== undefined) {
            submitData[field.key] = formData[field.key];
          }
        }
      }

      if (isEditing) {
        await recordsApi.update(toolId!, recordId!, submitData);
        showToast('Record updated successfully', 'success');
      } else {
        await recordsApi.create(toolId!, submitData);
        showToast('Record created successfully', 'success');
      }
      navigate(`/tools/${toolId}`);
    } catch (error) {
      showToast((error as Error).message || 'Failed to save record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FieldDefinition) => {
    // Check visibility
    if (field.visibility && !evaluateVisibility(field.visibility, formData, { user: { role: userRole } })) {
      return null;
    }

    // Check edit permission
    const canEdit = canEditField(userRole, field);
    const isDisabled = !canEdit || field.readonly || field.type === 'computed';

    const value = formData[field.key];
    const error = errors[field.key];

    switch (field.type) {
      case 'text':
        return (
          <Input
            key={field.key}
            label={field.label}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            helpText={field.helpText}
            error={error}
            required={field.required}
            disabled={isDisabled}
          />
        );

      case 'textarea':
        return (
          <div key={field.key} className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={(value as string) || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              disabled={isDisabled}
              rows={4}
              className={`
                block w-full rounded-md border px-3 py-2 text-sm shadow-sm
                placeholder-gray-400 focus:outline-none focus:ring-1
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${error
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }
              `}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            {field.helpText && !error && <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>}
          </div>
        );

      case 'number':
        return (
          <Input
            key={field.key}
            type="number"
            label={field.label}
            value={(value as number)?.toString() || ''}
            onChange={(e) => handleChange(field.key, e.target.value ? Number(e.target.value) : undefined)}
            placeholder={field.placeholder}
            helpText={field.helpText}
            error={error}
            required={field.required}
            disabled={isDisabled}
          />
        );

      case 'boolean':
        return (
          <div key={field.key} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(field.key, e.target.checked)}
              disabled={isDisabled}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="text-sm font-medium text-gray-700">
              {field.label}
            </label>
          </div>
        );

      case 'select':
        return (
          <Select
            key={field.key}
            label={field.label}
            options={field.options || []}
            value={(value as string) || ''}
            onChange={(v) => handleChange(field.key, v)}
            placeholder={field.placeholder || 'Select...'}
            helpText={field.helpText}
            error={error}
            required={field.required}
            disabled={isDisabled}
          />
        );

      case 'multiselect':
        return (
          <div key={field.key} className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map((option) => {
                const selected = Array.isArray(value) && value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const current = (value as string[]) || [];
                      const next = selected
                        ? current.filter((v) => v !== option.value)
                        : [...current, option.value];
                      handleChange(field.key, next);
                    }}
                    disabled={isDisabled}
                    className={`
                      px-3 py-1 rounded-full text-sm border transition-colors
                      ${selected
                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            {field.helpText && !error && <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>}
          </div>
        );

      case 'date':
        return (
          <Input
            key={field.key}
            type="date"
            label={field.label}
            value={(value as string)?.split('T')[0] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            helpText={field.helpText}
            error={error}
            required={field.required}
            disabled={isDisabled}
          />
        );

      case 'datetime':
        return (
          <Input
            key={field.key}
            type="datetime-local"
            label={field.label}
            value={(value as string)?.slice(0, 16) || ''}
            onChange={(e) => handleChange(field.key, e.target.value ? new Date(e.target.value).toISOString() : undefined)}
            helpText={field.helpText}
            error={error}
            required={field.required}
            disabled={isDisabled}
          />
        );

      case 'relation':
        // Simplified relation field - shows as text input for ID
        return (
          <Input
            key={field.key}
            label={field.label}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={`Enter ${field.relationTo} ID`}
            helpText={field.helpText}
            error={error}
            required={field.required}
            disabled={isDisabled}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to={`/tools/${toolId}`} className="hover:text-primary-600">
            {schema.name}
          </Link>
          <span>/</span>
          <span>{isEditing ? 'Edit Record' : 'New Record'}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Record' : `New ${schema.name}`}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {schema.formView.sections.map((section, idx) => {
            // Check section visibility
            if (section.visibility && !evaluateVisibility(section.visibility, formData, { user: { role: userRole } })) {
              return null;
            }

            return (
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
                    return renderField(field);
                  })}
                </div>
              </div>
            );
          })}

          {/* Form actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/tools/${toolId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
