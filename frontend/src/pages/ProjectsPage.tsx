'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Table, Modal, Form, Input, Select, Popconfirm, message } from 'antd';
import { Plus, FolderKanban, Pencil, Trash2 } from 'lucide-react';
import { projectService } from '@/services/project.service.ts';
import type { Project } from '@/services/project.service.ts';

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectService.getProjects({ page, pageSize });
      setProjects(res.data);
      setTotal(res.total);
    } catch {
      message.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openCreateModal = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      status: project.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: { name: string; status: string }) => {
    setSubmitLoading(true);
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject.id, values);
        message.success('Project updated successfully');
      } else {
        await projectService.createProject(values);
        message.success('Project created successfully');
      }
      setModalOpen(false);
      form.resetFields();
      fetchProjects();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Operation failed';
      message.error(errorMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await projectService.deleteProject(id);
      message.success('Project deleted successfully');
      fetchProjects();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to delete project';
      message.error(errorMsg);
    }
  };

  const columns = [
    {
      title: 'Project Name',
      key: 'name',
      render: (_: unknown, record: Project) => (
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-primary-light-bg)' }}
          >
            <FolderKanban className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          </div>
          <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{record.name}</span>
        </div>
      ),
    },
    {
      title: 'Owner',
      key: 'owner',
      render: (_: unknown, record: Project) => {
        if (!record.owner) {
          return <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>—</span>;
        }
        return (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
              style={{ backgroundColor: getAvatarColor(record.owner.fullName) }}
            >
              {getInitials(record.owner.fullName)}
            </div>
            <div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{record.owner.fullName}</p>
              {record.owner.jobTitle && (
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{record.owner.jobTitle}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => (
        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: status === 'active' ? 'var(--color-success-bg)' : '#F3F4F6',
            color: status === 'active' ? 'var(--color-success)' : '#6B7280',
          }}
        >
          {status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Borrow Requests',
      key: 'borrowRequests',
      width: 140,
      render: (_: unknown, record: Project) => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          {record._count?.borrowRequests ?? 0}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: Project) => (
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => openEditModal(record)}
          >
            <Pencil className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
          <Popconfirm
            title="Delete Project"
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Projects</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Manage projects for borrow request allocation</p>
      </div>

      {/* Toolbar */}
      <div
        className="bg-white rounded-lg p-4 mb-4 flex items-center justify-between"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          {total} project{total !== 1 ? 's' : ''}
        </p>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
          style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
        >
          Create Project
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `${t} projects`,
            showSizeChanger: false,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          locale={{
            emptyText: (
              <div className="py-12">
                <FolderKanban className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No projects</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Create your first project to get started
                </p>
              </div>
            ),
          }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={editingProject ? 'Edit Project' : 'Create Project'}
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
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="e.g. Website Redesign" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
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
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
