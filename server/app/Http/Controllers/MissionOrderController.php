<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MissionOrder;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Models\AdminNotification;

class MissionOrderController extends Controller
{
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'monsieurMadame' => 'required|string|min:3',
                'matricule' => 'required|string|min:1',
                'destination' => 'required|string|min:3',
                'purpose' => 'required|string|min:5',
                'startDate' => 'required|date',
                'endDate' => 'required|date',
                'conducteur' => 'nullable|string',
                'conducteurMatricule' => 'nullable|string',
                'startTime' => 'nullable|date_format:H:i',
                'endTime' => 'nullable|date_format:H:i',
                'additionalInfo' => 'nullable|string',
            ]);

            // دائماً نحفظ ملف PDF في storage/app/public/requests/اسم_الملف.pdf
            $filePath = null;
            $pdfBlob = null;
            if ($request->hasFile('pdf')) {
                $file = $request->file('pdf');
                $fileName = 'mission_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('public/requests', $fileName); // حفظ في المسار الموحد
                $filePath = 'requests/' . $fileName;
                $pdfBlob = file_get_contents($file->getRealPath());
            }
            if ($request->filled('pdf_base64')) {
                $pdfData = base64_decode($request->input('pdf_base64'));
                $fileName = 'mission_' . uniqid() . '.pdf';
                \Storage::disk('public')->put('requests/' . $fileName, $pdfData); // حفظ في المسار الموحد
                $filePath = 'requests/' . $fileName;
                $pdfBlob = $pdfData;
            }

            $type = $request->input('type');
            if (!$type || !in_array($type, ['missionOrder'])) {
                $type = 'missionOrder';
            }

            $missionOrder = MissionOrder::create([
                'user_id' => Auth::id(),
                'monsieur_madame' => $validatedData['monsieurMadame'],
                'matricule' => $validatedData['matricule'],
                'destination' => $validatedData['destination'],
                'purpose' => $validatedData['purpose'],
                'start_date' => Carbon::parse($validatedData['startDate'])->format('Y-m-d'),
                'end_date' => Carbon::parse($validatedData['endDate'])->format('Y-m-d'),
                'conducteur' => $validatedData['conducteur'] ?? null,
                'conducteur_matricule' => $validatedData['conducteurMatricule'] ?? null,
                'start_time' => $validatedData['startTime'] ?? null,
                'end_time' => $validatedData['endTime'] ?? null,
                'additional_info' => $validatedData['additionalInfo'] ?? null,
                'type' => $type,
                'full_name' => $validatedData['monsieurMadame'],
                'file_path' => null, // سيتم تحديثه بعد الحفظ
                'pdf_blob' => null,
                'status' => $request->input('status', 'pending'),
            ]);

            // حذف أي ملف قديم
            if ($missionOrder->file_path && \Storage::disk('public')->exists($missionOrder->file_path)) {
                \Storage::disk('public')->delete($missionOrder->file_path);
            }

            // حفظ الملف باسم جديد داخل مجلد requests فقط (بدون mission فرعي)
            $fileName = 'mission_' . $missionOrder->id . '.pdf';
            $dir = 'requests';
            if ($request->hasFile('pdf')) {
                $file = $request->file('pdf');
                $file->storeAs('public/' . $dir, $fileName);
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
            $missionOrder->file_path = $filePath;
            $missionOrder->pdf_blob = $pdfBlob;
            $missionOrder->save();

            // إضافة معلومات الملف للاستجابة
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

            // إشعار أدمين
            AdminNotification::create([
                'title' => 'طلب أمر مهمة جديد',
                'title_fr' => 'Nouvelle demande d\'ordre de mission',
                'body' => 'العميل: ' . $validatedData['monsieurMadame'] . ' - أرسل أمر مهمة جديد',
                'body_fr' => 'Client: ' . $validatedData['monsieurMadame'] . ' a soumis une demande d\'ordre de mission',
                'type' => 'missionOrder',
                'is_read' => false,
                'data' => json_encode([
                    'mission_order_id' => $missionOrder->id,
                    'user_id' => \Auth::id(),
                ]),
            ]);

            // إشعار للمستخدم
            \App\Models\UserNotification::create([
                'user_id' => Auth::id(),
                'title_ar' => 'تم حفظ أمر المهمة بنجاح',
                'title_fr' => 'Ordre de mission sauvegardé avec succès',
                'body_ar' => 'تم إرسال طلبك إلى الإدارة. الحالة: في انتظار المراجعة.',
                'body_fr' => "Votre demande a été envoyée à l'administration. Statut: en attente de validation.",
                'type' => 'missionOrder',
                'is_read' => false,
                'data' => json_encode(['mission_order_id' => $missionOrder->id]),
            ]);

            // إرسال إشعار لحظي عبر WebSocket
            event(new \App\Events\NewNotification([
                'id' => $missionOrder->id,
                'title' => 'تم حفظ أمر المهمة بنجاح',
                'title_fr' => 'Ordre de mission sauvegardé avec succès',
                'type' => 'missionOrder',
                'user_id' => Auth::id(),
            ]));

            Log::info('Mission order stored successfully', ['id' => $missionOrder->id]);

            return response()->json([
                'message' => 'Mission order submitted successfully!',
                'data' => $missionOrder->makeHidden('pdf_blob')->setAttribute('pdf_url', url('storage/requests/' . basename($missionOrder->file_path))),
                'file_info' => $fileInfo,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error storing mission order', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'An error occurred while submitting the request.'], 500);
        }
    }

    public function countAll()
    {
        $count = \App\Models\MissionOrder::count();
        return response()->json(['count' => $count]);
    }

    public function userCount()
    {
        $count = MissionOrder::where('user_id', Auth::id())->count();
        return response()->json(['count' => $count]);
    }

    public function userOrders()
    {
        $orders = MissionOrder::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get([
                'id', 'user_id', 'monsieur_madame', 'matricule', 'destination', 'purpose', 'start_date', 'end_date',
                'conducteur', 'conducteur_matricule', 'start_time', 'end_time', 'additional_info', 'type', 'full_name',
                'file_path', 'status', 'created_at', 'updated_at'
            ]);
        return response()->json($orders);
    }

    public function downloadPDF($id)
    {
        try {
            $missionOrder = MissionOrder::where('id', $id)
                ->where('user_id', Auth::id())
                ->first();

            if (!$missionOrder) {
                return response()->json(['message' => 'Mission order not found'], 404);
            }

            if (!$missionOrder->file_path) {
                return response()->json(['message' => 'PDF file not found'], 404);
            }

            $filePath = storage_path('app/public/' . $missionOrder->file_path);
            
            if (!file_exists($filePath)) {
                return response()->json(['message' => 'PDF file not found on server'], 404);
            }

            return response()->download($filePath, 'ordre_mission_' . $missionOrder->destination . '.pdf', [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="ordre_mission_' . $missionOrder->destination . '.pdf"'
            ]);

        } catch (\Exception $e) {
            Log::error('Error downloading PDF', [
                'error' => $e->getMessage(),
                'mission_order_id' => $id
            ]);
            return response()->json(['message' => 'An error occurred while downloading the PDF'], 500);
        }
    }

    public function downloadPDFfromDB($id)
    {
        $missionOrder = MissionOrder::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$missionOrder || !$missionOrder->pdf_blob) {
            return response()->json(['message' => 'PDF not found in database'], 404);
        }

        return response($missionOrder->pdf_blob, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="ordre_mission_' . $missionOrder->destination . '.pdf"');
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
}
