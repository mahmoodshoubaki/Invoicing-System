import { useAuth } from '@/hooks/useAuth';

/**
 * usePermission — read the current user's capabilities, fetched from the API
 * (api/Identity/me) rather than derived from any local role table.
 *
 * Returns:
 *   can(module, action)  — boolean: does the user hold this capability
 *   capabilities         — the raw { [module]: { [action]: boolean } } map
 */
export function usePermission() {
  const { can, capabilities } = useAuth();
  return { can, capabilities };
}

export default usePermission;
