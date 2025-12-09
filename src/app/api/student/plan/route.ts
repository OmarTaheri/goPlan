import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';
import { addCourseToPlan } from '@/lib/domain/plan/planService';

interface PlanWithDetails {
  plan_id: number;
  student_id: number;
  draft_id: number;
  course_id: number;
  semester_number: number;
  semester_order: number;
  status: string;
  prereqs_met: boolean;
  course_code: string;
  title: string;
  credits: number;
}

interface DraftRow {
  draft_id: number;
  name: string;
  is_default: boolean;
}

/**
 * GET /api/student/plan
 * Get all planned courses for the current student
 * Query params:
 *   - draft_id: Optional, filter by specific draft
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);
    const { searchParams } = new URL(request.url);
    const draftIdParam = searchParams.get('draft_id');

    // Get or create default draft
    let [drafts] = await query<DraftRow>(
      `SELECT * FROM student_plan_drafts 
       WHERE student_id = ? 
       ORDER BY is_default DESC, created_at ASC`,
      [user.user_id]
    );

    if (drafts.length === 0) {
      // Create default draft
      const result = await execute(
        `INSERT INTO student_plan_drafts (student_id, name, is_default)
         VALUES (?, 'Default Plan', TRUE)`,
        [user.user_id]
      );
      drafts = [{
        draft_id: result.insertId,
        name: 'Default Plan',
        is_default: true,
      }];
    }

    // Determine which draft to load
    let activeDraftId = drafts.find(d => d.is_default)?.draft_id || drafts[0].draft_id;
    if (draftIdParam) {
      const requestedDraftId = parseInt(draftIdParam);
      if (!isNaN(requestedDraftId) && drafts.some(d => d.draft_id === requestedDraftId)) {
        activeDraftId = requestedDraftId;
      }
    }

    // Fetch plan entries for the active draft
    const [plans] = await query<PlanWithDetails>(
      `SELECT sp.plan_id, sp.student_id, sp.draft_id, sp.course_id,
              sp.semester_number, sp.semester_order, sp.status, sp.prereqs_met,
              c.course_code, c.title, c.credits
       FROM student_plan sp
       JOIN courses c ON sp.course_id = c.course_id
       WHERE sp.student_id = ? AND sp.draft_id = ?
       ORDER BY sp.semester_number, sp.semester_order, c.course_code`,
      [user.user_id, activeDraftId]
    );

    // Fetch persisted semester definitions
    const [semesterDefinitions] = await query<{
      semester_number: number;
      term: string;
      year: number;
      is_locked: boolean;
    }>(
      `SELECT semester_number, term, year, is_locked 
       FROM student_plan_semesters 
       WHERE draft_id = ?`,
      [activeDraftId]
    );
    const semesterDefsMap = new Map(semesterDefinitions.map(s => [s.semester_number, s]));

    // Fetch transcript courses (completed and in-progress)
    const [transcriptCourses] = await query<{
      transcript_id: number;
      course_id: number;
      semester_id: number | null;
      grade: string | null;
      status: string;
      credits_earned: number | null;
      course_code: string;
      title: string;
      credits: number;
      semester_name: string | null;
    }>(
      `SELECT t.transcript_id, t.course_id, t.semester_id, t.grade, t.status, t.credits_earned,
              c.course_code, c.title, c.credits,
              s.name as semester_name
       FROM student_transcript t
       JOIN courses c ON t.course_id = c.course_id
       LEFT JOIN semesters s ON t.semester_id = s.semester_id
       WHERE t.student_id = ?
       ORDER BY s.start_date, c.course_code`,
      [user.user_id]
    );

    // Group transcript courses by semester_id
    const transcriptBySemesterId: Record<number, typeof transcriptCourses> = {};
    for (const tc of transcriptCourses) {
      const semId = tc.semester_id || 0;
      if (!transcriptBySemesterId[semId]) {
        transcriptBySemesterId[semId] = [];
      }
      transcriptBySemesterId[semId].push(tc);
    }


    // Build semesters array
    const semesters: Array<{
      semester_number: number;
      semester_name?: string;
      term?: string;
      year?: number;
      courses: Array<{
        plan_id: number;
        course_id: number;
        course_code: string;
        title: string;
        credits: number;
        status: string;
        prereqs_met: boolean;
        semester_order: number;
        grade?: string | null;
        is_historical: boolean;
      }>;
      total_credits: number;
      status: string;
      is_active_for_approval: boolean;
      is_historical: boolean;
      is_locked: boolean;
    }> = [];

    // First, add transcript semesters (historical)
    // Note: We're not calculating is_active_for_approval for historical, usually false unless incomplete?
    // But historical are by definition usually past. We'll set false.

    const sortedSemesterIds = Object.keys(transcriptBySemesterId)
      .map(Number)
      .filter(id => id > 0)
      .sort((a, b) => a - b);

    let semesterCounter = 1;

    for (const semId of sortedSemesterIds) {
      const courses = transcriptBySemesterId[semId];
      const firstCourse = courses[0];
      const isInProgress = courses.some(c => c.status === 'IN_PROGRESS');

      semesters.push({
        semester_number: semesterCounter,
        semester_name: firstCourse.semester_name || `Term ${semesterCounter}`,
        courses: courses.map((tc, idx) => ({
          plan_id: -tc.transcript_id,
          course_id: tc.course_id,
          course_code: tc.course_code,
          title: tc.title,
          credits: tc.credits,
          status: tc.status === 'COMPLETED' ? 'COMPLETED' : tc.status,
          prereqs_met: true,
          semester_order: idx,
          grade: tc.grade,
          is_historical: true,
        })),
        total_credits: courses.reduce((sum, c) => sum + (c.credits_earned || c.credits), 0),
        status: isInProgress ? 'IN_PROGRESS' : 'COMPLETED',
        is_active_for_approval: false, // History cannot be approved
        is_historical: true,
        is_locked: true, // Transcript semesters are always locked
      });
      semesterCounter++;
    }

    // Fetch definitions with active status for future semesters
    // We join with the global semesters table on term/year to find the global active status
    const [futureSemestersWithStatus] = await query<{
      semester_number: number;
      term: string;
      year: number;
      is_active: number; // boolean from DB is often number 0/1
      is_locked: number; // boolean from DB
    }>(
      `SELECT sps.semester_number, sps.term, sps.year, 
              COALESCE(s_global.is_active, 0) as is_active,
              sps.is_locked
       FROM student_plan_semesters sps
       LEFT JOIN semesters s_global ON sps.term = s_global.term AND sps.year = s_global.year
       WHERE sps.draft_id = ?
       ORDER BY sps.semester_number`,
      [activeDraftId]
    );

    const futureSemMap = new Map(futureSemestersWithStatus.map(s => [s.semester_number, s]));

    // Determine range
    // We start from where historical ended (semesterCounter)
    // Future semesters are defined in student_plan_semesters table
    const historicalSemesters = semesterCounter - 1;
    
    // Only show future semesters that are defined in student_plan_semesters
    // Default to 8 future semesters if none defined
    const maxDefSemester = futureSemestersWithStatus.length > 0 
      ? Math.max(...futureSemestersWithStatus.map(s => s.semester_number))
      : 8;
    
    // Total display semesters = historical + max defined future semesters
    // Total display semesters = historical + max defined future semesters
    const totalSemesters = historicalSemesters + maxDefSemester;

    // Iterate through semesters:
    // 1. Transcript semesters (already added)
    // 2. Future semesters (only if defined in student_plan_semesters)
    
    // We already added 1..historicalSemesters.
    // Now add strictly the defined future semesters.
    
    // Convert map keys to array and sort
    const futureSemNumbers = Array.from(futureSemMap.keys()).sort((a, b) => a - b);
    
    for (const futureSemNum of futureSemNumbers) {
        const i = historicalSemesters + futureSemNum;
        
        let semesterName = '';
        let term = '';
        let year = 0;
        let isActiveForApproval = false;

        const def = futureSemMap.get(futureSemNum);
        
        if (def) {
            semesterName = `${def.term.charAt(0) + def.term.slice(1).toLowerCase()} ${def.year}`;
            term = def.term;
            year = def.year;
            isActiveForApproval = !!def.is_active;
        } else {
             // Should not happen if we iterate keys of map
            semesterName = `Future Semester`;
        }
    
      const semesterPlans = plans.filter(p => p.semester_number === futureSemNum);
      
      const status = semesterPlans.some(p => p.status === 'APPROVED') ? 'APPROVED' :
                     semesterPlans.some(p => p.status === 'REJECTED') ? 'REJECTED' :
                     semesterPlans.some(p => p.status === 'SUBMITTED') ? 'SUBMITTED' : 'DRAFT';
      
      semesters.push({
        semester_number: i,
        // For frontend display consistency, we might want to preserve the global "semester number"
        // purely for ordering, but the "plan semester number" is futureSemNum
        semester_name: semesterName,
        term: term || undefined,
        year: year || undefined,
        courses: semesterPlans.map(p => ({
          plan_id: p.plan_id,
          course_id: p.course_id,
          course_code: p.course_code,
          title: p.title,
          credits: p.credits,
          status: p.status,
          prereqs_met: p.prereqs_met,
          semester_order: p.semester_order,
          is_historical: false,
        })),
        total_credits: semesterPlans.reduce((sum, p) => sum + p.credits, 0),
        status,
        is_active_for_approval: isActiveForApproval,
        is_historical: false,
        is_locked: def ? !!def.is_locked : false, 
      });
    }

    return NextResponse.json({
      active_draft: {
        draft_id: activeDraftId,
        name: drafts.find(d => d.draft_id === activeDraftId)?.name || 'Default Plan',
        is_default: Boolean(drafts.find(d => d.draft_id === activeDraftId)?.is_default),
      },
      drafts: drafts.map(d => ({
        draft_id: d.draft_id,
        name: d.name,
        is_default: Boolean(d.is_default),
      })),
      semesters,
      total_semesters: totalSemesters,
      historical_semesters: historicalSemesters,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/student/plan
 * Add a course to the student's plan
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);

    const body = await request.json();
    const { course_id, semester_number, draft_id } = body;

    if (!course_id || !semester_number) {
      return NextResponse.json(
        { error: 'course_id and semester_number are required' },
        { status: 400 }
      );
    }

    const semNum = parseInt(semester_number);
    if (isNaN(semNum) || semNum < 1 || semNum > 12) {
      return NextResponse.json(
        { error: 'semester_number must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Get or create default draft
    let activeDraftId = draft_id;
    if (!activeDraftId) {
      const [drafts] = await query<DraftRow>(
        `SELECT * FROM student_plan_drafts 
         WHERE student_id = ? AND is_default = TRUE`,
        [user.user_id]
      );

      if (drafts.length === 0) {
        const result = await execute(
          `INSERT INTO student_plan_drafts (student_id, name, is_default)
           VALUES (?, 'Default Plan', TRUE)`,
          [user.user_id]
        );
        activeDraftId = result.insertId;
      } else {
        activeDraftId = drafts[0].draft_id;
      }
    }

    // Use service to add course (handles locking checks)
    const result = await addCourseToPlan(user.user_id, course_id, activeDraftId, semNum);

    if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      message: result.message,
      plan_id: result.planId,
      semester_number: semNum,
      // semester_order isn't returned by service currently, but frontend might need it? 
      // Service creates it but doesn't return it. Frontend likely re-fetches or appends?
      // Frontend code: `handleAddCourse` calls refreshAll() on success. So valid.
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error adding to plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
