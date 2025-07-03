<?php

namespace App\Http\Controllers;

use App\Models\SalaryDomiciliation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            'full_name' => $request->fullName,
            'matricule' => $request->matricule,
            'file_path' => $filePath,
            'type' => $type,
            'status' => $request->input('status', 'pending'),
        ]);

        return response()->json(['message' => 'Request submitted successfully!', 'data' => $domiciliation], 201);
    }
} 