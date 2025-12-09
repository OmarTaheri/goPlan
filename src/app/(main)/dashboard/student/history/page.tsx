"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, History, CheckCircle, XCircle, Clock, Send, MessageSquare, Calendar, User } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  id: number;
  type: "SUBMITTED" | "APPROVED" | "REJECTED" | "DRAFT" | "REVISED";
  semester_name: string;
  semester_number: number;
  timestamp: string;
  advisor_name?: string;
  comments?: string;
  course_count: number;
  total_credits: number;
}

function getEventIcon(type: string) {
  switch (type) {
    case "APPROVED":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "REJECTED":
      return <XCircle className="h-5 w-5 text-red-600" />;
    case "SUBMITTED":
      return <Send className="h-5 w-5 text-blue-600" />;
    case "DRAFT":
      return <Clock className="h-5 w-5 text-muted-foreground" />;
    case "REVISED":
      return <History className="h-5 w-5 text-amber-600" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
}

function getEventBadge(type: string) {
  switch (type) {
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    case "SUBMITTED":
      return <Badge className="bg-blue-100 text-blue-700">Submitted</Badge>;
    case "DRAFT":
      return <Badge variant="secondary">Draft</Badge>;
    case "REVISED":
      return <Badge className="bg-amber-100 text-amber-700">Revised</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }

        const res = await fetch("/api/student/history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        } else {
          // If no history endpoint, try to build from plan data
          const planRes = await fetch("/api/student/plan");
          if (planRes.ok) {
            const planData = await planRes.json();
            // Create mock history from plan statuses
            const mockHistory: HistoryEntry[] = [];
            (planData.planned_semesters || []).forEach((sem: {
              semester_id: number;
              semester_name: string;
              status: string;
              total_credits: number;
              courses: unknown[];
            }, idx: number) => {
              if (sem.status !== "DRAFT") {
                mockHistory.push({
                  id: idx + 1,
                  type: sem.status as HistoryEntry["type"],
                  semester_name: sem.semester_name,
                  semester_number: sem.semester_id,
                  timestamp: new Date(Date.now() - idx * 24 * 60 * 60 * 1000).toISOString(),
                  course_count: sem.courses?.length || 0,
                  total_credits: sem.total_credits,
                });
              }
            });
            setHistory(mockHistory);
          }
        }
      } catch {
        setError("Failed to load history");
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [router]);

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground">Track your plan submissions, approvals, and advisor feedback</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{history.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {history.filter((h) => h.type === "APPROVED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {history.filter((h) => h.type === "SUBMITTED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {history.filter((h) => h.type === "REJECTED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No History Yet</p>
              <p className="text-sm">Your plan submissions and advisor decisions will appear here.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

                {/* Timeline entries */}
                <div className="space-y-6">
                  {history.map((entry, index) => (
                    <div key={entry.id} className="relative flex gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background",
                        entry.type === "APPROVED" && "border-green-300",
                        entry.type === "REJECTED" && "border-red-300",
                        entry.type === "SUBMITTED" && "border-blue-300",
                        entry.type === "DRAFT" && "border-gray-300",
                        entry.type === "REVISED" && "border-amber-300"
                      )}>
                        {getEventIcon(entry.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getEventBadge(entry.type)}
                              <span className="font-semibold">{entry.semester_name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(entry.timestamp)}
                              </span>
                              <span>•</span>
                              <span>{entry.course_count} courses</span>
                              <span>•</span>
                              <span>{entry.total_credits} credits</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(entry.timestamp)}
                          </span>
                        </div>

                        {/* Advisor info and comments */}
                        {(entry.advisor_name || entry.comments) && (
                          <div className={cn(
                            "mt-3 p-3 rounded-lg border",
                            entry.type === "APPROVED" && "bg-green-50 border-green-200",
                            entry.type === "REJECTED" && "bg-red-50 border-red-200"
                          )}>
                            {entry.advisor_name && (
                              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                <User className="h-4 w-4" />
                                {entry.advisor_name}
                              </div>
                            )}
                            {entry.comments && (
                              <div className="flex items-start gap-2 text-sm">
                                <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                                <p className="italic">&ldquo;{entry.comments}&rdquo;</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
