import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Invitation from './pages/Invitation';
import AdminScanner from './pages/AdminScanner';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/invitation" element={<Invitation />} />
        <Route path="/admin" element={<AdminScanner />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}