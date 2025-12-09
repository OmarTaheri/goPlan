"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, ClipboardCheck, AlertTriangle, Eye, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Student {
  user_id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  major_name: string | null;
  pending_plans: number;
}

interface Summary {
  total_students: number;
  students_with_pending: number;
  total_pending_plans: number;
}

export default function AdvisorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = await meRes.json();
        if (meData.user.role !== "ADVISOR") {
          router.push("/login");
          return;
        }
        setUserName(
          `${meData.user.first_name || ""} ${meData.user.last_name || ""}`.trim() || meData.user.username
        );

        const caseloadRes = await fetch("/api/advisor/caseload");
        if (caseloadRes.ok) {
          const data = await caseloadRes.json();
          setStudents(data.students || []);
          setSummary(data.summary);
        }
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const pendingStudents = students.filter((s) => s.pending_plans > 0);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}</h1>
        <p className="text-muted-foreground">Manage your student caseload and review plans</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_students || 0}</div>
            <p className="text-xs text-muted-foreground">in your caseload</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {summary?.total_pending_plans || 0}
            </div>
            <p className="text-xs text-muted-foreground">plans awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students with Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.students_with_pending || 0}</div>
            <p className="text-xs text-muted-foreground">need your attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/advisor/caseload">View Caseload</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Plans Awaiting Review</CardTitle>
            <CardDescription>Students with submitted plans for approval</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/advisor/caseload?pending=true">View All Pending</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pendingStudents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                No pending reviews. All submitted plans have been reviewed. Great job!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Major</TableHead>
                  <TableHead className="text-center">Pending Plans</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingStudents.slice(0, 5).map((student) => (
                  <TableRow key={student.user_id}>
                    <TableCell>
                      <div className="font-medium">
                        {student.first_name || student.last_name
                          ? `${student.first_name || ""} ${student.last_name || ""}`.trim()
                          : student.username}
                      </div>
                      <div className="text-muted-foreground text-xs">{student.email}</div>
                    </TableCell>
                    <TableCell>{student.major_name || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{student.pending_plans}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/dashboard/advisor/students/${student.user_id}`)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Full Caseload</CardTitle>
            <CardDescription>View all assigned students</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/advisor/caseload">View Caseload</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Search</CardTitle>
            <CardDescription>Find a specific student quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/advisor/students">Search Students</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
