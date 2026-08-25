import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from 'antd';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-4"
          style={{ backgroundColor: 'var(--color-canvas)' }}
        >
          <div
            className="w-full max-w-md bg-white rounded-lg p-8 text-center"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <AlertTriangle className="w-7 h-7" style={{ color: '#EF4444' }} />
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Something went wrong
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <Button
              onClick={this.handleReset}
              style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
