import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import TopBar from './TopBar.tsx';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <Sidebar />
      <div className="flex-1 ml-[232px] flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
