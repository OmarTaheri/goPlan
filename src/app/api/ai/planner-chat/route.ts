import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Current academic context
const CURRENT_SEMESTER = "Fall 2025";
const NEXT_PLANNING_SEMESTER = "Spring 2026";
const CURRENT_DATE = "December 2025";

const SYSTEM_PROMPT = `You are goPlan's AI Planner Assistant, designed to help students with their academic degree planning.

CURRENT ACADEMIC CONTEXT:
- Today's Date: ${CURRENT_DATE}
- Current Semester: ${CURRENT_SEMESTER} (IN PROGRESS - students are currently taking these courses)
- Next Planning Semester: ${NEXT_PLANNING_SEMESTER} (advisors can approve plans for this semester)

CRITICAL RULES:
1. You ONLY help with academic planning, course selection, semester organization, and degree requirements.
2. If asked about unrelated topics, politely redirect: "I'm goPlan's Planner Assistant - I focus on helping you with your academic plan. What would you like to know about your courses or semesters?"
3. Be concise, helpful, and focused on the student's academic success.
4. When giving advice about semester difficulty, consider: total credits, course prerequisites, and workload balance.

SEMESTER MODIFICATION RULES (VERY IMPORTANT):
- You can ONLY add, move, or modify courses in FUTURE semesters (starting from ${NEXT_PLANNING_SEMESTER})
- You CANNOT modify courses in the current semester (${CURRENT_SEMESTER}) or any past semesters - these are LOCKED
- If a student asks to modify a locked semester, explain politely that past/current semester courses cannot be changed
- Historical/completed semesters show grades and are permanently recorded in the transcript

CAPABILITIES:
- Analyze semester difficulty and workload
- Suggest course additions or removals for FUTURE semesters only
- Recommend moving courses between FUTURE semesters
- Answer questions about degree requirements
- Help create a complete degree plan across multiple semesters
- Add multiple courses at once when asked to plan remaining courses
- Add empty semesters when requested (e.g., "add a semester after Spring 2026")
- Fill semesters with courses when requested

PREREQUISITE PREFERENCE (IMPORTANT):
When selecting courses from a bucket with multiple options (e.g., electives), ALWAYS prefer courses WITHOUT prerequisites over courses WITH prerequisites. For example:
- If a student needs a computing elective and has options CSC 2303, CSC 2304, CSC 3398, the preference should be courses that have no prerequisites first
- Only add courses with prerequisites if:
  1. They are required/mandatory (no other option)
  2. All no-prereq courses in the same bucket are already taken/planned
- When adding a course that has prerequisites, make sure to add the prerequisite to an EARLIER semester

ACTION TYPES:
You can perform these actions on UNLOCKED/FUTURE semesters only:

1. Single course actions:
   - Add: { "type": "add", "course_code": "CSC 1302", "to_semester": 5 }
   - Move: { "type": "move", "course_code": "CSC 1302", "to_semester": 6 }
   - Remove: { "type": "remove", "course_code": "CSC 1302" }

2. Bulk actions:
   - Add multiple: { "type": "add_multiple", "courses": [{ "course_code": "CSC 1302", "to_semester": 5 }, { "course_code": "ENG 2303", "to_semester": 5 }] }
   - Generate full plan: { "type": "generate_plan", "courses": [{ "course_code": "...", "to_semester": N }, ...] }

3. Semester actions:
   - Add empty semester: { "type": "add_semester", "after_semester": 5, "semester_name": "Fall 2027" }
   - Fill semester: { "type": "fill_semester", "semester": 5 } (uses auto-fill logic for this semester)

4. Rejection (for impossible requests):
   - { "type": "reject", "reason": "Cannot complete degree in 4 semesters due to prerequisite chain..." }

RESPONSE FORMAT:
Always respond with valid JSON in this exact format:
{
  "message": "Your helpful response explaining what you did or your advice",
  "actions": []
}

PLANNING GUIDELINES:
- Maximum recommended credits per semester: 18
- Typical semester load: 15-16 credits
- Minimum for full-time status: 12 credits
- Always check prerequisites before adding courses
- When a bucket has multiple course options, prefer courses without prerequisites
- Consider course scheduling (some courses only offered in Fall or Spring)

When a student asks to "complete my degree" or "create a full plan":
1. Review their remaining required courses
2. Consider prerequisites chains - add prereqs to earlier semesters
3. Balance workload across semesters (aim for 15-16 credits each)
4. Prefer courses without prerequisites when multiple options exist
5. If impossible (too few semesters), use reject action with clear explanation
6. Otherwise, use generate_plan action with all remaining courses properly sequenced

When a student asks to "add a semester" or "add another semester":
1. Use the add_semester action with the appropriate after_semester number
2. Calculate the semester name based on the pattern (Fall/Spring alternating, year increments)

When a student asks to "fill semester X" or "fill the next semester":
1. Use the fill_semester action for that semester

Current student plan context:`;

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

