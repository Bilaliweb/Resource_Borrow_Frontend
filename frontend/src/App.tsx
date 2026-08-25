import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import AppLayout from './components/layout/AppLayout.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import UsersPage from './pages/UsersPage.tsx';
import DepartmentsPage from './pages/DepartmentsPage.tsx';
import ProjectsPage from './pages/ProjectsPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import NewBorrowRequest from './pages/NewBorrowRequest.tsx';
import BorrowRequestDetail from './pages/BorrowRequestDetail.tsx';
import ApprovalsPage from './pages/ApprovalsPage.tsx';
import MyRequestsPage from './pages/MyRequestsPage.tsx';
import NotFound from './pages/NotFound.tsx';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/users" element={<UsersPage />} />
          <Route path="dashboard/departments" element={<DepartmentsPage />} />
          <Route path="dashboard/projects" element={<ProjectsPage />} />
          <Route path="dashboard/settings" element={<SettingsPage />} />
          <Route path="dashboard/borrow-requests/new" element={<NewBorrowRequest />} />
          <Route path="dashboard/borrow-requests/:id" element={<BorrowRequestDetail />} />
          <Route path="dashboard/requests" element={<MyRequestsPage />} />
          <Route path="dashboard/approvals" element={<ApprovalsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}
