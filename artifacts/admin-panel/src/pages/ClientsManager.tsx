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

import React, { useState } from 'react';
import {
  useListClients, useCreateClient, useDisableClient, getListClientsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Copy, Check, Ban, CheckCircle2, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const schema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(50, 'الاسم يجب أن يكون أقل من 50 حرفاً'),
});

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
}

export default function ClientsManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: clients = [], isLoading } = useListClients({ query: { queryKey: getListClientsQueryKey() } });
  const createMutation = useCreateClient();
  const disableMutation = useDisableClient();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    createMutation.mutate({ data: { name: values.name } }, {
      onSuccess: (data) => {
        setNewApiKey(data.apiKey);
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        form.reset();
        toast({ title: 'تم إنشاء العميل', description: `تم إنشاء "${data.name}" بنجاح.` });
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: 'خطأ في الإنشاء', description: error.error || 'حدث خطأ غير معروف' });
      },
    });
  }

  function handleDisable(id: number) {
    disableMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.setQueryData(getListClientsQueryKey(), (old: any) =>
          old?.map((c: any) => c.id === id ? { ...c, isActive: false } : c)
        );
        toast({ title: 'تم التعطيل', description: 'تم إلغاء صلاحية الوصول لهذا العميل.' });
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: 'خطأ في التعطيل', description: error.error || 'حدث خطأ غير معروف' });
      },
    });
  }

  function copyApiKey() {
    if (!newApiKey) return;
    navigator.clipboard.writeText(newApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'تم النسخ', description: 'تم نسخ مفتاح API إلى الحافظة.' });
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setTimeout(() => { setNewApiKey(null); form.reset(); }, 300);
  }

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8 lg:pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">عملاء API</h2>
          <p className="text-muted-foreground mt-1 text-sm">إدارة التطبيقات المخوّلة باستخدام نظام التحقق.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 shrink-0 mt-1" size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">إنشاء عميل</span>
              <span className="sm:hidden">إنشاء</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إنشاء عميل جديد</DialogTitle>
              <DialogDescription>أصدر مفتاح API جديداً لتطبيق يريد استخدام CallVerify.</DialogDescription>
            </DialogHeader>

            {newApiKey ? (
              <div className="space-y-5 py-4">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-emerald-900">تم الإنشاء بنجاح</h4>
                      <p className="text-sm text-emerald-700 mt-1">انسخ المفتاح الآن. لن تتمكن من رؤيته مرة أخرى.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">مفتاح API</label>
                  <div className="flex items-center gap-2">
                    <Input value={newApiKey} readOnly className="font-mono text-xs bg-muted/50 flex-1" dir="ltr" />
                    <Button type="button" variant="secondary" size="icon" onClick={copyApiKey}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={() => handleDialogChange(false)}>تم</Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم العميل</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: تطبيق الشركة الإنتاجي" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>إلغاء</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء العميل'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* جدول للشاشات الكبيرة */}
      <Card className="shadow-sm hidden md:block">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="text-base">العملاء المسجّلون</CardTitle>
          <CardDescription className="text-xs">{clients.length} عميل مسجّل</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>اسم العميل</TableHead>
                <TableHead className="w-28">الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && clients.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>
              ) : clients.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">لا يوجد عملاء مسجّلون بعد.</TableCell></TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-muted-foreground text-sm">#{client.id}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.isActive ? (
                        <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 shrink-0" /><span>نشط</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-xs font-medium border">
                          <XCircle className="h-3 w-3 shrink-0" /><span>معطّل</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(client.createdAt)}</TableCell>
                    <TableCell className="text-left">
                      {client.isActive ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Ban className="h-4 w-4 ml-1" />تعطيل
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تعطيل العميل؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من تعطيل <strong>{client.name}</strong>؟ سيُلغى وصوله فوراً ولن تُقبل أي طلبات جديدة منه.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDisable(client.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                نعم، تعطيل
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button variant="ghost" size="sm" disabled className="opacity-50 cursor-default">معطّل</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* بطاقات للموبايل */}
      <div className="md:hidden space-y-3">
        {isLoading && clients.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">جارٍ التحميل...</div>
        ) : clients.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">لا يوجد عملاء مسجّلون بعد.</div>
        ) : (
          clients.map((client) => (
            <Card key={client.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{client.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">#{client.id}</p>
                  </div>
                  {client.isActive ? (
                    <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-200 shrink-0">
                      <CheckCircle2 className="h-3 w-3" /><span>نشط</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-xs font-medium border shrink-0">
                      <XCircle className="h-3 w-3" /><span>معطّل</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</div>
                {client.isActive && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                        <Ban className="h-3.5 w-3.5 ml-1.5" />تعطيل العميل
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تعطيل العميل؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من تعطيل <strong>{client.name}</strong>؟ سيُلغى وصوله فوراً.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDisable(client.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          نعم، تعطيل
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
