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

import React, { useEffect } from 'react';
import { useGetSettings, useUpdateSettings } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Save } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

const schema = z.object({
  receivingPhoneNumber: z
    .string()
    .min(7, 'الرقم قصير جداً')
    .regex(/^\+?[\d\s\-()]+$/, 'صيغة الرقم غير صحيحة'),
});

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useGetSettings();
  const updateMutation = useUpdateSettings();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { receivingPhoneNumber: '' },
  });

  // لما تجي البيانات من الـ API، حدّث الفورم
  useEffect(() => {
    if (settings?.receivingPhoneNumber) {
      form.reset({ receivingPhoneNumber: settings.receivingPhoneNumber });
    }
  }, [settings?.receivingPhoneNumber]);

  function onSubmit(values: z.infer<typeof schema>) {
    updateMutation.mutate(
      { data: { receivingPhoneNumber: values.receivingPhoneNumber } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries();
          form.reset({ receivingPhoneNumber: data.receivingPhoneNumber });
          toast({
            title: 'تم الحفظ',
            description: `رقم الاستقبال الجديد: ${data.receivingPhoneNumber}`,
          });
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'خطأ في الحفظ',
            description: error.error || 'حدث خطأ غير معروف',
          });
        },
      }
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8 lg:pt-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">الإعدادات</h2>
        <p className="text-muted-foreground mt-1 text-sm">إعدادات النظام والتهيئة الأساسية.</p>
      </div>

      <Card className="shadow-sm max-w-xl">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary shrink-0" />
            <CardTitle className="text-base">رقم الاستقبال</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1.5">
            هذا هو الرقم الذي يحمل تطبيق Android ويستقبل مكالمات المستخدمين للتحقق من هوياتهم.
            يُرسَل تلقائياً لكل موقع عند إنشاء جلسة تحقق جديدة.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">جارٍ التحميل...</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="receivingPhoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+249912345678"
                          dir="ltr"
                          className="font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        أدخل الرقم بصيغة دولية مثل: +249912345678
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between pt-1">
                  {settings?.receivingPhoneNumber && (
                    <p className="text-xs text-muted-foreground font-mono">
                      الحالي: <span className="text-foreground">{settings.receivingPhoneNumber}</span>
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending || !form.formState.isDirty}
                    className="flex items-center gap-2 mr-auto"
                  >
                    <Save className="h-4 w-4" />
                    {updateMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ الرقم'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm max-w-xl border-muted/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm text-muted-foreground font-medium">كيف يعمل النظام؟</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground list-none">
            {[
              { n: '١', text: 'الموقع يطلب جلسة تحقق لرقم هاتف المستخدم عبر API.' },
              { n: '٢', text: 'النظام يرد بـ callNumber — وهو الرقم المحدد هنا.' },
              { n: '٣', text: 'الموقع يطلب من المستخدم الاتصال بهذا الرقم مكالمة واحدة.' },
              { n: '٤', text: 'تطبيق Android يلتقط رقم المتصل ويرسله للـ Backend.' },
              { n: '٥', text: 'النظام يطابق الرقم مع الجلسة ويحدّث حالتها إلى "تم التحقق".' },
            ].map(({ n, text }) => (
              <li key={n} className="flex items-start gap-3">
                <span className="font-bold text-primary shrink-0 w-5 text-center">{n}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
