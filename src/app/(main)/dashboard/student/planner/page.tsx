"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search, ChevronLeft, ChevronRight, Lock, AlertCircle, X, CheckCircle, Clock, Send, GripVertical, ChevronDown, ChevronUp, BookOpen, GraduationCap, Library, Trash2, AlertTriangle, Wand2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CourseInfoPopup } from "./_components/CourseInfoPopup";
import { AIPlannerPopup } from "./_components/AIPlannerPopup";

interface Course {
  plan_id: number;
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  status: string;
  prereqs_met: boolean;
  semester_order: number;
  grade?: string | null;
  is_historical?: boolean;
}

interface Semester {
  semester_number: number;
  semester_name?: string;
  courses: Course[];
  total_credits: number;
  status: string;
  is_active_for_approval?: boolean;
  is_historical?: boolean;
  is_locked?: boolean;
}

interface Draft {
  draft_id: number;
  name: string;
  is_default: boolean;
}

interface AvailableCourse {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
}

interface RecommendedCourse {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  is_mandatory: boolean;
  group_name?: string;
  recommended_semester: number | null;
  prereqs_met: boolean;
  missing_prereqs: string[];
}

interface GenEdCategory {
  category_name: string;
  group_id: number;
  credits_required: number;
  credits_earned: number;
  fulfilled: boolean;
  courses: RecommendedCourse[];
}

interface RecommendedCoursesData {
  major_name: string;
  minor_name: string | null;
  concentration_name: string | null;
  degree_courses: RecommendedCourse[];
  gened_categories: GenEdCategory[];
  minor_courses: RecommendedCourse[];
  concentration_courses: RecommendedCourse[];
}

interface AutoFillAddition {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  suggested_semester: number;
  prereqs_met: boolean;
  missing_prereqs: string[];
  category: string;
}

interface AutoFillData {
  additions: AutoFillAddition[];
  conflicts: { course_code: string; reason: string }[];
  major_name: string;
  minor_name: string | null;
  concentration_name: string | null;
}

const getStatusColor = (status: string, isHistorical?: boolean) => {
  if (isHistorical) {
    if (status === "IN_PROGRESS") return "bg-blue-50 border-blue-200";
    return "bg-green-50 border-green-200";
  }
  switch (status) {
    case "APPROVED": return "bg-gray-200";
    case "SUBMITTED": return "bg-blue-100";
    case "REJECTED": return "bg-red-100";
    default: return "bg-background";
  }
};

