import { Navigate } from 'react-router-dom';
import { useStore }  from '@/store/useStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
