<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\WorkCertificate;
use App\Models\VacationRequest;
use App\Models\SalaryDomiciliation;
use App\Models\AnnualIncome;
use App\Models\User;
use App\Models\MissionOrder;
use App\Models\UserNotification;
use App\Models\AdminNotification;

class AdminDashboardController extends Controller
{
    private function getAllRequests()
    {
        $workCertificates = WorkCertificate::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path', 'user_id')->get();
        $vacationRequests = VacationRequest::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path', 'user_id')->get();
        $salaryDomiciliations = SalaryDomiciliation::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path', 'user_id')->get();
        $annualIncomes = AnnualIncome::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path', 'user_id')->get();
        $missionOrders = MissionOrder::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path', 'user_id')->get();

        return $workCertificates
            ->concat($vacationRequests)
            ->concat($salaryDomiciliations)
            ->concat($annualIncomes)
            ->concat($missionOrders)
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }

    private function getModelFromType($type)
    {
        $map = [
            'work_certificates' => \App\Models\WorkCertificate::class,
            'workCertificate' => \App\Models\WorkCertificate::class,
            'vacation_requests' => \App\Models\VacationRequest::class,
            'vacationRequest' => \App\Models\VacationRequest::class,
            'salary_domiciliations' => \App\Models\SalaryDomiciliation::class,
            'salaryDomiciliation' => \App\Models\SalaryDomiciliation::class,
            'annual_incomes' => \App\Models\AnnualIncome::class,
            'annualIncome' => \App\Models\AnnualIncome::class,
            'mission_orders' => \App\Models\MissionOrder::class,
            'missionOrder' => \App\Models\MissionOrder::class,
        ];
        return $map[$type] ?? null;
    }

    // إضافة دالة لإنشاء إشعار أدمين جديد
    private function createAdminNotification($title, $body = null, $type = null, $data = null) {
        AdminNotification::create([
            'title' => $title,
            'body' => $body,
            'type' => $type,
            'is_read' => false,
            'data' => $data ? json_encode($data) : null,
        ]);
    }

    public function summary()
    {
        $totalUsers = User::count();

        $workCertificatesCount = WorkCertificate::count();
        $vacationRequestsCount = VacationRequest::count();
        $missionOrdersCount = MissionOrder::count();
        $salaryDomiciliationsCount = SalaryDomiciliation::count();
        $annualIncomesCount = AnnualIncome::count();
        
        $totalRequests = $workCertificatesCount + $vacationRequestsCount + $missionOrdersCount + $salaryDomiciliationsCount + $annualIncomesCount;

        $pendingRequests = WorkCertificate::where('status', 'pending')->count()
                           + VacationRequest::where('status', 'pending')->count()
                           + MissionOrder::where('status', 'pending')->count()
                           + SalaryDomiciliation::where('status', 'pending')->count()
                           + AnnualIncome::where('status', 'pending')->count();
        
        $approvedRequests = WorkCertificate::where('status', 'approved')->count()
                            + VacationRequest::where('status', 'approved')->count()
                            + MissionOrder::where('status', 'approved')->count()
                            + SalaryDomiciliation::where('status', 'approved')->count()
                            + AnnualIncome::where('status', 'approved')->count();

        $rejectedRequests = WorkCertificate::where('status', 'rejected')->count()
                            + VacationRequest::where('status', 'rejected')->count()
                            + MissionOrder::where('status', 'rejected')->count()
                            + SalaryDomiciliation::where('status', 'rejected')->count()
                            + AnnualIncome::where('status', 'rejected')->count();

        $stats = [
            'totalUsers' => $totalUsers,
            'totalRequests' => $totalRequests,
            'pendingRequests' => $pendingRequests,
            'approvedRequests' => $approvedRequests,
            'rejectedRequests' => $rejectedRequests,
        ];

        return response()->json(['stats' => $stats]);
    }

    public function requests()
    {
        $workCertificates = WorkCertificate::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path', 'user_id')->get();
        $vacationRequests = VacationRequest::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path', 'user_id')->get();
        $missionOrders = MissionOrder::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path', 'user_id')->get();
        $salaryDomiciliations = SalaryDomiciliation::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path', 'user_id')->get();
        $annualIncomes = AnnualIncome::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path', 'user_id')->get();

        $allRequests = collect()
            ->concat($workCertificates)
            ->concat($vacationRequests)
            ->concat($missionOrders)
            ->concat($salaryDomiciliations)
            ->concat($annualIncomes)
            ->sortByDesc('created_at')
            ->values();

        // أضف معلومات المستخدم لكل طلب
        $allRequests = $allRequests->map(function($req) {
            $user = null;
            if ($req->user_id) {
                $user = User::find($req->user_id);
            }
            
            $file = \DB::table('request_files')
                ->where('request_id', $req->id)
                ->where('request_type', $req->type)
                ->orderByDesc('created_at')
                ->first();
            
            return [
                'id' => $req->id,
                'full_name' => $req->full_name,
                'matricule' => $req->matricule,
                'created_at' => $req->created_at,
                'status' => $req->status,
                'type' => $req->type,
                'file_path' => $req->file_path,
                'user_id' => $req->user_id,
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'profile_photo_url' => $user->profile_photo_url,
                ] : null,
                'admin_file_url' => $file ? url('storage/' . $file->file_path) : null,
            ];
        });

