import React from 'react';
import ErrorView from '../views/ErrorView';

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback component. Receives error & reset function. */
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/* ------------------------------------------------------------------ */
/*  ErrorBoundary (class component)                                   */
/* ------------------------------------------------------------------ */

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details to console for debugging
    console.error('[ErrorBoundary] Caught an error during render:');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  /** Reset the error state so children re-render from scratch. */
  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback: FallbackComponent } = this.props;

    if (hasError && error) {
      // If a custom fallback was provided, use it
      if (FallbackComponent) {
        return <FallbackComponent error={error} resetError={this.resetError} />;
      }

      // Default: render the ErrorView
      return (
        <ErrorView
          error={error}
          onRetry={this.resetError}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
