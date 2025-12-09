"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface TranscriptCourse {
  transcript_id: number;
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  grade: string | null;
  status: string;
  credits_earned: number | null;
}

interface Semester {
  semester_id: number | null;
  semester_name: string;
  courses: TranscriptCourse[];
  total_credits: number;
  gpa: number | null;
}

interface Summary {
  overall_gpa: number | null;
  completed_credits: number;
  in_progress_credits: number;
  total_courses: number;
}

interface CourseStatus {
  courseId: number;
  courseCode: string;
  title: string;
  credits: number;
  status: "DONE" | "IN_PROGRESS" | "MISSING" | "WAIVED";
  grade?: string;
  isMandatory: boolean;
}

interface BucketProgress {
  creditsDone: number;
  creditsRequired: number;
  percent: number;
}

interface Bucket {
  groupId: number;
  name: string;
  courses: CourseStatus[];
  progress: BucketProgress;
  children: Bucket[];
}

interface AuditResult {
  programId: number;
  programName: string;
  programType: string;
  overall: {
    percentComplete: number;
    creditsDone: number;
    creditsRequired: number;
  };
  buckets: Bucket[];
  warnings: Array<{ type: string; message: string }>;
}

interface FullAudit {
  major?: AuditResult;
  minor?: AuditResult;
  concentration?: AuditResult;
  combinedProgress: {
    percentComplete: number;
    creditsDone: number;
    creditsRequired: number;
  };
  warnings: Array<{ type: string; message: string }>;
  unassignedCourses?: CourseStatus[];
}

