<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function index()
    {
        return response()->json(
            Application::orderBy('submitted_at', 'desc')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'submitted_at' => 'nullable|date',
            'status' => 'nullable|string',
            'priority' => 'nullable|string',
            'contact' => 'nullable|string',
            'purok' => 'nullable|string',
            'age' => 'nullable|integer|min:60',
            'birth_date' => 'nullable|date',

            'valid_id_uploaded' => 'nullable|boolean',
            'birth_certificate_uploaded' => 'nullable|boolean',
            'proof_residence_uploaded' => 'nullable|boolean',
            'photo_uploaded' => 'nullable|boolean',

            'notes' => 'nullable|string',
            'history' => 'nullable|array',
        ]);

        $nextNumber = (Application::max('id') ?? 0) + 1;

        $validated['application_id'] =
            'APP-' . now()->year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        $validated['submitted_at'] =
            $validated['submitted_at'] ?? now();

        $validated['status'] =
            $validated['status'] ?? 'Pending';

        $validated['priority'] =
            $validated['priority'] ?? 'Low';

        $application = Application::create($validated);

        return response()->json($application, 201);
    }

    public function show(Application $application)
    {
        return response()->json($application);
    }

    public function update(Request $request, Application $application)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'submitted_at' => 'sometimes|date',
            'status' => 'sometimes|string',
            'priority' => 'sometimes|string',
            'contact' => 'nullable|string',
            'purok' => 'nullable|string',
            'age' => 'nullable|integer|min:60',
            'birth_date' => 'nullable|date',

            'valid_id_uploaded' => 'nullable|boolean',
            'birth_certificate_uploaded' => 'nullable|boolean',
            'proof_residence_uploaded' => 'nullable|boolean',
            'photo_uploaded' => 'nullable|boolean',

            'notes' => 'nullable|string',
            'history' => 'nullable|array',
        ]);

        $application->update($validated);

        return response()->json($application);
    }

    public function destroy(Application $application)
    {
        $application->delete();

        return response()->json([
            'message' => 'Application deleted successfully.'
        ]);
    }
}