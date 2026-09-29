<?php

namespace App\Http\Controllers;

use App\Models\MedicalRequest;
use Illuminate\Http\Request;

class MedicalRequestController extends Controller
{
    public function index()
    {
        return response()->json(
            MedicalRequest::latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reference' => 'nullable|string|max:255|unique:medical_requests,reference',
            'senior_name' => 'required|string|max:255',
            'senior_id' => 'required|string|max:255',
            'purok' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
            'assistance_type' => 'required|string|max:255',
            'request_date' => 'required|date',
            'facility' => 'nullable|string|max:255',
            'status' => 'required|in:Pending,Approved,Completed,On Hold',
            'completed_date' => 'nullable|date',
            'received_by' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        if (empty($validated['reference'])) {
            $nextNumber = (MedicalRequest::max('id') ?? 0) + 1;

            $validated['reference'] =
                'MED-' . now()->year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        }

        $medicalRequest = MedicalRequest::create($validated);

        return response()->json($medicalRequest, 201);
    }

    public function show(MedicalRequest $medicalRequest)
    {
        return response()->json($medicalRequest);
    }

    public function update(Request $request, MedicalRequest $medicalRequest)
    {
        $validated = $request->validate([
            'reference' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                'unique:medical_requests,reference,' . $medicalRequest->id,
            ],
            'senior_name' => 'sometimes|required|string|max:255',
            'senior_id' => 'sometimes|required|string|max:255',
            'purok' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
            'assistance_type' => 'sometimes|required|string|max:255',
            'request_date' => 'sometimes|required|date',
            'facility' => 'nullable|string|max:255',
            'status' => 'sometimes|required|in:Pending,Approved,Completed,On Hold',
            'completed_date' => 'nullable|date',
            'received_by' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        $medicalRequest->update($validated);

        return response()->json($medicalRequest->fresh());
    }

    public function destroy(MedicalRequest $medicalRequest)
    {
        $medicalRequest->delete();

        return response()->json([
            'message' => 'Medical request deleted successfully.',
        ]);
    }
}