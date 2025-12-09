"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, X, ChevronDown, ChevronRight, ClipboardList, BookOpen, Settings, GripVertical } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Course { course_id: number; course_code: string; title: string; credits: number; }

interface RequirementGroup {
  id: string;
  name: string;
  credits_required: number;
  min_courses_required: number;
  courses: Array<{ course_id: number; course_code: string; title: string; credits: number; is_mandatory: boolean; }>;
}

interface Minor { program_id: number; name: string; code: string; }

// Draggable Course Card
function DraggableCourse({ course, zone, groupId }: { course: Course; zone: "search" | "group"; groupId?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${zone}-${groupId || "main"}-${course.course_id}`,
    data: { course, sourceZone: zone, sourceGroupId: groupId },
  });

  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 1000 } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn("flex items-center gap-2 p-2 bg-background border rounded-md cursor-grab transition-all hover:shadow-md hover:border-primary/50", isDragging && "opacity-50 shadow-lg scale-105")}>
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm">{course.course_code}</span>
          <Badge variant="outline" className="text-xs">{course.credits}</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{course.title}</p>
      </div>
    </div>
  );
}

function DragOverlayCard({ course }: { course: Course }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-background border-2 border-primary rounded-md shadow-xl cursor-grabbing">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1"><span className="font-mono font-semibold text-sm">{course.course_code}</span><Badge variant="outline" className="text-xs ml-2">{course.credits}</Badge></div>
    </div>
  );
}

function DroppableZone({ id, children, className, emptyMessage }: { id: string; children: React.ReactNode; className?: string; emptyMessage: string }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn("min-h-[200px] border-2 border-dashed rounded-lg p-2 transition-all duration-200", isOver && "scale-[1.02] border-primary bg-primary/5 shadow-lg", className)}>
      {children || <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50"><BookOpen className="h-10 w-10 mb-2" /><p className="text-sm">{emptyMessage}</p></div>}
    </div>
  );
}

const SCHOOLS = ["SBA", "SHSS", "SSE"];

export default function NewMajorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [minors, setMinors] = useState<Minor[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  const [basicInfo, setBasicInfo] = useState({ name: "", code: "", school: "SBA", total_credits_required: 130, catalog_year: "2024-2026", free_electives_credits: 0 });
  const [requirementGroups, setRequirementGroups] = useState<RequirementGroup[]>([]);
  const [rules, setRules] = useState({ minor_required: "NO" as "YES" | "NO" | "CONDITIONAL", minor_required_note: "", concentrations_available: "NOT_AVAILABLE" as "REQUIRED" | "OPTIONAL" | "NOT_AVAILABLE", minor_rule_type: "NONE" as "NONE" | "ALLOWED" | "FORBIDDEN", selected_minors: [] as number[] });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { loadCourses(); loadMinors(); }, []);

  async function loadCourses() { try { const res = await fetch("/api/admin/courses?active=true"); if (res.ok) setCourses((await res.json()).courses || []); } catch { } }
  async function loadMinors() { try { const res = await fetch("/api/admin/programs?type=MINOR"); if (res.ok) setMinors((await res.json()).programs || []); } catch { } }

  const addRequirementGroup = () => {
    const newGroup: RequirementGroup = { id: `temp-${Date.now()}`, name: "", credits_required: 0, min_courses_required: 0, courses: [] };
    setRequirementGroups([...requirementGroups, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  const updateRequirementGroup = (id: string, updates: Partial<RequirementGroup>) => setRequirementGroups(groups => groups.map(g => g.id === id ? { ...g, ...updates } : g));
  const removeRequirementGroup = (id: string) => { setRequirementGroups(groups => groups.filter(g => g.id !== id)); if (activeGroupId === id) setActiveGroupId(null); };

  const toggleCourseMandatory = (groupId: string, courseId: number) => setRequirementGroups(groups => groups.map(g => g.id === groupId ? { ...g, courses: g.courses.map(c => c.course_id === courseId ? { ...c, is_mandatory: !c.is_mandatory } : c) } : g));

  const filteredCourses = courses.filter(c => c.course_code.toLowerCase().includes(courseSearch.toLowerCase()) || c.title.toLowerCase().includes(courseSearch.toLowerCase()));

  // Get all allocated course IDs across all groups
  const allocatedCourseIds = new Set(requirementGroups.flatMap(g => g.courses.map(c => c.course_id)));
  const availableCourses = filteredCourses.filter(c => !allocatedCourseIds.has(c.course_id));

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { course: Course };
    setActiveCourse(data?.course || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCourse(null);
    const { active, over } = event;
    if (!over || !active.data.current) return;

    const { course, sourceZone, sourceGroupId } = active.data.current as { course: Course; sourceZone: string; sourceGroupId?: string };
    const targetId = over.id as string;

    // Parse target: "search" or "group-{groupId}"
    if (targetId === "search") {
      // Remove from source group
      if (sourceZone === "group" && sourceGroupId) {
        setRequirementGroups(groups => groups.map(g => g.id === sourceGroupId ? { ...g, courses: g.courses.filter(c => c.course_id !== course.course_id) } : g));
      }
      return;
    }

    if (targetId.startsWith("group-")) {
      const targetGroupId = targetId.replace("group-", "");
      // Remove from source
      if (sourceZone === "group" && sourceGroupId) {
        setRequirementGroups(groups => groups.map(g => g.id === sourceGroupId ? { ...g, courses: g.courses.filter(c => c.course_id !== course.course_id) } : g));
      }
      // Add to target
      setRequirementGroups(groups => groups.map(g => {
        if (g.id === targetGroupId && !g.courses.find(c => c.course_id === course.course_id)) {
          return { ...g, courses: [...g.courses, { ...course, is_mandatory: true }] };
        }
        return g;
      }));
    }
  };

  const handleSubmit = async () => {
    if (!basicInfo.name || !basicInfo.code) { toast.error("Program name and code are required"); return; }
    setLoading(true);
    try {
      const programRes = await fetch("/api/admin/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...basicInfo, type: "MAJOR", minor_required: rules.minor_required, concentrations_available: rules.concentrations_available }) });
      if (!programRes.ok) throw new Error((await programRes.json()).error || "Failed");
      const { program_id } = await programRes.json();

      for (const group of requirementGroups) {
        if (!group.name) continue;
        const groupRes = await fetch(`/api/admin/programs/${program_id}/requirements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: group.name, credits_required: group.credits_required, min_courses_required: group.min_courses_required }) });
        if (groupRes.ok) {
          const { group_id } = await groupRes.json();
          for (const course of group.courses) await fetch(`/api/admin/programs/${program_id}/requirements/${group_id}/courses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course_id: course.course_id, is_mandatory: course.is_mandatory }) });
        }
      }

      if (rules.minor_rule_type !== "NONE" && rules.selected_minors.length > 0) {
        for (const minorId of rules.selected_minors) await fetch(`/api/admin/programs/${program_id}/minor-rules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ minor_program_id: minorId, rule_type: rules.minor_rule_type }) });
      }

      toast.success("Major created successfully");
      router.push("/dashboard/admin/programs");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); } finally { setLoading(false); }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight">Create New Major</h1><p className="text-muted-foreground">Define a new major program with course requirements and rules</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/admin/programs")}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{loading ? "Creating..." : "Create Major"}</Button>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Basic Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Program Name *</Label><Input value={basicInfo.name} onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })} placeholder="e.g., Bachelor of Business Administration" /></div>
              <div className="space-y-2"><Label>Program Code *</Label><Input value={basicInfo.code} onChange={e => setBasicInfo({ ...basicInfo, code: e.target.value })} placeholder="e.g., BBA" /></div>
              <div className="space-y-2"><Label>School/Department *</Label><Select value={basicInfo.school} onValueChange={v => setBasicInfo({ ...basicInfo, school: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Total Credits *</Label><Input type="number" value={basicInfo.total_credits_required} onChange={e => setBasicInfo({ ...basicInfo, total_credits_required: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Catalog Year</Label><Input value={basicInfo.catalog_year} onChange={e => setBasicInfo({ ...basicInfo, catalog_year: e.target.value })} placeholder="e.g., 2024-2026" /></div>
              <div className="space-y-2"><Label>Free Electives Credits</Label><Input type="number" value={basicInfo.free_electives_credits} onChange={e => setBasicInfo({ ...basicInfo, free_electives_credits: parseInt(e.target.value) || 0 })} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Course Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Course Categories (Buckets)</CardTitle>
            <Button size="sm" onClick={addRequirementGroup}><Plus className="mr-2 h-4 w-4" />Add Category</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {/* Available Courses */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><Search className="h-4 w-4" />Available Courses</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} className="pl-9" /></div>
                <DroppableZone id="search" className="border-muted bg-muted/20 min-h-[300px]" emptyMessage="All courses allocated">
                  {availableCourses.length > 0 && (
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-1.5 pr-2">{availableCourses.slice(0, 25).map(c => <DraggableCourse key={c.course_id} course={c} zone="search" />)}</div>
                    </ScrollArea>
                  )}
                </DroppableZone>
              </div>

              {/* Requirement Groups */}
              <div className="col-span-3 space-y-3">
                {requirementGroups.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg"><BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No categories defined. Click "Add Category" to start.</p></div>
                ) : (
                  <div className="space-y-3">
                    {requirementGroups.map(group => (
                      <Collapsible key={group.id} open={activeGroupId === group.id} onOpenChange={open => setActiveGroupId(open ? group.id : null)}>
                        <div className="border rounded-lg overflow-hidden">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 cursor-pointer hover:bg-muted">
                              {activeGroupId === group.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <Input value={group.name} onChange={e => updateRequirementGroup(group.id, { name: e.target.value })} placeholder="Category Name" onClick={e => e.stopPropagation()} className="flex-1 font-medium" />
                              <div className="flex items-center gap-2 bg-background rounded px-2 py-1"><span className="text-xs text-muted-foreground">Credits:</span><Input type="number" value={group.credits_required} onChange={e => updateRequirementGroup(group.id, { credits_required: parseInt(e.target.value) || 0 })} onClick={e => e.stopPropagation()} className="w-14 h-7 text-sm" /></div>
                              <Badge variant="secondary">{group.courses.length} courses</Badge>
                              <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); removeRequirementGroup(group.id); }}><X className="h-4 w-4" /></Button>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-3 border-t bg-background">
                              <DroppableZone id={`group-${group.id}`} className="border-primary/30 bg-primary/5 min-h-[120px]" emptyMessage="Drop courses here">
                                {group.courses.length > 0 && (
                                  <div className="space-y-1.5">
                                    {group.courses.map(course => (
                                      <div key={course.course_id} className="flex items-center gap-2 p-2 bg-background border rounded-md">
                                        <DraggableCourse course={course} zone="group" groupId={group.id} />
                                        <div className="flex items-center gap-1 ml-auto shrink-0">
                                          <Checkbox checked={course.is_mandatory} onCheckedChange={() => toggleCourseMandatory(group.id, course.course_id)} />
                                          <Label className="text-xs">Req</Label>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </DroppableZone>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration & Rules */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />Configuration & Rules</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Is a Minor Required?</Label>
                <RadioGroup value={rules.minor_required} onValueChange={(v: "YES" | "NO" | "CONDITIONAL") => setRules({ ...rules, minor_required: v })} className="flex gap-4">
                  {(["NO", "YES", "CONDITIONAL"] as const).map(opt => <div key={opt} className="flex items-center gap-2"><RadioGroupItem value={opt} id={`minor-${opt}`} /><Label htmlFor={`minor-${opt}`}>{opt === "CONDITIONAL" ? "Conditional" : opt}</Label></div>)}
                </RadioGroup>
                {rules.minor_required === "CONDITIONAL" && <Textarea value={rules.minor_required_note} onChange={e => setRules({ ...rules, minor_required_note: e.target.value })} placeholder="e.g., Not required if student takes a second concentration" />}
              </div>
              <div className="space-y-3">
                <Label>Are Concentrations Available?</Label>
                <RadioGroup value={rules.concentrations_available} onValueChange={(v: "REQUIRED" | "OPTIONAL" | "NOT_AVAILABLE") => setRules({ ...rules, concentrations_available: v })} className="flex gap-4">
                  {(["NOT_AVAILABLE", "OPTIONAL", "REQUIRED"] as const).map(opt => <div key={opt} className="flex items-center gap-2"><RadioGroupItem value={opt} id={`conc-${opt}`} /><Label htmlFor={`conc-${opt}`}>{opt === "NOT_AVAILABLE" ? "None" : opt}</Label></div>)}
                </RadioGroup>
              </div>
              <div className="col-span-2 space-y-3">
                <Label>Allowed/Forbidden Minors</Label>
                <RadioGroup value={rules.minor_rule_type} onValueChange={(v: "NONE" | "ALLOWED" | "FORBIDDEN") => setRules({ ...rules, minor_rule_type: v, selected_minors: [] })} className="flex gap-4">
                  {(["NONE", "ALLOWED", "FORBIDDEN"] as const).map(opt => <div key={opt} className="flex items-center gap-2"><RadioGroupItem value={opt} id={`rule-${opt}`} /><Label htmlFor={`rule-${opt}`}>{opt === "NONE" ? "No Restrictions" : opt === "ALLOWED" ? "Whitelist" : "Blacklist"}</Label></div>)}
                </RadioGroup>
                {rules.minor_rule_type !== "NONE" && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                    {minors.map(minor => {
                      const isSelected = rules.selected_minors.includes(minor.program_id);
                      return <Badge key={minor.program_id} variant={isSelected ? (rules.minor_rule_type === "ALLOWED" ? "default" : "destructive") : "outline"} className="cursor-pointer" onClick={() => setRules({ ...rules, selected_minors: isSelected ? rules.selected_minors.filter(id => id !== minor.program_id) : [...rules.selected_minors, minor.program_id] })}>{minor.code || minor.name}</Badge>;
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
          {activeCourse && <DragOverlayCard course={activeCourse} />}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
