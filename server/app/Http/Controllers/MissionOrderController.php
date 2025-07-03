<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MissionOrder;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

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

            $filePath = null;
            if ($request->hasFile('pdf')) {
                $file = $request->file('pdf');
                $fileName = 'requests/' . uniqid('mission_') . '.' . $file->getClientOriginalExtension();
                $file->storeAs('public/requests', basename($fileName));
                $filePath = 'requests/' . basename($fileName);
            } elseif ($request->filled('pdf_base64')) {
                $pdfData = base64_decode($request->input('pdf_base64'));
                $fileName = 'requests/' . uniqid('mission_') . '.pdf';
                \Storage::disk('public')->put($fileName, $pdfData);
                $filePath = $fileName;
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
                'file_path' => $filePath,
                'status' => $request->input('status', 'pending'),
            ]);

            Log::info('Mission order stored successfully', ['id' => $missionOrder->id]);

            return response()->json([
                'message' => 'Mission order submitted successfully!',
                'data' => $missionOrder,
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
        $orders = MissionOrder::where('user_id', Auth::id())->orderBy('created_at', 'desc')->get();
        return response()->json($orders);
    }
}
