"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X, ClipboardList, BookOpen, AlertTriangle, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Course {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
}

// Draggable Course Card Component
function DraggableCourse({ course, zone }: { course: Course; zone: "search" | "core" | "choice" }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${zone}-${course.course_id}`,
    data: { course, sourceZone: zone },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 1000 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 p-2.5 bg-background border rounded-md cursor-grab transition-all",
        "hover:shadow-md hover:border-primary/50",
        isDragging && "opacity-50 shadow-lg scale-105"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm">{course.course_code}</span>
          <Badge variant="outline" className="text-xs">{course.credits} SCH</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{course.title}</p>
      </div>
    </div>
  );
}

// Overlay card shown while dragging
function DragOverlayCard({ course }: { course: Course }) {
  return (
    <div className="flex items-center gap-2 p-2.5 bg-background border-2 border-primary rounded-md shadow-xl cursor-grabbing">
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm">{course.course_code}</span>
          <Badge variant="outline" className="text-xs">{course.credits} SCH</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{course.title}</p>
      </div>
    </div>
  );
}

// Droppable Zone Component
function DroppableZone({
  id,
  children,
  className,
  emptyMessage,
  emptyIcon: EmptyIcon = BookOpen,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  emptyMessage: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[280px] border-2 border-dashed rounded-lg p-3 transition-all duration-200",
        isOver && "scale-[1.02] border-primary bg-primary/5 shadow-lg",
        className
      )}
    >
      {children || (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
          <EmptyIcon className="h-12 w-12 mb-3" />
          <p className="font-medium text-sm">{emptyMessage}</p>
          <p className="text-xs">Drag courses here</p>
        </div>
      )}
    </div>
  );
}

export default function NewMinorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  const [basicInfo, setBasicInfo] = useState({
    name: "",
    code: "",
    school: "",
    total_credits_required: 15,
    prerequisite_note: "",
  });

  const [coreCourses, setCoreCourses] = useState<Course[]>([]);
  const [choiceCourses, setChoiceCourses] = useState<Course[]>([]);
  const [choiceCount, setChoiceCount] = useState(2);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => { loadCourses(); }, []);

  async function loadCourses() {
    try {
      const res = await fetch("/api/admin/courses?active=true");
      if (res.ok) setCourses((await res.json()).courses || []);
    } catch { }
  }

  const filteredCourses = courses.filter(
    (c) => c.course_code.toLowerCase().includes(courseSearch.toLowerCase()) || c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  // Get courses not yet allocated
  const availableCourses = filteredCourses.filter(
    (c) => !coreCourses.find((x) => x.course_id === c.course_id) && !choiceCourses.find((x) => x.course_id === c.course_id)
  );

  const coreCredits = coreCourses.reduce((s, c) => s + c.credits, 0);
  const choiceCredits = choiceCourses.reduce((s, c) => s + c.credits, 0);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { course: Course };
    setActiveCourse(data?.course || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCourse(null);
    const { active, over } = event;
    if (!over || !active.data.current) return;

    const { course, sourceZone } = active.data.current as { course: Course; sourceZone: string };
    const targetZone = over.id as string;

    // If dropped back to search area, remove from allocated
    if (targetZone === "search") {
      if (sourceZone === "core") setCoreCourses((prev) => prev.filter((c) => c.course_id !== course.course_id));
      if (sourceZone === "choice") setChoiceCourses((prev) => prev.filter((c) => c.course_id !== course.course_id));
      return;
    }

    // Remove from source zone first
    if (sourceZone === "core") setCoreCourses((prev) => prev.filter((c) => c.course_id !== course.course_id));
    if (sourceZone === "choice") setChoiceCourses((prev) => prev.filter((c) => c.course_id !== course.course_id));

    // Add to target zone
    if (targetZone === "core") {
      setCoreCourses((prev) => prev.find((c) => c.course_id === course.course_id) ? prev : [...prev, course]);
    } else if (targetZone === "choice") {
      setChoiceCourses((prev) => prev.find((c) => c.course_id === course.course_id) ? prev : [...prev, course]);
    }
  };

  const handleSubmit = async () => {
    if (!basicInfo.name) { toast.error("Minor name is required"); return; }
    if (coreCourses.length === 0 && choiceCourses.length === 0) { toast.error("Add at least one course"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basicInfo, type: "MINOR" }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const { program_id } = await res.json();

      if (coreCourses.length > 0) {
        const groupRes = await fetch(`/api/admin/programs/${program_id}/requirements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Core Courses", credits_required: coreCredits, min_courses_required: coreCourses.length }),
        });
        if (groupRes.ok) {
          const { group_id } = await groupRes.json();
          for (const c of coreCourses) {
            await fetch(`/api/admin/programs/${program_id}/requirements/${group_id}/courses`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ course_id: c.course_id, is_mandatory: true }),
            });
          }
        }
      }

      if (choiceCourses.length > 0) {
        const groupRes = await fetch(`/api/admin/programs/${program_id}/requirements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: `Select ${choiceCount} course(s)`, credits_required: choiceCount * 3, min_courses_required: choiceCount }),
        });
        if (groupRes.ok) {
          const { group_id } = await groupRes.json();
          for (const c of choiceCourses) {
            await fetch(`/api/admin/programs/${program_id}/requirements/${group_id}/courses`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ course_id: c.course_id, is_mandatory: false }),
            });
          }
        }
      }

      toast.success("Minor created successfully");
      router.push("/dashboard/admin/programs");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Minor</h1>
          <p className="text-muted-foreground">Define a minor program available across different majors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/programs")}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Creating..." : "Create Minor"}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Minor Name *</Label>
              <Input value={basicInfo.name} onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })} placeholder="e.g., Human Resource Development" />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={basicInfo.code} onChange={(e) => setBasicInfo({ ...basicInfo, code: e.target.value })} placeholder="e.g., MINOR-HRD" />
            </div>
            <div className="space-y-2">
              <Label>Hosting School</Label>
              <Input value={basicInfo.school} onChange={(e) => setBasicInfo({ ...basicInfo, school: e.target.value })} placeholder="e.g., School of Business" />
            </div>
            <div className="space-y-2">
              <Label>Total Credits *</Label>
              <Input type="number" value={basicInfo.total_credits_required} onChange={(e) => setBasicInfo({ ...basicInfo, total_credits_required: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prerequisite Warning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Prerequisite Warning
          </CardTitle>
          <CardDescription>Note any hidden prerequisites that students should be aware of</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={basicInfo.prerequisite_note} onChange={(e) => setBasicInfo({ ...basicInfo, prerequisite_note: e.target.value })} placeholder="e.g., CSC 1401 is a prerequisite for this minor but may not be in your major's core courses." rows={3} />
        </CardContent>
      </Card>

      {/* Course Allocation with DnD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Course Allocation
          </CardTitle>
          <CardDescription>Drag courses between zones. Drag back to search to remove.</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-3 gap-6">
              {/* Course Search */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><Search className="h-4 w-4" />Available Courses</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search by code or title..." value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} className="pl-9" />
                </div>
                <DroppableZone id="search" className="border-muted bg-muted/20" emptyMessage="All courses allocated">
                  {availableCourses.length > 0 && (
                    <ScrollArea className="h-[260px]">
                      <div className="space-y-2 pr-2">
                        {availableCourses.slice(0, 30).map((c) => (
                          <DraggableCourse key={c.course_id} course={c} zone="search" />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </DroppableZone>
              </div>

              {/* Core Courses */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <BookOpen className="h-4 w-4" />
                  Core Courses ({coreCourses.length} • {coreCredits} SCH)
                </Label>
                <p className="text-xs text-muted-foreground">Everyone must take these</p>
                <DroppableZone id="core" className="border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10" emptyMessage="Drop core courses here">
                  {coreCourses.length > 0 && (
                    <ScrollArea className="h-[260px]">
                      <div className="space-y-2 pr-2">
                        {coreCourses.map((c) => (
                          <DraggableCourse key={c.course_id} course={c} zone="core" />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </DroppableZone>
              </div>

              {/* Choice Courses */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <BookOpen className="h-4 w-4" />
                  Choice Courses ({choiceCourses.length} • {choiceCredits} SCH)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Pick</span>
                  <Input type="number" value={choiceCount} onChange={(e) => setChoiceCount(parseInt(e.target.value) || 1)} className="w-16 h-8" min={1} max={choiceCourses.length || 1} />
                  <span className="text-sm">from list</span>
                </div>
                <DroppableZone id="choice" className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10" emptyMessage="Drop choice courses here">
                  {choiceCourses.length > 0 && (
                    <ScrollArea className="h-[220px]">
                      <div className="space-y-2 pr-2">
                        {choiceCourses.map((c) => (
                          <DraggableCourse key={c.course_id} course={c} zone="choice" />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </DroppableZone>
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
              {activeCourse && <DragOverlayCard course={activeCourse} />}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}
