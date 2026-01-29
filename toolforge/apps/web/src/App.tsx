import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { ToolListPage } from './pages/ToolListPage';
import { RecordDetailPage } from './pages/RecordDetailPage';
import { RecordFormPage } from './pages/RecordFormPage';
import { SchemaEditorPage } from './pages/SchemaEditorPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tools/:toolId" element={<ToolListPage />} />
        <Route path="/tools/:toolId/records/new" element={<RecordFormPage />} />
        <Route path="/tools/:toolId/records/:recordId" element={<RecordDetailPage />} />
        <Route path="/tools/:toolId/records/:recordId/edit" element={<RecordFormPage />} />
        <Route path="/admin/schemas" element={<SchemaEditorPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
