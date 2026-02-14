import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: unknown): void {
    console.error('[AppErrorBoundary] Caught render error:', error);
  }

  public render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: '#ffffff',
          color: '#111827',
          padding: 24
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>页面加载异常</div>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>请刷新页面后重试</div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            background: '#ef4444',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          重新加载
        </button>
      </div>
    );
  }
}

