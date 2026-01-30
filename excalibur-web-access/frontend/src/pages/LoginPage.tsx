import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/authStore';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { InputField } from '@/components/ui/FormField';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid credentials. Please try again.';
      setError('root', { message: errorMessage });
      toast.error('Login failed', { description: errorMessage });
    }
  };

  const fillDemoCredentials = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4"
            aria-hidden="true"
          >
            <span className="text-3xl font-bold text-white">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Excalibur Web Access
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Customer Care & Billing Platform
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {errors.root && (
              <div
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                role="alert"
              >
                <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
              </div>
            )}

            <InputField
              {...register('email')}
              id="email"
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              error={errors.email}
              required
              autoComplete="email"
              autoFocus
            />

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all ${
                    errors.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-red-500" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
              Demo Credentials (click to fill):
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin@excalibur.com', 'Admin123!')}
                className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <p className="font-medium text-gray-900 dark:text-white">Admin</p>
                <p className="text-gray-500">admin@excalibur.com</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('billing@excalibur.com', 'Billing123!')}
                className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <p className="font-medium text-gray-900 dark:text-white">Billing Agent</p>
                <p className="text-gray-500">billing@excalibur.com</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('care@excalibur.com', 'Care123!')}
                className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <p className="font-medium text-gray-900 dark:text-white">Care Agent</p>
                <p className="text-gray-500">care@excalibur.com</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('collector@excalibur.com', 'Collector123!')}
                className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <p className="font-medium text-gray-900 dark:text-white">Collector</p>
                <p className="text-gray-500">collector@excalibur.com</p>
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Tab</kbd> to navigate,{' '}
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to submit
        </p>
      </div>
    </div>
  );
}
