<?php

namespace App\Http\Controllers;

use App\Models\WorkCertificate;
use Illuminate\Http\Request;

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
        ]);

        $certificate = WorkCertificate::create([
            'full_name' => $validated['fullName'],
            'matricule' => $validated['matricule'],
            'grade' => $validated['grade'] ?? null,
            'hire_date' => $validated['hireDate'] ?? null,
            'function' => $validated['function'] ?? null,
            'purpose' => $validated['purpose'],
            'additional_info' => $validated['additionalInfo'] ?? null,
        ]);

        return response()->json(['message' => 'تم الحفظ بنجاح', 'data' => $certificate], 201);
    }

    public function countAll()
    {
        $count = \App\Models\WorkCertificate::count();
        return response()->json(['count' => $count]);
    }
} 