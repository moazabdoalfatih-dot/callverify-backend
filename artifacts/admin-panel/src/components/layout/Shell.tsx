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

import React, { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {/* Overlay للموبايل */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* الشريط الجانبي */}
      <div
        className={[
          'fixed inset-y-0 right-0 z-40 w-64 transition-transform duration-300 lg:static lg:translate-x-0 lg:z-auto',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* شريط علوي للموبايل */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b bg-sidebar text-sidebar-foreground sticky top-0 z-20">
          <span className="font-bold text-base">CallVerify</span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-sidebar-accent/50 transition-colors"
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
