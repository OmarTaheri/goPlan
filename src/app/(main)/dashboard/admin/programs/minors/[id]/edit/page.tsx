"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X, ClipboardList, AlertTriangle, BookOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Course {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
}

export default function EditMinorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [basicInfo, setBasicInfo] = useState({ name: "", code: "", school: "", total_credits_required: 15, prerequisite_note: "" });
  const [mandatoryCourses, setMandatoryCourses] = useState<Course[]>([]);
  const [optionalPool, setOptionalPool] = useState<Course[]>([]);
  const [optionalCount, setOptionalCount] = useState(2);
  const programId = parseInt(id, 10);

  useEffect(() => { if (!isNaN(programId)) { loadProgram(); loadCourses(); } }, [programId]);

  async function loadProgram() {
    try {
      const res = await fetch(`/api/admin/programs/${programId}`);
      if (!res.ok) { router.push(res.status === 401 ? "/login" : "/dashboard/admin/programs"); return; }
      const { program } = await res.json();
      setBasicInfo({ name: program.name, code: program.code || "", school: program.school || "", total_credits_required: program.total_credits_required, prerequisite_note: program.prerequisite_note || "" });
      const reqRes = await fetch(`/api/admin/programs/${programId}/requirements`);
      if (reqRes.ok) {
        const { requirement_groups } = await reqRes.json();
        for (const g of requirement_groups) { g.name === "Core Courses" ? setMandatoryCourses(g.courses || []) : (setOptionalPool(g.courses || []), setOptionalCount(g.min_courses_required || 2)); }
      }
    } catch { toast.error("Failed to load program"); } finally { setLoading(false); }
  }

  async function loadCourses() { try { const res = await fetch("/api/admin/courses?active=true"); if (res.ok) setCourses((await res.json()).courses || []); } catch { } }

  const filteredCourses = courses.filter(c => c.course_code.toLowerCase().includes(courseSearch.toLowerCase()) || c.title.toLowerCase().includes(courseSearch.toLowerCase()));
  const addToMandatory = (c: Course) => { if (!mandatoryCourses.find(x => x.course_id === c.course_id)) { setMandatoryCourses([...mandatoryCourses, c]); setOptionalPool(optionalPool.filter(x => x.course_id !== c.course_id)); } };
  const addToOptional = (c: Course) => { if (!optionalPool.find(x => x.course_id === c.course_id) && !mandatoryCourses.find(x => x.course_id === c.course_id)) setOptionalPool([...optionalPool, c]); };
  const mandatoryCredits = mandatoryCourses.reduce((s, c) => s + c.credits, 0);

  const handleSubmit = async () => {
    if (!basicInfo.name) { toast.error("Minor name required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/programs/${programId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(basicInfo) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Minor updated"); router.push("/dashboard/admin/programs");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Edit Minor: {basicInfo.name}</h1><p className="text-muted-foreground">Update settings and courses</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => router.push("/dashboard/admin/programs")}>Cancel</Button><Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
      </div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Basic Info</CardTitle></CardHeader><CardContent><div className="grid grid-cols-4 gap-4">
        <div className="space-y-2"><Label>Name *</Label><Input value={basicInfo.name} onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })} /></div>
        <div className="space-y-2"><Label>Code</Label><Input value={basicInfo.code} onChange={e => setBasicInfo({ ...basicInfo, code: e.target.value })} /></div>
        <div className="space-y-2"><Label>School</Label><Input value={basicInfo.school} onChange={e => setBasicInfo({ ...basicInfo, school: e.target.value })} /></div>
        <div className="space-y-2"><Label>Credits *</Label><Input type="number" value={basicInfo.total_credits_required} onChange={e => setBasicInfo({ ...basicInfo, total_credits_required: parseInt(e.target.value) || 0 })} /></div>
      </div></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Prerequisite</CardTitle></CardHeader><CardContent><Textarea value={basicInfo.prerequisite_note} onChange={e => setBasicInfo({ ...basicInfo, prerequisite_note: e.target.value })} rows={2} /></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Courses</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-4">
        <div><Label>Search</Label><Input placeholder="Search..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} className="mb-2" /><ScrollArea className="h-60 border rounded">{filteredCourses.slice(0, 30).map(c => <div key={c.course_id} className="p-2 border-b flex justify-between"><span>{c.course_code}</span><div className="flex gap-1"><Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => addToMandatory(c)}>Core</Button><Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => addToOptional(c)}>Choice</Button></div></div>)}</ScrollArea></div>
        <div><Label className="text-green-700">Core ({mandatoryCourses.length} • {mandatoryCredits} SCH)</Label><ScrollArea className="h-60 border-2 border-dashed border-green-300 rounded p-2">{mandatoryCourses.map(c => <div key={c.course_id} className="flex justify-between p-1"><span>{c.course_code}</span><Button size="sm" variant="ghost" onClick={() => setMandatoryCourses(mandatoryCourses.filter(x => x.course_id !== c.course_id))}><X className="h-4 w-4" /></Button></div>)}</ScrollArea></div>
        <div><Label className="text-orange-700">Choice ({optionalPool.length})</Label><div className="flex gap-2 mb-2"><span className="text-sm">Pick</span><Input type="number" value={optionalCount} onChange={e => setOptionalCount(parseInt(e.target.value) || 1)} className="w-16 h-8" /></div><ScrollArea className="h-52 border-2 border-dashed border-orange-300 rounded p-2">{optionalPool.map(c => <div key={c.course_id} className="flex justify-between p-1"><span>{c.course_code}</span><Button size="sm" variant="ghost" onClick={() => setOptionalPool(optionalPool.filter(x => x.course_id !== c.course_id))}><X className="h-4 w-4" /></Button></div>)}</ScrollArea></div>
      </div></CardContent></Card>
    </div>
  );
}
