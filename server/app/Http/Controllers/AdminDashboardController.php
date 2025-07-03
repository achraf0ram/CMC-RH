<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\WorkCertificate;
use App\Models\VacationRequest;
use App\Models\SalaryDomiciliation;
use App\Models\AnnualIncome;
use App\Models\User;
use App\Models\MissionOrder;
use App\Models\UserNotification;

class AdminDashboardController extends Controller
{
    private function getAllRequests()
    {
        $workCertificates = WorkCertificate::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path')->get();
        $vacationRequests = VacationRequest::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path')->get();
        $salaryDomiciliations = SalaryDomiciliation::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path')->get();
        $annualIncomes = AnnualIncome::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path')->get();
        $missionOrders = MissionOrder::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path')->get();

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
            'work_certificates' => WorkCertificate::class,
            'vacation_requests' => VacationRequest::class,
            'salary_domiciliations' => SalaryDomiciliation::class,
            'annual_incomes' => AnnualIncome::class,
            'mission_orders' => MissionOrder::class,
        ];
        return $map[$type] ?? null;
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
        $workCertificates = WorkCertificate::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path')->get();
        $vacationRequests = VacationRequest::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path')->get();
        $missionOrders = MissionOrder::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path')->get();
        $salaryDomiciliations = SalaryDomiciliation::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path')->get();
        $annualIncomes = AnnualIncome::select('id', 'full_name', 'matricule', 'created_at', 'status', 'type', 'file_path')->get();

        $allRequests = collect()
            ->concat($workCertificates)
            ->concat($vacationRequests)
            ->concat($missionOrders)
            ->concat($salaryDomiciliations)
            ->concat($annualIncomes)
            ->sortByDesc('created_at')
            ->values();

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
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $model = $this->getModelFromType($type);
        if (!$model) {
            return response()->json(['message' => 'Invalid request type'], 400);
        }

        $req = $model::find($id);
        if (!$req) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $req->status = $validated['status'];
        $req->save();

        // إشعار المستخدم بالقبول أو الرفض
        $statusTextAr = $validated['status'] === 'approved' ? 'تم قبول طلبك' : 'تم رفض طلبك';
        $statusTextFr = $validated['status'] === 'approved' ? 'Votre demande a été acceptée' : 'Votre demande a été refusée';
        UserNotification::create([
            'user_id' => $req->user_id ?? $req->user?->id, // دعم الحقول المختلفة
            'type' => $validated['status'],
            'title_ar' => $statusTextAr,
            'title_fr' => $statusTextFr,
            'body_ar' => $statusTextAr . ' - نوع الطلب: ' . ($type ?? ''),
            'body_fr' => $statusTextFr . ' - Type de demande: ' . ($type ?? ''),
        ]);

        return response()->json(['message' => 'Status updated successfully', 'data' => $req]);
    }

    public function destroy($type, $id)
    {
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
} 