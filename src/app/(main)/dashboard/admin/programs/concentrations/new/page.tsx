"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ClipboardList, BookOpen, GripVertical } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Course { course_id: number; course_code: string; title: string; credits: number; }
interface Major { program_id: number; name: string; code: string; }

// Draggable Course Card Component
function DraggableCourse({ course, zone }: { course: Course; zone: "search" | "required" | "optional" }) {
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
function DroppableZone({ id, children, className, emptyMessage }: { id: string; children: React.ReactNode; className?: string; emptyMessage: string; }) {
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
          <BookOpen className="h-12 w-12 mb-3" />
          <p className="font-medium text-sm">{emptyMessage}</p>
          <p className="text-xs">Drag courses here</p>
        </div>
      )}
    </div>
  );
}

export default function NewConcentrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  const [basicInfo, setBasicInfo] = useState({ name: "", code: "", parent_program_id: 0, total_credits_required: 15 });
  const [requiredCourses, setRequiredCourses] = useState<Course[]>([]);
  const [optionalCourses, setOptionalCourses] = useState<Course[]>([]);
  const [optionalCount, setOptionalCount] = useState(4);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { loadCourses(); loadMajors(); }, []);

  async function loadCourses() {
    try { const res = await fetch("/api/admin/courses?active=true"); if (res.ok) setCourses((await res.json()).courses || []); } catch { }
  }

  async function loadMajors() {
    try { const res = await fetch("/api/admin/programs?type=MAJOR"); if (res.ok) setMajors((await res.json()).programs || []); } catch { }
  }

  const filteredCourses = courses.filter(c => c.course_code.toLowerCase().includes(courseSearch.toLowerCase()) || c.title.toLowerCase().includes(courseSearch.toLowerCase()));
  const availableCourses = filteredCourses.filter(c => !requiredCourses.find(x => x.course_id === c.course_id) && !optionalCourses.find(x => x.course_id === c.course_id));

  const requiredCredits = requiredCourses.reduce((s, c) => s + c.credits, 0);
  const optionalCredits = optionalCourses.reduce((s, c) => s + c.credits, 0);

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
      if (sourceZone === "required") setRequiredCourses((prev) => prev.filter((c) => c.course_id !== course.course_id));
      if (sourceZone === "optional") setOptionalCourses((prev) => prev.filter((c) => c.course_id !== course.course_id));
      return;
    }

    // Remove from source zone first
    if (sourceZone === "required") setRequiredCourses((prev) => prev.filter((c) => c.course_id !== course.course_id));
    if (sourceZone === "optional") setOptionalCourses((prev) => prev.filter((c) => c.course_id !== course.course_id));

    // Add to target zone
    if (targetZone === "required") {
      setRequiredCourses((prev) => prev.find((c) => c.course_id === course.course_id) ? prev : [...prev, course]);
    } else if (targetZone === "optional") {
      setOptionalCourses((prev) => prev.find((c) => c.course_id === course.course_id) ? prev : [...prev, course]);
    }
  };

  const handleSubmit = async () => {
    if (!basicInfo.name || !basicInfo.parent_program_id) { toast.error("Name and parent major required"); return; }
    if (requiredCourses.length === 0 && optionalCourses.length === 0) { toast.error("Add at least one course"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basicInfo, type: "CONCENTRATION" }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const { program_id } = await res.json();

      if (requiredCourses.length > 0) {
        const groupRes = await fetch(`/api/admin/programs/${program_id}/requirements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Required Courses", credits_required: requiredCredits, min_courses_required: requiredCourses.length }) });
        if (groupRes.ok) {
          const { group_id } = await groupRes.json();
          for (const c of requiredCourses) await fetch(`/api/admin/programs/${program_id}/requirements/${group_id}/courses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course_id: c.course_id, is_mandatory: true }) });
        }
      }

      if (optionalCourses.length > 0) {
        const groupRes = await fetch(`/api/admin/programs/${program_id}/requirements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `Select ${optionalCount} course(s)`, credits_required: optionalCount * 3, min_courses_required: optionalCount }) });
        if (groupRes.ok) {
          const { group_id } = await groupRes.json();
          for (const c of optionalCourses) await fetch(`/api/admin/programs/${program_id}/requirements/${group_id}/courses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course_id: c.course_id, is_mandatory: false }) });
        }
      }

      toast.success("Concentration created");
      router.push("/dashboard/admin/programs");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Concentration</h1>
          <p className="text-muted-foreground">Define a concentration program with course requirements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/programs")}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{loading ? "Creating..." : "Create Concentration"}</Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Basic Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2"><Label>Concentration Name *</Label><Input value={basicInfo.name} onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })} placeholder="e.g., Finance" /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={basicInfo.code} onChange={e => setBasicInfo({ ...basicInfo, code: e.target.value })} placeholder="e.g., CONC-FIN" /></div>
            <div className="space-y-2"><Label>Parent Major *</Label><Select value={basicInfo.parent_program_id.toString()} onValueChange={v => setBasicInfo({ ...basicInfo, parent_program_id: parseInt(v) || 0 })}><SelectTrigger><SelectValue placeholder="Select major..." /></SelectTrigger><SelectContent>{majors.map(m => <SelectItem key={m.program_id} value={m.program_id.toString()}>{m.code || m.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Total Credits *</Label><Input type="number" value={basicInfo.total_credits_required} onChange={e => setBasicInfo({ ...basicInfo, total_credits_required: parseInt(e.target.value) || 0 })} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Course Allocation */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Course Allocation</CardTitle><CardDescription>Drag courses between zones. Drag back to search to remove.</CardDescription></CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-3 gap-6">
              {/* Course Search */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><Search className="h-4 w-4" />Available Courses</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} className="pl-9" /></div>
                <DroppableZone id="search" className="border-muted bg-muted/20" emptyMessage="All courses allocated">
                  {availableCourses.length > 0 && (
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-2 pr-2">
                        {availableCourses.slice(0, 30).map(c => <DraggableCourse key={c.course_id} course={c} zone="search" />)}
                      </div>
                    </ScrollArea>
                  )}
                </DroppableZone>
              </div>

              {/* Required Courses */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-green-700 dark:text-green-400"><BookOpen className="h-4 w-4" />Required Courses ({requiredCourses.length} • {requiredCredits} SCH)</Label>
                <p className="text-xs text-muted-foreground">All courses here must be taken</p>
                <DroppableZone id="required" className="border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10" emptyMessage="Drop required courses here">
                  {requiredCourses.length > 0 && (
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-2 pr-2">
                        {requiredCourses.map(c => <DraggableCourse key={c.course_id} course={c} zone="required" />)}
                      </div>
                    </ScrollArea>
                  )}
                </DroppableZone>
              </div>

              {/* Optional Courses */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-amber-700 dark:text-amber-400"><BookOpen className="h-4 w-4" />Optional Pool ({optionalCourses.length} • {optionalCredits} SCH)</Label>
                <div className="flex items-center gap-2"><span className="text-sm">Select</span><Input type="number" value={optionalCount} onChange={e => setOptionalCount(parseInt(e.target.value) || 1)} className="w-16 h-8" min={1} max={optionalCourses.length || 1} /><span className="text-sm">course(s)</span></div>
                <DroppableZone id="optional" className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10" emptyMessage="Drop optional courses here">
                  {optionalCourses.length > 0 && (
                    <ScrollArea className="h-[240px]">
                      <div className="space-y-2 pr-2">
                        {optionalCourses.map(c => <DraggableCourse key={c.course_id} course={c} zone="optional" />)}
                      </div>
                    </ScrollArea>
                  )}
                </DroppableZone>
              </div>
            </div>

            <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
              {activeCourse && <DragOverlayCard course={activeCourse} />}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}
