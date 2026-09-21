'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getAuthContext, hasPermission, isSuperAdmin } from '@/lib/auth';
import {
  LayoutDashboard, Building2, Users, GraduationCap, BookOpen,
  ClipboardList, CreditCard, Bell, Shield, Activity, X,
  ChevronDown, ChevronRight, DollarSign, UserCog, Key,
  BarChart2, BookMarked, Home, Bus,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavChild { label: string; href: string; }
interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  /** Any one of these permissions allows the item to show */
  anyPerm?: string[];
  /** Show only for super admin */
  superAdminOnly?: boolean;
  children?: NavChild[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  NAVIGATION DEFINITION  — driven by permissions, not role names
// ─────────────────────────────────────────────────────────────────────────────
const NAV: NavItem[] = [
  // always visible after login
  { label: 'Dashboard',      href: '/dashboard',    icon: LayoutDashboard },

  // Institute — only admins can edit; principals/others shouldn't see this in sidebar
  { label: 'Institute', href: '/institute', icon: Building2,
    anyPerm: ['institute.update'] },

  // Users & Members
  { label: 'Users & Access', icon: UserCog, anyPerm: ['membership.view', 'user.view'],
    children: [
      { label: 'Members',        href: '/memberships' },
      { label: 'Roles',          href: '/roles' },
      { label: 'Permissions',    href: '/permissions' },
    ],
  },

  // Employees / HR
  { label: 'Employees', icon: Users, anyPerm: ['employee.view'],
    children: [
      { label: 'All Staff',      href: '/employees' },
      { label: 'Teachers',       href: '/employees/teachers' },
    ],
  },

  // Academics
  { label: 'Academics', icon: BookOpen, anyPerm: ['academic.view'],
    children: [
      { label: 'Classes',           href: '/academics/classes' },
      { label: 'Sections',          href: '/academics/sections' },
      { label: 'Subjects',          href: '/academics/subjects' },
      { label: 'Assign to Classes', href: '/academics/class-subjects' },
      { label: 'Timetable',         href: '/academics/timetable' },
      { label: 'Academic Years',    href: '/academics/years' },
    ],
  },

  // Students
  { label: 'Students', href: '/students', icon: GraduationCap, anyPerm: ['student.view'] },

  // Attendance
  { label: 'Attendance', href: '/attendance', icon: ClipboardList,
    anyPerm: ['attendance.view', 'attendance.create'] },

  // Finance / Fees
  { label: 'Finance', icon: DollarSign, anyPerm: ['fee.view', 'finance.view'],
    children: [
      { label: 'Payments',       href: '/fees/payments' },
      { label: 'Fee Categories', href: '/fees/categories' },
    ],
  },

  // Notices
  { label: 'Notices', href: '/notices', icon: Bell,
    anyPerm: ['notice.view'] },

  // Reports
  { label: 'Reports', href: '/reports', icon: BarChart2,
    anyPerm: ['report.academic.view', 'report.finance.view', 'report.hr.view', 'report.attendance.view'] },

  // Audit
  { label: 'Activity Log', href: '/audit', icon: Activity,
    anyPerm: ['audit.view'] },

  // Library
  { label: 'Library', href: '/library', icon: BookMarked,
    anyPerm: ['library.book.view'] },

  // Hostel
  { label: 'Hostel', href: '/hostel', icon: Home,
    anyPerm: ['hostel.view'] },

  // Transport
  { label: 'Transport', href: '/transport', icon: Bus,
    anyPerm: ['transport.vehicle.view'] },
];

// Super-admin only nav (shown at top before main nav)
const SUPER_NAV: NavItem[] = [
  { label: 'Super Admin', href: '/super-admin', icon: Shield, superAdminOnly: true },
];

interface SidebarProps { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname  = usePathname();
  const ctx       = getAuthContext();
  const isSuper   = isSuperAdmin(ctx);

  // Auto-expand any parent whose child matches the current path
  const [expanded, setExpanded] = useState<string[]>(() => {
    const all = [...NAV, ...SUPER_NAV];
    return all
      .filter(item => item.children?.some(c => pathname.startsWith(c.href)))
      .map(item => item.label);
  });

  // Keep expanded state in sync when pathname changes (e.g. browser back/forward)
  useEffect(() => {
    const all = [...NAV, ...SUPER_NAV];
    const shouldBeOpen = all
      .filter(item => item.children?.some(c => pathname.startsWith(c.href)))
      .map(item => item.label);
    // Only add, never collapse — so user-manually-opened items stay open
    setExpanded(prev => [...new Set([...prev, ...shouldBeOpen])]);
  }, [pathname]);

  function toggle(label: string) {
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  }

  function isVisible(item: NavItem): boolean {
    if (item.superAdminOnly) return isSuper;
    if (!item.anyPerm) return true; // always-visible items
    return item.anyPerm.some(p => hasPermission(p, ctx));
  }

  function renderItem(item: NavItem) {
    if (!isVisible(item)) return null;

    if (item.children) {
      const isExp = expanded.includes(item.label);
      const isActive = item.children.some(c => pathname.startsWith(c.href));
      return (
        <div key={item.label}>
          <button onClick={() => toggle(item.label)}
            className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {isExp && (
            <div className="ml-7 mt-0.5 space-y-0.5">
              {item.children.map(child => (
                <Link key={child.href} href={child.href} onClick={onClose}
                  className={cn('block px-3 py-1.5 rounded-lg text-sm transition-colors',
                    pathname === child.href ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white')}>
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link key={item.href} href={item.href!} onClick={onClose}
        className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          pathname === item.href ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
      </Link>
    );
  }

  const user = ctx?.user;
  const currentInstitute = ctx?.currentInstitute;
  const roleNames = ctx?.currentRoles.map(r => r.displayName).join(', ') || '';

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40 flex flex-col transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Logo + institute */}
        <div className="px-4 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">S</div>
              <span className="font-semibold text-white">Seeron</span>
            </div>
            <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          {currentInstitute && (
            <p className="text-xs text-gray-400 mt-2 truncate">{currentInstitute.name}</p>
          )}
          {isSuper && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" /> Super Admin
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {/* Super admin section */}
          {isSuper && (
            <div className="mb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Platform</p>
              {SUPER_NAV.map(renderItem)}
              <div className="border-t border-gray-700 my-2" />
            </div>
          )}
          {NAV.map(renderItem)}
        </nav>

        {/* User info */}
        <div className="px-4 py-3 border-t border-gray-700">
          <Link href="/profile" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{roleNames || user?.email}</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
