// ============================================================
// ⚠️ تحذير | WARNING
// ------------------------------------------------------------
// 🇸🇦 لا تقم بتشفير رابط قاعدة البيانات أو إنشاء قاعدة بيانات جديدة أو حذفها.
//    المالك (ناير) يتحمل كامل المسؤولية عن هذا الاختيار.
//    رابط قاعدة البيانات المستخدم:
//    postgresql://neondb_owner:npg_Q5leq9pMHFuA@ep-bitter-hall-atpxgb78-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
//
// 🇬🇧 Do NOT encrypt, delete, or create a new database.
//    The owner (Nayer) takes full responsibility for this decision.
//    Database URL in use:
//    postgresql://neondb_owner:npg_Q5leq9pMHFuA@ep-bitter-hall-atpxgb78-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
// ============================================================

import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Phone, ShieldCheck, Users, Activity, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'لوحة المعلومات', icon: LayoutDashboard },
    { href: '/calls', label: 'الاتصالات الواردة', icon: Phone },
    { href: '/sessions', label: 'جلسات التحقق', icon: ShieldCheck },
    { href: '/clients', label: 'عملاء API', icon: Users },
    { href: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
      <div className="flex h-14 lg:h-16 items-center px-4 lg:px-6 border-b border-sidebar-border justify-between">
        <div className="flex items-center gap-2 text-sidebar-primary-foreground font-bold text-lg tracking-tight">
          <Activity className="h-5 w-5 text-sidebar-primary" />
          <span>CallVerify</span>
        </div>
        {/* زر الإغلاق على الموبايل */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md hover:bg-sidebar-accent/50 transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-sidebar-accent/30 text-xs text-sidebar-foreground/70">
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse shrink-0" />
          <span>النظام يعمل</span>
        </div>
      </div>
    </div>
  );
}
