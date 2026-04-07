import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MaterialLibrary from './pages/MaterialLibrary';
import MaterialEntry from './pages/MaterialEntry';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import QualityManagement from './pages/QualityManagement';
import BOMManagement from './pages/BOMManagement';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="materials" element={<MaterialLibrary />} />
          <Route path="entry" element={<MaterialEntry />} />
          <Route path="approval" element={<ApprovalWorkflow />} />
          <Route path="quality" element={<QualityManagement />} />
          <Route path="bom" element={<BOMManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
