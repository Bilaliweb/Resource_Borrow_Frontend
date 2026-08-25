import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Badge } from 'antd';
import { Users, FileText, CheckCircle, Calendar, Settings, HelpCircle, Building2, FolderKanban } from 'lucide-react';
import api from '@/services/api.ts';

const orgItems = [
  { label: 'Users', icon: Users, path: '/dashboard/users' },
  { label: 'Departments', icon: Building2, path: '/dashboard/departments' },
  { label: 'Projects', icon: FolderKanban, path: '/dashboard/projects' },
];

const navItems = [
  { label: 'Borrow Employee', icon: Users, path: '/dashboard' },
  { label: 'My Requests', icon: FileText, path: '/dashboard/requests' },
  { label: 'Approvals', icon: CheckCircle, path: '/dashboard/approvals' },
  { label: 'Calendar View', icon: Calendar, path: '/dashboard/calendar' },
];

const bottomItems = [
  { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  { label: 'Help', icon: HelpCircle, path: '/dashboard/help' },
];

export default function Sidebar() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get<{ success: boolean; data: { count: number } }>('/notifications/unread-count');
        setUnreadCount(res.data.data.count);
      } catch { /* silent */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[232px] bg-white border-r flex flex-col z-30"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Users className="w-4 h-4 text-white" />
        </div>
        <span
          className="text-[15px] font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Resource Borrow
        </span>
      </div>

      {/* Nav sections */}
      <div className="flex-1 px-3 mt-2 overflow-y-auto">
        {/* Organization section */}
        <p
          className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Organization
        </p>
        <nav className="flex flex-col gap-1 mb-4">
          {orgItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  isActive ? 'text-white' : ''
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
              })}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Resource Management section */}
        <p
          className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Resource Management
        </p>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  isActive ? 'text-white' : ''
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
              })}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
              {item.path === '/dashboard/approvals' && unreadCount > 0 && (
                <Badge
                  count={unreadCount}
                  size="small"
                  style={{ marginLeft: 'auto' }}
                />
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="px-3 pb-5">
        <div className="border-t pt-3 flex flex-col gap-1" style={{ borderColor: 'var(--color-border)' }}>
          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
              })}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
