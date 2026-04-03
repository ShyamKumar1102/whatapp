import { Navigate } from 'react-router-dom';
import { useStore }  from '@/store/useStore';
import { ShieldOff } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export function AdminRoute({ children }) {
  const { user } = useStore();
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldOff className="w-7 h-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Admin Access Required</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          This page is only accessible to administrators. Contact your admin to get access.
        </p>
      </div>
    );
  }
  return children;
}
