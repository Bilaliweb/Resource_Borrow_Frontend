'use client';

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Select, DatePicker, message, Spin } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { getAvatarColor, getInitials } from '@/utils/avatar.ts';
import dayjs from 'dayjs';
import { userService } from '@/services/user.service.ts';
import { projectService } from '@/services/project.service.ts';
import { borrowRequestService } from '@/services/borrow-request.service.ts';
import { availabilityService } from '@/services/availability.service.ts';
import type { User } from '@/services/user.service.ts';
import type { Project } from '@/services/project.service.ts';
import type { AvailabilityData, ScheduleBlock } from '@/services/availability.service.ts';

function formatTime(timeStr: string): string {
  return dayjs(timeStr).format('h:mm A');
}

const SCHEDULE_TYPE_COLORS: Record<string, { bg: string; dot: string }> = {
  project_work: { bg: '#EEF2FF', dot: '#4F46E5' },
  meeting: { bg: '#DBEAFE', dot: '#3B82F6' },
  break: { bg: '#DCFCE7', dot: '#10B981' },
  available: { bg: '#DCFCE7', dot: '#10B981' },
};

function AvailabilityDonut({ percent }: { percent: number }) {
  const radius = 60;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
        {/* Background circle (gray) */}
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle (green) */}
        <circle
          stroke="#10B981"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div
        className="flex flex-col items-center justify-center"
        style={{ marginTop: -radius * 2 + 20, marginBottom: radius - 20, height: radius * 2 - 40 }}
      >
        <span className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{percent}%</span>
        <span className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Available</span>
      </div>
    </div>
  );
}

