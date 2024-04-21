<?php

namespace App\Http\Controllers;

use App\Http\Clients\Wanikani\WanikaniClient;
use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class WanikaniController extends Controller
{
    public function __construct(private WanikaniClient $client)
    {
    }

    public function show(Request $request): Response
    {
        $levelProgressions =  array_slice($this->client->getLevelProgression(), 12);
        return Inertia::render('Wanikani', [
            'levelProgressions' => $levelProgressions, // skip first 12 values since I reset my account
            'currentLevel' => end($levelProgressions)->level,
        ]);
    }
}
