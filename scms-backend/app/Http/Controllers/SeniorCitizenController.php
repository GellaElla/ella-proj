<?php

namespace App\Http\Controllers;

use App\Models\SeniorCitizen;
use Illuminate\Http\Request;

class SeniorCitizenController extends Controller
{
    public function index()
    {
        return response()->json(
            SeniorCitizen::orderBy('created_at', 'desc')->get()
        );
    }

    public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'age' => 'required|integer|min:60',
        'birth_date' => 'nullable|date',
        'gender' => 'required|string',
        'purok' => 'required|string',
        'contact' => 'nullable|string',

        'blood_type' => 'nullable|string',
        'condition' => 'nullable|string',
        'maintenance' => 'nullable|string',
        'last_checkup' => 'nullable|date',

        'civil_status' => 'nullable|string',
        'emergency_contact' => 'nullable|string',
        'relationship' => 'nullable|string',
        'osca_id' => 'nullable|in:Active,Inactive',
    ]);

    $nextNumber = (SeniorCitizen::max('id') ?? 0) + 1;

    $validated['senior_id'] =
        'SC-' . now()->year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

    $validated['status'] = 'Active';
    $validated['osca_id'] = $validated['osca_id'] ?? 'Active';

    $seniorCitizen = SeniorCitizen::create($validated);

    return response()->json($seniorCitizen, 201);
}

    public function show(SeniorCitizen $seniorCitizen)
    {
        return response()->json($seniorCitizen);
    }

    public function update(Request $request, SeniorCitizen $seniorCitizen)
    {
        $validated = $request->validate([
            'senior_id' => 'sometimes|string|unique:senior_citizens,senior_id,' . $seniorCitizen->id,
            'name' => 'sometimes|string|max:255',
            'age' => 'sometimes|integer|min:60',
            'birth_date' => 'nullable|date',
            'gender' => 'sometimes|string',
            'purok' => 'sometimes|string',
            'contact' => 'nullable|string',
            
'status' => 'sometimes|required|in:Active,Needs follow-up,Needs attention,Archived,Inactive,Deceased',

            'blood_type' => 'nullable|string',
            'condition' => 'nullable|string',
            'maintenance' => 'nullable|string',
          

            'civil_status' => 'nullable|string',
            'emergency_contact' => 'nullable|string',
            'relationship' => 'nullable|string',
            'osca_id' => 'nullable|string',
        ]);

        $seniorCitizen->update($validated);

        return response()->json($seniorCitizen);
    }

    public function destroy(SeniorCitizen $seniorCitizen)
    {
        $seniorCitizen->delete();

        return response()->json([
            'message' => 'Senior citizen deleted successfully.'
        ]);
    }
}