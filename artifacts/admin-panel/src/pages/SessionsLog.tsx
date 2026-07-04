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
import { useListSessions, getListSessionsQueryKey } from '@workspace/api-client-react';
import { RefreshCw, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('ar-SA', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(dateStr));
}

function SessionBadge({ session }: { session: { verified: boolean; expiresAt: string } }) {
  if (session.verified) {
    return (
      <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-200">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        <span>تم التحقق</span>
      </div>
    );
  }
  if (new Date(session.expiresAt) < new Date()) {
    return (
      <div className="inline-flex items-center gap-1 text-destructive bg-destructive/10 px-2 py-0.5 rounded-full text-xs font-medium border border-destructive/20">
        <XCircle className="h-3 w-3 shrink-0" />
        <span>منتهية</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200">
      <Clock className="h-3 w-3 shrink-0" />
      <span>قيد الانتظار</span>
    </div>
  );
}

export default function SessionsLog() {
  const { data: sessions = [], isLoading, isRefetching } = useListSessions({
    query: { refetchInterval: 5000, queryKey: getListSessionsQueryKey() }
  });

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8 lg:pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">جلسات التحقق</h2>
          <p className="text-muted-foreground mt-1 text-sm">سجل بجميع جلسات التحقق النشطة والمنتهية.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md border shrink-0 mt-1">
          <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
          <span className="hidden sm:inline">تحديث تلقائي (5ث)</span>
        </div>
      </div>

      {/* جدول للشاشات الكبيرة */}
      <Card className="shadow-sm hidden md:block">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="text-base">سجل الجلسات</CardTitle>
          <CardDescription className="text-xs">{sessions.length} جلسة</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">الحالة</TableHead>
                <TableHead>معرّف الجلسة</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead className="text-left">تاريخ الانتهاء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">جارٍ التحميل...</TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">لا توجد جلسات بعد.</TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell><SessionBadge session={session} /></TableCell>
                    <TableCell>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs border text-muted-foreground">
                        {session.id.substring(0, 12)}...
                      </code>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">{session.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {session.clientId ? `#${session.clientId}` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(session.createdAt)}</TableCell>
                    <TableCell className="text-left text-sm text-muted-foreground">{formatDate(session.expiresAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* بطاقات للموبايل */}
      <div className="md:hidden space-y-3">
        {isLoading && sessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">جارٍ التحميل...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">لا توجد جلسات بعد.</div>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold">{session.phone}</p>
                  <SessionBadge session={session} />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><span className="text-foreground/60 ml-1">الجلسة:</span>
                    <code className="bg-muted px-1.5 rounded border">{session.id.substring(0, 16)}...</code>
                  </div>
                  <div><span className="text-foreground/60 ml-1">أُنشئت:</span>{formatDate(session.createdAt)}</div>
                  <div><span className="text-foreground/60 ml-1">تنتهي:</span>{formatDate(session.expiresAt)}</div>
                  {session.clientId && <div><span className="text-foreground/60 ml-1">العميل:</span>#{session.clientId}</div>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
