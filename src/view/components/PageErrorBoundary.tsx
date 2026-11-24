import React, { ErrorInfo } from 'react';
import { logError } from '../../utils/logger';

interface PageErrorBoundaryProps {
  /** The location of the page; a new one gives the next page a fresh start. */
  resetKey: string;
  children: React.ReactNode;
}

/**
 * Error boundary around the routed page: a render error in a page (e.g. a
 * list cell that cannot be displayed) shows a message in its place instead of
 * unmounting the whole app. Header and sidebar stay usable.
 */
class PageErrorBoundary extends React.Component<PageErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(
      `Page could not be rendered: ${error}\n${info.componentStack ?? ''}`,
      'PageErrorBoundary',
    );
  }

  componentDidUpdate(prevProps: PageErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <section
        role="alert"
        className="rounded-xs border border-stroke bg-white p-8 text-center shadow-default dark:bg-boxdark"
      >
        <h3 className="pb-2 text-xl font-bold text-plainfont">This page could not be displayed</h3>
        <p className="font-medium">
          An error occurred while displaying the data. Please reload the page; if the error
          persists, contact your admin.
        </p>
      </section>
    );
  }
}

export default PageErrorBoundary;
