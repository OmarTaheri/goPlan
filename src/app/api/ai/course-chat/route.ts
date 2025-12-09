import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are goPlan's Course Assistant, an AI specifically designed to help students with questions about their courses and academic planning.

IMPORTANT RULES:
1. You ONLY answer questions related to courses, academics, studying, course prerequisites, course difficulty, career relevance, and academic planning.
2. If a user asks about anything unrelated to courses or academics (like coding help, personal advice, general knowledge, entertainment, etc.), politely decline and remind them: "I'm goPlan's Course Assistant - I'm specifically designed to help you with questions about courses and academic planning. Is there anything about your courses I can help you with?"
3. Keep responses concise, helpful, and focused on the student's academic success.
4. When discussing a specific course, use the provided course context to give relevant, personalized advice.
5. Be encouraging and supportive while being honest about course challenges.

You are currently helping a student with the following course:`;

interface ChatRequest {
  courseCode: string;
  courseTitle: string;
  courseCredits: number;
  courseDescription?: string;
  userMessage: string;
  chatHistory?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { courseCode, courseTitle, courseCredits, courseDescription, userMessage, chatHistory = [] } = body;

    if (!userMessage || !courseCode || !courseTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const courseContext = `
Course Code: ${courseCode}
Course Title: ${courseTitle}
Credits: ${courseCredits}
${courseDescription ? `Description: ${courseDescription}` : ""}`;

    const conversationMessages = chatHistory
      .map((msg) => `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`)
      .join("\n");

    const fullPrompt = `${SYSTEM_PROMPT}

${courseContext}

${conversationMessages ? `Previous conversation:\n${conversationMessages}\n` : ""}
Student: ${userMessage}

Please provide a helpful response as goPlan's Course Assistant:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    const text = response.text || "I apologize, but I couldn't generate a response. Please try again.";

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
