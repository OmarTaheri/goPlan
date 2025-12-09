"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MousePointerClick,
  Bot,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Play,
  Sparkles,
  AlertTriangle,
  GripVertical,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Force brutalist theme for this page
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

// Floating course card component matching planner design
function FloatingCourseCard({
  code,
  title,
  credits,
  className,
  style,
  warning,
}: {
  code: string;
  title: string;
  credits: number;
  className?: string;
  style?: React.CSSProperties;
  warning?: boolean;
}) {
  return (
    <div
      className={`group flex items-center gap-3 p-3 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${className}`}
      style={style}
    >
      <GripVertical className="h-4 w-4 text-gray-400" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm font-bold">{code}</div>
        <div className="text-xs text-gray-600 truncate">{title}</div>
      </div>
      <Badge className="bg-black text-white border-0 font-mono">
        {credits} cr
      </Badge>
      {warning && (
        <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
      )}
    </div>
  );
}

// FAQ Item component
function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-2 border-black">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-yellow-50 transition-colors text-left font-semibold"
      >
        {question}
        {open ? (
          <ChevronUp className="h-5 w-5 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="p-4 bg-gray-50 border-t-2 border-black text-gray-700">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  useBrutalistTheme();

  return (
    <div className="min-h-dvh bg-white text-black">
      {/* ========== 1. TOP NAVBAR ========== */}
      <nav className="sticky top-0 z-50 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5">
              <Image
                src="/logo.png"
                alt="GoPlan logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
              />
              <span className="text-2xl font-light">
                Go<span className="font-black">Plan</span>
              </span>
            </Link>

            {/* Nav Links - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="font-medium hover:text-orange-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="font-medium hover:text-orange-600 transition-colors"
              >
                How it works
              </a>
              <a
                href="#demo"
                className="font-medium hover:text-orange-600 transition-colors"
              >
                Programs
              </a>
              <Link
                href="/login"
                className="font-medium hover:text-orange-600 transition-colors"
              >
                Sign in
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                className="hidden sm:flex border-2 border-black hover:bg-yellow-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <Link href="/login">Try demo</Link>
              </Button>
              <Button
                asChild
                className="bg-orange-500 hover:bg-orange-600 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold"
              >
                <Link href="/login">Start planning</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== 2. HERO SECTION ========== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
                Plan your degree.
                <br />
                <span className="text-orange-500">Avoid surprises.</span>
                <br />
                Graduate on time.
              </h1>

              <p className="text-lg sm:text-xl text-gray-700 max-w-lg">
                Build a semester-by-semester plan, track requirements, and ask
                the AI advisor anything—
                <span className="font-semibold">before you register.</span>
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-lg px-8"
                >
                  <Link href="/login">
                    <Check className="h-5 w-5 mr-2" />
                    Start planning free
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-4 border-black bg-white hover:bg-yellow-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-lg px-8"
                >
                  <Link href="/login">
                    <Play className="h-5 w-5 mr-2" />
                    Try demo plan
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: Visual Mockup */}
            <div className="relative">
              {/* Semester Grid Mock */}
              <div className="relative bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Your Plan</h3>
                  <Badge className="bg-green-500 text-white border-2 border-black">
                    On Track
                  </Badge>
                </div>

                {/* Mini semester columns */}
                <div className="flex gap-3 overflow-hidden">
                  <div className="flex-1 min-w-[140px] border-2 border-black p-3 bg-green-50">
                    <div className="text-xs font-bold mb-2 text-green-700">
                      Fall 2024 ✓
                    </div>
                    <FloatingCourseCard
                      code="CSC 101"
                      title="Intro to CS"
                      credits={3}
                      className="text-xs mb-2"
                    />
                    <FloatingCourseCard
                      code="MTH 201"
                      title="Calculus I"
                      credits={4}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex-1 min-w-[140px] border-2 border-black p-3 bg-blue-50 border-dashed">
                    <div className="text-xs font-bold mb-2 text-blue-700">
                      Spring 2025
                    </div>
                    <FloatingCourseCard
                      code="CSC 201"
                      title="Data Structures"
                      credits={3}
                      className="text-xs mb-2"
                    />
                    <FloatingCourseCard
                      code="PHY 101"
                      title="Physics I"
                      credits={4}
                      className="text-xs"
                      warning
                    />
                  </div>
                </div>
              </div>

              {/* AI Chat Bubble */}
              <div className="absolute -bottom-6 -right-4 lg:-right-8 bg-blue-500 text-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-[280px]">
                <div className="flex items-start gap-2">
                  <Bot className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-bold">AI Advisor:</span> "PHY 101
                    needs MTH 201 first. You're good — it's completed!"
                  </div>
                </div>
              </div>

              {/* Decorative floating elements */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 border-2 border-black rotate-12"></div>
              <div className="absolute top-1/2 -left-8 w-6 h-6 bg-orange-400 border-2 border-black -rotate-6"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 3. HOW IT WORKS ========== */}
      <section id="how-it-works" className="bg-yellow-300 border-y-4 border-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <Card className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-500 border-4 border-black mx-auto mb-4 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="GoPlan logo"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div className="text-4xl font-black mb-2">1</div>
                <h3 className="text-xl font-bold mb-2">Pick your program</h3>
                <p className="text-gray-600">
                  Major, minor, catalog year. We load all your requirements
                  automatically.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-500 border-4 border-black mx-auto mb-4 flex items-center justify-center">
                  <MousePointerClick className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-black mb-2">2</div>
                <h3 className="text-xl font-bold mb-2">Drag & drop your plan</h3>
                <p className="text-gray-600">
                  Move courses between semesters instantly. See credit loads and
                  conflicts live.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-500 border-4 border-black mx-auto mb-4 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-black mb-2">3</div>
                <h3 className="text-xl font-bold mb-2">Ask AI for guidance</h3>
                <p className="text-gray-600">
                  "What should I take next?" "Am I on track?" Get instant,
                  personalized answers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ========== 4. MAIN FEATURE BLOCKS ========== */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Feature 1: Smart Plan Builder */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-green-400 border-2 border-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Check className="h-5 w-5" />
                <span className="font-bold">Smart Plan Builder</span>
              </div>
              <h3 className="text-3xl font-black">
                Your entire degree, organized
              </h3>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Drag & drop</strong> courses between semesters
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Credit-load warnings</strong> — "18 credits is
                    heavy!"
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Prerequisite alerts</strong> — never miss a required
                    course
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex gap-4">
                <div className="flex-1 border-2 border-black bg-white p-4">
                  <div className="text-sm font-bold mb-3 bg-green-100 -m-4 mb-3 p-2 border-b-2 border-black">
                    Fall 2025
                  </div>
                  <FloatingCourseCard
                    code="CSC 301"
                    title="Algorithms"
                    credits={3}
                    className="mb-2"
                  />
                  <FloatingCourseCard
                    code="CSC 350"
                    title="Database Systems"
                    credits={3}
                  />
                </div>
                <div className="flex-1 border-2 border-dashed border-black bg-orange-50 p-4 relative">
                  <div className="text-sm font-bold mb-3 bg-orange-100 -m-4 mb-3 p-2 border-b-2 border-dashed border-black">
                    Spring 2026
                  </div>
                  <FloatingCourseCard
                    code="CSC 401"
                    title="Software Eng"
                    credits={3}
                    className="mb-2 opacity-70"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-orange-500 text-white text-xs p-2 border-2 border-black font-bold">
                    ⚠️ 18 credits — Heavy load!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: AI Course Advisor */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-blue-500 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-white border-2 border-black p-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  You
                </div>
                <p className="font-medium">
                  "What's the best schedule for next semester?"
                </p>
              </div>
              <div className="bg-yellow-300 border-2 border-black p-4">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Bot className="h-4 w-4" />
                  <span className="font-bold">AI Advisor</span>
                </div>
                <p className="text-sm">
                  Based on your progress, I recommend: CSC 301 (Algorithms),
                  MTH 301 (Linear Algebra), and one GenEd elective. This keeps
                  you at 12 credits — a balanced load! 🎯
                </p>
                <Button className="mt-3 bg-black text-white border-2 border-black hover:bg-gray-800 text-sm">
                  Apply to plan
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-400 border-2 border-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Bot className="h-5 w-5" />
                <span className="font-bold">AI Course Advisor</span>
              </div>
              <h3 className="text-3xl font-black">
                Ask anything, get smart answers
              </h3>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    "Best schedule for next semester?"
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Prerequisites explained in simple language
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Suggest alternatives if a course is unavailable
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Progress Tracker */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-purple-400 border-2 border-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <BarChart3 className="h-5 w-5" />
                <span className="font-bold">Progress Tracker</span>
              </div>
              <h3 className="text-3xl font-black">
                Know exactly where you stand
              </h3>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Requirements completed vs. remaining
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>"On-track to graduate"</strong> indicator
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Clear checklist by category (GenEd / Core / Electives)
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold">Your Progress</span>
                  <Badge className="bg-green-500 text-white border-2 border-black font-bold">
                    On Track!
                  </Badge>
                </div>
                {/* Progress bars */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Core Requirements</span>
                    <span>24/30 cr</span>
                  </div>
                  <div className="h-4 bg-white border-2 border-black">
                    <div className="h-full bg-green-500" style={{ width: "80%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">General Education</span>
                    <span>18/24 cr</span>
                  </div>
                  <div className="h-4 bg-white border-2 border-black">
                    <div className="h-full bg-blue-500" style={{ width: "75%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Electives</span>
                    <span>9/15 cr</span>
                  </div>
                  <div className="h-4 bg-white border-2 border-black">
                    <div className="h-full bg-purple-500" style={{ width: "60%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 5. STUDENT PROOF / CREDIBILITY ========== */}
      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
            Built for students
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Everything you need to plan your academic journey with confidence.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Check, text: "Semester-by-semester planning" },
              { icon: BarChart3, text: "Requirement tracking" },
              { icon: Bot, text: "AI guidance" },
              { icon: ArrowRight, text: "Export/share plan with advisor" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-gray-900 border-2 border-white p-4"
              >
                <div className="w-10 h-10 bg-green-500 border-2 border-white flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 6. SEE IT IN ACTION - DEMO SECTION ========== */}
      <section id="demo" className="py-20 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
            See it in action
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Watch how easy it is to plan your perfect semester
          </p>

          {/* Interactive Demo Preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              {/* Demo Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-black">
                <h3 className="font-bold text-lg">Course Planner Demo</h3>
                <Badge className="bg-yellow-400 text-black border-2 border-black font-bold">
                  Interactive
                </Badge>
              </div>

              {/* Demo Content */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Semester Column */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Fall Semester */}
                    <div className="border-2 border-black p-4 bg-green-50">
                      <div className="text-sm font-bold mb-3 flex items-center justify-between">
                        <span>Fall 2025</span>
                        <Badge variant="outline" className="text-xs border-black">
                          12 cr
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <FloatingCourseCard
                          code="CSC 301"
                          title="Algorithms"
                          credits={3}
                        />
                        <FloatingCourseCard
                          code="MTH 301"
                          title="Linear Algebra"
                          credits={3}
                        />
                        <FloatingCourseCard
                          code="ENG 201"
                          title="Technical Writing"
                          credits={3}
                        />
                      </div>
                    </div>

                    {/* Spring Semester */}
                    <div className="border-2 border-dashed border-black p-4 bg-blue-50 relative">
                      <div className="text-sm font-bold mb-3 flex items-center justify-between">
                        <span>Spring 2026</span>
                        <Badge variant="outline" className="text-xs border-black">
                          9 cr
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <FloatingCourseCard
                          code="CSC 350"
                          title="Database Systems"
                          credits={3}
                        />
                        <FloatingCourseCard
                          code="CSC 401"
                          title="Software Engineering"
                          credits={3}
                          warning
                        />
                        {/* Drop zone indicator */}
                        <div className="border-2 border-dashed border-orange-400 p-4 bg-orange-50 text-center text-sm text-orange-600">
                          Drag courses here
                        </div>
                      </div>

                      {/* Warning tooltip */}
                      <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs px-2 py-1 border-2 border-black font-bold animate-bounce">
                        ⚠️ Prereq missing!
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Chat Panel */}
                <div className="bg-blue-500 border-2 border-black p-4 text-white">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-400">
                    <Bot className="h-5 w-5" />
                    <span className="font-bold">AI Advisor</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="bg-blue-600 p-2 border border-blue-400">
                      <span className="opacity-70">You asked:</span>
                      <p className="mt-1">"What should I take first?"</p>
                    </div>
                    <div className="bg-white text-black p-3 border-2 border-black">
                      <p>
                        Take <strong>CSC 301</strong> first — it's a prereq for
                        CSC 401! I've planned it in Fall for you.
                      </p>
                      <Button size="sm" className="mt-2 bg-green-500 text-white border border-black w-full">
                        ✓ Apply suggestion
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating decorative course cards */}
            <div className="absolute -top-6 -left-6 rotate-6 opacity-80 hidden lg:block">
              <FloatingCourseCard code="PHY 101" title="Physics I" credits={4} />
            </div>
            <div className="absolute -bottom-6 -right-6 -rotate-3 opacity-80 hidden lg:block">
              <FloatingCourseCard code="ART 110" title="Art History" credits={3} />
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              asChild
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-lg px-12"
            >
              <Link href="/login">
                Try it yourself
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========== 7. FAQ SECTION ========== */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <FAQItem
              question="Does it work with my major/minor?"
              answer="Yes! GoPlan supports all majors and minors at your institution. When you sign in, we automatically load your program requirements based on your catalog year."
            />
            <FAQItem
              question="Is this official?"
              answer="GoPlan is a planning tool to help you visualize your academic path. Your official degree audit is still managed by your registrar. We recommend verifying your plan with your advisor."
            />
            <FAQItem
              question="Can I export my plan?"
              answer="Absolutely! You can export your plan as a PDF or share it directly with your academic advisor for review and approval."
            />
            <FAQItem
              question="Can the AI register courses for me?"
              answer="No — the AI is an advisor, not a registration system. It helps you plan and answers questions, but you'll still register through your university's official system."
            />
            <FAQItem
              question="Is it free?"
              answer="Yes! GoPlan is completely free for students. We believe every student deserves access to smart planning tools."
            />
          </div>
        </div>
      </section>

      {/* ========== 8. FINAL CTA + FOOTER ========== */}
      <section className="bg-yellow-300 border-t-4 border-black py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Ready to plan your next semester in 2 minutes?
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Join thousands of students who plan smarter, not harder.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-xl px-12 py-6 h-auto"
          >
            <Link href="/login">
              <Check className="h-6 w-6 mr-2" />
              Start planning
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t-4 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <Image
                src="/logo.png"
                alt="GoPlan logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
              <span className="text-xl font-light">
                Go<span className="font-bold">Plan</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-yellow-400 transition-colors">
                Contact
              </a>
              <a href="#" className="hover:text-yellow-400 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-yellow-400 transition-colors">
                Terms
              </a>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 GoPlan. Built for students.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
