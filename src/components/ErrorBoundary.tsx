import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 素材加载错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: '#fff',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#ef4444' }}>
            素材加载失败
          </h3>
          <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '16px' }}>
            网络波动导致素材加载失败，已切换到离线真迹图
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: '#333',
              border: '1px solid #444',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            重试加载
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;