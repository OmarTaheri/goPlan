"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare, BookOpen, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CourseInfo {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  description?: string;
  grade?: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CourseInfoPopupProps {
  course: CourseInfo | null;
  open: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  "What topics does this course cover?",
  "Is this course difficult?",
  "What careers is this course useful for?",
  "What should I study before taking this?",
];

export function CourseInfoPopup({ course, open, onClose }: CourseInfoPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Reset chat when course changes
  useEffect(() => {
    if (course) {
      setMessages([]);
      setInput("");
    }
  }, [course?.course_id]);

  // Smooth auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !course || loading) return;

    const userMessage: ChatMessage = { role: "user", content: messageText.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/course-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: course.course_code,
          courseTitle: course.title,
          courseCredits: course.credits,
          courseDescription: course.description,
          userMessage: messageText.trim(),
          chatHistory: messages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5 text-primary shrink-0" />
                <DialogTitle className="text-xl font-bold truncate">
                  {course.course_code}
                </DialogTitle>
              </div>
              <p className="text-muted-foreground text-sm">{course.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{course.credits} Credits</Badge>
                {course.grade && (
                  <Badge
                    variant="outline"
                    className={cn(
                      course.grade.startsWith("A") && "text-green-600 border-green-200",
                      course.grade.startsWith("B") && "text-blue-600 border-blue-200",
                      course.grade.startsWith("C") && "text-amber-600 border-amber-200"
                    )}
                  >
                    Grade: {course.grade}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* AI Chat Section */}
        <div className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Course Assistant</span>
            <Badge variant="outline" className="text-xs">Powered by AI</Badge>
          </div>

          {/* Chat Messages - Scrollable container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto min-h-[200px] max-h-[350px] pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40"
          >
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">
                  Ask me anything about this course!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1.5 px-2"
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
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 mt-4 pt-4 border-t shrink-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this course..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
