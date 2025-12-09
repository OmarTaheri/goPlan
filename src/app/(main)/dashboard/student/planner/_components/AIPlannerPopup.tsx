"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Semester {
  semester_number: number;
  semester_name?: string;
  is_historical?: boolean;
  is_locked?: boolean;
  total_credits: number;
  courses: {
    plan_id: number;
    course_id: number;
    course_code: string;
    title: string;
    credits: number;
    grade?: string | null;
  }[];
}

interface AIAction {
  type: "add" | "move" | "remove" | "add_multiple" | "generate_plan" | "add_semester" | "fill_semester" | "reject";
  course_code?: string;
  to_semester?: number;
  courses?: { course_code: string; to_semester: number }[];
  after_semester?: number;
  semester_name?: string;
  semester?: number;
  reason?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actions?: AIAction[];
  actionsExecuted?: boolean;
}

interface AIPlannerPopupProps {
  open: boolean;
  onClose: () => void;
  semesters: Semester[];
  majorName?: string;
  minorName?: string;
  historicalSemesters: number;
  onAddCourse: (courseCode: string, semesterNum: number) => Promise<boolean>;
  onMoveCourse: (courseCode: string, toSemester: number) => Promise<boolean>;
  onRemoveCourse: (courseCode: string) => Promise<boolean>;
  onAddSemester?: (afterSemester: number, semesterName: string) => Promise<boolean>;
  onFillSemester?: (semesterNum: number) => Promise<boolean>;
  onRefresh: () => void;
}

const SUGGESTED_PROMPTS = [
  "Is my next semester too heavy?",
  "What courses should I take next?",
  "Review my entire plan",
  "Add another semester after my last one",
];

export function AIPlannerPopup({
  open,
  onClose,
  semesters,
  majorName,
  minorName,
  historicalSemesters,
  onAddCourse,
  onMoveCourse,
  onRemoveCourse,
  onAddSemester,
  onFillSemester,
  onRefresh,
}: AIPlannerPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [executingActions, setExecutingActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset chat when popup closes
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setInput("");
    }
  }, [open]);

  // Smooth auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: messageText.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/planner-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: messageText.trim(),
          semesters,
          majorName,
          minorName,
          historicalSemesters,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            actions: data.actions || [],
            actionsExecuted: false,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Sorry, I couldn't process your request." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error connecting to the assistant." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeActions = async (messageIndex: number, actions: AIAction[]) => {
    setExecutingActions(true);
    let successCount = 0;
    let failCount = 0;

    for (const action of actions) {
      try {
        let success = false;
        switch (action.type) {
          case "add":
            if (action.course_code && action.to_semester) {
              success = await onAddCourse(action.course_code, action.to_semester);
            }
            break;
          case "move":
            if (action.course_code && action.to_semester) {
              success = await onMoveCourse(action.course_code, action.to_semester);
            }
            break;
          case "remove":
            if (action.course_code) {
              success = await onRemoveCourse(action.course_code);
            }
            break;
          case "add_multiple":
          case "generate_plan":
            if (action.courses) {
              for (const course of action.courses) {
                const courseSuccess = await onAddCourse(course.course_code, course.to_semester);
                if (courseSuccess) successCount++;
                else failCount++;
              }
              continue; // Skip the success/fail count below
            }
            break;
          case "add_semester":
            if (onAddSemester && action.after_semester && action.semester_name) {
              success = await onAddSemester(action.after_semester, action.semester_name);
            }
            break;
          case "fill_semester":
            if (onFillSemester && action.semester) {
              success = await onFillSemester(action.semester);
            }
            break;
          case "reject":
            // Just show the message, no action needed
            success = true;
            break;
        }
        if (success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    // Mark actions as executed
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === messageIndex ? { ...msg, actionsExecuted: true } : msg
      )
    );

    if (successCount > 0) {
      toast.success(`Applied ${successCount} change${successCount > 1 ? "s" : ""}`);
      onRefresh();
    }
    if (failCount > 0) {
      toast.error(`${failCount} action${failCount > 1 ? "s" : ""} failed`);
    }

    setExecutingActions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const getSemesterName = (semesterNum?: number) => {
    if (!semesterNum) return "Unknown";
    const sem = semesters.find(s => s.semester_number === semesterNum);
    return sem?.semester_name || `Semester ${semesterNum}`;
  };

  const formatAction = (action: AIAction) => {
    switch (action.type) {
      case "add":
        return `Add ${action.course_code} to ${getSemesterName(action.to_semester)}`;
      case "move":
        return `Move ${action.course_code} to ${getSemesterName(action.to_semester)}`;
      case "remove":
        return `Remove ${action.course_code}`;
      case "add_multiple":
      case "generate_plan":
        return `Add ${action.courses?.length || 0} courses to plan`;
      case "add_semester":
        return `Add semester "${action.semester_name}" after semester ${action.after_semester}`;
      case "fill_semester":
        return `Auto-fill semester ${action.semester}`;
      case "reject":
        return `Cannot perform: ${action.reason}`;
      default:
        return JSON.stringify(action);
    }
  };

  // Check if actions can be executed (reject actions don't need execution)
  const hasExecutableActions = (actions: AIAction[]) => {
    return actions.some(a => a.type !== "reject");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-violet-500/10 to-purple-500/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <DialogTitle className="text-xl font-bold">AI Planner Assistant</DialogTitle>
            <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
              Beta
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            I can help you analyze and modify your academic plan
          </p>
        </DialogHeader>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[400px] pr-2">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm mb-4">
                  Ask me about your plan or request changes!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_PROMPTS.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1.5 px-3"
                      onClick={() => sendMessage(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className="space-y-2">
                    <div
                      className={cn(
                        "flex gap-2",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>

                    {/* Actions card */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-lg border bg-card p-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            {msg.actionsExecuted ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-green-600">Actions Applied</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Suggested Changes</span>
                              </>
                            )}
                          </div>
                          <ul className="text-xs space-y-1">
                            {msg.actions.map((action, j) => (
                              <li key={j} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                {formatAction(action)}
                              </li>
                            ))}
                          </ul>
                          {!msg.actionsExecuted && hasExecutableActions(msg.actions) && (
                            <Button
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => executeActions(i, msg.actions!)}
                              disabled={executingActions}
                            >
                              {executingActions ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Apply Changes
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 mt-4 pt-4 border-t shrink-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your plan or request changes..."
              disabled={loading || executingActions}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim() || executingActions}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
