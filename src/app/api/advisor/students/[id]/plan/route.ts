import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole, requireAdvisorAssigned } from '@/lib/auth/rbac';
import { query } from '@/lib/db/query';
import { StudentPlanRow } from '@/lib/db/types';

interface Params {
  params: Promise<{ id: string }>;
}

interface PlanWithDetails extends StudentPlanRow {
  draft_id: number;
  semester_number: number;
  course_code: string;
  title: string;
  credits: number;
  term: string;
  year: number;
}

/**
 * GET /api/advisor/students/[id]/plan
 * Get all plans for a student in the advisor's caseload
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const advisor = await requireAuthWithRole(request, ['ADVISOR']);
    const { id } = await params;
    const studentId = parseInt(id, 10);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // Verify advisor is assigned to this student
    await requireAdvisorAssigned(advisor.user_id, studentId);

    // FIX: Join with student_plan_semesters instead of semesters table directly
    // student_plan uses (draft_id, semester_number)
    const [plans] = await query<PlanWithDetails>(
      `SELECT sp.*,
              c.course_code, c.title, c.credits,
              sps.term, sps.year
       FROM student_plan sp
       JOIN courses c ON sp.course_id = c.course_id
       JOIN student_plan_semesters sps ON sp.draft_id = sps.draft_id AND sp.semester_number = sps.semester_number
       WHERE sp.student_id = ?
       ORDER BY sps.year DESC, CASE sps.term WHEN 'FALL' THEN 1 WHEN 'SUMMER' THEN 2 WHEN 'SPRING' THEN 3 END, c.course_code`,
      [studentId]
    );

    // Group by semester
    const semesterMap = new Map<string, {
      semester_id: number; // We'll use semester_number as the ID for the frontend to be consistent
      semester_name: string;
      courses: Array<{
        plan_id: number;
        course_id: number;
        course_code: string;
        title: string;
        credits: number;
        status: string;
        prereqs_met: boolean;
      }>;
      total_credits: number;
      status: string;
      needs_review: boolean;
    }>();

    for (const plan of plans) {
      // Create a unique key for the map (draft_id + semester_number)
      // Note: Frontend likely expects an ID. We can pass semester_number as ID if we are only viewing one draft.
      // Or we can construct a composite ID.
      // The frontend uses `semester.semester_id` to navigate `?semester=X`.
      // Let's use `semester_number` as the ID since that's what seems to be used elsewhere, 
      // providing we are looking at the active/submitted draft.
      
      const mapKey = `${plan.draft_id}-${plan.semester_number}`;
      
      if (!semesterMap.has(mapKey)) {
        // Format semester name: e.g. "Fall 2024"
        const termDisplay = plan.term.charAt(0).toUpperCase() + plan.term.slice(1).toLowerCase();
        const semName = `${termDisplay} ${plan.year}`;

        semesterMap.set(mapKey, {
          semester_id: plan.semester_number, // Using semester_number as ID for frontend compatibility
          semester_name: semName,
          courses: [],
          total_credits: 0,
          status: 'DRAFT',
          needs_review: false,
        });
      }

      const semester = semesterMap.get(mapKey)!;
      semester.courses.push({
        plan_id: plan.plan_id,
        course_id: plan.course_id,
        course_code: plan.course_code,
        title: plan.title,
        credits: plan.credits,
        status: plan.status,
        prereqs_met: plan.prereqs_met,
      });
      semester.total_credits += plan.credits;

      // Determine status (if any course is submitted, the whole semester is submitted)
      // Actually strictly speaking, if sp.status is SUBMITTED, the semester is submitted.
      if (plan.status === 'SUBMITTED') {
        semester.status = 'SUBMITTED';
        semester.needs_review = true;
      } else if (plan.status === 'APPROVED' && semester.status !== 'SUBMITTED') {
        semester.status = 'APPROVED';
      } else if (plan.status === 'REJECTED' && semester.status === 'DRAFT') {
        semester.status = 'REJECTED';
      }
    }

    return NextResponse.json({
      semesters: Array.from(semesterMap.values()),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('not assigned')) {
      return NextResponse.json({ error: 'Student not in your caseload' }, { status: 403 });
    }
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
