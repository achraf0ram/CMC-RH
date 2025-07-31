<?php

namespace App\Http\Controllers;

use App\Models\SalaryDomiciliation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\AdminNotification;

class SalaryDomiciliationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'fullName' => 'required|string|max:255',
            'matricule' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $filePath = $request->file('file')->store('salary_domiciliations', 'public');

        $type = $request->input('type');
        if (!$type || !in_array($type, ['salaryDomiciliation'])) {
            $type = 'salaryDomiciliation';
        }

        $domiciliation = SalaryDomiciliation::create([
            'user_id' => \Auth::id(),
            'full_name' => $request->fullName,
            'matricule' => $request->matricule,
            'file_path' => $filePath,
            'type' => $type,
            'status' => $request->input('status', 'pending'),
        ]);
        // إشعار أدمين
        AdminNotification::create([
            'title' => 'طلب توطين راتب جديد',
            'title_fr' => 'Nouvelle demande de domiciliation de salaire',
            'body' => 'العميل: ' . $request->fullName . ' - أرسل طلب توطين راتب جديد',
            'body_fr' => 'Client: ' . $request->fullName . ' a soumis une demande de domiciliation de salaire',
            'type' => 'salaryDomiciliation',
            'is_read' => false,
            'data' => json_encode([
                'salary_domiciliation_id' => $domiciliation->id,
                'user_id' => \Auth::id(),
            ]),
        ]);
        // إشعار لحظي للأدمين
        try {
        event(new \App\Events\NewNotification([
            'id' => $domiciliation->id,
            'title' => 'طلب توطين راتب جديد',
            'title_fr' => 'Nouvelle demande de domiciliation de salaire',
            'type' => 'salaryDomiciliation',
            'user_id' => \Auth::id(),
        ]));
        } catch (\Exception $e) {
            \Log::error('Broadcast error: ' . $e->getMessage());
        }
        // إشعار للمستخدم
        \App\Models\UserNotification::create([
            'user_id' => \Auth::id(),
            'title_ar' => 'تم حفظ توطين الراتب بنجاح',
            'title_fr' => 'Domiciliation de salaire sauvegardée avec succès',
            'body_ar' => 'تم إرسال طلب توطين الراتب إلى الإدارة. الحالة: في انتظار المراجعة.',
            'body_fr' => "Votre demande de domiciliation de salaire a été envoyée à l'administration. Statut: en attente de validation.",
            'type' => 'salaryDomiciliation',
            'status' => $domiciliation->status ?? 'pending',
            'is_read' => false,
            'data' => json_encode(['salary_domiciliation_id' => $domiciliation->id]),
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
            'data' => $domiciliation,
            'file_info' => $fileInfo,
        ], 201);
    }

    public function downloadPDF($id)
    {
        $domiciliation = SalaryDomiciliation::where('id', $id)
            ->where('user_id', \Auth::id())
            ->first();
        if (!$domiciliation) {
            return response()->json(['message' => 'Salary domiciliation not found'], 404);
        }
        if (!$domiciliation->file_path) {
            return response()->json(['message' => 'PDF file not found'], 404);
        }
        $filePath = storage_path('app/public/' . $domiciliation->file_path);
        if (!file_exists($filePath)) {
            return response()->json(['message' => 'PDF file not found on server'], 404);
        }
        $filename = 'domiciliation_salaire_' . preg_replace('/\s+/', '_', $domiciliation->full_name) . '.pdf';
        return response()->download($filePath, $filename, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
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

    public function userDomiciliations()
    {
        \Log::info('userDomiciliations called', ['user_id' => \Auth::id()]);
        try {
            $domiciliations = \App\Models\SalaryDomiciliation::where('user_id', \Auth::id())
                ->orderBy('created_at', 'desc')
                ->get(['id','full_name','matricule','file_path','type','status','created_at']);
            $domiciliations = $domiciliations->map(function($item) {
                $item->created_at = $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null;
                return $item;
            });
            return response()->json($domiciliations);
        } catch (\Exception $e) {
            \Log::error('Error in userDomiciliations', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error', 'message' => $e->getMessage()], 500);
        }
    }
} 