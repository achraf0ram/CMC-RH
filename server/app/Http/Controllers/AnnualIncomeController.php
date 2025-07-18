<?php

namespace App\Http\Controllers;

use App\Models\AnnualIncome;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\AdminNotification;

class AnnualIncomeController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'fullName' => 'required|string|max:255',
            'matricule' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $filePath = $request->file('file')->store('annual_incomes', 'public');

        $type = $request->input('type');
        if (!$type || !in_array($type, ['annualIncome'])) {
            $type = 'annualIncome';
        }

        $income = AnnualIncome::create([
            'user_id' => \Auth::id(),
            'full_name' => $request->fullName,
            'matricule' => $request->matricule,
            'file_path' => $filePath,
            'type' => $type,
            'status' => $request->input('status', 'pending'),
        ]);
        // إشعار أدمين
        AdminNotification::create([
            'title' => 'طلب شهادة دخل سنوي جديد',
            'title_fr' => "Nouvelle demande d'attestation de revenus annuels",
            'body' => 'العميل: ' . $request->fullName . ' - أرسل طلب شهادة دخل سنوي جديد',
            'body_fr' => 'Client: ' . $request->fullName . " a soumis une demande d'attestation de revenus annuels",
            'type' => 'annualIncome',
            'is_read' => false,
            'data' => json_encode([
                'annual_income_id' => $income->id,
                'user_id' => \Auth::id(),
            ]),
        ]);
        // إشعار لحظي للأدمين
        event(new \App\Events\NewNotification([
            'id' => $income->id,
            'title' => 'طلب شهادة دخل سنوي جديد',
            'title_fr' => "Nouvelle demande d'attestation de revenus annuels",
            'type' => 'annualIncome',
            'user_id' => \Auth::id(),
        ]));
        // إشعار للمستخدم
        \App\Models\UserNotification::create([
            'user_id' => \Auth::id(),
            'title_ar' => 'تم حفظ شهادة الدخل السنوي بنجاح',
            'title_fr' => 'Attestation de revenus annuels sauvegardée avec succès',
            'body_ar' => 'تم إرسال طلبك إلى الإدارة. الحالة: في انتظار المراجعة.',
            'body_fr' => "Votre demande a été envoyée à l'administration. Statut: en attente de validation.",
            'type' => 'annualIncome',
            'is_read' => false,
            'data' => json_encode(['annual_income_id' => $income->id]),
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
            'data' => $income,
            'file_info' => $fileInfo,
        ], 201);
    }

    public function downloadPDF($id)
    {
        $income = AnnualIncome::where('id', $id)
            ->where('user_id', \Auth::id())
            ->first();
        if (!$income) {
            return response()->json(['message' => 'Annual income not found'], 404);
        }
        if (!$income->file_path) {
            return response()->json(['message' => 'PDF file not found'], 404);
        }
        $filePath = storage_path('app/public/' . $income->file_path);
        if (!file_exists($filePath)) {
            return response()->json(['message' => 'PDF file not found on server'], 404);
        }
        $filename = 'attestation_revenu_annuel_' . preg_replace('/\s+/', '_', $income->full_name) . '.pdf';
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

    public function userAnnualIncomes()
    {
        \Log::info('userAnnualIncomes called', ['user_id' => \Auth::id()]);
        try {
            $incomes = \App\Models\AnnualIncome::where('user_id', \Auth::id())
                ->orderBy('created_at', 'desc')
                ->get(['id','full_name','matricule','file_path','type','status','created_at']);
            $incomes = $incomes->map(function($item) {
                $item->created_at = $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null;
                return $item;
            });
            return response()->json($incomes);
        } catch (\Exception $e) {
            \Log::error('Error in userAnnualIncomes', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error', 'message' => $e->getMessage()], 500);
        }
    }
} 