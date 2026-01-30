import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { FieldError } from 'react-hook-form';

interface BaseFieldProps {
  label: string;
  error?: FieldError;
  hint?: string;
  required?: boolean;
}

// Input Field
interface InputFieldProps extends BaseFieldProps, InputHTMLAttributes<HTMLInputElement> {}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, required, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
          aria-required={required}
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary'
          } ${className}`}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error.message}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

// Select Field
interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, required, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    return (
      <div className="space-y-1">
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
          aria-required={required}
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error.message}
          </p>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';

// Textarea Field
interface TextareaFieldProps extends BaseFieldProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  showCount?: boolean;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, required, maxLength, showCount, className = '', id, value, ...props }, ref) => {
    const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="space-y-1">
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
          aria-required={required}
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary'
          } ${className}`}
          {...props}
        />
        <div className="flex justify-between">
          <div>
            {hint && !error && (
              <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
                {hint}
              </p>
            )}
            {error && (
              <p id={errorId} className="text-sm text-red-500" role="alert">
                {error.message}
              </p>
            )}
          </div>
          {showCount && maxLength && (
            <p
              className={`text-sm ${
                currentLength > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TextareaField.displayName = 'TextareaField';

// Checkbox Field
interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: FieldError;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, description, error, className = '', id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${checkboxId}-error`;

    return (
      <div className="space-y-1">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? errorId : undefined}
              className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ${className}`}
              {...props}
            />
          </div>
          <div className="ml-3">
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {label}
            </label>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-500 ml-7" role="alert">
            {error.message}
          </p>
        )}
      </div>
    );
  }
);

CheckboxField.displayName = 'CheckboxField';