        return response()->json(['requests' => $allRequests]);
    }

    public function users()
    {
        $users = User::all()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'created_at' => $user->created_at,
                'is_admin' => $user->is_admin,
                'profile_photo_url' => $user->profile_photo_url,
                'last_seen' => $user->last_seen ?? null,
            ];
        });
        return response()->json(['users' => $users]);
    }

    public function updateStatus(Request $request, $type, $id)
    {
        \Log::info('updateStatus ENTRY', [
            'type' => $type,
            'id' => $id,
            'request_all' => $request->all(),
            'user' => auth()->user(),
        ]);
        try {
            \Log::info('updateStatus: before validate');
            $validated = $request->validate([
                'status' => 'required|in:approved,rejected,waiting_admin_file',
            ]);
            \Log::info('updateStatus: after validate', ['validated' => $validated]);

            $model = $this->getModelFromType($type);
            \Log::info('updateStatus: after getModelFromType', ['model' => $model]);
            if (!$model) {
                \Log::error('Invalid request type', ['type' => $type]);
                return response()->json(['message' => 'Invalid request type'], 400);
            }

            $req = $model::find($id);
            \Log::info('updateStatus: after find', ['req' => $req]);
            if (!$req) {
                \Log::error('Request not found', ['id' => $id, 'type' => $type]);
                return response()->json(['message' => 'Request not found'], 404);
            }

            // تحقق من الحقول الأساسية في MissionOrder
            if ($model === \App\Models\MissionOrder::class) {
                $missing = [];
                if (empty($req->user_id)) $missing[] = 'user_id';
                if (empty($req->type)) $missing[] = 'type';
                if (empty($req->full_name)) $missing[] = 'full_name';
                if (!empty($missing)) {
                    \Log::error('MissionOrder missing fields', ['id' => $id, 'fields' => $missing, 'req' => $req]);
                    return response()->json(['message' => 'MissionOrder missing fields', 'fields' => $missing], 422);
                }
            }

            if ($validated['status'] === 'approved') {
                $req->status = 'waiting_admin_file';
            } else {
                $req->status = $validated['status'];
            }
            \Log::info('updateStatus: before save', ['id' => $req->id, 'new_status' => $req->status]);
            $req->save();
            \Log::info('updateStatus: after save', ['id' => $req->id, 'status' => $req->status]);

            $notifUserId = $req->user_id ?? ($req->user->id ?? null);
            \Log::info('updateStatus: notifUserId', ['notifUserId' => $notifUserId]);
            if ($notifUserId) {
                if ($req->status === 'waiting_admin_file') {
                    $statusTextAr = 'تم قبول طلبك، بانتظار رفع ملف الإدارة';
                    $statusTextFr = "Votre demande a été acceptée, en attente du fichier de l'admin";
                } else {
                    $statusTextAr = $validated['status'] === 'approved' ? 'تم قبول طلبك' : 'تم رفض طلبك';
                    $statusTextFr = $validated['status'] === 'approved' ? 'Votre demande a été acceptée' : 'Votre demande a été refusée';
                }
                \Log::info('updateStatus: before notification', ['user_id' => $notifUserId, 'status' => $req->status]);
                \App\Models\UserNotification::create([
                    'user_id' => $notifUserId,
                    'type' => $req->status,
                    'title_ar' => $statusTextAr,
                    'title_fr' => $statusTextFr,
                    'body_ar' => $statusTextAr . ' - نوع الطلب: ' . ($type ?? ''),
                    'body_fr' => $statusTextFr . ' - Type de demande: ' . ($type ?? ''),
                ]);
                \Log::info('updateStatus: after notification');
            } else {
                \Log::warning('No user_id found for notification', ['req_id' => $req->id, 'type' => $type]);
            }

            \Log::info('updateStatus: END', ['req' => $req]);
            return response()->json([
                'message' => 'Status updated successfully',
                'data' => [
                    'id' => $req->id,
                    'user_id' => $req->user_id,
                    'full_name' => $req->full_name,
                    'matricule' => $req->matricule,
                    'status' => $req->status,
                    'type' => $req->type,
                    'file_path' => $req->file_path,
                    'created_at' => $req->created_at,
                    'updated_at' => $req->updated_at,
                ]
            ], 200, [], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            \Log::error('updateStatus Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'type' => $type,
                'id' => $id,
                'request_all' => $request->all(),
                'user' => auth()->user(),
            ]);
            return response()->json(['message' => 'Internal Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($type, $id)
    {
        \Log::info('Type received in destroy: ' . $type); // log type
        $model = $this->getModelFromType($type);
        if (!$model) {
            return response()->json(['message' => 'Invalid request type'], 400);
        }
        $req = $model::find($id);
        if (!$req) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        $req->delete();
        return response()->json(['message' => 'Request deleted successfully']);
    }

    // رفع ملف الطلب من الأدمن وحفظه في جدول request_files
    public function uploadRequestFile(Request $request, $type, $id)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:20480', // 20MB max
        ]);

        $file = $request->file('file');
        // تحديد مجلد الحفظ حسب نوع الطلب
        $folder = 'requests';
        $fileName = $type . '_' . $id . '_' . time() . '.' . $file->getClientOriginalExtension();
        if (in_array($type, ['salary_domiciliations', 'salaryDomiciliation'])) {
            $folder = 'salary_domiciliations';
            $fileName = $id . '_' . time() . '.' . $file->getClientOriginalExtension();
        } elseif (in_array($type, ['annual_incomes', 'annualIncome'])) {
            $folder = 'annual_incomes';
            $fileName = $id . '_' . time() . '.' . $file->getClientOriginalExtension();
        }
        $path = $file->storeAs($folder, $fileName, 'public');
        // المسار النهائي في قاعدة البيانات يجب أن يكون بدون requests/
        // فقط annual_incomes/xxx.pdf أو salary_domiciliations/xxx.pdf أو requests/xxx.pdf
        $finalPath = $folder . '/' . $fileName;

        // حفظ في جدول request_files
        \DB::table('request_files')->insert([
            'request_id' => $id,
            'request_type' => $type,
            'file_path' => $finalPath,
            'file_type' => $file->getClientOriginalExtension(),
            'uploaded_by' => auth()->id(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // تحديث الطلب الأصلي: الحالة + الملف
        $model = $this->getModelFromType($type);
        if ($model) {
            $req = $model::find($id);
            if ($req) {
                $req->status = 'approved';
                $req->file_path = $finalPath; // هذا سيحفظ المسار الصحيح مثل salary_domiciliations/xxx.pdf أو annual_incomes/xxx.pdf أو requests/xxx.pdf
                $req->save();

                // إشعار المستخدم أن ملفه جاهز (اختياري)
                \App\Models\UserNotification::create([
                    'user_id' => $req->user_id ?? $req->user?->id,
                    'type' => 'approved',
                    'title_ar' => 'تم تجهيز ملفك من الإدارة',
                    'title_fr' => 'Votre fichier est prêt',
                    'body_ar' => 'تم رفع الملف النهائي لطلبك من الإدارة.',
                    'body_fr' => 'Le fichier final de votre demande a été envoyé par l’administration.',
                    'data' => json_encode([
                        'request_type' => $type,
                        $type . '_id' => $id,
                    ]),
                ]);
            }
        }

        return response()->json(['message' => 'تم رفع الملف بنجاح', 'file_path' => $path]);
    }

    // API: جلب عدد الإشعارات غير المقروءة
    public function unreadAdminNotificationsCount() {
        $count = AdminNotification::where('is_read', false)->count();
        return response()->json(['count' => $count]);
    }
    // API: جلب كل إشعارات الأدمين
    public function allAdminNotifications() {
        $notifs = AdminNotification::orderBy('created_at', 'desc')->get();
        
        // إضافة معلومات المستخدم لكل إشعار
        $notifs = $notifs->map(function($notif) {
            $data = $notif->data ? json_decode($notif->data, true) : null;
            $user = null;
            
            if ($data && isset($data['user_id'])) {
                $user = User::find($data['user_id']);
            }
            
            return [
                'id' => $notif->id,
                'title' => $notif->title,
                'body' => $notif->body,
                'type' => $notif->type,
                'is_read' => $notif->is_read,
                'data' => $notif->data,
                'created_at' => $notif->created_at,
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'profile_photo_url' => $user->profile_photo_url,
                ] : null,
            ];
        });
        
        return response()->json(['notifications' => $notifs]);
    }
    // API: تعليم كل الإشعارات كمقروءة
    public function markAllAdminNotificationsRead() {
        AdminNotification::where('is_read', false)->update(['is_read' => true]);
        return response()->json(['success' => true]);
    }

    // API: جلب آخر إشعار أدمين فقط
    public function latestAdminNotification() {
        $notif = AdminNotification::orderBy('created_at', 'desc')->first();
        
        if ($notif) {
            $data = $notif->data ? json_decode($notif->data, true) : null;
            $user = null;
            
            if ($data && isset($data['user_id'])) {
                $user = User::find($data['user_id']);
            }
            
            $notif = [
                'id' => $notif->id,
                'title' => $notif->title,
                'body' => $notif->body,
                'type' => $notif->type,
                'is_read' => $notif->is_read,
                'data' => $notif->data,
                'created_at' => $notif->created_at,
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'profile_photo_url' => $user->profile_photo_url,
                ] : null,
            ];
        }
        
        return response()->json(['notification' => $notif]);
    }
} 