# نظام تحديث الشعارات التلقائي

## الميزات المضافة

### 1. تحديث تلقائي للشعارات كل 5 ثوانٍ

تم إضافة نظام تحديث تلقائي للشعارات (صور الملف الشخصي) للمستخدمين والأدمن كل 5 ثوانٍ، مثل نظام الدردشة.

#### الملفات المعدلة:

**Frontend:**
- `client/src/hooks/useAdminData.ts` - إضافة تحديث تلقائي لشعارات المستخدمين في لوحة الإدارة
- `client/src/contexts/AuthContext.tsx` - إضافة تحديث تلقائي لشعار المستخدم الحالي

**Backend:**
- `server/app/Http/Controllers/AuthController.php` - إضافة دالة `updateProfilePhoto`
- `server/routes/api.php` - إضافة route جديد `/user/profile-photo`
- `server/database/migrations/2025_07_18_005128_add_profile_photo_path_to_users_table.php` - إضافة حقل `profile_photo_path`

### 2. مكونات Avatar محسنة

تم استبدال جميع صور المستخدمين بـ مكونات Avatar محسنة مع fallback للصور غير الموجودة.

#### الملفات المعدلة:

**Frontend:**
- `client/src/components/AppHeader.tsx` - استبدال صور المستخدمين بـ Avatar في قائمة الدردشة
- `client/src/components/AppSidebar.tsx` - استبدال أيقونة المستخدم بـ Avatar
- `client/src/components/admin/UsersTable.tsx` - يستخدم Avatar بالفعل
- `client/src/pages/Settings.tsx` - إضافة مكون رفع الشعار الشخصي

### 3. ميزة رفع الشعار الشخصي

تم إضافة ميزة رفع الشعار الشخصي في صفحة الإعدادات مع:
- معاينة الشعار الحالي
- زر رفع صورة جديدة
- تحديث فوري للشعار
- رسائل تأكيد النجاح/الخطأ

## كيفية الاستخدام

### للمستخدم العادي:
1. اذهب إلى صفحة الإعدادات
2. في تبويب "الملف الشخصي"، ستجد قسم رفع الشعار
3. انقر على أيقونة الكاميرا لاختيار صورة جديدة
4. انقر على "Mettre à jour la photo" لرفع الصورة

### للأدمن:
- شعارات المستخدمين في جدول المستخدمين ستحدث تلقائياً كل 5 ثوانٍ
- شعار المستخدم في الشريط الجانبي سيحدث تلقائياً كل 5 ثوانٍ

## الملفات الجديدة

- `server/database/migrations/2025_07_18_005128_add_profile_photo_path_to_users_table.php`
- `README_AVATAR_UPDATE.md` (هذا الملف)

## التحسينات التقنية

1. **تحديث ذكي**: يتم تحديث الشعارات فقط إذا تغيرت
2. **معالجة الأخطاء**: لا يتم عرض أخطاء في التحديث التلقائي للشعارات
3. **أداء محسن**: استخدام `useCallback` لتجنب إعادة إنشاء الدوال
4. **UX محسن**: معاينة فورية للصور المرفوعة
5. **Fallback**: عرض الحرف الأول من اسم المستخدم إذا لم تكن هناك صورة

## API Endpoints الجديدة

- `POST /api/user/profile-photo` - رفع شعار المستخدم الشخصي
  - Method: POST
  - Content-Type: multipart/form-data
  - Parameter: profile_photo (image file, max 2MB)

## ملاحظات

- الصور محفوظة في `storage/app/public/profile_photos/`
- الحد الأقصى لحجم الصورة: 2MB
- الصور القديمة يتم حذفها تلقائياً عند رفع صورة جديدة
- التحديث التلقائي يعمل فقط للمستخدمين المسجلين دخول 