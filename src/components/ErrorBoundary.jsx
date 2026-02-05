import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught:', error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                    <div className="text-center max-w-md">
                        <div className="mb-6 flex justify-center">
                            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-destructive" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold mb-4 text-foreground">
                            कुछ गलत हो गया
                        </h1>

                        <p className="text-muted-foreground mb-6">
                            क्षमा करें, एक अप्रत्याशित त्रुटि हुई है। कृपया पुनः प्रयास करें।
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="text-left mb-6 p-4 bg-muted rounded-lg text-sm">
                                <summary className="cursor-pointer font-medium mb-2">
                                    Error Details (Dev Only)
                                </summary>
                                <pre className="overflow-auto text-xs text-destructive">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}

                        <Button onClick={this.handleReset} size="lg" className="btn-gradient">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            होम पेज पर जाएं
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
