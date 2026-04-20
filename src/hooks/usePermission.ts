import { useAuth } from './useAuth';

export const usePermission = () => {
  const { hasPermission, user } = useAuth();

  return {
    can: (permission: string) => hasPermission(permission),
    cannot: (permission: string) => !hasPermission(permission),
    hasRole: (role: string) => user?.roles.some((r) => r.name === role) ?? false,
  };
};
