<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index()
    {
        return response()->json(
            Announcement::orderBy('date', 'desc')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
            'pinned' => 'nullable|boolean',
            'icon_index' => 'nullable|integer|min:0',
        ]);

        $announcement = Announcement::create($validated);

        return response()->json($announcement, 201);
    }

    public function show(Announcement $announcement)
    {
        return response()->json($announcement);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'date' => 'sometimes|date',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
            'pinned' => 'nullable|boolean',
            'icon_index' => 'nullable|integer|min:0',
        ]);

        $announcement->update($validated);

        return response()->json($announcement);
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();

        return response()->json([
            'message' => 'Announcement deleted successfully.'
        ]);
    }
}