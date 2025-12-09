"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, BookOpen, Calendar, History, User, Clock, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Profile {
  major: { name: string } | null;
  minor: { name: string } | null;
  advisor: { name: string; email: string } | null;
}

interface AuditResult {
  combinedProgress: {
    percentComplete: number;
    creditsDone: number;
    creditsRequired: number;
  };
}

interface TranscriptSummary {
  overall_gpa: number | null;
  completed_credits: number;
  in_progress_credits: number;
}

interface PlannedSemester {
  semester_id: number;
  semester_name: string;
  status: string;
  total_credits: number;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "DRAFT": return "secondary";
    case "SUBMITTED": return "outline";
    case "APPROVED": return "default";
    case "REJECTED": return "destructive";
    default: return "secondary";
  }
}

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSummary | null>(null);
  const [plans, setPlans] = useState<PlannedSemester[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = await meRes.json();
        if (meData.user.role !== "STUDENT") {
          router.push("/login");
          return;
        }
        setUserName(`${meData.user.first_name || ""} ${meData.user.last_name || ""}`.trim() || meData.user.username);

        const [profileRes, auditRes, transcriptRes, planRes] = await Promise.all([
          fetch("/api/student/profile"),
          fetch("/api/student/audit"),
          fetch("/api/student/transcript"),
          fetch("/api/student/plan"),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.profile);
        }

        if (auditRes.ok) {
          const data = await auditRes.json();
          setAudit(data);
        }

        if (transcriptRes.ok) {
          const data = await transcriptRes.json();
          setTranscript(data.summary);
        }

        if (planRes.ok) {
          const data = await planRes.json();
          setPlans(data.planned_semesters || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const progress = audit?.combinedProgress || { percentComplete: 0, creditsDone: 0, creditsRequired: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}</h1>
        <p className="text-muted-foreground">
          {profile?.major?.name || "No major assigned"}
          {profile?.minor?.name && ` • Minor: ${profile.minor.name}`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Degree Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progress.percentComplete}%</div>
            <Progress value={progress.percentComplete} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Credits Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{transcript?.completed_credits || 0}</div>
            <p className="text-xs text-muted-foreground">of {progress.creditsRequired} required</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Current GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{transcript?.overall_gpa?.toFixed(2) || "-"}</div>
            <p className="text-xs text-muted-foreground">Cumulative</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{transcript?.in_progress_credits || 0}</div>
            <p className="text-xs text-muted-foreground">credits this term</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Transcript & Progress
            </CardTitle>
            <CardDescription>See your transcript and degree requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/student/transcript")}>
              Open Transcript
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Course Planner
            </CardTitle>
            <CardDescription>Plan your upcoming semesters</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/student/planner")}>
              Open Planner
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              History
            </CardTitle>
            <CardDescription>View advisor approvals and rejection history</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/student/history")}>
              View History
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Planned Semesters and Advisor */}
      <div className="grid grid-cols-3 gap-4">
        {/* Planned Semesters */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Planned Semesters
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/student/history")}>
              View History
            </Button>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No semesters planned yet. Use the planner to add courses.
              </p>
            ) : (
              <div className="space-y-2">
                {plans.slice(0, 4).map((plan) => (
                  <div
                    key={plan.semester_id}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{plan.semester_name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {plan.total_credits} credits
                      </span>
                    </div>
                    <Badge variant={getStatusVariant(plan.status)}>{plan.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advisor Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Advisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.advisor ? (
              <div>
                <div className="font-semibold mb-1">{profile.advisor.name}</div>
                <div className="text-sm text-muted-foreground">{profile.advisor.email}</div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No advisor assigned. Please contact administration.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