function StatusBadge({ status, isMandatory = true }: { status: string; isMandatory?: boolean }) {
  switch (status) {
    case "COMPLETED":
    case "DONE":
      return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
    case "MISSING":
      if (!isMandatory) {
        return <Badge variant="outline" className="text-muted-foreground/60">Optional</Badge>;
      }
      return <Badge variant="outline" className="text-muted-foreground"><XCircle className="h-3 w-3 mr-1" />Not Taken</Badge>;
    case "WAIVED":
      return <Badge variant="secondary">Waived</Badge>;
    case "TRANSFER":
      return <Badge className="bg-purple-100 text-purple-700">Transfer</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function TranscriptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [audit, setAudit] = useState<FullAudit | null>(null);
  const [expandedBuckets, setExpandedBuckets] = useState<Set<number>>(new Set());
  const [activeProgram, setActiveProgram] = useState<number | null>(null);
  const [error, setError] = useState("");

  const collectBucketIds = (buckets: Bucket[], collector: Set<number>) => {
    buckets.forEach((bucket) => {
      collector.add(bucket.groupId);
      if (bucket.children.length > 0) {
        collectBucketIds(bucket.children, collector);
      }
    });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }

        const [transcriptRes, auditRes] = await Promise.all([
          fetch("/api/student/transcript"),
          fetch("/api/student/audit"),
        ]);

        if (transcriptRes.ok) {
          const data = await transcriptRes.json();
          setSemesters(data.semesters || []);
          setSummary(data.summary);
        } else {
          setError("Failed to load transcript");
        }

        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAudit(auditData);
          // Set default active program to major
          if (auditData.major) {
            setActiveProgram(auditData.major.programId);
          } else if (auditData.minor) {
            setActiveProgram(auditData.minor.programId);
          } else if (auditData.concentration) {
            setActiveProgram(auditData.concentration.programId);
          }
          const expanded = new Set<number>();
          if (auditData.major) collectBucketIds(auditData.major.buckets, expanded);
          if (auditData.minor) collectBucketIds(auditData.minor.buckets, expanded);
          if (auditData.concentration) collectBucketIds(auditData.concentration.buckets, expanded);
          setExpandedBuckets(expanded);
        }
      } catch {
        setError("Failed to load transcript");
        toast.error("Failed to load transcript");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const getGradeClass = (grade: string | null) => {
    if (!grade) return "";
    if (["A", "A-"].includes(grade)) return "text-green-600";
    if (["B+", "B", "B-"].includes(grade)) return "";
    if (["C+", "C", "C-"].includes(grade)) return "text-amber-600";
    return "text-red-600";
  };

  const toggleBucket = (id: number) => {
    const updated = new Set(expandedBuckets);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setExpandedBuckets(updated);
  };

  const filterBuckets = (buckets: Bucket[]): Bucket[] => {
    return buckets
      .map((bucket) => ({ ...bucket, children: filterBuckets(bucket.children) }))
      .filter((bucket) => bucket.courses.length > 0 || bucket.children.length > 0);
  };

  const renderBucket = (bucket: Bucket, depth = 0): JSX.Element => (
    <div key={bucket.groupId} className={depth > 0 ? "ml-4" : ""}>
      <Collapsible open={expandedBuckets.has(bucket.groupId)}>
        <CollapsibleTrigger
          className="flex items-center justify-between w-full p-2 bg-muted/50 rounded hover:bg-muted text-sm"
          onClick={() => toggleBucket(bucket.groupId)}
        >
          <div className="flex items-center gap-2">
            {expandedBuckets.has(bucket.groupId) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="font-medium">{bucket.name}</span>
            {bucket.progress.percent === 100 && <CheckCircle className="h-3 w-3 text-green-600" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {bucket.progress.creditsDone}/{bucket.progress.creditsRequired}
            </span>
            <div className="w-16">
              <Progress value={bucket.progress.percent} className="h-1" />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-5 mt-1 mb-2 border-l-2 pl-3 space-y-2">
            {bucket.courses.map((course) => (
              <div key={course.courseId} className="flex items-center justify-between py-1 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-medium shrink-0">{course.courseCode}</span>
                  <span className="text-muted-foreground truncate">{course.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {course.grade && <span className="font-semibold">{course.grade}</span>}
                  <StatusBadge status={course.status} isMandatory={course.isMandatory} />
                </div>
              </div>
            ))}
            {bucket.children.length > 0 && (
              <div className="space-y-1">
                {bucket.children.map((child) => renderBucket(child, depth + 1))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const progress = audit?.combinedProgress;
  const creditsRemaining = progress ? Math.max(progress.creditsRequired - progress.creditsDone, 0) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transcript & Degree Progress</h1>
        <p className="text-muted-foreground">Review your grades and graduation requirements</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Progress */}
      {progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Overall Progress</h3>
                {creditsRemaining !== null && (
                  <p className="text-sm text-muted-foreground">{creditsRemaining} credits remaining</p>
                )}
              </div>
              <div className="text-4xl font-bold">{progress.percentComplete}%</div>
            </div>
            <Progress value={progress.percentComplete} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2 text-right">
              {progress.creditsDone} of {progress.creditsRequired} credits completed
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cumulative GPA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.overall_gpa?.toFixed(2) || "-"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Credits Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{summary.completed_credits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{summary.in_progress_credits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.total_courses}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Degree Requirements - Tabbed Interface */}
      {audit && (
        <Card>
          <CardHeader>
            <CardTitle>Degree Requirements</CardTitle>
            <CardDescription>
              {audit.major?.programName || "Bachelor's Degree"} - {progress?.creditsRequired || 0} credits required
            </CardDescription>
            {/* Overall degree progress bar */}
            {progress && (
              <div className="pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Degree Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {progress.creditsDone} / {progress.creditsRequired} credits
                  </span>
                </div>
                <Progress value={progress.percentComplete} className="h-2" />
              </div>
            )}
            {/* Legend inline */}
            <div className="flex gap-4 flex-wrap pt-3">
              <div className="flex items-center gap-1 text-xs"><StatusBadge status="DONE" /><span>Completed</span></div>
              <div className="flex items-center gap-1 text-xs"><StatusBadge status="IN_PROGRESS" /><span>In Progress</span></div>
              <div className="flex items-center gap-1 text-xs"><StatusBadge status="MISSING" /><span>Not Taken</span></div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Program Tabs - show only course requirements, not separate credit totals */}
            <div className="flex gap-2 border-b mb-4">
              {[audit.major, audit.minor, audit.concentration].filter(Boolean).map((program) => (
                <button
                  key={program!.programId}
                  onClick={() => setActiveProgram(program!.programId)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                    activeProgram === program!.programId
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {program!.programType}
                </button>
              ))}
            </div>

            {/* Active Program Content */}
            {[audit.major, audit.minor, audit.concentration].filter(Boolean).map((program) => (
              activeProgram === program!.programId && (
                <div key={program!.programId}>
                  {/* Program Header - simpler, no separate credit total */}
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-semibold">{program!.programName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {program!.programType === "MAJOR" 
                          ? "Core degree requirements"
                          : program!.programType === "MINOR"
                            ? "Minor requirements (included in degree total)"
                            : "Concentration requirements (included in degree total)"
                        }
                      </p>
                    </div>
                  </div>

                  {/* Buckets as compact list */}
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {filterBuckets(program!.buckets).map((bucket) => renderBucket(bucket))}
                  </div>
                </div>
              )
            ))}
          </CardContent>
        </Card>
      )}

      {/* Courses that are not mapped to current program requirements */}
      {audit?.unassignedCourses && audit.unassignedCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Courses</CardTitle>
            <CardDescription>Completed or in-progress courses not tied to your major/minor requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {audit.unassignedCourses.map((course) => (
              <div key={`${course.courseId}-${course.status}-${course.grade || ''}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-medium shrink-0">{course.courseCode}</span>
                  <span className="text-muted-foreground truncate">{course.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {course.grade && <span className="font-semibold">{course.grade}</span>}
                  <StatusBadge status={course.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {audit?.warnings && audit.warnings.length > 0 && (
        <div className="space-y-2">
          {audit.warnings.map((warning, index) => (
            <Alert key={index} variant={warning.type === "MISSING_PREREQS" ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{warning.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Transcript by Semester */}
      {semesters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No Transcript Records</p>
            <p className="text-sm">Your academic history will appear here once you have completed courses.</p>
          </CardContent>
        </Card>
      ) : (
        semesters.map((semester) => (
          <Card key={semester.semester_id || "transfer"}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{semester.semester_name}</CardTitle>
              <div className="text-right">
                {semester.gpa !== null && <div className="font-semibold">GPA: {semester.gpa.toFixed(2)}</div>}
                <div className="text-sm text-muted-foreground">{semester.total_credits} credits</div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-center w-24">Credits</TableHead>
                    <TableHead className="text-center w-24">Grade</TableHead>
                    <TableHead className="text-center w-32">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semester.courses.map((course) => (
                    <TableRow key={course.transcript_id}>
                      <TableCell className="font-mono font-semibold">{course.course_code}</TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell className="text-center">{course.credits}</TableCell>
                      <TableCell className={cn("text-center font-semibold", getGradeClass(course.grade))}>
                        {course.grade || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={course.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Grade Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Grading Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><strong>A</strong> = 4.0</div>
            <div><strong>A-</strong> = 3.7</div>
            <div><strong>B+</strong> = 3.3</div>
            <div><strong>B</strong> = 3.0</div>
            <div><strong>B-</strong> = 2.7</div>
            <div><strong>C+</strong> = 2.3</div>
            <div><strong>C</strong> = 2.0</div>
            <div><strong>C-</strong> = 1.7</div>
            <div><strong>D+</strong> = 1.3</div>
            <div><strong>D</strong> = 1.0</div>
            <div><strong>D-</strong> = 0.7</div>
            <div><strong>F</strong> = 0.0</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
