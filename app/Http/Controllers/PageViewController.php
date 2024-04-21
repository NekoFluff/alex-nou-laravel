<?php

namespace App\Http\Controllers;

use App\Models\PageView;
use Illuminate\Http\Request;

class PageViewController extends Controller
{
    public function store(Request $request)
    {

        $request->validate([
            'url' => 'required|url',
        ]);
        $pageView = new PageView();
        $pageView->url = $request->get('url');
        $pageView->session_id = $request->session()->getId();
        $pageView->user_agent = $request->userAgent();
        $pageView->ip_address = $request->ip();
        $pageView->save();

        $count = PageView::where('url', $request->get('url'))->count();

        return response()->json([
            'message' => 'Page view recorded',
            'count' => $count,
        ]);
    }
}
