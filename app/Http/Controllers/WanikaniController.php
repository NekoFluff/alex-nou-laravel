<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class WanikaniController extends Controller
{
    /**
     * The dashboard is entirely client-side: the visitor supplies their own WaniKani API
     * token, which stays in their browser and is used for direct calls to
     * api.wanikani.com.
     *
     * It used to receive level progressions for a shared server-side account, which meant
     * one person's progress was rendered for every visitor. That data is gone, so the page
     * now takes no props and the server holds no WaniKani token on its behalf.
     */
    public function show(): Response
    {
        return Inertia::render('Wanikani');
    }
}
