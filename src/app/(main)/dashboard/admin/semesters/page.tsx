"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Semester {
  semester_id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  term?: string | null;
  year?: number | null;
}

export default function SemestersPage() {
  const router = useRouter();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Semester | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_active: false,
  });

  useEffect(() => {
    loadSemesters();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      start_date: "",
      end_date: "",
      is_active: false,
    });
    setEditing(null);
  };

  const loadSemesters = async () => {
    try {
      const res = await fetch("/api/admin/semesters");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load semesters");
      }
      const data = await res.json();
      setSemesters(data.semesters || []);
    } catch {
      setError("Failed to load semesters");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (semester: Semester) => {
    setEditing(semester);
    setFormData({
      name: semester.name,
      start_date: toDateInput(semester.start_date),
      end_date: toDateInput(semester.end_date),
      is_active: semester.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: formData.is_active,
    };

    try {
      let res;
      if (editing) {
        res = await fetch(`/api/admin/semesters?id=${editing.semester_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/semesters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save semester");
        return;
      }

      setSuccess(editing ? "Semester updated" : "Semester created");
      setShowModal(false);
      resetForm();
      loadSemesters();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save semester");
    }
  };

  const handleActivate = async (semester: Semester) => {
    try {
      const res = await fetch(`/api/admin/semesters?id=${semester.semester_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to activate semester");
        return;
      }

      setSuccess(`Marked ${semester.name} as active`);
      loadSemesters();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to activate semester");
    }
  };

  const formatDate = (value: string) => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString();
  };

  const toDateInput = (value: string) => {
    if (!value) return "";
    const parts = value.split("T")[0];
    return parts || "";
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
          <h1 className="text-3xl font-bold tracking-tight">Semesters</h1>
          <p className="text-muted-foreground">
            Define academic terms for planning, transcripts, and approvals
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Semester
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardDescription>
            Active semester controls which term students can submit for advisor approval. Start and
            end dates are also used to order plans and transcripts.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          {semesters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No semesters defined yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.map((semester) => (
                  <TableRow key={semester.semester_id}>
                    <TableCell>
                      <div className="font-medium">{semester.name}</div>
                      {semester.term && semester.year && (
                        <div className="text-xs text-muted-foreground">
                          {semester.term} {semester.year}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(semester.start_date)}</TableCell>
                    <TableCell>{formatDate(semester.end_date)}</TableCell>
                    <TableCell>
                      {semester.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(semester)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!semester.is_active && (
                          <Button size="sm" onClick={() => handleActivate(semester)}>
                            <Check className="mr-1 h-4 w-4" />
                            Set Active
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

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Semester" : "Add Semester"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update semester details" : "Create a new academic semester"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fall 2025"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked === true })
                  }
                />
                <Label htmlFor="is_active" className="font-normal">
                  Set as active semester
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save Changes" : "Create Semester"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
