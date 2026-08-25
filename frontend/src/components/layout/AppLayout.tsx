import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import TopBar from './TopBar.tsx';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-canvas">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden md:ml-[232px]">
        <TopBar onMenuClick={() => setMenuOpen(true)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
