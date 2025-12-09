"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, Search, Loader2, Eye, FileCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

interface Student {
  user_id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  major_name: string | null;
  minor_name: string | null;
  enrollment_year: number | null;
  pending_plans: number;
  approved_plans: number;
}

interface Summary {
  total_students: number;
  students_with_pending: number;
  total_pending_plans: number;
}

function StudentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(searchParams.get("pending") === "true");
  const [error, setError] = useState("");

  useEffect(() => {
    loadStudents();
  }, [showPendingOnly]);

  async function loadStudents() {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }

      const params = new URLSearchParams();
      if (showPendingOnly) params.append("pending", "true");

      const res = await fetch(`/api/advisor/students?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load students");
      }

      const data = await res.json();
      setStudents(data.students || []);
      setSummary(data.summary);
    } catch {
      setError("Failed to load students");
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.first_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.last_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.major_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
        <p className="text-muted-foreground">
          {summary?.total_students || 0} students assigned to you
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.total_students || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With Pending Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{summary?.students_with_pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.total_pending_plans || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or major..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="pending"
                checked={showPendingOnly}
                onCheckedChange={(checked) => setShowPendingOnly(checked === true)}
              />
              <Label htmlFor="pending" className="cursor-pointer">
                Show only with pending plans
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No Students Found</p>
              <p className="text-sm">
                {search
                  ? "Try a different search term"
                  : showPendingOnly
                  ? "No students have pending plans"
                  : "You have no students assigned"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Major</TableHead>
                  <TableHead className="text-center">Year</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Approved</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.user_id}>
                    <TableCell>
                      <div className="font-medium">
                        {student.first_name || student.last_name
                          ? `${student.first_name || ""} ${student.last_name || ""}`.trim()
                          : student.username}
                      </div>
                      <div className="text-xs text-muted-foreground">@{student.username}</div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <div>{student.major_name || "-"}</div>
                      {student.minor_name && (
                        <div className="text-xs text-muted-foreground">Minor: {student.minor_name}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{student.enrollment_year || "-"}</TableCell>
                    <TableCell className="text-center">
                      {student.pending_plans > 0 ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                          {student.pending_plans}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {student.approved_plans > 0 ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          {student.approved_plans}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/advisor/students/${student.user_id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {student.pending_plans > 0 && (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/dashboard/advisor/students/${student.user_id}/plan`)}
                          >
                            <FileCheck className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
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

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StudentsContent />
    </Suspense>
  );
}
