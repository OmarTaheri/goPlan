"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, Pencil, Trash2, Power, PowerOff, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Prerequisite {
  dependency_id: number;
  course_id: number;
  dependency_course_id: number | null;
  dependency_type: "PREREQUISITE" | "COREQUISITE" | "STATUS";
  required_status: string | null;
  prereq_code: string | null;
  prereq_title?: string | null;
  prereq_credits?: number | null;
}

interface PrerequisiteForm {
  dependency_course_id: number | null;
  dependency_type: "PREREQUISITE" | "COREQUISITE" | "STATUS";
  required_status: string;
}

interface Program {
  program_id: number;
  name: string;
  type: "MAJOR" | "MINOR" | "CONCENTRATION";
}

interface Course {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  description: string | null;
  is_active: boolean;
  prerequisites?: Prerequisite[];
  programs?: { program_id: number; name: string; type: string }[];
}

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  variant: "default" | "destructive";
  onConfirm: () => void;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [programFilter, setProgramFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    course_code: "",
    title: "",
    credits: 3,
    description: "",
  });
  const [prereqFormData, setPrereqFormData] = useState<PrerequisiteForm[]>([]);

  // Course detail sheet
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    variant: "default",
    onConfirm: () => {},
  });

  useEffect(() => {
    loadCourses();
  }, [showInactive, programFilter]);

  useEffect(() => {
    loadAllCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      let url = `/api/admin/courses?active=${!showInactive}`;
      if (programFilter && programFilter !== "all") {
        url += `&programId=${programFilter}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load courses");
      }
      const data = await res.json();
      setCourses(data.courses || []);
      setPrograms(data.programs || []);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  async function loadAllCourses() {
    try {
      const res = await fetch("/api/admin/courses?active=true");
      if (res.ok) {
        const data = await res.json();
        setAllCourses(data.courses || []);
      }
    } catch {
      console.error("Failed to load all courses");
    }
  }

  const filteredCourses = courses.filter(
    (c) =>
      c.course_code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  );

  const openNewModal = () => {
    setEditingCourse(null);
    setFormData({ course_code: "", title: "", credits: 3, description: "" });
    setPrereqFormData([]);
    setShowModal(true);
  };

  const openEditModal = async (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCourse(course);
    setFormData({
      course_code: course.course_code,
      title: course.title,
      credits: course.credits,
      description: course.description || "",
    });

    // Load prerequisites for this course
    try {
      const res = await fetch(`/api/admin/courses/${course.course_id}/prerequisites`);
      if (res.ok) {
        const data = await res.json();
        const prereqs = data.prerequisites || [];
        setPrereqFormData(
          prereqs.map((p: Prerequisite) => ({
            dependency_course_id: p.dependency_course_id,
            dependency_type: p.dependency_type,
            required_status: p.required_status || "",
          }))
        );
      } else {
        setPrereqFormData([]);
      }
    } catch {
      setPrereqFormData([]);
    }

    setShowModal(true);
  };

  const handleRowClick = (course: Course) => {
    setSelectedCourse(course);
    setShowDetailSheet(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCourse
        ? `/api/admin/courses/${editingCourse.course_id}`
        : "/api/admin/courses";
      const method = editingCourse ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save course");
        return;
      }

      const courseId = editingCourse ? editingCourse.course_id : data.course_id;

      // Save prerequisites
      if (courseId && prereqFormData.length > 0) {
        const prereqRes = await fetch(`/api/admin/courses/${courseId}/prerequisites`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prerequisites: prereqFormData.filter(
              (p) => (p.dependency_type === "STATUS" ? p.required_status : p.dependency_course_id)
            ),
          }),
        });

        if (!prereqRes.ok) {
          const prereqData = await prereqRes.json();
          toast.warning(prereqData.error || "Course saved but failed to save prerequisites");
          loadCourses();
          setShowModal(false);
          return;
        }
      } else if (courseId && editingCourse) {
        // Clear prerequisites if empty
        await fetch(`/api/admin/courses/${courseId}/prerequisites`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prerequisites: [] }),
        });
      }

      toast.success(editingCourse ? "Course updated successfully" : "Course created successfully");
      setShowModal(false);
      loadCourses();
    } catch {
      toast.error("Failed to save course");
    }
  };

  const handleInactivate = (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      open: true,
      title: "Deactivate Course",
      description: `Are you sure you want to deactivate "${course.course_code} - ${course.title}"? This will mark the course as inactive but not delete it.`,
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          const res = await fetch(`/api/admin/courses/${course.course_id}`, {
            method: "DELETE",
          });

          const data = await res.json();

          if (!res.ok) {
            toast.error(data.error || "Failed to deactivate course");
            return;
          }

          toast.success("Course deactivated successfully");
          loadCourses();
        } catch {
          toast.error("Failed to deactivate course");
        }
      },
    });
  };

  const handleActivate = async (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/courses/${course.course_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to activate course");
        return;
      }

      toast.success("Course activated successfully");
      loadCourses();
    } catch {
      toast.error("Failed to activate course");
    }
  };

  const handleDelete = (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      open: true,
      title: "Permanently Delete Course",
      description: `Are you sure you want to PERMANENTLY DELETE "${course.course_code}"? This action cannot be undone and will remove the course from all programs.`,
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          const res = await fetch(`/api/admin/courses/${course.course_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete" }),
          });

          const data = await res.json();

          if (!res.ok) {
            toast.error(data.error || "Failed to delete course");
            return;
          }

          toast.success("Course deleted permanently");
          loadCourses();
        } catch {
          toast.error("Failed to delete course");
        }
      },
    });
  };

  // Prerequisite form handlers
  const addPrerequisite = () => {
    setPrereqFormData([
      ...prereqFormData,
      { dependency_course_id: null, dependency_type: "PREREQUISITE", required_status: "" },
    ]);
  };

  const removePrerequisite = (index: number) => {
    setPrereqFormData(prereqFormData.filter((_, i) => i !== index));
  };

  const updatePrerequisite = (index: number, updates: Partial<PrerequisiteForm>) => {
    setPrereqFormData(prereqFormData.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  const getPrereqBadgeVariant = (type: string) => {
    switch (type) {
      case "PREREQUISITE":
        return "default";
      case "COREQUISITE":
        return "secondary";
      case "STATUS":
        return "outline";
      default:
        return "outline";
    }
  };

  const getProgramTypeLabel = (type: string) => {
    switch (type) {
      case "MAJOR":
        return "Major";
      case "MINOR":
        return "Minor";
      case "CONCENTRATION":
        return "Concentration";
      default:
        return type;
    }
  };

  const clearFilters = () => {
    setSearch("");
    setProgramFilter("all");
    setShowInactive(false);
  };

  const hasActiveFilters = search || programFilter !== "all" || showInactive;

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
            <p className="text-muted-foreground">Manage the course catalog</p>
          </div>
          <Button onClick={openNewModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by code or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.program_id} value={String(p.program_id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showInactive"
                  checked={showInactive}
                  onCheckedChange={(checked) => setShowInactive(checked === true)}
                />
                <Label htmlFor="showInactive" className="font-normal">
                  Show inactive
                </Label>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            {hasActiveFilters && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
                {showInactive && " including inactive"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card>
          <CardContent className="p-0">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {hasActiveFilters
                    ? "No courses found. Try adjusting your filters."
                    : "No courses yet. Add your first course to get started."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Prerequisites</TableHead>
                    <TableHead>Programs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow
                      key={course.course_id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(course)}
                    >
                      <TableCell className="font-mono font-semibold">{course.course_code}</TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {course.prerequisites && course.prerequisites.length > 0 ? (
                            course.prerequisites.map((prereq) => (
                              <Tooltip key={prereq.dependency_id}>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant={getPrereqBadgeVariant(prereq.dependency_type)}
                                    className="cursor-help"
                                  >
                                    {prereq.dependency_type === "STATUS"
                                      ? prereq.required_status
                                      : prereq.prereq_code}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm">
                                    <p className="font-semibold">{prereq.dependency_type}</p>
                                    {prereq.prereq_title && <p>{prereq.prereq_title}</p>}
                                    {prereq.prereq_credits && <p>{prereq.prereq_credits} credits</p>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {course.programs && course.programs.length > 0 ? (
                            <>
                              {course.programs.slice(0, 2).map((prog, idx) => (
                                <Tooltip key={idx}>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant={
                                        prog.type === "MAJOR"
                                          ? "default"
                                          : prog.type === "MINOR"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className="cursor-help"
                                    >
                                      {prog.type.charAt(0)}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm">
                                      <p className="font-semibold">{getProgramTypeLabel(prog.type)}</p>
                                      <p>{prog.name}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {course.programs.length > 2 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="cursor-help">
                                      +{course.programs.length - 2}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm space-y-1">
                                      {course.programs.slice(2).map((p, i) => (
                                        <p key={i}>
                                          <span className="font-semibold">{p.type}:</span> {p.name}
                                        </p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.is_active ? "default" : "outline"}>
                          {course.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={(e) => openEditModal(course, e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {course.is_active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleInactivate(course, e)}
                            >
                              <PowerOff className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={(e) => handleActivate(course, e)}>
                                <Power className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => handleDelete(course, e)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
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

        {/* Course Detail Sheet */}
        <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            {selectedCourse && (
              <div className="px-2 py-6">
                <SheetHeader className="pb-6">
                  <SheetTitle className="text-2xl font-mono">{selectedCourse.course_code}</SheetTitle>
                  <SheetDescription className="text-lg">{selectedCourse.title}</SheetDescription>
                </SheetHeader>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Credits</p>
                      <p className="text-lg font-semibold">{selectedCourse.credits}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge variant={selectedCourse.is_active ? "default" : "outline"} className="mt-1">
                        {selectedCourse.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  {selectedCourse.description && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">Description</p>
                        <p className="text-sm leading-relaxed">{selectedCourse.description}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Prerequisites */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">Prerequisites</p>
                    {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCourse.prerequisites.map((prereq) => (
                          <div
                            key={prereq.dependency_id}
                            className="flex items-center gap-3 p-4 rounded-lg bg-muted"
                          >
                            <Badge variant={getPrereqBadgeVariant(prereq.dependency_type)}>
                              {prereq.dependency_type}
                            </Badge>
                            <span className="font-mono text-sm">
                              {prereq.dependency_type === "STATUS"
                                ? prereq.required_status
                                : prereq.prereq_code}
                            </span>
                            {prereq.prereq_title && (
                              <span className="text-sm text-muted-foreground">
                                - {prereq.prereq_title}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No prerequisites</p>
                    )}
                  </div>

                  <Separator />

                  {/* Programs */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">Associated Programs</p>
                    {selectedCourse.programs && selectedCourse.programs.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCourse.programs.map((prog, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                            <Badge
                              variant={
                                prog.type === "MAJOR"
                                  ? "default"
                                  : prog.type === "MINOR"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {getProgramTypeLabel(prog.type)}
                            </Badge>
                            <span className="text-sm">{prog.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not assigned to any programs</p>
                    )}
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1"
                      onClick={(e) => {
                        openEditModal(selectedCourse, e);
                        setShowDetailSheet(false);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Course
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Confirm Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDialog.onConfirm}
                className={confirmDialog.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add/Edit Dialog */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Add Course"}</DialogTitle>
              <DialogDescription>
                {editingCourse ? "Update course details and prerequisites" : "Create a new course in the catalog"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course_code">Course Code *</Label>
                    <Input
                      id="course_code"
                      value={formData.course_code}
                      onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                      placeholder="e.g., CSC 1401"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits *</Label>
                    <Input
                      id="credits"
                      type="number"
                      value={formData.credits}
                      onChange={(e) =>
                        setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                      max="12"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Introduction to Programming"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Course description..."
                    rows={3}
                  />
                </div>

                {/* Prerequisites Section */}
                <Separator className="my-2" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Prerequisites</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPrerequisite}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Prerequisite
                    </Button>
                  </div>

                  {prereqFormData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No prerequisites added</p>
                  ) : (
                    <div className="space-y-3">
                      {prereqFormData.map((prereq, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                          <Select
                            value={prereq.dependency_type}
                            onValueChange={(value: "PREREQUISITE" | "COREQUISITE" | "STATUS") =>
                              updatePrerequisite(index, { dependency_type: value })
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PREREQUISITE">Prerequisite</SelectItem>
                              <SelectItem value="COREQUISITE">Corequisite</SelectItem>
                              <SelectItem value="STATUS">Status</SelectItem>
                            </SelectContent>
                          </Select>

                          {prereq.dependency_type === "STATUS" ? (
                            <Input
                              placeholder="e.g., JUNIOR"
                              value={prereq.required_status}
                              onChange={(e) =>
                                updatePrerequisite(index, { required_status: e.target.value })
                              }
                              className="flex-1"
                            />
                          ) : (
                            <Select
                              value={prereq.dependency_course_id?.toString() || ""}
                              onValueChange={(value) =>
                                updatePrerequisite(index, {
                                  dependency_course_id: value ? parseInt(value) : null,
                                })
                              }
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select course..." />
                              </SelectTrigger>
                              <SelectContent>
                                {allCourses
                                  .filter((c) => c.course_id !== editingCourse?.course_id)
                                  .map((c) => (
                                    <SelectItem key={c.course_id} value={c.course_id.toString()}>
                                      {c.course_code} - {c.title}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePrerequisite(index)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingCourse ? "Save Changes" : "Create Course"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
