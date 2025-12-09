"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Loader2, X, ChevronDown, ChevronRight, ClipboardList, BookOpen, Settings } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Course {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
}

interface RequirementGroup {
  id: string | number;
  group_id?: number;
  name: string;
  credits_required: number;
  min_courses_required: number;
  courses: Array<{
    course_id: number;
    course_code: string;
    title: string;
    credits: number;
    is_mandatory: boolean;
  }>;
  isNew?: boolean;
}

interface Minor {
  program_id: number;
  name: string;
  code: string;
}

const SCHOOLS = ["SBA", "SHSS", "SSE"];

export default function EditMajorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [minors, setMinors] = useState<Minor[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [activeGroupId, setActiveGroupId] = useState<string | number | null>(null);

  const [basicInfo, setBasicInfo] = useState({
    name: "",
    code: "",
    school: "SBA",
    total_credits_required: 130,
    catalog_year: "2024-2026",
    free_electives_credits: 0,
  });

  const [requirementGroups, setRequirementGroups] = useState<RequirementGroup[]>([]);

  const [rules, setRules] = useState({
    minor_required: "NO" as "YES" | "NO" | "CONDITIONAL",
    minor_required_note: "",
    concentrations_available: "NOT_AVAILABLE" as "REQUIRED" | "OPTIONAL" | "NOT_AVAILABLE",
    minor_rule_type: "NONE" as "NONE" | "ALLOWED" | "FORBIDDEN",
    selected_minors: [] as number[],
  });

  const programId = parseInt(id, 10);

  useEffect(() => {
    if (!isNaN(programId)) {
      loadProgram();
      loadCourses();
      loadMinors();
    }
  }, [programId]);

  async function loadProgram() {
    try {
      const programRes = await fetch(`/api/admin/programs/${programId}`);
      if (!programRes.ok) {
        if (programRes.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load program");
      }
      const { program } = await programRes.json();

      setBasicInfo({
        name: program.name,
        code: program.code || "",
        school: program.school || "SBA",
        total_credits_required: program.total_credits_required,
        catalog_year: program.catalog_year || "",
        free_electives_credits: program.free_electives_credits || 0,
      });

      setRules((prev) => ({
        ...prev,
        minor_required: program.minor_required || "NO",
        concentrations_available: program.concentrations_available || "NOT_AVAILABLE",
      }));

      // Load requirement groups
      const requirementsRes = await fetch(`/api/admin/programs/${programId}/requirements`);
      if (requirementsRes.ok) {
        const { requirement_groups: groups } = await requirementsRes.json();
        setRequirementGroups(
          groups.map((g: RequirementGroup & { group_id: number }) => ({
            id: g.group_id,
            group_id: g.group_id,
            name: g.name,
            credits_required: g.credits_required,
            min_courses_required: g.min_courses_required,
            courses: g.courses || [],
            isNew: false,
          }))
        );
      }

      // Load minor rules
      const rulesRes = await fetch(`/api/admin/programs/${programId}/minor-rules`);
      if (rulesRes.ok) {
        const { rules: minorRules } = await rulesRes.json();
        if (minorRules.length > 0) {
          setRules((prev) => ({
            ...prev,
            minor_rule_type: minorRules[0].rule_type,
            selected_minors: minorRules.map((r: { minor_program_id: number }) => r.minor_program_id),
          }));
        }
      }
    } catch {
      toast.error("Failed to load program");
    } finally {
      setLoading(false);
    }
  }

  async function loadCourses() {
    try {
      const res = await fetch("/api/admin/courses?active=true");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    }
  }

  async function loadMinors() {
    try {
      const res = await fetch("/api/admin/programs?type=MINOR");
      if (res.ok) {
        const data = await res.json();
        setMinors(data.programs || []);
      }
    } catch (err) {
      console.error("Failed to load minors:", err);
    }
  }

  const addRequirementGroup = () => {
    const newGroup: RequirementGroup = {
      id: `temp-${Date.now()}`,
      name: "",
      credits_required: 0,
      min_courses_required: 0,
      courses: [],
      isNew: true,
    };
    setRequirementGroups([...requirementGroups, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  const updateRequirementGroup = (id: string | number, updates: Partial<RequirementGroup>) => {
    setRequirementGroups((groups) =>
      groups.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const removeRequirementGroup = async (id: string | number, groupId?: number) => {
    if (groupId) {
      try {
        await fetch(`/api/admin/programs/${programId}/requirements/${groupId}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete group:", err);
      }
    }
    setRequirementGroups((groups) => groups.filter((g) => g.id !== id));
    if (activeGroupId === id) {
      setActiveGroupId(null);
    }
  };

  const addCourseToGroup = (groupId: string | number, course: Course) => {
    setRequirementGroups((groups) =>
      groups.map((g) => {
        if (g.id === groupId && !g.courses.find((c) => c.course_id === course.course_id)) {
          return {
            ...g,
            courses: [...g.courses, { ...course, is_mandatory: true }],
          };
        }
        return g;
      })
    );
  };

  const removeCourseFromGroup = (groupId: string | number, courseId: number) => {
    setRequirementGroups((groups) =>
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            courses: g.courses.filter((c) => c.course_id !== courseId),
          };
        }
        return g;
      })
    );
  };

  const toggleCourseMandatory = (groupId: string | number, courseId: number) => {
    setRequirementGroups((groups) =>
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            courses: g.courses.map((c) =>
              c.course_id === courseId ? { ...c, is_mandatory: !c.is_mandatory } : c
            ),
          };
        }
        return g;
      })
    );
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.course_code.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!basicInfo.name || !basicInfo.code) {
      toast.error("Program name and code are required");
      return;
    }

    setSaving(true);

    try {
      // Update program
      const programRes = await fetch(`/api/admin/programs/${programId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: basicInfo.name,
          code: basicInfo.code,
          school: basicInfo.school,
          total_credits_required: basicInfo.total_credits_required,
          catalog_year: basicInfo.catalog_year,
          free_electives_credits: basicInfo.free_electives_credits,
          minor_required: rules.minor_required,
          concentrations_available: rules.concentrations_available,
        }),
      });

      if (!programRes.ok) {
        const data = await programRes.json();
        throw new Error(data.error || "Failed to update program");
      }

      // Handle requirement groups
      for (const group of requirementGroups) {
        if (group.isNew && group.name) {
          const groupRes = await fetch(`/api/admin/programs/${programId}/requirements`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: group.name,
              credits_required: group.credits_required,
              min_courses_required: group.min_courses_required,
            }),
          });

          if (groupRes.ok) {
            const { group_id } = await groupRes.json();
            for (const course of group.courses) {
              await fetch(`/api/admin/programs/${programId}/requirements/${group_id}/courses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  course_id: course.course_id,
                  is_mandatory: course.is_mandatory,
                }),
              });
            }
          }
        } else if (group.group_id && group.name) {
          await fetch(`/api/admin/programs/${programId}/requirements/${group.group_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: group.name,
              credits_required: group.credits_required,
              min_courses_required: group.min_courses_required,
            }),
          });
        }
      }

      toast.success("Major updated successfully");
      router.push("/dashboard/admin/programs");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update major");
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Major: {basicInfo.code}</h1>
          <p className="text-muted-foreground">
            Update program settings, course requirements and rules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/programs")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name *</Label>
              <Input
                id="name"
                value={basicInfo.name}
                onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Program Code *</Label>
              <Input
                id="code"
                value={basicInfo.code}
                onChange={(e) => setBasicInfo({ ...basicInfo, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">School/Department *</Label>
              <Select
                value={basicInfo.school}
                onValueChange={(value) => setBasicInfo({ ...basicInfo, school: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOLS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Total Credits Required *</Label>
              <Input
                id="credits"
                type="number"
                value={basicInfo.total_credits_required}
                onChange={(e) =>
                  setBasicInfo({ ...basicInfo, total_credits_required: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog_year">Catalog Year</Label>
              <Input
                id="catalog_year"
                value={basicInfo.catalog_year}
                onChange={(e) => setBasicInfo({ ...basicInfo, catalog_year: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="free_electives">Free Electives Credits</Label>
              <Input
                id="free_electives"
                type="number"
                value={basicInfo.free_electives_credits}
                onChange={(e) =>
                  setBasicInfo({ ...basicInfo, free_electives_credits: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Course Categories (Buckets)</CardTitle>
          <Button size="sm" onClick={addRequirementGroup}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {requirementGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No course categories defined yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requirementGroups.map((group) => (
                <Collapsible
                  key={group.id}
                  open={activeGroupId === group.id}
                  onOpenChange={(open) => setActiveGroupId(open ? group.id : null)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-4 p-4 bg-muted/50 cursor-pointer hover:bg-muted">
                        {activeGroupId === group.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Input
                          value={group.name}
                          onChange={(e) => updateRequirementGroup(group.id, { name: e.target.value })}
                          placeholder="Category Name"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground">Credits:</Label>
                          <Input
                            type="number"
                            value={group.credits_required}
                            onChange={(e) =>
                              updateRequirementGroup(group.id, {
                                credits_required: parseInt(e.target.value) || 0,
                              })
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-20"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRequirementGroup(group.id, group.group_id);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Add Courses</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search courses..."
                              value={courseSearch}
                              onChange={(e) => setCourseSearch(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                          <ScrollArea className="h-48 border rounded-md">
                            {filteredCourses.slice(0, 20).map((course) => (
                              <div
                                key={course.course_id}
                                className={`p-2 cursor-pointer hover:bg-muted border-b ${
                                  group.courses.find((c) => c.course_id === course.course_id)
                                    ? "bg-green-50 dark:bg-green-900/20"
                                    : ""
                                }`}
                                onClick={() => addCourseToGroup(group.id, course)}
                              >
                                <span className="font-mono font-semibold">{course.course_code}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({course.credits} SCH)
                                </span>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            Selected ({group.courses.length}) - {group.courses.reduce((s, c) => s + c.credits, 0)} SCH
                          </Label>
                          <ScrollArea className="h-56 border rounded-md">
                            {group.courses.map((course) => (
                              <div key={course.course_id} className="flex items-center justify-between p-2 border-b">
                                <span className="font-mono">{course.course_code}</span>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={course.is_mandatory}
                                    onCheckedChange={() => toggleCourseMandatory(group.id, course.course_id)}
                                  />
                                  <Label className="text-sm">Required</Label>
                                  <Button variant="ghost" size="sm" onClick={() => removeCourseFromGroup(group.id, course.course_id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration & Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />Configuration & Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Is a Minor Required?</Label>
              <RadioGroup
                value={rules.minor_required}
                onValueChange={(value: "YES" | "NO" | "CONDITIONAL") =>
                  setRules({ ...rules, minor_required: value })
                }
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="NO" id="minor-no" />
                  <Label htmlFor="minor-no">No</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="YES" id="minor-yes" />
                  <Label htmlFor="minor-yes">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="CONDITIONAL" id="minor-conditional" />
                  <Label htmlFor="minor-conditional">Conditional</Label>
                </div>
              </RadioGroup>
              {rules.minor_required === "CONDITIONAL" && (
                <Textarea
                  value={rules.minor_required_note}
                  onChange={(e) => setRules({ ...rules, minor_required_note: e.target.value })}
                  placeholder="e.g., Not required if student takes a second concentration"
                />
              )}
            </div>

            <div className="space-y-3">
              <Label>Are Concentrations Available?</Label>
              <RadioGroup
                value={rules.concentrations_available}
                onValueChange={(value: "REQUIRED" | "OPTIONAL" | "NOT_AVAILABLE") =>
                  setRules({ ...rules, concentrations_available: value })
                }
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="NOT_AVAILABLE" id="conc-none" />
                  <Label htmlFor="conc-none">None</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="OPTIONAL" id="conc-optional" />
                  <Label htmlFor="conc-optional">Optional</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="REQUIRED" id="conc-required" />
                  <Label htmlFor="conc-required">Required</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="col-span-2 space-y-3">
              <Label>Allowed/Forbidden Minors</Label>
              <RadioGroup
                value={rules.minor_rule_type}
                onValueChange={(value: "NONE" | "ALLOWED" | "FORBIDDEN") =>
                  setRules({ ...rules, minor_rule_type: value, selected_minors: [] })
                }
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="NONE" id="rule-none" />
                  <Label htmlFor="rule-none">No Restrictions</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="ALLOWED" id="rule-allowed" />
                  <Label htmlFor="rule-allowed">Whitelist</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="FORBIDDEN" id="rule-forbidden" />
                  <Label htmlFor="rule-forbidden">Blacklist</Label>
                </div>
              </RadioGroup>
              {rules.minor_rule_type !== "NONE" && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {minors.map((minor) => {
                    const isSelected = rules.selected_minors.includes(minor.program_id);
                    return (
                      <Badge
                        key={minor.program_id}
                        variant={isSelected ? (rules.minor_rule_type === "ALLOWED" ? "default" : "destructive") : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (isSelected) {
                            setRules({
                              ...rules,
                              selected_minors: rules.selected_minors.filter((id) => id !== minor.program_id),
                            });
                          } else {
                            setRules({
                              ...rules,
                              selected_minors: [...rules.selected_minors, minor.program_id],
                            });
                          }
                        }}
                      >
                        {minor.code || minor.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
