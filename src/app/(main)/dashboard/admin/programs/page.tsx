"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil, Trash2, FileText, Map } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Program {
  program_id: number;
  name: string;
  code: string | null;
  school: string | null;
  type: "MAJOR" | "MINOR" | "CONCENTRATION";
  total_credits_required: number;
  catalog_year: string | null;
  parent_program_id: number | null;
  minor_required: "YES" | "NO" | "CONDITIONAL" | null;
  concentrations_available: "REQUIRED" | "OPTIONAL" | "NOT_AVAILABLE" | null;
  free_electives_credits: number;
  prerequisite_note: string | null;
}

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    loadPrograms();
  }, []);

  async function loadPrograms() {
    try {
      const res = await fetch("/api/admin/programs");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load programs");
      }
      const data = await res.json();
      setPrograms(data.programs || []);
    } catch {
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = (program: Program) => {
    setConfirmDialog({
      open: true,
      title: "Delete Program",
      description: `Are you sure you want to delete "${program.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          const res = await fetch(`/api/admin/programs/${program.program_id}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            const data = await res.json();
            toast.error(data.error || "Failed to delete program");
            return;
          }

          toast.success("Program deleted successfully");
          loadPrograms();
        } catch {
          toast.error("Failed to delete program");
        }
      },
    });
  };

  const majors = programs.filter((p) => p.type === "MAJOR");
  const minors = programs.filter((p) => p.type === "MINOR");
  const concentrations = programs.filter((p) => p.type === "CONCENTRATION");

  const getParentMajorName = (parentId: number | null) => {
    if (!parentId) return "N/A";
    const parent = majors.find((m) => m.program_id === parentId);
    return parent ? parent.code || parent.name : "Unknown";
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
        <p className="text-muted-foreground">
          Manage academic programs, concentrations, and minors
        </p>
      </div>

      {/* Majors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Majors ({majors.length})</CardTitle>
          <Button onClick={() => router.push("/dashboard/admin/programs/majors/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Major
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {majors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No majors defined</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Minor Req.</TableHead>
                  <TableHead>Concentrations</TableHead>
                  <TableHead>Free Electives</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {majors.map((program) => (
                  <TableRow key={program.program_id}>
                    <TableCell>
                      <Badge variant="secondary">{program.code || "-"}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell>{program.school || "-"}</TableCell>
                    <TableCell>{program.total_credits_required}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          program.minor_required === "YES"
                            ? "default"
                            : program.minor_required === "CONDITIONAL"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {program.minor_required || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          program.concentrations_available === "REQUIRED"
                            ? "default"
                            : program.concentrations_available === "OPTIONAL"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {program.concentrations_available || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{program.free_electives_credits} SCH</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/admin/programs/majors/${program.program_id}/edit`)
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/admin/programs/${program.program_id}/requirements`)
                          }
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/admin/programs/${program.program_id}/roadmap`)
                          }
                        >
                          <Map className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(program)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Concentrations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Concentrations ({concentrations.length})</CardTitle>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin/programs/concentrations/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Concentration
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {concentrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No concentrations defined</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent Major</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {concentrations.map((program) => (
                  <TableRow key={program.program_id}>
                    <TableCell>
                      <Badge variant="default">{program.code || "-"}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell>{getParentMajorName(program.parent_program_id)}</TableCell>
                    <TableCell>{program.total_credits_required}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/admin/programs/concentrations/${program.program_id}/edit`
                            )
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/admin/programs/${program.program_id}/requirements`)
                          }
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(program)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Minors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Minors ({minors.length})</CardTitle>
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/programs/minors/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Minor
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {minors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No minors defined</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Prerequisite Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {minors.map((program) => (
                  <TableRow key={program.program_id}>
                    <TableCell>
                      <Badge variant="outline">{program.code || "-"}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell>{program.school || "-"}</TableCell>
                    <TableCell>{program.total_credits_required}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {program.prerequisite_note || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/admin/programs/minors/${program.program_id}/edit`)
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/admin/programs/${program.program_id}/requirements`)
                          }
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(program)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
