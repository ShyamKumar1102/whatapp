import { useStore } from '@/store/useStore';

export const useRole = () => {
  const { user } = useStore();
  const role = user?.role || 'agent';
  return {
    role,
    isAdmin:     role === 'admin',
    isAgent:     role === 'agent',
    canWrite:    role === 'admin',   // only admin can create/edit/delete
    canRead:     true,               // everyone can read
  };
};
