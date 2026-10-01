import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const scriptUrl =
      process.env.GOOGLE_APPS_SCRIPT_URL ||
      process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;

    if (!scriptUrl) {
      console.warn("[Waitlist API] GOOGLE_APPS_SCRIPT_URL is not set.");
      return NextResponse.json(
        {
          success: false,
          error: "Google Sheets integration URL is not configured.",
        },
        { status: 500 }
      );
    }

    // Forward to Google Apps Script Web App
    const payload = {
      email: trimmedEmail,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") || "",
      referrer: request.headers.get("referer") || "",
    };

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to save email to Google Sheets." },
        { status: 502 }
      );
    }

    // Try parsing response
    const resText = await response.text();
    let resData: { result?: string; status?: string; message?: string } = {};
    try {
      resData = JSON.parse(resText);
    } catch {
      resData = { result: "success" };
    }

    if (resData.result === "error" || resData.status === "error") {
      return NextResponse.json(
        {
          success: false,
          error: resData.message || "Error saving to Google Sheets.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined waitlist!",
    });
  } catch (error: unknown) {
    console.error("[Waitlist API] Server error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}