export default function NewBorrowRequest() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Data for dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Selected employee for availability
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [reasonLength, setReasonLength] = useState(0);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setDropdownsLoading(true);
        const [usersRes, projectsRes] = await Promise.all([
          userService.getUsers({ page: 1, pageSize: 100 }),
          projectService.getProjects({ page: 1, pageSize: 100, status: 'active' }),
        ]);
        setUsers(usersRes.data);
        setProjects(projectsRes.data);
      } catch {
        // dropdowns will stay empty
      } finally {
        setDropdownsLoading(false);
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setAvailability(null);
      return;
    }
    const fetchAvailability = async () => {
      try {
        setAvailabilityLoading(true);
        const data = await availabilityService.getEmployeeAvailability(selectedEmployeeId);
        setAvailability(data);
      } catch {
        setAvailability(null);
      } finally {
        setAvailabilityLoading(false);
      }
    };
    fetchAvailability();
  }, [selectedEmployeeId]);

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSubmitting(true);
      await borrowRequestService.createBorrowRequest({
        employeeId: values.employeeId,
        fromManagerId: values.fromManagerId,
        projectId: values.projectId,
        startDatetime: (values.startDatetime as dayjs.Dayjs).toISOString(),
        endDatetime: (values.endDatetime as dayjs.Dayjs).toISOString(),
        reason: values.reason,
      });
      message.success('Borrow request created successfully');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to create borrow request';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const userSelectOptions = users.map((u) => ({
    value: u.id,
    label: (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
          style={{ backgroundColor: getAvatarColor(u.fullName) }}
        >
          {getInitials(u.fullName)}
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{u.fullName}</span>
          {u.jobTitle && (
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{u.jobTitle}</span>
          )}
        </div>
      </div>
    ),
  }));

  const managerSelectOptions = users
    .filter((u) => u.roles?.some((r) => ['manager', 'department_head', 'owner'].includes(r.name)))
    .map((u) => ({
      value: u.id,
      label: (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
            style={{ backgroundColor: getAvatarColor(u.fullName) }}
          >
            {getInitials(u.fullName)}
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{u.fullName}</span>
            {u.jobTitle && (
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{u.jobTitle}</span>
            )}
          </div>
        </div>
      ),
    }));

  const projectSelectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedEmployee = users.find((u) => u.id === selectedEmployeeId);

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            New Borrow Request
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Fill in the details to create a new employee borrow request
          </p>
        </div>
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN — Form (3/5 = 60%) */}
        <div className="lg:col-span-3">
          <div
            className="bg-white rounded-lg"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Request Details
              </h3>
            </div>
            <div className="p-5">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
              >
                {/* Employee */}
                <Form.Item
                  name="employeeId"
                  label={<span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Employee</span>}
                  rules={[{ required: true, message: 'Please select an employee' }]}
                >
                  <Select
                    showSearch
                    placeholder="Select an employee"
                    optionFilterProp="label"
                    loading={dropdownsLoading}
                    options={userSelectOptions}
                    filterOption={(input, option) => {
                      const user = users.find((u) => u.id === option?.value);
                      if (!user) return false;
                      const search = input.toLowerCase();
                      return user.fullName.toLowerCase().includes(search) || (user.jobTitle?.toLowerCase().includes(search) ?? false);
                    }}
                    onChange={(val) => setSelectedEmployeeId(val)}
                    size="large"
                  />
                </Form.Item>

                {/* Current Manager */}
                <Form.Item
                  name="fromManagerId"
                  label={<span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Current Manager</span>}
                  rules={[{ required: true, message: 'Please select the current manager' }]}
                >
                  <Select
                    showSearch
                    placeholder="Select the current manager"
                    optionFilterProp="label"
                    loading={dropdownsLoading}
                    options={managerSelectOptions}
                    filterOption={(input, option) => {
                      const user = users.find((u) => u.id === option?.value);
                      if (!user) return false;
                      const search = input.toLowerCase();
                      return user.fullName.toLowerCase().includes(search) || (user.jobTitle?.toLowerCase().includes(search) ?? false);
                    }}
                    size="large"
                  />
                </Form.Item>

                {/* Project */}
                <Form.Item
                  name="projectId"
                  label={<span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Project</span>}
                  rules={[{ required: true, message: 'Please select a project' }]}
                >
                  <Select
                    showSearch
                    placeholder="Select a project"
                    optionFilterProp="label"
                    loading={dropdownsLoading}
                    options={projectSelectOptions}
                    size="large"
                  />
                </Form.Item>

                {/* Duration — Two DatePickers side by side */}
                <Form.Item
                  label={<span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Duration</span>}
                  required
                >
                  <div className="flex items-center gap-3">
                    <Form.Item
                      name="startDatetime"
                      noStyle
                      rules={[{ required: true, message: 'Start datetime is required' }]}
                    >
                      <DatePicker
                        showTime
                        format="MMM DD, YYYY hh:mm A"
                        placeholder="Start date & time"
                        className="flex-1"
                        size="large"
                        style={{ width: '100%' }}
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                      />
                    </Form.Item>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>to</span>
                    <Form.Item
                      name="endDatetime"
                      noStyle
                      dependencies={['startDatetime']}
                      rules={[
                        { required: true, message: 'End datetime is required' },
                        ({ getFieldValue }) => {
                          const start = getFieldValue('startDatetime');
                          if (!start) return Promise.resolve();
                          const end = getFieldValue('endDatetime');
                          if (!end) return Promise.resolve();
                          if (dayjs(end).isBefore(dayjs(start))) {
                            return Promise.reject(new Error('End must be after start'));
                          }
                          return Promise.resolve();
                        },
                      ]}
                    >
                      <DatePicker
                        showTime
                        format="MMM DD, YYYY hh:mm A"
                        placeholder="End date & time"
                        className="flex-1"
                        size="large"
                        style={{ width: '100%' }}
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                      />
                    </Form.Item>
                  </div>
                </Form.Item>

                {/* Reason */}
                <Form.Item
                  name="reason"
                  label={<span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Reason</span>}
                  rules={[{ required: true, message: 'Please provide a reason' }]}
                >
                  <div className="relative">
                    <Input.TextArea
                      rows={4}
                      maxLength={500}
                      placeholder="Explain why this employee needs to be borrowed..."
                      onChange={(e) => setReasonLength(e.target.value.length)}
                    />
                    <span
                      className="absolute bottom-3 right-3 text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {reasonLength}/500
                    </span>
                  </div>
                </Form.Item>

                {/* Submit */}
                <Form.Item className="mt-6 mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    block
                    size="large"
                    className="font-medium"
                    style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                  >
                    Submit Request
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Availability Panel (2/5 = 40%) */}
        <div className="lg:col-span-2">
          <div
            className="bg-white rounded-lg sticky top-6"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Employee Availability
              </h3>
            </div>
            <div className="p-5">
              {!selectedEmployeeId ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--color-canvas)' }}
                  >
                    <svg className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                    </svg>
                  </div>
                  <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                    Select an employee to view their availability
                  </p>
                </div>
              ) : availabilityLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Spin />
                  <p className="text-sm mt-4" style={{ color: 'var(--color-text-muted)' }}>
                    Loading availability...
                  </p>
                </div>
              ) : availability ? (
                <div>
                  {/* Selected employee info */}
                  {selectedEmployee && (
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                        style={{ backgroundColor: getAvatarColor(selectedEmployee.fullName) }}
                      >
                        {getInitials(selectedEmployee.fullName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {selectedEmployee.fullName}
                        </p>
                        {selectedEmployee.jobTitle && (
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {selectedEmployee.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Donut Chart */}
                  <div className="flex justify-center mb-6">
                    <AvailabilityDonut percent={availability.availabilityPercent} />
                  </div>

                  {/* Hours summary */}
                  <div className="flex justify-center gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: '#10B981' }}>
                        {availability.availableHours}h
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                        {availability.totalHours}h
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total</p>
                    </div>
                  </div>

                  {/* Today's Schedule */}
                  <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Today's Schedule
                  </h4>
                  {availability.todaySchedule.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      No schedule found for today
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {availability.todaySchedule.map((block: ScheduleBlock) => {
                        const colors = SCHEDULE_TYPE_COLORS[block.type] || SCHEDULE_TYPE_COLORS.project_work;
                        return (
                          <div
                            key={block.id}
                            className="rounded-lg px-3 py-2.5 flex items-center gap-3"
                            style={{ backgroundColor: colors.bg }}
                          >
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: block.isBusy ? colors.dot : '#10B981' }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                {block.label}
                              </p>
                              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                                {formatTime(block.startTime)} - {formatTime(block.endTime)}
                              </p>
                            </div>
                            <span
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: block.isBusy ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                color: block.isBusy ? '#EF4444' : '#10B981',
                              }}
                            >
                              {block.isBusy ? 'Busy' : 'Free'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No availability data found
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
