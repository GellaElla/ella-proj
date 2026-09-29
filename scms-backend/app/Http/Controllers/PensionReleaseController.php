<?php

namespace App\Http\Controllers;

use App\Models\PensionRelease;
use Illuminate\Http\Request;

class PensionReleaseController extends Controller
{
    public function index()
    {
        return response()->json(
            PensionRelease::latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'senior_id' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'period' => 'required|string|max:255',
            'release_date' => 'nullable|date',
            'received_by' => 'required|string|max:255',
            'status' => 'required|in:Released,Pending,On Hold',
            'reference' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        $release = PensionRelease::create($validated);

        return response()->json($release, 201);
    }
}