interface PlannerChatRequest {
  userMessage: string;
  semesters: Semester[];
  majorName?: string;
  minorName?: string;
  historicalSemesters: number;
  remainingCourses?: { course_code: string; title: string; credits: number; category: string }[];
  chatHistory?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: PlannerChatRequest = await request.json();
    const { userMessage, semesters, majorName, minorName, historicalSemesters, remainingCourses, chatHistory = [] } = body;

    if (!userMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build plan context with clear modifiability indicators
    const planContext = semesters.map(sem => {
      const isEditable = !sem.is_historical && !sem.is_locked;
      let status: string;
      if (sem.is_locked) {
        status = "COMPLETED (LOCKED - Cannot modify)";
      } else if (sem.is_historical) {
        status = "IN PROGRESS (LOCKED - Cannot modify)";
      } else {
        status = "PLANNED (Editable)";
      }
      
      const courses = sem.courses.length > 0 
        ? sem.courses.map(c => `  - ${c.course_code}: ${c.title} (${c.credits} cr)${c.grade ? ` [Grade: ${c.grade}]` : ""}`).join("\n")
        : "  (No courses planned yet)";
      
      return `${sem.semester_name || `Semester ${sem.semester_number}`} - ${status}, ${sem.total_credits} credits${isEditable ? " ✓ CAN EDIT" : " ✗ LOCKED"}:\n${courses}`;
    }).join("\n\n");

    // Build remaining courses context if provided
    let remainingContext = "";
    if (remainingCourses && remainingCourses.length > 0) {
      const byCategory: { [key: string]: typeof remainingCourses } = {};
      remainingCourses.forEach(c => {
        if (!byCategory[c.category]) byCategory[c.category] = [];
        byCategory[c.category].push(c);
      });
      
      remainingContext = "\n\nREMAINING COURSES NEEDED TO COMPLETE DEGREE:\n";
      for (const [category, courses] of Object.entries(byCategory)) {
        remainingContext += `\n${category}:\n`;
        courses.forEach(c => {
          remainingContext += `  - ${c.course_code}: ${c.title} (${c.credits} cr)\n`;
        });
      }
    }

    const conversationHistory = chatHistory
      .map(msg => `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`)
      .join("\n");

    const fullPrompt = `${SYSTEM_PROMPT}

Major: ${majorName || "Unknown"}
${minorName ? `Minor: ${minorName}` : ""}
Historical semesters (completed/in-progress): ${historicalSemesters}
Total semesters in plan: ${semesters.length}

IMPORTANT: Only semesters marked with "✓ CAN EDIT" can be modified. All others are LOCKED.

CURRENT PLAN:
${planContext}
${remainingContext}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n` : ""}
Student: ${userMessage}

Remember:
1. ALWAYS respond with valid JSON format with "message" and "actions" fields
2. NEVER try to modify LOCKED semesters
3. For bulk operations, use add_multiple or generate_plan action types
4. If a request is impossible, use the reject action type with a clear reason`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    const text = response.text || '{"message": "I apologize, but I couldn\'t generate a response. Please try again.", "actions": []}';
    
    // Try to parse JSON response
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();
      
      const parsed = JSON.parse(cleanedText);
      return NextResponse.json({
        message: parsed.message || text,
        actions: parsed.actions || []
      });
    } catch {
      // If parsing fails, return as plain message
      return NextResponse.json({
        message: text,
        actions: []
      });
    }
  } catch (error) {
    console.error("AI Planner Chat Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
