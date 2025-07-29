<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VacationRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Events\NewRequest;
use App\Events\RequestStatusUpdated;
use App\Models\AdminNotification;

class VacationRequestController extends Controller
{
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'fullName' => 'required|string|min:3',
                'arabicFullName' => 'nullable|string',
                'matricule' => 'required|string|min:1',
                'echelle' => 'nullable|string',
                'echelon' => 'nullable|string',
                'grade' => 'nullable|string',
                'fonction' => 'nullable|string',
                'arabicFonction' => 'nullable|string',
                'direction' => 'nullable|string',
                'arabicDirection' => 'nullable|string',
                'address' => 'nullable|string',
                'arabicAddress' => 'nullable|string',
                'phone' => 'nullable|string',
                'leaveType' => 'required|string|min:1',
                'customLeaveType' => 'nullable|string',
                'arabicCustomLeaveType' => 'nullable|string',
                'duration' => 'required|string|min:1',
                'arabicDuration' => 'nullable|string',
                'startDate' => 'required|date',
                'endDate' => 'required|date',
                'with' => 'nullable|string',
                'arabicWith' => 'nullable|string',
                'interim' => 'nullable|string',
                'arabicInterim' => 'nullable|string',
                'leaveMorocco' => 'sometimes|boolean',
                'signature' => 'nullable|string',
                'pdf_base64' => 'nullable|string',
            ]);

            $signaturePath = null;
            if ($request->filled('signature')) {
                $signatureData = $request->input('signature');
                // Check if the signature is a base64 string
                if (preg_match('/^data:image\/(\w+);base64,/', $signatureData, $type)) {
                    $signatureData = substr($signatureData, strpos($signatureData, ',') + 1);
                    $type = strtolower($type[1]); // jpg, png, gif

                    if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                        throw new \Exception('invalid image type');
                    }
                    $signatureData = base64_decode($signatureData);

                    if ($signatureData === false) {
                        throw new \Exception('base64_decode failed');
                    }

                    $fileName = 'signatures/' . Str::uuid() . '.' . $type;
                    Storage::disk('public')->put($fileName, $signatureData);
                    $signaturePath = $fileName;
                }
            }

            $type = $request->input('type');
            if (!$type || !in_array($type, ['vacationRequest'])) {
                $type = 'vacationRequest';
            }
            $vacationRequest = VacationRequest::create([
                'user_id' => Auth::id(),
                'full_name' => $validatedData['fullName'],
                'arabic_full_name' => $validatedData['arabicFullName'] ?? null,
                'matricule' => $validatedData['matricule'],
                'echelle' => $validatedData['echelle'] ?? null,
                'echelon' => $validatedData['echelon'] ?? null,
                'grade' => $validatedData['grade'] ?? null,
                'fonction' => $validatedData['fonction'] ?? null,
                'arabic_fonction' => $validatedData['arabicFonction'] ?? null,
                'direction' => $validatedData['direction'] ?? null,
                'arabic_direction' => $validatedData['arabicDirection'] ?? null,
                'address' => $validatedData['address'] ?? null,
                'arabic_address' => $validatedData['arabicAddress'] ?? null,
                'phone' => $validatedData['phone'] ?? null,
                'leave_type' => $validatedData['leaveType'],
                'custom_leave_type' => $validatedData['customLeaveType'] ?? null,
                'arabic_custom_leave_type' => $validatedData['arabicCustomLeaveType'] ?? null,
                'duration' => $validatedData['duration'],
                'arabic_duration' => $validatedData['arabicDuration'] ?? null,
                'start_date' => Carbon::parse($validatedData['startDate'])->format('Y-m-d'),
                'end_date' => Carbon::parse($validatedData['endDate'])->format('Y-m-d'),
                'with_family' => $validatedData['with'] ?? null,
                'arabic_with_family' => $validatedData['arabicWith'] ?? null,
                'interim' => $validatedData['interim'] ?? null,
                'arabic_interim' => $validatedData['arabicInterim'] ?? null,
                'leave_morocco' => $validatedData['leaveMorocco'] ?? false,
                'signature_path' => $signaturePath,
                'file_path' => null, // سيتم تحديثه بعد الحفظ
                'type' => $type,
                'status' => $request->input('status', 'pending'),
                'pdf_blob' => null, // سيتم تحديثه بعد الحفظ
            ]);

            // حذف أي ملف قديم
            if ($vacationRequest->file_path && \Storage::disk('public')->exists($vacationRequest->file_path)) {
                \Storage::disk('public')->delete($vacationRequest->file_path);
            }

            // حفظ الملف باسم جديد داخل مجلد requests فقط (بدون vacation فرعي)
            $fileName = 'vacation_' . $vacationRequest->id . '.pdf';
            $dir = 'requests';
            if ($request->hasFile('pdf')) {
                $file = $request->file('pdf');
                $file->storeAs($dir, $fileName);
                $filePath = $dir . '/' . $fileName;
                $pdfBlob = file_get_contents($file->getRealPath());
            } elseif ($request->filled('pdf_base64')) {
                $pdfData = base64_decode($request->input('pdf_base64'));
                \Storage::disk('public')->put($dir . '/' . $fileName, $pdfData);
                $filePath = $dir . '/' . $fileName;
                $pdfBlob = $pdfData;
            } else {
                $filePath = null;
                $pdfBlob = null;
            }
            $vacationRequest->file_path = $filePath;
            $vacationRequest->pdf_blob = $pdfBlob;
            $vacationRequest->save();

            // إشعار أدمين
            AdminNotification::create([
                'title' => 'طلب عطلة جديد',
                'title_fr' => 'Nouvelle demande de congé',
                'body' => 'العميل: ' . $validatedData['fullName'] . ' - أرسل طلب عطلة جديد',
                'body_fr' => 'Client: ' . $validatedData['fullName'] . ' a soumis une demande de congé',
                'type' => 'vacationRequest',
                'is_read' => false,
                'data' => json_encode([
                    'request_id' => $vacationRequest->id,
                    'user_id' => \Auth::id(),
                ]),
            ]);

            // إشعار للمستخدم
            \App\Models\UserNotification::create([
                'user_id' => Auth::id(),
                'title_ar' => 'تم حفظ طلب الإجازة بنجاح',
                'title_fr' => 'Demande de congé sauvegardée avec succès',
                'body_ar' => 'تم إرسال طلبك إلى الإدارة. الحالة: في انتظار المراجعة.',
                'body_fr' => "Votre demande a été envoyée à l'administration. Statut: en attente de validation.",
                'type' => 'vacationRequest',
                'is_read' => false,
                'data' => json_encode(['vacation_request_id' => $vacationRequest->id]),
            ]);

            // إشعار لحظي للأدمين
            try {
                event(new \App\Events\NewRequest($vacationRequest));
            } catch (\Exception $e) {
                \Log::error('Broadcast error: ' . $e->getMessage());
            }

            Log::info('Vacation request stored successfully', ['id' => $vacationRequest->id]);

            return response()->json([
                'message' => __('📤 تم الإرسال — تم إرسال الطلب إلى الإدارة بنجاح'),
                'data' => $vacationRequest->makeHidden(['pdf_blob'])->setAttribute('pdf_url', '/storage/requests/' . basename($vacationRequest->file_path)),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error storing vacation request', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'An error occurred while submitting the request.'], 500);
        }
    }

    public function updateStatus(Request $request, $type, $id)
    {
        $req = VacationRequest::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|string|in:pending,approved,rejected,cancelled',
        ]);
        $req->status = $validated['status'];
        $req->save();
        event(new RequestStatusUpdated($req->id, $req->status));
        return response()->json(['message' => 'Status updated successfully', 'data' => $req]);
    }

    public function countPending()
    {
        $count = \App\Models\VacationRequest::where('status', 'pending')->count();
        return response()->json(['count' => $count]);
    }

    public function countApproved()
    {
        $count = \App\Models\VacationRequest::where('status', 'approved')->count();
        return response()->json(['count' => $count]);
    }

    public function countVacationDays()
    {
        $days = \App\Models\VacationRequest::where('status', 'approved')->sum('duration');
        return response()->json(['days' => $days]);
    }

    public function countAll()
    {
        $count = \App\Models\VacationRequest::count();
        return response()->json(['count' => $count]);
    }

    public function userCount()
    {
        $count = VacationRequest::where('user_id', Auth::id())->count();
        return response()->json(['count' => $count]);
    }

    // دالة تحميل PDF
    public function downloadPDF($id)
    {
        $request = \App\Models\VacationRequest::findOrFail($id);
        // السماح للأدمين أو صاحب الطلب فقط
        if (auth()->user()->is_admin || $request->user_id == auth()->id()) {
            if ($request->pdf_blob) {
                $filename = 'DEMANDE_CONGE ' . ($request->full_name ?? 'user') . '.pdf';
                return response($request->pdf_blob, 200, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                ]);
            } elseif ($request->file_path && \Storage::disk('public')->exists($request->file_path)) {
                return \Storage::disk('public')->download($request->file_path);
            }
            return response()->json(['message' => 'PDF file not found.'], 404);
        }
        return response()->json(['message' => 'Forbidden'], 403);
    }

    // تعديل دالة history للمستخدم
    public function userRequests()
    {
        $requests = VacationRequest::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get(['id','full_name','matricule','file_path','type','status','created_at','start_date','end_date','leave_type','custom_leave_type']);
        // تأكد من أن created_at يعاد بتنسيق كامل مع الوقت
        $requests = $requests->map(function($item) {
            $item->created_at = $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null;
            return $item;
        });
        return response()->json($requests);
    }

    // تحميل ملف vacation من التخزين بشكل آمن
    public function secureDownload($filename)
    {
        $user = auth()->user();
        $filePath = storage_path('app/requests/' . $filename);
        if (!file_exists($filePath)) {
            return response()->json(['message' => 'الملف غير موجود'], 404);
        }
        // تحقق من أن المستخدم أدمين أو صاحب الطلب
        $vacation = \App\Models\VacationRequest::where('file_path', 'requests/' . $filename)->first();
        if (!$vacation) {
            return response()->json(['message' => 'الطلب غير موجود'], 404);
        }
        if (!($user->is_admin || $user->id == $vacation->user_id)) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }
        return response()->download($filePath);
    }
}