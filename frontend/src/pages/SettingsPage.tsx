'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Tag, message } from 'antd';
import { Users, Calendar, Save } from 'lucide-react';
import api from '@/services/api.ts';

interface OrgSettings {
  name: string;
  planTier: string;
  userCount: number;
  createdAt: string;
}

const PLAN_TAG_CONFIG: Record<string, { color: string; bg: string }> = {
  starter: { color: '#6B7280', bg: '#F3F4F6' },
  growth: { color: '#3B82F6', bg: '#DBEAFE' },
  enterprise: { color: '#6366F1', bg: '#EEF2FF' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await api.get<{ success: boolean; data: OrgSettings }>('/organizations/settings');
        const data = res.data.data;
        setSettings(data);
        setOrgName(data.name);
      } catch {
        message.error('Failed to load organization settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!orgName.trim()) {
      message.error('Organization name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put<{ success: boolean; data: OrgSettings }>('/organizations/settings', { name: orgName });
      setSettings(res.data.data);
      message.success('Settings saved successfully');
    } catch {
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const planConfig = PLAN_TAG_CONFIG[settings?.planTier ?? ''] ?? { color: '#6B7280', bg: '#F3F4F6' };

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Manage your organization settings</p>
      </div>

      {/* Organization Information Card */}
      <div
        className="bg-white rounded-lg overflow-hidden mb-6"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Organization Information
          </h3>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
            </div>
          ) : settings ? (
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Organization Name
                </label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  style={{ maxWidth: 400 }}
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Plan Tier
                </label>
                <Tag
                  style={{
                    color: planConfig.color,
                    backgroundColor: planConfig.bg,
                    borderColor: `${planConfig.color}30`,
                    borderRadius: 9999,
                    fontSize: 13,
                    padding: '2px 12px',
                    textTransform: 'capitalize',
                  }}
                >
                  {settings.planTier}
                </Tag>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Users
                  </label>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-[14px]" style={{ color: 'var(--color-text-primary)' }}>{settings.userCount}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Created
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-[14px]" style={{ color: 'var(--color-text-primary)' }}>
                      {formatDate(settings.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="primary"
                  icon={<Save className="w-4 h-4" />}
                  loading={saving}
                  onClick={handleSave}
                  style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Danger Zone Card */}
      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--color-danger-border)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-danger-border)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-danger)' }}>
            Danger Zone
          </h3>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>Delete Organization</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Permanently remove this organization and all of its data. This action cannot be undone.
            </p>
          </div>
          <Button danger disabled>
            Delete Organization
          </Button>
        </div>
      </div>
    </div>
  );
}
