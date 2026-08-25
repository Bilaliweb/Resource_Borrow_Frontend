'use client';

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Button, Alert, Form } from 'antd';
import { Mail, Lock, Users, Building2 } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import { authService } from '@/services/auth.service.ts';

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { orgName: string; fullName: string; email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { user, accessToken } = await authService.register(values);
      dispatch(setCredentials({ user, accessToken }));
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message :
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--color-canvas)' }}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg p-8"
        style={{ border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Create Account
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Get started with Resource Borrow
          </p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}

        <Form layout="vertical" onFinish={onFinish} autoComplete="off" requiredMark={false}>
          <Form.Item
            name="orgName"
            label={<span style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 500 }}>Organization Name</span>}
            rules={[{ required: true, message: 'Please enter your organization name' }]}
          >
            <Input
              prefix={<Building2 className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />}
              placeholder="Acme Corp"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="fullName"
            label={<span style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 500 }}>Full Name</span>}
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input
              prefix={<Users className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />}
              placeholder="John Doe"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 500 }}>Email</span>}
            rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Invalid email' }]}
          >
            <Input
              prefix={<Mail className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />}
              placeholder="you@company.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 500 }}>Password</span>}
            rules={[{ required: true, message: 'Please enter your password' }, { min: 8, message: 'Password must be at least 8 characters' }]}
          >
            <Input.Password
              prefix={<Lock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />}
              placeholder="Create a password"
              size="large"
            />
          </Form.Item>

          <Form.Item className="mb-2">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              className="font-medium"
              style={{
                backgroundColor: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
                height: 44,
              }}
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium" style={{ color: 'var(--color-primary)' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
