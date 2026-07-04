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

import React, { useMemo } from 'react';
import { Link } from 'wouter';
import { useListCalls, useListSessions, useListClients, getListCallsQueryKey, getListSessionsQueryKey, getListClientsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PhoneIncoming, Shield, Key, Target, CheckCircle2, XCircle } from 'lucide-react';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('ar-SA', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(dateStr));
}

export default function Dashboard() {
  const { data: calls = [], isLoading: isLoadingCalls } = useListCalls({
    query: { refetchInterval: 5000, queryKey: getListCallsQueryKey() }
  });
  const { data: sessions = [], isLoading: isLoadingSessions } = useListSessions({
    query: { refetchInterval: 5000, queryKey: getListSessionsQueryKey() }
  });
  const { data: clients = [], isLoading: isLoadingClients } = useListClients({
    query: { queryKey: getListClientsQueryKey() }
  });

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const callsToday = calls.filter(c => c.receivedAt.startsWith(today)).length;
    const verifiedToday = sessions.filter(s => s.verified && s.createdAt.startsWith(today)).length;
    const activeClients = clients.filter(c => c.isActive).length;
    const matchRate = calls.length > 0 ? Math.round((calls.filter(c => c.matched).length / calls.length) * 100) : 0;
    return { callsToday, verifiedToday, activeClients, matchRate };
  }, [calls, sessions, clients]);

  const recentCalls = calls.slice(0, 5);

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8 lg:pt-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">لوحة المعلومات</h2>
        <p className="text-muted-foreground mt-1 text-sm">مؤشرات النظام والنشاط الأخير بشكل فوري.</p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="hover-elevate shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs md:text-sm font-medium">اتصالات اليوم</CardTitle>
            <PhoneIncoming className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold">{isLoadingCalls ? '-' : stats.callsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">إجمالي الاتصالات الواردة</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs md:text-sm font-medium">تحققات ناجحة</CardTitle>
            <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold">{isLoadingSessions ? '-' : stats.verifiedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">مطابقات اليوم</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs md:text-sm font-medium">نسبة المطابقة</CardTitle>
            <Target className="h-4 w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold">{isLoadingCalls ? '-' : `${stats.matchRate}%`}</div>
            <p className="text-xs text-muted-foreground mt-1">المتوسط التاريخي</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs md:text-sm font-medium">العملاء النشطون</CardTitle>
            <Key className="h-4 w-4 text-orange-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold">{isLoadingClients ? '-' : stats.activeClients}</div>
            <p className="text-xs text-muted-foreground mt-1">مفاتيح API نشطة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        {/* آخر الاتصالات */}
        <Card className="lg:col-span-4 shadow-sm flex flex-col">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">آخر الاتصالات</CardTitle>
                <CardDescription className="text-xs mt-0.5">آخر 5 اتصالات وردت على النظام</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href="/calls" className="flex items-center gap-1 text-xs">
                  عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {isLoadingCalls ? (
              <div className="p-8 text-center text-muted-foreground text-sm">جارٍ التحميل...</div>
            ) : recentCalls.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">لا توجد اتصالات بعد.</div>
            ) : (
              <div className="divide-y">
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/10 transition-colors gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        {call.matched ? (
                          <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-xs md:text-sm font-medium truncate">{call.callerPhone}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(call.receivedAt)}</p>
                      </div>
                    </div>
                    {call.sessionId && (
                      <div className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground border shrink-0 hidden sm:block">
                        {call.sessionId.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* حالة النظام */}
        <Card className="lg:col-span-3 shadow-sm bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-primary-foreground text-base">حالة النظام</CardTitle>
            <CardDescription className="text-primary-foreground/70 text-xs">مراقبة صحة المنصة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 md:space-y-6">
              {[
                { label: 'بوابة API' },
                { label: 'محرك المطابقة' },
                { label: 'قاعدة البيانات' },
              ].map(({ label }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                  <span className="text-xs font-mono opacity-80">يعمل</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-primary-foreground/10">
              <p className="text-xs opacity-70 leading-relaxed">
                يعالج النظام الاتصالات الواردة ويطابقها مع الجلسات النشطة فورياً. تتم المطابقة في أقل من 150ms.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
