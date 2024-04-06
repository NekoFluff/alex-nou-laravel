<?php

namespace App\Http\Controllers;

use App\Models\PageView;
use Illuminate\Http\Request;

class PageViewController extends Controller
{
    public function store(Request $request)
    {

        $pageView = new PageView();
        $pageView->url = $request->getRequestUri();
        $pageView->session_id = $request->session()->getId();
        $pageView->user_agent = $request->userAgent();
        $pageView->ip_address = $request->ip();
        $pageView->save();

        $count = PageView::where('url', $request->getRequestUri())->count();

        return response()->json([
            'message' => 'Page view recorded',
            'count' => $count,
        ]);
    }
}