const getStatusBadge = (status: string, isHistorical?: boolean) => {
  if (isHistorical) {
    if (status === "IN_PROGRESS") {
      return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
  }
  switch (status) {
    case "APPROVED": return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    case "SUBMITTED": return <Badge className="bg-blue-100 text-blue-700">Submitted</Badge>;
    case "REJECTED": return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="secondary">Draft</Badge>;
  }
};

export default function PlannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [courses, setCourses] = useState<AvailableCourse[]>([]);
  const [historicalSemesters, setHistoricalSemesters] = useState<number>(0);

  // UI state
  const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [activeSemester, setActiveSemester] = useState<number | null>(null); // The semester selected for quick-add
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDraftDialog, setShowNewDraftDialog] = useState(false);
  const [newDraftName, setNewDraftName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Recommended courses state
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCoursesData | null>(null);
  const [showRecommended, setShowRecommended] = useState(true);
  const [expandedGenEdCategories, setExpandedGenEdCategories] = useState<Set<number>>(new Set());
  const [genEdFlatView, setGenEdFlatView] = useState(true); // true = flat (default), false = collapsible
  
  // Auto-fill state
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [showAutoFillPreview, setShowAutoFillPreview] = useState(false);
  const [autoFillData, setAutoFillData] = useState<AutoFillData | null>(null);
  
  // Course info popup state
  const [selectedCourseForPopup, setSelectedCourseForPopup] = useState<{
    course_id: number;
    course_code: string;
    title: string;
    credits: number;
    grade?: string | null;
  } | null>(null);
  const [showCoursePopup, setShowCoursePopup] = useState(false);
  
  // AI Planner popup state
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  
  // Drag state
  interface DragItem {
    type: 'RECOMMENDED' | 'PLAN';
    course?: RecommendedCourse;
    planItem?: Course;
    originSemester?: number;
  }
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTargetSemester, setDropTargetSemester] = useState<number | null>(null);

  // Load data
  const loadPlanData = useCallback(async (draftId?: number) => {
    try {
      const url = draftId ? `/api/student/plan?draft_id=${draftId}` : "/api/student/plan";
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch plan data");
      }

      const data = await res.json();
      setSemesters(data.semesters || []);
      setDrafts(data.drafts || []);
      setActiveDraft(data.active_draft || null);
      setHistoricalSemesters(data.historical_semesters || 0);
    } catch {
      setError("Failed to load planner data");
    }
  }, [router]);

  const loadCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/student/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch {
      console.error("Failed to load courses");
    }
  }, []);

  const loadRecommendedCourses = useCallback(async (draftId?: number) => {
    try {
      const url = draftId 
        ? `/api/student/recommended-courses?draft_id=${draftId}` 
        : "/api/student/recommended-courses";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecommendedCourses(data);
      }
    } catch {
      console.error("Failed to load recommended courses");
    }
  }, []);

  useEffect(() => {
    async function init() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      await Promise.all([loadPlanData(), loadCourses(), loadRecommendedCourses()]);
      setLoading(false);
    }
    init();
  }, [loadPlanData, loadCourses, loadRecommendedCourses, router]);

  // Actions
  
  const refreshAll = () => {
    loadPlanData(activeDraft?.draft_id);
    loadRecommendedCourses(activeDraft?.draft_id);
  };

  const handleRemoveCourse = async (planId: number) => {
    if (planId < 0) {
      toast.error("Cannot remove completed courses");
      return;
    }
    try {
      const res = await fetch(`/api/student/plan/${planId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      toast.success("Course removed");
      refreshAll();
    } catch {
      toast.error("Failed to remove course");
    }
  };

  const handleAddCourse = async (courseId: number, targetSemesterNum?: number) => {
    const semNum = targetSemesterNum ?? selectedSemester;
    if (semNum === null) return;

    // Convert display semester to plan semester
    const planSemesterNumber = semNum - historicalSemesters;
    if (planSemesterNumber < 1) {
        toast.error("Invalid semester");
        return;
    }

    try {
      const res = await fetch("/api/student/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          semester_number: planSemesterNumber,
          draft_id: activeDraft?.draft_id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add course");
        return;
      }

      toast.success("Course added");
      setShowAddCourseDialog(false);
      setSearchQuery("");
      refreshAll();
    } catch {
      toast.error("Failed to add course");
    }
  };

  const handleMoveCourse = async (planId: number, targetSemesterGlobal: number) => {
     // Convert to plan semester number
     const targetPlanSemester = targetSemesterGlobal - historicalSemesters;
     if (targetPlanSemester < 1) return;

     try {
       const res = await fetch("/api/student/plan/move", {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            plan_id: planId,
            target_semester_number: targetPlanSemester
         })
       });

       if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error);
       }
       
       toast.success("Course moved");
       refreshAll();
     } catch (e) {
       toast.error(e instanceof Error ? e.message : "Failed to move course");
     }
  };

  const handleAddSemester = async (isSummer: boolean = false) => {
    if (!activeDraft) return;
    try {
        const res = await fetch("/api/student/plan/semesters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                draft_id: activeDraft.draft_id,
                force_summer: isSummer 
            })
        });
        
        if (!res.ok) throw new Error();
        
        toast.success("Semester added");
        loadPlanData(activeDraft.draft_id);
    } catch {
        toast.error("Failed to add semester");
    }
  };

  const handleRemoveSemester = async (semesterGlobal: number) => {
    if (!activeDraft) return;
    const planSemester = semesterGlobal - historicalSemesters;
    if (planSemester < 1) return;

    if (!confirm("Are you sure? Removing this semester will unplan all courses in it.")) return;

    try {
        const res = await fetch(`/api/student/plan/semesters?draft_id=${activeDraft.draft_id}&semester_number=${planSemester}`, {
            method: "DELETE"
        });
        
        if (!res.ok) {
            const data = await res.json();
             throw new Error(data.error);
        }
        
        toast.success("Semester removed");
        refreshAll();
    } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to remove semester");
    }
  };

  // Submit semester for approval
  const handleSubmitSemester = async (semesterNumber: number) => {
    setSubmitting(true);
    try {
      const semester = semesters.find(s => s.semester_number === semesterNumber);
      if (!semester || semester.courses.length === 0) {
        toast.error("No courses to submit");
        setSubmitting(false);
        return;
      }
      
      const planSemester = semesterNumber - historicalSemesters;

      const res = await fetch(`/api/student/plan/semester/${planSemester}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", draft_id: activeDraft?.draft_id }),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success("Semester submitted for approval");
      loadPlanData(activeDraft?.draft_id);
    } catch {
      toast.error("Failed to submit semester");
    } finally {
      setSubmitting(false);
    }
  };

  // Create new draft
  const handleCreateDraft = async () => {
    if (!newDraftName.trim()) {
      toast.error("Draft name is required");
      return;
    }
    try {
      const res = await fetch("/api/student/plan/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDraftName.trim() }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      toast.success("Draft created");
      setShowNewDraftDialog(false);
      setNewDraftName("");
      loadPlanData(data.draft.draft_id);
    } catch {
      toast.error("Failed to create draft");
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, type: 'RECOMMENDED' | 'PLAN', item: any, originSemester?: number) => {
    if (type === 'RECOMMENDED') {
        setDragItem({ type: 'RECOMMENDED', course: item });
        e.dataTransfer.setData("application/json", JSON.stringify({ type: 'RECOMMENDED', ...item }));
        // Auto-scroll to top so user can see semester columns
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        setDragItem({ type: 'PLAN', planItem: item, originSemester });
        e.dataTransfer.setData("application/json", JSON.stringify({ type: 'PLAN', ...item, originSemester }));
    }
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, semesterNumber: number, isLocked: boolean) => {
    if (isLocked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetSemester(semesterNumber);
  };

  const handleDrop = async (e: React.DragEvent, semesterNumber: number) => {
    e.preventDefault();
    setDropTargetSemester(null);
    setDragItem(null);
    
    // If dropped on same semester, do nothing
    if (dragItem?.type === 'PLAN' && dragItem.originSemester === semesterNumber) {
        return;
    }

    try {
        if (dragItem?.type === 'RECOMMENDED' && dragItem.course) {
             await handleAddCourse(dragItem.course.course_id, semesterNumber);
        } else if (dragItem?.type === 'PLAN' && dragItem.planItem) {
             await handleMoveCourse(dragItem.planItem.plan_id, semesterNumber);
        }
    } catch {
        toast.error("Failed to drop course");
    }
  };

  // Auto-fill handlers
  const handleAutoFill = async () => {
    setAutoFillLoading(true);
    try {
      const res = await fetch("/api/student/plan/auto-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_id: activeDraft?.draft_id,
          fill_mode: "remaining"
        })
      });

      if (!res.ok) {
        throw new Error("Failed to generate auto-fill suggestions");
      }

      const data = await res.json();
      setAutoFillData(data);
      setShowAutoFillPreview(true);
    } catch {
      toast.error("Failed to generate auto-fill suggestions");
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleApplyAutoFill = async () => {
    if (!autoFillData) return;
    
    setAutoFillLoading(true);
    let successCount = 0;
    
    try {
      for (const addition of autoFillData.additions) {
        // Find the target semester global number
        const targetSemesterGlobal = addition.suggested_semester + historicalSemesters;
        
        try {
          const res = await fetch("/api/student/plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_id: addition.course_id,
              semester_number: addition.suggested_semester,
              draft_id: activeDraft?.draft_id,
            }),
          });

          if (res.ok) {
            successCount++;
          }
        } catch {
          // Continue with other courses even if one fails
        }
      }

      toast.success(`Added ${successCount} courses to your plan`);
      setShowAutoFillPreview(false);
      setAutoFillData(null);
      refreshAll();
    } catch {
      toast.error("Failed to apply auto-fill");
    } finally {
      setAutoFillLoading(false);
    }
  };

  // Filter courses for add dialog
  const filteredCourses = courses.filter(
    (c) =>
      c.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollContainer = (direction: "left" | "right") => {
    const container = document.getElementById("semester-grid");
    if (container) {
      container.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Planner</h1>
          <p className="text-muted-foreground">View your academic history and plan future semesters</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={activeDraft?.draft_id?.toString() || ""} onValueChange={(v) => loadPlanData(parseInt(v))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select plan..." />
            </SelectTrigger>
            <SelectContent>
              {drafts.map((d) => (
                <SelectItem key={d.draft_id} value={d.draft_id.toString()}>
                  {d.name} {d.is_default ? "(Default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => setShowNewDraftDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>

          <Button 
            variant="default" 
            size="sm"
            onClick={handleAutoFill}
            disabled={autoFillLoading}
            className="gap-2"
          >
            {autoFillLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Auto-fill
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIPlanner(true)}
            className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Sparkles className="h-4 w-4" />
            AI Planner
          </Button>

          <Button variant="outline" size="icon" onClick={() => scrollContainer("left")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scrollContainer("right")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Legend */}
      <div className="flex gap-6 flex-wrap text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-4 h-4 border rounded border-dashed" />
           <span>Planned</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-4 h-4 border-2 border-red-500 bg-red-50/30 rounded" />
           <span>Prerequisites Not Met</span>
        </div>
      </div>

      {/* Semester Grid */}
      <div id="semester-grid" className="flex overflow-x-auto pb-4 scroll-smooth items-stretch gap-4">
        {semesters.map((semester) => {
          const isHistorical = semester.is_historical;
          const isLocked = semester.is_locked || isHistorical || semester.status === "APPROVED" || semester.status === "SUBMITTED";
          const canSubmit = !isHistorical && semester.status === "DRAFT" && semester.courses.length > 0 && !!semester.is_active_for_approval;
          const isCurrentSemester = isHistorical && semester.status === "IN_PROGRESS";

          return (
            <div key={semester.semester_number} className="flex-shrink-0 h-full">
              <Card 
                className={cn(
                  "w-[300px] h-full flex flex-col transition-all",
                  getStatusColor(semester.status, isHistorical),
                  isCurrentSemester && "ring-2 ring-blue-400",
                  dropTargetSemester === semester.semester_number && !isLocked && "ring-2 ring-primary bg-primary/5",
                  activeSemester === semester.semester_number && !isLocked && "ring-2 ring-violet-500 shadow-lg",
                  !isLocked && "cursor-pointer hover:shadow-md"
                )}
                onClick={() => {
                  if (!isLocked) {
                    setActiveSemester(activeSemester === semester.semester_number ? null : semester.semester_number);
                  }
                }}
                onDragOver={(e) => handleDragOver(e, semester.semester_number, !!isLocked)}
                onDrop={(e) => !isLocked && handleDrop(e, semester.semester_number)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={cn("text-lg", isHistorical && "text-muted-foreground")}>
                        {isHistorical && <Lock className="h-4 w-4 inline mr-1" />}
                        {semester.semester_name || (semester.term ? `${semester.term.charAt(0)}${semester.term.slice(1).toLowerCase()} ${semester.year}` : "Unknown Term")}
                      </CardTitle>
                      {getStatusBadge(semester.status, isHistorical)}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                         <span className="text-muted-foreground text-sm font-semibold">{semester.total_credits} cr</span>
                         {activeSemester === semester.semester_number && !isLocked && (
                           <Badge className="bg-violet-100 text-violet-700 text-[10px]">Selected</Badge>
                         )}
                         {!isLocked && !isHistorical && (
                             <button onClick={(e) => { e.stopPropagation(); handleRemoveSemester(semester.semester_number); }} className="text-destructive hover:bg-destructive/10 p-1 rounded" title="Remove Semester">
                                 <Trash2 className="h-4 w-4" />
                             </button>
                         )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 flex-1 min-h-[150px] overflow-y-auto">
                    {semester.courses.length === 0 ? (
                      <div className="text-center text-muted-foreground/50 py-8 text-sm">
                        {isHistorical ? "No courses" : "Drag courses here or add"}
                      </div>
                    ) : (
                      semester.courses.map((course) => (
                        <div
                          key={`${semester.semester_number}-${course.plan_id}`}
                          draggable={!isLocked && !isHistorical}
                          onDragStart={(e) => handleDragStart(e, 'PLAN', course, semester.semester_number)}
                          className={cn(
                            "group p-2 rounded-md border bg-background relative select-none",
                            !isLocked && "cursor-grab active:cursor-grabbing hover:border-primary/50",
                            isLocked && "opacity-80 cursor-pointer hover:bg-accent/50"
                          )}
                          onClick={() => {
                            setSelectedCourseForPopup({
                              course_id: course.course_id,
                              course_code: course.course_code,
                              title: course.title,
                              credits: course.credits,
                              grade: course.grade,
                            });
                            setShowCoursePopup(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="font-mono text-sm font-semibold truncate">
                                {course.course_code}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{course.title}</div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {course.grade && (
                                <Badge variant="outline" className={cn(
                                  "text-xs",
                                  course.grade.startsWith("A") && "text-green-600 border-green-200",
                                  course.grade.startsWith("B") && "text-blue-600 border-blue-200",
                                  course.grade.startsWith("C") && "text-amber-600 border-amber-200"
                                )}>
                                  {course.grade}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {course.credits}
                              </Badge>
                            </div>
                          </div>
                          {!isLocked && course.plan_id > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCourse(course.plan_id);
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 space-y-2 pt-2 border-t">
                    {!isLocked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border-dashed border"
                        onClick={() => {
                          setSelectedSemester(semester.semester_number);
                          setShowAddCourseDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Course
                      </Button>
                    )}
                    {canSubmit && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleSubmitSemester(semester.semester_number)}
                        disabled={submitting}
                      >
                         {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4 mr-1" />}
                         Submit for Approval
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Add Semester Column */}
        <div className="flex-shrink-0 w-[100px] flex flex-col items-center justify-start gap-3 min-h-[300px]">
            <Button variant="outline" className="h-[140px] w-full flex-col gap-2 border-dashed" onClick={() => handleAddSemester(false)}>
                <Plus className="h-6 w-6" />
                <span>Add Sem</span>
            </Button>
            <Button variant="outline" className="h-[80px] w-full flex-col gap-1 border-dashed bg-yellow-50/50 border-yellow-200 hover:bg-yellow-100/50" onClick={() => handleAddSemester(true)}>
                <Plus className="h-4 w-4" />
                <span className="text-xs">Add Summer</span>
            </Button>
        </div>
      </div>

      {/* Recommended Courses Panel */}
      {recommendedCourses && (
        <Card className="mt-6">
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowRecommended(!showRecommended)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Recommended Courses</CardTitle>
                <Badge variant="secondary" className="ml-2">
                 {(() => {
                    // Count degree courses
                    const degreeCount = recommendedCourses.degree_courses?.length || 0;
                    
                    // Count GenEd courses ONLY from unfulfilled categories
                    const genedCount = recommendedCourses.gened_categories?.reduce((sum, cat) => {
                      // Skip fulfilled categories - they don't show courses
                      if (cat.fulfilled) return sum;
                      // Only count if there are actual courses
                      return sum + (cat.courses?.length || 0);
                    }, 0) || 0;
                    
                    // Count minor and concentration courses
                    const minorCount = recommendedCourses.minor_courses?.length || 0;
                    const concCount = recommendedCourses.concentration_courses?.length || 0;
                    
                    return degreeCount + genedCount + minorCount + concCount;
                 })()} remaining
                </Badge>
              </div>
              {showRecommended ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          
          {showRecommended && (
            <CardContent className="space-y-6 pt-0">
                <div className="text-sm text-muted-foreground mb-4">
                  {activeSemester ? (
                    <span>Click <Plus className="inline h-3 w-3" /> on a course to add it to <strong>{semesters.find(s => s.semester_number === activeSemester)?.semester_name || 'the selected semester'}</strong>. Click the semester card again to deselect.</span>
                  ) : (
                    <span>Click on a semester card to select it, then click <Plus className="inline h-3 w-3" /> on courses to add them. Or drag courses to your plan.</span>
                  )}
                </div>

              {recommendedCourses.degree_courses?.length > 0 && (
                <div>
                   <div className="flex items-center gap-2 mb-3 mt-4">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-sm">Required Degree Courses</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendedCourses.degree_courses.map((course) => (
                      <div
                        key={course.course_id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'RECOMMENDED', course)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md border bg-card cursor-grab active:cursor-grabbing transition-all hover:shadow-sm",
                          !course.prereqs_met && "border-2 border-red-500 bg-red-50/30"
                        )}
                        title={!course.prereqs_met ? `Prerequisites not met: ${course.missing_prereqs.join(', ')}` : course.title}
                      >
                         <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                         {!course.prereqs_met && (
                           <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                         )}
                         <div>
                            <div className="font-mono text-xs font-bold">{course.course_code}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[120px]">{course.title}</div>
                         </div>
                         <Badge variant="secondary" className="text-[10px] px-1 h-5">{course.credits}cr</Badge>
                         {course.recommended_semester && (
                           <Badge variant="outline" className="text-[10px] px-1 h-5 bg-blue-50 text-blue-700 border-blue-200">S{course.recommended_semester}</Badge>
                         )}
                         {/* Quick add button */}
                          <div className="border-l pl-2 ml-1">
                                <Plus className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => {
                                    if (activeSemester) {
                                      handleAddCourse(course.course_id, activeSemester);
                                    } else {
                                      toast.error("Please select a semester first by clicking on it");
                                    }
                                }} />
                          </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

             {/* Minor Courses - Now above GenEd */}
              {recommendedCourses.minor_courses && (
                <div className="mt-4">
                   <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-4 w-4 text-orange-600" />
                    <h3 className="font-semibold text-sm">Minor Courses ({recommendedCourses.minor_name || 'Minor'})</h3>
                    {recommendedCourses.minor_courses.length === 0 && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">All Selected</Badge>
                    )}
                  </div>
                  {recommendedCourses.minor_courses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recommendedCourses.minor_courses.map((course) => (
                        <div
                          key={course.course_id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'RECOMMENDED', course)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-md border bg-card cursor-grab active:cursor-grabbing transition-all hover:shadow-sm",
                            !course.prereqs_met && "border-2 border-red-500 bg-red-50/30"
                          )}
                          title={!course.prereqs_met ? `Prerequisites not met: ${course.missing_prereqs.join(', ')}` : course.title}
                        >
                           <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                           {!course.prereqs_met && (
                             <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                           )}
                           <div>
                              <div className="font-mono text-xs font-bold">{course.course_code}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[120px]">{course.title}</div>
                           </div>
                           <Badge variant="secondary" className="text-[10px] px-1 h-5">{course.credits}cr</Badge>
                           {course.recommended_semester && (
                             <Badge variant="outline" className="text-[10px] px-1 h-5 bg-orange-50 text-orange-700 border-orange-200">S{course.recommended_semester}</Badge>
                           )}
                           <div className="border-l pl-2 ml-1">
                                 <Plus className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => {
                                     if (activeSemester) {
                                       handleAddCourse(course.course_id, activeSemester);
                                     } else {
                                       toast.error("Please select a semester first by clicking on it");
                                     }
                                 }} />
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">All minor courses have been added to your plan.</p>
                  )}
                </div>
              )}

             {/* GenEds - Now below Minor */}
             {recommendedCourses.gened_categories?.length > 0 && (
                 <div className="mt-4">
                     <div className="flex items-center gap-2 mb-3">
                        <Library className="h-4 w-4 text-purple-600" />
                        <h3 className="font-semibold text-sm">General Education</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={() => setGenEdFlatView(!genEdFlatView)}
                        >
                          {genEdFlatView ? "Show Collapsible" : "Show Flat"}
                        </Button>
                     </div>
                     
                     {/* Flat View (default) */}
                     {genEdFlatView ? (
                       <div className="space-y-4">
                         {recommendedCourses.gened_categories.map(cat => (
                           <div key={cat.group_id}>
                             <div className="flex items-center gap-2 mb-2">
                               {cat.fulfilled ? <CheckCircle className="h-4 w-4 text-green-600"/> : <div className="h-4 w-4 rounded-full border-2"/> }
                               <span className={cn("text-sm font-medium", cat.fulfilled && "text-muted-foreground")}>{cat.category_name}</span>
                               <Badge variant="outline" className="text-[10px] ml-1">{cat.credits_earned}/{cat.credits_required} cr</Badge>
                               {cat.fulfilled && (
                                 <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">All Selected</Badge>
                               )}
                             </div>
                             {!cat.fulfilled && cat.courses.length > 0 && (
                               <div className="flex flex-wrap gap-2 ml-6">
                                 {cat.courses.map(course => (
                                   <div
                                     key={course.course_id}
                                     draggable
                                     onDragStart={(e) => handleDragStart(e, 'RECOMMENDED', course)}
                                     className={cn(
                                       "flex items-center gap-2 p-2 rounded-md border bg-card cursor-grab active:cursor-grabbing hover:shadow-sm",
                                       !course.prereqs_met && "border-2 border-red-500 bg-red-50/30"
                                     )}
                                     title={!course.prereqs_met ? `Prerequisites not met: ${course.missing_prereqs.join(', ')}` : course.title}
                                   >
                                     <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                                     {!course.prereqs_met && (
                                       <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                                     )}
                                     <div>
                                       <div className="font-mono text-xs font-bold">{course.course_code}</div>
                                       <div className="text-xs text-muted-foreground truncate max-w-[120px]">{course.title}</div>
                                     </div>
                                     <Badge variant="secondary" className="text-[10px] h-5">{course.credits}</Badge>
                                     {course.recommended_semester && (
                                       <Badge variant="outline" className="text-[10px] h-5 bg-purple-50 text-purple-700 border-purple-200">S{course.recommended_semester}</Badge>
                                     )}
                                     <div className="border-l pl-2 ml-1">
                                       <Plus className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => {
                                         const firstDraftSem = semesters.find(s => !s.is_locked && !s.is_historical);
                                         if (firstDraftSem) handleAddCourse(course.course_id, firstDraftSem.semester_number);
                                         else toast.error("Please add a semester first");
                                       }} />
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     ) : (
                       /* Collapsible View */
                       <div className="space-y-2">
                         {recommendedCourses.gened_categories.map(cat => (
                             <div key={cat.group_id} className="border rounded-lg overflow-hidden">
                                <div 
                                    className={cn("p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50", cat.fulfilled && "bg-green-50/50")}
                                    onClick={() => {
                                        const newSet = new Set(expandedGenEdCategories);
                                        if (newSet.has(cat.group_id)) newSet.delete(cat.group_id);
                                        else newSet.add(cat.group_id);
                                        setExpandedGenEdCategories(newSet);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {cat.fulfilled ? <CheckCircle className="h-4 w-4 text-green-600"/> : <div className="h-4 w-4 rounded-full border-2"/> }
                                        <span className={cn("text-sm font-medium", cat.fulfilled && "text-muted-foreground")}>{cat.category_name}</span>
                                        <Badge variant="outline" className="text-[10px] ml-1">{cat.credits_earned}/{cat.credits_required} cr</Badge>
                                        {cat.fulfilled && (
                                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">All Selected</Badge>
                                        )}
                                    </div>
                                    <ChevronDown className={cn("h-4 w-4 transition-transform", expandedGenEdCategories.has(cat.group_id) && "rotate-180")} />
                                </div>
                                
                                {expandedGenEdCategories.has(cat.group_id) && !cat.fulfilled && (
                                    <div className="p-3 bg-muted/20 border-t flex flex-wrap gap-2">
                                         {cat.courses.map(course => (
                                             <div
                                                key={course.course_id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, 'RECOMMENDED', course)}
                                                className={cn(
                                                  "flex items-center gap-2 p-2 rounded-md border bg-background cursor-grab active:cursor-grabbing hover:shadow-sm",
                                                  !course.prereqs_met && "border-2 border-red-500 bg-red-50/30"
                                                )}
                                                title={!course.prereqs_met ? `Prerequisites not met: ${course.missing_prereqs.join(', ')}` : course.title}
                                            >
                                                {!course.prereqs_met && (
                                                  <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                                                )}
                                                <div className="font-mono text-xs font-bold">{course.course_code}</div>
                                                <Badge variant="secondary" className="text-[10px] h-5">{course.credits}</Badge>
                                                {course.recommended_semester && (
                                                  <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200">S{course.recommended_semester}</Badge>
                                                )}
                                            </div>
                                         ))}
                                    </div>
                                )}
                             </div>
                         ))}
                       </div>
                     )}
                 </div>
             )}


              {/* Concentration Courses */}
              {recommendedCourses.concentration_courses && recommendedCourses.concentration_courses.length > 0 && (
                <div className="mt-4">
                   <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-4 w-4 text-teal-600" />
                    <h3 className="font-semibold text-sm">Concentration Courses ({recommendedCourses.concentration_name || 'Concentration'})</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendedCourses.concentration_courses.map((course) => (
                      <div
                        key={course.course_id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'RECOMMENDED', course)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md border bg-card cursor-grab active:cursor-grabbing transition-all hover:shadow-sm",
                          !course.prereqs_met && "border-2 border-red-500 bg-red-50/30"
                        )}
                        title={!course.prereqs_met ? `Prerequisites not met: ${course.missing_prereqs.join(', ')}` : course.title}
                      >
                         <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                         {!course.prereqs_met && (
                           <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                         )}
                         <div>
                            <div className="font-mono text-xs font-bold">{course.course_code}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[120px]">{course.title}</div>
                         </div>
                         <Badge variant="secondary" className="text-[10px] px-1 h-5">{course.credits}cr</Badge>
                         {course.recommended_semester && (
                           <Badge variant="outline" className="text-[10px] px-1 h-5 bg-teal-50 text-teal-700 border-teal-200">S{course.recommended_semester}</Badge>
                         )}
                         <div className="border-l pl-2 ml-1">
                               <Plus className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => {
                                   if (activeSemester) {
                                     handleAddCourse(course.course_id, activeSemester);
                                   } else {
                                     toast.error("Please select a semester first by clicking on it");
                                   }
                               }} />
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          )}
        </Card>
      )}

      {/* Other Courses - Add any course from catalog */}
      <Card className="mt-6">
        <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowAddCourseDialog(true)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Other Courses</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Browse All
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3">
            Add any course from the catalog, including courses outside your degree requirements.
          </p>
          <Button 
            variant="outline" 
            className="w-full border-dashed"
            onClick={() => {
              setSelectedSemester(semesters.find(s => !s.is_locked && !s.is_historical)?.semester_number || null);
              setShowAddCourseDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Browse All Courses
          </Button>
        </CardContent>
      </Card>


      {/* Dialogs */}
      <Dialog open={showAddCourseDialog} onOpenChange={setShowAddCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Course</DialogTitle>
             <DialogDescription>Search for a course to add to your plan</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredCourses.map((course) => (
                  <div
                    key={course.course_id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer border"
                    onClick={() => handleAddCourse(course.course_id)}
                  >
                    <div>
                      <div className="font-semibold">{course.course_code}</div>
                      <div className="text-sm text-muted-foreground">{course.title}</div>
                    </div>
                    <Badge>{course.credits} cr</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewDraftDialog} onOpenChange={setShowNewDraftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Plan Draft</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Draft Name (e.g., Minoring in CS)"
              value={newDraftName}
              onChange={(e) => setNewDraftName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateDraft}>Create Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-fill Preview Dialog */}
      <Dialog open={showAutoFillPreview} onOpenChange={setShowAutoFillPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Auto-fill Preview
            </DialogTitle>
            <DialogDescription>
              Review the suggested courses before adding them to your plan
            </DialogDescription>
          </DialogHeader>
          
          {autoFillData && (
            <div className="py-4">
              <div className="text-sm text-muted-foreground mb-4">
                Based on the <strong>{autoFillData.major_name}</strong> recommended sequence
                {autoFillData.minor_name && <>, Minor: <strong>{autoFillData.minor_name}</strong></>}
              </div>
              
              <ScrollArea className="h-[400px] pr-4">
                {autoFillData.additions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>Your plan is already complete!</p>
                    <p className="text-sm">All recommended courses have been added.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Group by semester */}
                    {Array.from(
                      autoFillData.additions.reduce((acc, course) => {
                        const sem = course.suggested_semester;
                        if (!acc.has(sem)) acc.set(sem, []);
                        acc.get(sem)!.push(course);
                        return acc;
                      }, new Map<number, AutoFillAddition[]>())
                    ).sort((a, b) => a[0] - b[0]).map(([semester, courses]) => (
                      <div key={semester} className="border rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2 flex items-center justify-between">
                          <span>Semester {semester + historicalSemesters}</span>
                          <Badge variant="secondary">{courses.reduce((sum, c) => sum + c.credits, 0)} credits</Badge>
                        </h4>
                        <div className="space-y-2">
                          {courses.map((course) => (
                            <div 
                              key={course.course_id}
                              className={cn(
                                "flex items-center justify-between p-2 rounded border bg-background",
                                !course.prereqs_met && "border-red-300 bg-red-50/50"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {!course.prereqs_met && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                <div>
                                  <div className="font-mono text-sm font-semibold">{course.course_code}</div>
                                  <div className="text-xs text-muted-foreground">{course.title}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{course.category}</Badge>
                                <Badge variant="secondary" className="text-xs">{course.credits} cr</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {autoFillData.conflicts.length > 0 && (
                  <div className="mt-4 p-3 border rounded-lg border-amber-200 bg-amber-50">
                    <h4 className="font-semibold text-sm mb-2 text-amber-700">Notes</h4>
                    <ul className="text-sm text-amber-600 space-y-1">
                      {autoFillData.conflicts.map((conflict, i) => (
                        <li key={i}>• {conflict.course_code}: {conflict.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoFillPreview(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyAutoFill} 
              disabled={autoFillLoading || !autoFillData?.additions.length}
            >
              {autoFillLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Apply {autoFillData?.additions.length || 0} Courses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Info Popup with AI Helper */}
      <CourseInfoPopup
        course={selectedCourseForPopup}
        open={showCoursePopup}
        onClose={() => {
          setShowCoursePopup(false);
          setSelectedCourseForPopup(null);
        }}
      />

      {/* AI Planner Popup */}
      <AIPlannerPopup
        open={showAIPlanner}
        onClose={() => setShowAIPlanner(false)}
        semesters={semesters}
        majorName={recommendedCourses?.major_name}
        minorName={recommendedCourses?.minor_name || undefined}
        historicalSemesters={historicalSemesters}
        onAddCourse={async (courseCode: string, semesterNum: number) => {
          // Find course by code
          const course = courses.find(c => c.course_code === courseCode);
          if (!course) {
            toast.error(`Course ${courseCode} not found`);
            return false;
          }
          try {
            const planSemesterNumber = semesterNum - historicalSemesters;
            if (planSemesterNumber < 1) {
              toast.error("Cannot add to historical semester");
              return false;
            }
            const res = await fetch("/api/student/plan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                course_id: course.course_id,
                semester_number: planSemesterNumber,
                draft_id: activeDraft?.draft_id,
              }),
            });
            return res.ok;
          } catch {
            return false;
          }
        }}
        onMoveCourse={async (courseCode: string, toSemester: number) => {
          // Find course in plan
          let planItem: Course | undefined;
          for (const sem of semesters) {
            planItem = sem.courses.find(c => c.course_code === courseCode);
            if (planItem) break;
          }
          if (!planItem || planItem.plan_id < 0) {
            toast.error(`Cannot move ${courseCode}`);
            return false;
          }
          try {
            const targetPlanSemester = toSemester - historicalSemesters;
            if (targetPlanSemester < 1) {
              toast.error("Cannot move to historical semester");
              return false;
            }
            const res = await fetch("/api/student/plan/move", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plan_id: planItem.plan_id,
                target_semester_number: targetPlanSemester,
              }),
            });
            return res.ok;
          } catch {
            return false;
          }
        }}
        onRemoveCourse={async (courseCode: string) => {
          // Find course in plan
          let planItem: Course | undefined;
          for (const sem of semesters) {
            planItem = sem.courses.find(c => c.course_code === courseCode);
            if (planItem) break;
          }
          if (!planItem || planItem.plan_id < 0) {
            toast.error(`Cannot remove ${courseCode}`);
            return false;
          }
          try {
            const res = await fetch(`/api/student/plan/${planItem.plan_id}`, {
              method: "DELETE",
            });
            return res.ok;
          } catch {
            return false;
          }
        }}
        onAddSemester={async (afterSemester: number, semesterName: string) => {
          if (!activeDraft) return false;
          try {
            // Check if adding summer by looking at semester name
            const isSummer = semesterName.toLowerCase().includes('summer');
            const res = await fetch("/api/student/plan/semesters", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                draft_id: activeDraft.draft_id,
                force_summer: isSummer 
              })
            });
            if (res.ok) {
              loadPlanData(activeDraft.draft_id);
              return true;
            }
            return false;
          } catch {
            return false;
          }
        }}
        onRefresh={refreshAll}
      />
    </div>
  );
}
