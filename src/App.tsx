import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MaterialLibrary from './pages/MaterialLibrary';
import MaterialEntry from './pages/MaterialEntry';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import QualityManagement from './pages/QualityManagement';
import BOMManagement from './pages/BOMManagement';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="materials" element={<MaterialLibrary />} />
        <Route path="entry" element={<MaterialEntry />} />
        <Route path="approval" element={<ApprovalWorkflow />} />
        <Route path="quality" element={<QualityManagement />} />
        <Route path="bom" element={<BOMManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
