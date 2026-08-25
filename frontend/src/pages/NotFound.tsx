import { Link } from 'react-router-dom';
import { Button } from 'antd';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
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
          style={{ backgroundColor: '#EEF2FF' }}
        >
          <FileQuestion className="w-7 h-7" style={{ color: '#4F46E5' }} />
        </div>
        <h1
          className="text-6xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          404
        </h1>
        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Page not found
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/dashboard">
          <Button
            type="primary"
            style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
