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

import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              404 Page Not Found
            </h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
