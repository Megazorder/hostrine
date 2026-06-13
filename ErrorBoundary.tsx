import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-red-100 max-w-xl w-full text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Oops, algo deu errado!</h1>
            <p className="text-gray-600 mb-6">
              Desculpe, ocorreu um erro inesperado. Nossa equipe já foi notificada.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg text-left overflow-x-auto mb-6 max-h-40 overflow-y-auto">
              <pre className="text-xs text-red-500 font-mono">
                {this.state.error?.toString()}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
