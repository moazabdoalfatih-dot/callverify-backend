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
import { useListCalls, getListCallsQueryKey } from '@workspace/api-client-react';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(dateStr));
}

function StatusBadge({ matched }: { matched: boolean }) {
  return matched ? (
    <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-200">
      <CheckCircle2 className="h-3 w-3 shrink-0" />
      <span>مطابق</span>
    </div>
  ) : (
    <div className="inline-flex items-center gap-1 text-destructive bg-destructive/10 px-2 py-0.5 rounded-full text-xs font-medium border border-destructive/20">
      <XCircle className="h-3 w-3 shrink-0" />
      <span>غير مطابق</span>
    </div>
  );
}

export default function CallsLog() {
  const { data: calls = [], isLoading, isRefetching } = useListCalls({
    query: { refetchInterval: 5000, queryKey: getListCallsQueryKey() }
  });

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8 lg:pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">الاتصالات الواردة</h2>
          <p className="text-muted-foreground mt-1 text-sm">سجل كامل بجميع الاتصالات التي استقبلها النظام.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md border shrink-0 mt-1">
          <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
          <span className="hidden sm:inline">تحديث تلقائي (5ث)</span>
        </div>
      </div>

      {/* جدول للشاشات الكبيرة */}
      <Card className="shadow-sm hidden md:block">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="text-base">سجل الاتصالات</CardTitle>
          <CardDescription className="text-xs">{calls.length} اتصال مسجّل</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-28">الحالة</TableHead>
                <TableHead>رقم المتصل</TableHead>
                <TableHead>الجلسة المرتبطة</TableHead>
                <TableHead className="text-left">وقت الاستقبال</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && calls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">جارٍ التحميل...</TableCell>
                </TableRow>
              ) : calls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">لا توجد اتصالات مسجّلة بعد.</TableCell>
                </TableRow>
              ) : (
                calls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="text-center">
                      <StatusBadge matched={call.matched} />
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">{call.callerPhone}</TableCell>
                    <TableCell>
                      {call.sessionId ? (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs border text-muted-foreground">{call.sessionId}</code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left text-sm text-muted-foreground">{formatDate(call.receivedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* بطاقات للموبايل */}
      <div className="md:hidden space-y-3">
        {isLoading && calls.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">جارٍ التحميل...</div>
        ) : calls.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">لا توجد اتصالات مسجّلة بعد.</div>
        ) : (
          calls.map((call) => (
            <Card key={call.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold">{call.callerPhone}</p>
                  <StatusBadge matched={call.matched} />
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(call.receivedAt)}</div>
                {call.sessionId && (
                  <div className="text-xs text-muted-foreground">
                    <span className="text-foreground/60 ml-1">الجلسة:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded border">{call.sessionId.substring(0, 16)}...</code>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
