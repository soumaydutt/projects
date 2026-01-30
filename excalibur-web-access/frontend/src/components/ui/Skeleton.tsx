interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  ));

  return count === 1 ? elements[0] : <div className="space-y-2">{elements}</div>;
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading table data">
      {/* Header */}
      <div className="flex space-x-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-4" width={`${100 / columns}%`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 py-3">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-4"
              width={`${100 / columns}%`}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      role="status"
      aria-label="Loading card"
    >
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4" width="60%" />
          <Skeleton className="h-3" width="40%" />
        </div>
      </div>
      <Skeleton count={3} className="h-3" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// KPI card skeleton
export function KpiCardSkeleton() {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
      role="status"
      aria-label="Loading KPI"
    >
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4" width="40%" />
        <Skeleton variant="rectangular" width={32} height={32} className="rounded-lg" />
      </div>
      <Skeleton className="h-8" width="60%" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = 256 }: { height?: number }) {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      role="status"
      aria-label="Loading chart"
    >
      <Skeleton className="h-6 mb-4" width="30%" />
      <div style={{ height }} className="flex items-end space-x-2">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width="100%"
            height={`${30 + Math.random() * 70}%`}
          />
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Form skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading form">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4" width="20%" />
          <Skeleton className="h-10" variant="rectangular" />
        </div>
      ))}
      <div className="flex justify-end space-x-3 pt-4">
        <Skeleton className="h-10" width={80} variant="rectangular" />
        <Skeleton className="h-10" width={100} variant="rectangular" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between" role="status" aria-label="Loading header">
      <div className="space-y-2">
        <Skeleton className="h-8" width={200} />
        <Skeleton className="h-4" width={300} />
      </div>
      <Skeleton className="h-10" width={120} variant="rectangular" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
