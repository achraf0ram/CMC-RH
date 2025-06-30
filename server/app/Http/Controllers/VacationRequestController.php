<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VacationRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;

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

            $vacationRequest = VacationRequest::create([
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
            ]);

            Log::info('Vacation request stored successfully', ['id' => $vacationRequest->id]);

            return response()->json([
                'message' => 'Vacation request submitted successfully!',
                'data' => $vacationRequest,
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
}
