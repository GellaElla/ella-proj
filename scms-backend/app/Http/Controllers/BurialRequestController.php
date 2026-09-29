<?php

namespace App\Http\Controllers;

use App\Models\BurialRequest;
use Illuminate\Http\Request;

class BurialRequestController extends Controller
{
    public function index()
    {
        return response()->json(
            BurialRequest::latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reference' => 'nullable|string|max:255|unique:burial_requests,reference',
            'senior_name' => 'required|string|max:255',
            'claimant_name' => 'required|string|max:255',
            'senior_id' => 'nullable|string|max:255',
            'death_date' => 'nullable|date',
            'purok' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
            'funeral_home' => 'nullable|string|max:255',
            'request_date' => 'required|date',
            'status' => 'required|in:Pending,Approved,Released,On Hold',
            'relationship' => 'nullable|string|max:255',
            'release_date' => 'nullable|date',
            'received_by' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        if (empty($validated['reference'])) {
            $nextNumber = (BurialRequest::max('id') ?? 0) + 1;

            $validated['reference'] =
                'BUR-' . now()->year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        }

        $burialRequest = BurialRequest::create($validated);

        return response()->json($burialRequest, 201);
    }

    public function show(BurialRequest $burialRequest)
    {
        return response()->json($burialRequest);
    }

    public function update(Request $request, BurialRequest $burialRequest)
    {
        $validated = $request->validate([
            'reference' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                'unique:burial_requests,reference,' . $burialRequest->id,
            ],
            'senior_name' => 'sometimes|required|string|max:255',
            'claimant_name' => 'sometimes|required|string|max:255',
            'senior_id' => 'nullable|string|max:255',
            'death_date' => 'nullable|date',
            'purok' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:255',
            'funeral_home' => 'nullable|string|max:255',
            'request_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:Pending,Approved,Released,On Hold',
            'relationship' => 'nullable|string|max:255',
            'release_date' => 'nullable|date',
            'received_by' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        $burialRequest->update($validated);

        return response()->json($burialRequest->fresh());
    }

    public function destroy(BurialRequest $burialRequest)
    {
        $burialRequest->delete();

        return response()->json([
            'message' => 'Burial request deleted successfully.',
        ]);
    }
}