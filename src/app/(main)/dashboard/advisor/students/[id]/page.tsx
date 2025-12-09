"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, User, GraduationCap, ClipboardCheck, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

interface StudentOverview {
  user: {
    user_id: number;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
  };
  profile: {
    major_name: string | null;
    minor_name: string | null;
    concentration_name: string | null;
    enrollment_year: number | null;
  } | null;
  stats: {
    completed_credits: number;
    in_progress_credits: number;
    planned_credits: number;
    gpa: number | null;
  };
  recent_plans: Array<{
    semester_id: number;
    semester_name: string;
    status: string;
    course_count: number;
  }>;
}

function getStatusVariant(status: string) {
  switch (status) {
    case "DRAFT": return "secondary";
    case "SUBMITTED": return "outline";
    case "APPROVED": return "default";
    case "REJECTED": return "destructive";
    default: return "secondary";
  }
}

export default function StudentOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  async function loadStudent() {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }

      const res = await fetch(`/api/advisor/students/${studentId}`);
      if (!res.ok) {
        if (res.status === 403) {
          setError("This student is not in your caseload");
        } else if (res.status === 404) {
          setError("Student not found");
        } else {
          throw new Error("Failed to load student");
        }
        return;
      }

      const data = await res.json();
      setStudent(data);
    } catch {
      setError("Failed to load student data");
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  }

  const studentName = student?.user.first_name || student?.user.last_name
    ? `${student?.user.first_name || ""} ${student?.user.last_name || ""}`.trim()
    : student?.user.username || "Student";

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/dashboard/advisor/caseload")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Caseload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push("/dashboard/advisor/caseload")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Caseload
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{studentName}</h1>
          <p className="text-muted-foreground">
            {student?.profile?.major_name || "No major assigned"}
            {student?.profile?.minor_name && ` • Minor: ${student.profile.minor_name}`}
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Email</div>
              <div className="font-medium">{student?.user.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Username</div>
              <div className="font-medium">@{student?.user.username}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Enrollment Year</div>
              <div className="font-medium">{student?.profile?.enrollment_year || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">GPA</div>
              <div className="font-medium text-lg">{student?.stats.gpa?.toFixed(2) || "-"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{student?.stats.completed_credits || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{student?.stats.in_progress_credits || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{student?.stats.planned_credits || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cumulative GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{student?.stats.gpa?.toFixed(2) || "-"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Degree Audit
            </CardTitle>
            <CardDescription>View student's progress toward graduation</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/dashboard/advisor/students/${studentId}/audit`)}>
              View Audit
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Review Plans
            </CardTitle>
            <CardDescription>Review and approve semester plans</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/dashboard/advisor/students/${studentId}/plan`)}>
              Review Plans
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Plans
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/advisor/students/${studentId}/plan`)}>
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!student?.recent_plans || student.recent_plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No plans found for this student.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-center">Courses</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.recent_plans.map((plan) => (
                  <TableRow key={plan.semester_id}>
                    <TableCell className="font-medium">{plan.semester_name}</TableCell>
                    <TableCell className="text-center">{plan.course_count}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusVariant(plan.status)}>{plan.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {plan.status === "SUBMITTED" ? (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/dashboard/advisor/students/${studentId}/plan?semester=${plan.semester_id}`)}
                        >
                          Review
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/advisor/students/${studentId}/plan?semester=${plan.semester_id}`)}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
