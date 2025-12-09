"use client";

import { Suspense, useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Calendar, Check, X, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PlannedCourse {
  plan_id: number;
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  status: string;
  prereqs_met: boolean;
}

interface SemesterPlan {
  semester_id: number;
  semester_name: string;
  status: string;
  courses: PlannedCourse[];
  total_credits: number;
  validation_errors: Array<{ type: string; message: string }>;
}

interface StudentInfo {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
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

function StudentPlanReviewContent({ studentId }: { studentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSemesterId = searchParams.get("semester");

  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [plans, setPlans] = useState<SemesterPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SemesterPlan | null>(null);
  const [error, setError] = useState("");

  // Review dialog
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [comments, setComments] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, [studentId]);

  useEffect(() => {
    if (selectedSemesterId && plans.length > 0) {
      const plan = plans.find(p => p.semester_id === parseInt(selectedSemesterId));
      if (plan) setSelectedPlan(plan);
    }
  }, [selectedSemesterId, plans]);

  async function loadData() {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { router.push("/login"); return; }

      const studentRes = await fetch(`/api/advisor/students/${studentId}`);
      if (!studentRes.ok) {
        if (studentRes.status === 403) setError("This student is not in your caseload");
        else throw new Error("Failed to load student");
        return;
      }
      const studentData = await studentRes.json();
      setStudentInfo({
        user_id: studentData.user.user_id,
        first_name: studentData.user.first_name,
        last_name: studentData.user.last_name,
        username: studentData.user.username,
      });

      const planRes = await fetch(`/api/advisor/students/${studentId}/plan`);
      if (planRes.ok) {
        const planData = await planRes.json();
        setPlans(planData.semesters || []);

        if (!selectedSemesterId && planData.semesters) {
          const submitted = planData.semesters.find((s: SemesterPlan) => s.status === "SUBMITTED");
          if (submitted) setSelectedPlan(submitted);
          else if (planData.semesters.length > 0) setSelectedPlan(planData.semesters[0]);
        }
      }
    } catch {
      setError("Failed to load student plans");
      toast.error("Failed to load student plans");
    } finally {
      setLoading(false);
    }
  }

  const handleReview = async () => {
    if (!selectedPlan) return;
    if (reviewAction === "reject" && !comments.trim()) {
      toast.error("Comments are required when rejecting a plan");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/advisor/students/${studentId}/plan/${selectedPlan.semester_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: reviewAction, comments: comments.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || `Failed to ${reviewAction} plan`); return; }

      toast.success(`Plan ${reviewAction === "approve" ? "approved" : "rejected"} successfully`);
      setShowReviewDialog(false);
      setComments("");
      loadData();
    } catch {
      toast.error(`Failed to ${reviewAction} plan`);
    } finally {
      setProcessing(false);
    }
  };

  const openReviewDialog = (action: "approve" | "reject") => {
    setReviewAction(action);
    setComments("");
    setShowReviewDialog(true);
  };

  const studentName = studentInfo?.first_name || studentInfo?.last_name
    ? `${studentInfo?.first_name || ""} ${studentInfo?.last_name || ""}`.trim()
    : studentInfo?.username || "Student";

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
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
        <Button variant="outline" onClick={() => router.push(`/dashboard/advisor/students/${studentId}`)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push(`/dashboard/advisor/students/${studentId}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" />Back to {studentName}
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Plan Review: {studentName}</h1>
          <p className="text-muted-foreground">Review and approve semester plans</p>
        </div>

        <div className="grid grid-cols-[280px_1fr] gap-6">
          {/* Semester List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />Semesters</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {plans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No plans found</div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="flex flex-col">
                    {plans.map((plan) => (
                      <button
                        key={plan.semester_id}
                        onClick={() => setSelectedPlan(plan)}
                        className={cn(
                          "p-3 border-b text-left hover:bg-muted/50 transition-colors",
                          selectedPlan?.semester_id === plan.semester_id && "bg-muted"
                        )}
                      >
                        <div className="font-medium mb-1">{plan.semester_name}</div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">{plan.courses.length} courses</span>
                          <Badge variant={getStatusVariant(plan.status)} className="text-xs">{plan.status}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Plan Details */}
          <div className="space-y-4">
            {!selectedPlan ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Select a Semester</p>
                  <p className="text-sm">Choose a semester from the list to review the plan</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Plan Header */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle>{selectedPlan.semester_name}</CardTitle>
                      <CardDescription>{selectedPlan.courses.length} courses • {selectedPlan.total_credits} credits</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusVariant(selectedPlan.status)}>{selectedPlan.status}</Badge>
                      {selectedPlan.status === "SUBMITTED" && (
                        <>
                          <Button variant="destructive" onClick={() => openReviewDialog("reject")}><X className="h-4 w-4 mr-1" />Reject</Button>
                          <Button className="bg-green-600 hover:bg-green-700" onClick={() => openReviewDialog("approve")}><Check className="h-4 w-4 mr-1" />Approve</Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {/* Validation Errors */}
                {selectedPlan.validation_errors?.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Validation Issues:</strong>
                      <ul className="list-disc ml-5 mt-1">
                        {selectedPlan.validation_errors.map((err, i) => (<li key={i}>{err.message}</li>))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Courses Table */}
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-center w-24">Credits</TableHead>
                        <TableHead className="text-center w-32">Prerequisites</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPlan.courses.map((course) => (
                        <TableRow key={course.plan_id}>
                          <TableCell className="font-mono font-semibold">{course.course_code}</TableCell>
                          <TableCell>{course.title}</TableCell>
                          <TableCell className="text-center">{course.credits}</TableCell>
                          <TableCell className="text-center">
                            {course.prereqs_met ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Met</Badge>
                            ) : (
                              <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Not Met</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                        <TableCell className="text-center font-semibold">{selectedPlan.total_credits}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === "approve" ? "Approve Plan" : "Reject Plan"}</DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "Approving this plan will lock it and allow the student to register for these courses."
                : "Rejecting this plan will notify the student and allow them to revise their course selection."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Comments {reviewAction === "reject" && <span className="text-destructive">*</span>}</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={reviewAction === "approve" ? "Optional feedback for the student..." : "Explain why this plan is being rejected..."}
                rows={4}
              />
              {reviewAction === "reject" && <p className="text-xs text-muted-foreground">Comments are required when rejecting a plan</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
            <Button
              variant={reviewAction === "approve" ? "default" : "destructive"}
              onClick={handleReview}
              disabled={processing || (reviewAction === "reject" && !comments.trim())}
              className={reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {reviewAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function StudentPlanReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = use(params);
  return (
    <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <StudentPlanReviewContent studentId={studentId} />
    </Suspense>
  );
}
