/**
 * Error Boundary Component
 * T129: Add error boundary for content display
 */

'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry?: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        We encountered an error while loading this content.
        Please try again or navigate to a different page.
      </p>

      {isDev && error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl overflow-auto">
          <p className="text-sm font-mono text-red-700">{error.message}</p>
          {error.stack && (
            <pre className="mt-2 text-xs text-red-600 overflow-x-auto">
              {error.stack}
            </pre>
          )}
        </div>
      )}

      <div className="flex gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
        <Link
          href="/rules"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Go to Rules
        </Link>
      </div>
    </div>
  );
}

/**
 * Hook to catch errors in async operations
 */
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${context || 'Error'}]:`, errorMessage);

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error:', error);
    }
  };

  return { handleError };
}

export default ErrorBoundary;
