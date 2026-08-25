'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Table, Modal, Form, Input, Select, Popconfirm, message } from 'antd';
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react';
import { departmentService } from '@/services/department.service.ts';
import type { Department } from '@/services/department.service.ts';
import { userService } from '@/services/user.service.ts';
import type { User } from '@/services/user.service.ts';

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

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await departmentService.getDepartments();
      setDepartments(data);
    } catch {
      message.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await userService.getUsers({ page: 1, pageSize: 100 });
      setUsers(res.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [fetchDepartments, fetchUsers]);

  const headUserOptions = users.map((u) => ({
    value: u.id,
    label: `${u.fullName}${u.jobTitle ? ` · ${u.jobTitle}` : ''}`,
  }));

  const openCreateModal = () => {
    setEditingDept(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    form.setFieldsValue({
      name: dept.name,
      headUserId: dept.headUserId,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: { name: string; headUserId?: string }) => {
    setSubmitLoading(true);
    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept.id, values);
        message.success('Department updated successfully');
      } else {
        await departmentService.createDepartment(values);
        message.success('Department created successfully');
      }
      setModalOpen(false);
      form.resetFields();
      fetchDepartments();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Operation failed';
      message.error(errorMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await departmentService.deleteDepartment(id);
      message.success('Department deleted successfully');
      fetchDepartments();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to delete department';
      message.error(errorMsg);
    }
  };

  const columns = [
    {
      title: 'Department Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-info-bg)' }}
          >
            <Building2 className="w-4 h-4" style={{ color: 'var(--color-secondary-blue)' }} />
          </div>
          <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{name}</span>
        </div>
      ),
    },
    {
      title: 'Department Head',
      key: 'head',
      render: (_: unknown, record: Department) => {
        if (!record.head) {
          return <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Not assigned</span>;
        }
        return (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
              style={{ backgroundColor: getAvatarColor(record.head.fullName) }}
            >
              {getInitials(record.head.fullName)}
            </div>
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{record.head.fullName}</p>
              {record.head.jobTitle && (
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{record.head.jobTitle}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: Department) => (
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => openEditModal(record)}
          >
            <Pencil className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
          <Popconfirm
            title="Delete Department"
            description="Are you sure? This cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <button className="p-1.5 rounded-md hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Departments</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Manage organizational structure</p>
      </div>

      {/* Toolbar */}
      <div
        className="bg-white rounded-lg p-4 mb-4 flex items-center justify-between"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          {departments.length} department{departments.length !== 1 ? 's' : ''}
        </p>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
          style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
        >
          Add Department
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <Table
          columns={columns}
          dataSource={departments}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <div className="py-12">
                <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No departments</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Create your first department to get started
                </p>
              </div>
            ),
          }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={editingDept ? 'Edit Department' : 'Add Department'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Department Name"
            rules={[{ required: true, message: 'Please enter department name' }]}
          >
            <Input placeholder="e.g. Engineering" />
          </Form.Item>
          <Form.Item name="headUserId" label="Department Head">
            <Select
              placeholder="Select a department head"
              options={headUserOptions}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <div className="flex justify-end gap-3 mt-2">
            <Button
              onClick={() => {
                setModalOpen(false);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitLoading}
              style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            >
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
