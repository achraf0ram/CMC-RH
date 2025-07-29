<?php

namespace App\Http\Controllers;

use App\Models\WorkCertificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\VacationRequest;
use App\Models\AdminNotification;
use Barryvdh\DomPDF\Facade\Pdf;

class WorkCertificateController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fullName' => 'required|string|min:3',
            'matricule' => 'required|string',
            'grade' => 'nullable|string',
            'hireDate' => 'nullable|date',
            'function' => 'nullable|string',
            'purpose' => 'required|string|min:5',
            'additionalInfo' => 'nullable|string',
            'pdf' => 'required_without:pdf_base64|file|mimes:pdf',
            'pdf_base64' => 'required_without:pdf|nullable|string',
        ]);

        $filePath = null;

        // إذا كان الملف مرفوعًا مباشرة
        if ($request->hasFile('pdf')) {
            $file = $request->file('pdf');
            $fileName = 'workcert_' . uniqid() . '.' . $file->getClientOriginalExtension();
            // الحفظ في requests فقط
            $file->storeAs('requests', $fileName);
            $filePath = 'requests/' . $fileName;
        }
        // إذا كان الملف Base64
        elseif ($request->filled('pdf_base64')) {
            $pdfData = base64_decode($request->input('pdf_base64'));
            $fileName = 'workcert_' . uniqid() . '.pdf';
            \Storage::disk('public')->put('requests/' . $fileName, $pdfData);
            $filePath = 'requests/' . $fileName;
        } else {
            return response()->json(['error' => 'PDF file is required.'], 422);
        }

        $type = $request->input('type');
        if (!$type || !in_array($type, ['workCertificate'])) {
            $type = 'workCertificate';
        }

        $certificate = WorkCertificate::create([
            'user_id' => \Auth::id(),
            'full_name' => $validated['fullName'],
            'matricule' => $validated['matricule'],
            'grade' => $validated['grade'] ?? null,
            'hire_date' => $validated['hireDate'] ?? null,
            'function' => $validated['function'] ?? null,
            'purpose' => $validated['purpose'],
            'additional_info' => $validated['additionalInfo'] ?? null,
            'type' => $type,
            'file_path' => $filePath,
            'status' => $request->input('status', 'pending'),
        ]);

        // إشعار أدمين
        AdminNotification::create([
            'title' => 'طلب شهادة عمل جديد',
            'title_fr' => "Nouvelle demande d'attestation de travail",
            'body' => 'العميل: ' . $validated['fullName'] . ' - أرسل طلب شهادة عمل جديد',
            'body_fr' => 'Client: ' . $validated['fullName'] . " a soumis une demande d'attestation de travail",
            'type' => 'workCertificate',
            'is_read' => false,
            'data' => json_encode([
                'certificate_id' => $certificate->id,
                'user_id' => \Auth::id(),
            ]),
        ]);
        // إشعار لحظي للأدمين
        try {
        event(new \App\Events\NewNotification([
            'id' => $certificate->id,
            'title' => 'طلب شهادة عمل جديد',
            'title_fr' => "Nouvelle demande d'attestation de travail",
            'type' => 'workCertificate',
            'user_id' => \Auth::id(),
        ]));
        } catch (\Exception $e) {
            \Log::error('Broadcast error: ' . $e->getMessage());
        }

        // إشعار للمستخدم
        \App\Models\UserNotification::create([
            'user_id' => \Auth::id(),
            'title_ar' => 'تم حفظ شهادة العمل بنجاح',
            'title_fr' => 'Attestation de travail sauvegardée avec succès',
            'body_ar' => 'تم إرسال طلبك إلى الإدارة. الحالة: في انتظار المراجعة.',
            'body_fr' => "Votre demande a été envoyée à l'administration. Statut: en attente de validation.",
            'type' => 'workCertificate',
            'is_read' => false,
            'data' => json_encode(['certificate_id' => $certificate->id]),
        ]);

        // معلومات الملف
        $fileInfo = null;
        if ($filePath) {
            $fullPath = storage_path('app/public/' . $filePath);
            if (file_exists($fullPath)) {
                $fileInfo = [
                    'size' => filesize($fullPath),
                    'size_formatted' => $this->formatFileSize(filesize($fullPath)),
                    'created_at' => date('Y-m-d H:i:s', filemtime($fullPath)),
                ];
            }
        }

        return response()->json([
            'message' => 'تم إرسال الطلب بنجاح!',
            'data' => $certificate->setAttribute('pdf_url', '/storage/requests/' . basename($certificate->file_path)),
            'file_info' => $fileInfo,
        ], 201);
    }

    public function countAll()
    {
        $count = \App\Models\WorkCertificate::count();
        return response()->json(['count' => $count]);
    }

    public function userCount()
    {
        \Log::info('userCount called', ['user_id' => Auth::id()]);
        $count = WorkCertificate::where('user_id', Auth::id())->count();
        return response()->json(['count' => $count]);
    }

    public function downloadPDF($id)
    {
        $certificate = \App\Models\WorkCertificate::findOrFail($id);
        // السماح للأدمين أو صاحب الطلب فقط
        if (auth()->user()->is_admin || $certificate->user_id == auth()->id()) {
            if ($certificate->pdf_blob) {
                $filename = 'attestation_travail_' . preg_replace('/\s+/', '_', $certificate->full_name) . '.pdf';
                return response($certificate->pdf_blob, 200)
                    ->header('Content-Type', 'application/pdf')
                    ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
            } elseif ($certificate->file_path && \Storage::disk('public')->exists($certificate->file_path)) {
                $filename = 'attestation_travail_' . preg_replace('/\s+/', '_', $certificate->full_name) . '.pdf';
                return \Storage::disk('public')->download($certificate->file_path, $filename);
            }
            return response()->json(['message' => 'PDF file not found.'], 404);
        }
        return response()->json(['message' => 'Forbidden'], 403);
    }

    public function downloadPDFfromDB($id)
    {
        $certificate = WorkCertificate::where('id', $id)
            ->where('user_id', \Auth::id())
            ->first();
        if ($certificate && $certificate->pdf_blob) {
            $filename = 'attestation_travail_' . preg_replace('/\s+/', '_', $certificate->full_name) . '.pdf';
            return response($certificate->pdf_blob, 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } elseif ($certificate && $certificate->file_path && \Storage::disk('public')->exists($certificate->file_path)) {
            return \Storage::disk('public')->download($certificate->file_path);
        }
        return response()->json(['message' => 'PDF not found in database or storage'], 404);
    }

    private function formatFileSize($bytes)
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }

    public function userCertificates()
    {
        $certificates = WorkCertificate::where('user_id', \Auth::id())
            ->orderBy('created_at', 'desc')
            ->get(['id','full_name','matricule','file_path','type','status','created_at','grade','hire_date','function','purpose','additional_info']);
        $certificates = $certificates->map(function($item) {
            $item->created_at = $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null;
            return $item;
        });
        return response()->json($certificates);
    }
} 