// ─────────────────────────────────────────────────────────────────────────────
//  Auth types & helpers — aligned with new RBAC backend
// ─────────────────────────────────────────────────────────────────────────────

export interface RoleRef {
  id: string;
  name: string;        // e.g. "TEACHER" — uppercase
  displayName: string; // e.g. "Teacher" — human readable
}

export interface InstituteRef {
  id: string;
  name: string;
  type: string;
  logo_url?: string;
}

export interface Membership {
  membershipId: string;
  institute: InstituteRef;
  roles: RoleRef[];
  permissions: string[]; // e.g. ["student.view", "attendance.create"]
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  isSuperAdmin: boolean;
}

export interface AuthContext {
  user: AuthUser;
  memberships: Membership[];
  currentInstitute: InstituteRef | null;
  currentMembershipId: string | null;
  currentRoles: RoleRef[];
  currentPermissions: string[];  // effective permissions for active institute
}

// ─────────────────────────────────────────────────────────────────────────────
//  Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

export function setAuth(accessToken: string, refreshToken: string, ctx: AuthContext): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('authContext', JSON.stringify(ctx));
  // Store active institute id for the x-institute-id header
  // For super admin: use first membership institute if available, otherwise leave unset (backend bypasses)
  const instituteId = ctx.currentInstitute?.id ?? ctx.memberships?.[0]?.institute?.id ?? null;
  if (instituteId) {
    localStorage.setItem('instituteId', instituteId);
  } else {
    localStorage.removeItem('instituteId');
  }
}

export function getAuthContext(): AuthContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('authContext');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getUser(): AuthUser | null {
  return getAuthContext()?.user ?? null;
}

export function getInstituteId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('instituteId');
}

export function setActiveInstitute(id: string): void {
  localStorage.setItem('instituteId', id);
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('authContext');
  localStorage.removeItem('instituteId');
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

// ─────────────────────────────────────────────────────────────────────────────
//  Permission helpers — used in frontend for UI gating ONLY
//  Backend always enforces the real authorization check.
// ─────────────────────────────────────────────────────────────────────────────

export function hasPermission(permission: string, ctx?: AuthContext | null): boolean {
  const context = ctx ?? getAuthContext();
  if (!context) return false;
  if (context.user.isSuperAdmin) return true;
  // Wildcard in permissions array (e.g. from token claims) also grants all access
  if (context.currentPermissions.includes('*')) return true;
  return context.currentPermissions.includes(permission);
}

export function hasAnyPermission(permissions: string[], ctx?: AuthContext | null): boolean {
  return permissions.some(p => hasPermission(p, ctx));
}

export function hasAllPermissions(permissions: string[], ctx?: AuthContext | null): boolean {
  return permissions.every(p => hasPermission(p, ctx));
}

export function hasRole(roleName: string, ctx?: AuthContext | null): boolean {
  const context = ctx ?? getAuthContext();
  if (!context) return false;
  if (context.user.isSuperAdmin) return true;
  return context.currentRoles.some(r => r.name === roleName.toUpperCase());
}

export function hasAnyRole(roleNames: string[], ctx?: AuthContext | null): boolean {
  return roleNames.some(r => hasRole(r, ctx));
}

export function isSuperAdmin(ctx?: AuthContext | null): boolean {
  const context = ctx ?? getAuthContext();
  return context?.user.isSuperAdmin === true;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Redirect target after login
// ─────────────────────────────────────────────────────────────────────────────
export function getPostLoginRedirect(ctx: AuthContext): string {
  if (ctx.user.isSuperAdmin) return '/super-admin';
  if (hasRole('STUDENT', ctx)) return '/portal/dashboard';
  if (hasRole('PARENT', ctx)) return '/portal/dashboard';
  return '/dashboard';
}
