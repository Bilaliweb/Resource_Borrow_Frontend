'use client';

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Button, Alert, Form } from 'antd';
import { Mail, Lock, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import { authService } from '@/services/auth.service.ts';

export default function Login() {
  const dispatch = useAppDispatch(); const navigate = useNavigate();
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true); setError(null);
    try { const { user, accessToken } = await authService.login(values); dispatch(setCredentials({ user, accessToken })); navigate('/dashboard'); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Login failed. Please try again.'); }
    finally { setLoading(false); }
  };
  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-slate-200/50 lg:grid lg:grid-cols-[.9fr_1.1fr]">
        <section className="hidden bg-primary p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div><div className="mb-10 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Users className="h-5 w-5" /></div><span className="font-semibold tracking-tight">Resource Borrow</span></div><p className="max-w-sm text-4xl font-semibold leading-tight tracking-tight">Move people and projects forward, together.</p></div>
          <div className="flex items-center gap-3 text-sm text-white/80"><ShieldCheck className="h-5 w-5" />A secure workspace for every request</div>
        </section>
        <section className="p-6 sm:p-10 lg:p-14">
          <div className="mb-8 lg:hidden"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white"><Users className="h-5 w-5" /></div></div>
          <div className="mb-8"><p className="mb-2 text-sm font-semibold text-primary">Welcome back</p><h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Sign in to your workspace</h1><p className="mt-3 text-sm leading-6 text-text-muted">Manage requests, approvals, and your team resources in one place.</p></div>
          {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} className="mb-6" />}
          <Form layout="vertical" onFinish={onFinish} autoComplete="off" requiredMark={false}>
            <Form.Item name="email" label="Email address" rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Invalid email' }]}><Input prefix={<Mail className="h-4 w-4 text-text-muted" />} placeholder="you@company.com" size="large" /></Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password' }]}><Input.Password prefix={<Lock className="h-4 w-4 text-text-muted" />} placeholder="Enter your password" size="large" /></Form.Item>
            <Form.Item className="mb-2"><Button type="primary" htmlType="submit" block size="large" loading={loading} className="h-12 font-semibold">Sign in <ArrowRight className="ml-2 inline h-4 w-4" /></Button></Form.Item>
          </Form>
          <p className="mt-6 text-center text-sm text-text-muted">Don&apos;t have an account? <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">Create one</Link></p>
        </section>
      </div>
    </main>
  );
}
