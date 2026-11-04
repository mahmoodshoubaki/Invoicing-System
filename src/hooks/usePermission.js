import { useAuth } from '@/hooks/useAuth';

export function usePermission() {
  const { can, capabilities } = useAuth();
  return { can, capabilities };
}

export default usePermission;
