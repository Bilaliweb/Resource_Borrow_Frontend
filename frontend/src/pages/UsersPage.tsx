'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Table, Input, Select, Modal, Form, Tag, Dropdown, message } from 'antd';
import { UserPlus, MoreHorizontal, Search, Users } from 'lucide-react';
import { userService } from '@/services/user.service.ts';
import type { User, Role } from '@/services/user.service.ts';

const ROLE_COLORS: Record<string, string> = {
  owner: '#6366F1',
  hr_manager: '#10B981',
  department_head: '#3B82F6',
  manager: '#F59E0B',
  employee: '#6B7280',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  hr_manager: 'HR Manager',
  department_head: 'Dept Head',
  manager: 'Manager',
  employee: 'Employee',
};

const ROLE_FILTER_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'department_head', label: 'Dept Head' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [form] = Form.useForm();

  // Edit roles modal
  const [rolesOpen, setRolesOpen] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers({ page, pageSize, search, role: roleFilter, status: statusFilter });

      // Fetch all roles
      const getRoles = await userService.getRoles()
      
      
      setUsers(res.data);
      setTotal(res.total);
      // Extract unique roles from fetched users for role selection
      const roleMap = new Map<string, Role>();
      
      // res.data.forEach((u) => u.roles.forEach((r) => roleMap.set(r.id, r)));
      getRoles.forEach((r) => roleMap.set(r.id, r));
      setAvailableRoles(Array.from(roleMap.values()));
    } catch {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInvite = async (values: { fullName: string; email: string; password: string; jobTitle?: string; roleIds?: string[] }) => {
    setInviteLoading(true);
    try {
      await userService.createUser(values);
      message.success('User invited successfully');
      setInviteOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to invite user';
      message.error(errorMsg);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditRoles = (user: User) => {
    setEditUser(user);
    setSelectedRoles(user.roles.map((r) => r.id));
    setRolesOpen(true);
  };

  const handleSaveRoles = async () => {
    if (!editUser) return;
    setRolesLoading(true);
    try {
      await userService.assignRoles(editUser.id, selectedRoles);
      message.success('Roles updated successfully');
      setRolesOpen(false);
      fetchUsers();
    } catch {
      message.error('Failed to update roles');
    } finally {
      setRolesLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.updateUser(user.id, { isActive: !user.isActive });
      message.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch {
      message.error('Failed to update user status');
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: User) => (
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(record.fullName) }}
          >
            {getInitials(record.fullName)}
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {record.fullName}
            </p>
            {record.jobTitle && (
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {record.jobTitle}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>{email}</span>
      ),
    },
    {
      title: 'Role(s)',
      key: 'roles',
      render: (_: unknown, record: User) => (
        <div className="flex gap-1 flex-wrap">
          {record.roles.map((r) => {
            const color = ROLE_COLORS[r.name] || '#6B7280';
            return (
              <Tag
                key={r.id}
                style={{
                  color,
                  backgroundColor: `${color}15`,
                  borderColor: `${color}30`,
                  borderRadius: 9999,
                  fontSize: 11,
                  margin: 0,
                  padding: '1px 8px',
                }}
              >
                {ROLE_LABELS[r.name] || r.name}
              </Tag>
            );
          })}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: User) => (
        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: record.isActive ? 'var(--color-success-bg)' : '#F3F4F6',
            color: record.isActive ? 'var(--color-success)' : '#6B7280',
          }}
        >
          {record.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(date)}</span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_: unknown, record: User) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: 'View' },
              { key: 'edit-roles', label: 'Edit Roles' },
              { type: 'divider' as const },
              {
                key: 'toggle',
                label: record.isActive ? 'Deactivate' : 'Activate',
                danger: record.isActive,
              },
            ],
            onClick: ({ key }) => {
              if (key === 'edit-roles') handleEditRoles(record);
              if (key === 'toggle') handleToggleStatus(record);
            },
          }}
          trigger={['click']}
        >
          <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <MoreHorizontal className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </Dropdown>
      ),
    },
  ];

  const roleSelectOptions = availableRoles.map((r) => ({
    value: r.id,
    label: ROLE_LABELS[r.name] || r.name,
  }));

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          User Management
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Manage team members, roles, and permissions
        </p>
      </div>

      {/* Toolbar */}
      <div
        className="bg-white rounded-lg p-4 mb-4 flex flex-wrap items-center gap-3"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <Input
          placeholder="Search by name or email..."
          prefix={<Search className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />}
          allowClear
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 260 }}
        />
        <Select
          placeholder="All Roles"
          allowClear
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
          options={ROLE_FILTER_OPTIONS}
          style={{ width: 150 }}
        />
        <Select
          placeholder="All Status"
          allowClear
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          style={{ width: 140 }}
        />
        <div className="flex-1" />
        <Button
          type="primary"
          icon={<UserPlus className="w-4 h-4" />}
          onClick={() => setInviteOpen(true)}
          style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
        >
          Invite User
        </Button>
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `${t} users`,
            showSizeChanger: false,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          locale={{
            emptyText: (
              <div className="py-12">
                <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No users found</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Try adjusting your search or filters
                </p>
              </div>
            ),
          }}
        />
      </div>

      {/* Invite User Modal */}
      <Modal
        title="Invite User"
        open={inviteOpen}
        onCancel={() => {
          setInviteOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleInvite}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="e.g. John Doe" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input placeholder="e.g. john@company.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter a password' }]}
          >
            <Input.Password placeholder="Min. 8 characters" />
          </Form.Item>
          <Form.Item name="jobTitle" label="Job Title">
            <Input placeholder="e.g. Software Engineer" />
          </Form.Item>
          <Form.Item name="roleIds" label="Roles">
            <Select
              mode="multiple"
              placeholder="Select roles"
              options={roleSelectOptions}
              allowClear
            />
          </Form.Item>
          <div className="flex justify-end gap-3 mt-2">
            <Button
              onClick={() => {
                setInviteOpen(false);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={inviteLoading}
              style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            >
              Invite User
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Roles Modal */}
      <Modal
        title="Edit Roles"
        open={rolesOpen}
        onOk={handleSaveRoles}
        onCancel={() => setRolesOpen(false)}
        confirmLoading={rolesLoading}
        okButtonProps={{ style: { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } }}
      >
        {editUser && (
          <div style={{ marginTop: 16 }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                style={{ backgroundColor: getAvatarColor(editUser.fullName) }}
              >
                {getInitials(editUser.fullName)}
              </div>
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {editUser.fullName}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{editUser.email}</p>
              </div>
            </div>
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>Assign roles:</p>
            <Select
              mode="multiple"
              value={selectedRoles}
              onChange={setSelectedRoles}
              options={roleSelectOptions}
              style={{ width: '100%' }}
              placeholder="Select roles"
              allowClear
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
