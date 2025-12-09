"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { GoPlanLoginForm } from "@/app/(main)/auth/_components/goplan-login-form";

// Force brutalist theme for login page
function useBrutalistTheme() {
  useEffect(() => {
    const html = document.documentElement;
    const prevTheme = html.getAttribute("data-theme-preset");
    html.setAttribute("data-theme-preset", "brutalist");
    return () => {
      if (prevTheme) html.setAttribute("data-theme-preset", prevTheme);
      else html.removeAttribute("data-theme-preset");
    };
  }, []);
}

export default function LoginPage() {
  useBrutalistTheme();

  return (
    <div className="flex min-h-dvh">
      {/* Left side - Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col bg-white">
        {/* Back to home link */}
        <div className="p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-orange-600 transition-colors border-2 border-black px-3 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        {/* Login form container */}
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Logo and Title */}
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/logo.png"
                  alt="GoPlan logo"
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                  priority
                />
                <span className="text-3xl font-light">
                  Go<span className="font-black">Plan</span>
                </span>
              </div>
              <p className="text-gray-600">
                Al Akhawayn University Degree Planner
              </p>
            </div>

            {/* Heading */}
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-black tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-gray-600">
                Enter your credentials to access your dashboard
              </p>
            </div>

            {/* Login Form with brutalist styling wrapper */}
            <div className="border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white">
              <GoPlanLoginForm />
            </div>

            {/* Additional info */}
            <p className="text-center text-sm text-gray-500">
              Need help?{" "}
              <a href="#" className="font-semibold text-black hover:text-orange-600 underline">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image background */}
      <div
        className="hidden lg:block lg:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: "url('/image1.jpg')" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Content on image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6 max-w-lg">
            <div className="bg-white/10 backdrop-blur-sm border-4 border-white p-8">
              <h1 className="text-5xl font-black text-white leading-tight mb-4">
                Plan your
                <br />
                <span className="text-yellow-400">academic future</span>
              </h1>
              <p className="text-white/90 text-lg">
                Build a semester-by-semester plan, track requirements, and get
                advisor approval for your courses.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-3">
              <span className="bg-orange-500 text-white px-4 py-2 text-sm font-bold border-2 border-white">
                ✓ Drag & Drop
              </span>
              <span className="bg-blue-500 text-white px-4 py-2 text-sm font-bold border-2 border-white">
                ✓ AI Advisor
              </span>
              <span className="bg-green-500 text-white px-4 py-2 text-sm font-bold border-2 border-white">
                ✓ Track Progress
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
