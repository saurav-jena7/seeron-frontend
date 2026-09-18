'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, getAuthContext, hasPermission, isSuperAdmin } from '@/lib/auth';
import Spinner from '@/components/ui/Spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Require ALL of these permissions (AND logic) */
  permissions?: string[];
  /** Require ANY of these permissions (OR logic) */
  anyPermission?: string[];
  /** Restrict to super admin only */
  superAdminOnly?: boolean;
  /** Fallback redirect — defaults to /dashboard */
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  permissions,
  anyPermission,
  superAdminOnly,
  redirectTo = '/dashboard',
}: AuthGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
      return;
    }

    const ctx = getAuthContext();

    if (superAdminOnly && !isSuperAdmin(ctx)) {
      router.replace(redirectTo);
      return;
    }

    if (permissions && permissions.length > 0) {
      const allOk = permissions.every(p => hasPermission(p, ctx));
      if (!allOk) { router.replace(redirectTo); return; }
    }

    if (anyPermission && anyPermission.length > 0) {
      const anyOk = anyPermission.some(p => hasPermission(p, ctx));
      if (!anyOk) { router.replace(redirectTo); return; }
    }

    setChecked(true);
  }, [router, permissions, anyPermission, superAdminOnly, redirectTo]);

  if (!checked) return <Spinner />;
  return <>{children}</>;
}
