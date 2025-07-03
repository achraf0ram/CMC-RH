<?php

namespace App\Http\Controllers;

use App\Models\WorkCertificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\VacationRequest;

class WorkCertificateController extends Controller
{
    public function store(Request $request)
    {
        \Log::info('WorkCertificateController@store called');
        \Log::info('All request data:', $request->all());
        \Log::info('All files in request:', $request->allFiles());

        $validated = $request->validate([
            'fullName' => 'required|string|min:3',
            'matricule' => 'required|string',
            'grade' => 'nullable|string',
            'hireDate' => 'nullable|date',
            'function' => 'nullable|string',
            'purpose' => 'required|string|min:5',
            'additionalInfo' => 'nullable|string',
            'pdf' => 'required',
        ]);

        $filePath = null;
        if ($request->hasFile('pdf')) {
            \Log::info('PDF file received as file upload.');
            $file = $request->file('pdf');
            $fileName = 'requests/' . uniqid('workcert_') . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/requests', basename($fileName));
            $filePath = 'requests/' . basename($fileName);
            \Log::info('PDF file saved at: ' . $filePath);
        } elseif ($request->pdf && is_string($request->pdf)) {
            \Log::info('PDF file received as raw string.');
            $pdfData = $request->pdf;
            if (base64_decode($pdfData, true) !== false) {
                $pdfData = base64_decode($pdfData);
            }
            $fileName = 'requests/' . uniqid('workcert_') . '.pdf';
            \Storage::disk('public')->put($fileName, $pdfData);
            $filePath = $fileName;
            \Log::info('PDF file saved from raw input at: ' . $filePath);
        } else {
            \Log::error('No PDF file received in request.');
            return response()->json(['error' => 'PDF file is required.'], 422);
        }

        $type = $request->input('type');
        if (!$type || !in_array($type, ['workCertificate'])) {
            $type = 'workCertificate';
        }

        $certificate = WorkCertificate::create([
            'user_id' => Auth::id(),
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
        \Log::info('WorkCertificate created with file_path: ' . $filePath);

        return response()->json($certificate, 201);
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

    public function userCertificates()
    {
        $certificates = WorkCertificate::where('user_id', Auth::id())->orderBy('created_at', 'desc')->get();
        return response()->json($certificates);
    }
} 