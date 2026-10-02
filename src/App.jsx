import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Invitation from './pages/Invitation';
import AdminScanner from './pages/AdminScanner';
import AdminLogin from './pages/AdminLogin';
import RequireAdmin from './components/RequireAdmin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/invitation" element={<Invitation />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAdmin><AdminScanner /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}