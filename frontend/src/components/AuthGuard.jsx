import { Navigate } from 'react-router-dom';

export default function AuthGuard({ children, requireAdmin }) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && role !== 'ADMIN') return <Navigate to="/t2i" replace />;

  return children;
}
