import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';

interface SemesterDef {
  semester_number: number;
  term: 'FALL' | 'SPRING' | 'SUMMER';
  year: number;
}

/**
 * POST /api/student/plan/semesters
 * Add a new semester to the plan
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);
    const body = await request.json();
    const { draft_id, force_summer } = body;

    let activeDraftId = draft_id;
    
    // Get default draft if not provided
    if (!activeDraftId) {
      const [drafts] = await query<{draft_id: number}>(
        `SELECT draft_id FROM student_plan_drafts 
         WHERE student_id = ? AND is_default = TRUE`,
        [user.user_id]
      );
      if (drafts.length > 0) activeDraftId = drafts[0].draft_id;
    }

    if (!activeDraftId) {
       return NextResponse.json({ error: 'Default draft not found' }, { status: 404 });
    }

    // Get the last defined semester for this draft
    const [rows] = await query<SemesterDef>(
      `SELECT semester_number, term, year 
       FROM student_plan_semesters 
       WHERE draft_id = ? 
       ORDER BY semester_number DESC LIMIT 1`,
      [activeDraftId]
    );
    const lastSemester = rows[0];

    let nextSemNum = 1;
    let nextTerm: 'FALL' | 'SPRING' | 'SUMMER' = 'FALL';
    let nextYear = new Date().getFullYear();

    // If no plan semesters, try to find last historical semester to start after
    if (!lastSemester) {
       // Logic: find enrollment year or last transcript entry
       // Fallback to "Next Semester" based on current date
       const now = new Date();
       const currentMonth = now.getMonth(); 
       const currentYear = now.getFullYear();
       
       if (force_summer) {
           // User explicitly wants to start with Summer
           if (currentMonth > 7) nextYear = currentYear + 1; // It's late in year, next summer is next year
           else nextYear = currentYear;
           nextTerm = 'SUMMER';
       } else {
           if (currentMonth <= 4) { nextTerm = 'SPRING'; nextYear = currentYear; }
           else if (currentMonth <= 7) { nextTerm = 'SUMMER'; nextYear = currentYear; }
           else { nextTerm = 'FALL'; nextYear = currentYear; }
       }
    } else {
        nextSemNum = lastSemester.semester_number + 1;
        
        if (force_summer) {
            nextTerm = 'SUMMER';
            if (lastSemester.term === 'SPRING') {
                nextYear = lastSemester.year;
            } else {
                // Fall -> Summer (next year)
                // Summer -> Summer (next year)
                nextYear = lastSemester.year + 1;
            }
        } else {
            // Standard progression (Skipping Summer unless forced)
            if (lastSemester.term === 'FALL') {
                nextTerm = 'SPRING';
                nextYear = lastSemester.year + 1;
            } else if (lastSemester.term === 'SPRING') {
                nextTerm = 'FALL';
                nextYear = lastSemester.year;
            } else {
                // Summer -> Fall
                nextTerm = 'FALL';
                nextYear = lastSemester.year;
            }
        }
    }

    // Insert new semester
    await execute(
      `INSERT INTO student_plan_semesters (draft_id, semester_number, term, year, is_locked)
       VALUES (?, ?, ?, ?, FALSE)`,
      [activeDraftId, nextSemNum, nextTerm, nextYear]
    );

    return NextResponse.json({ message: 'Semester added', semester_number: nextSemNum });

  } catch (error) {
    console.error('Error adding semester:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/student/plan/semesters
 * Remove a semester and unplan its courses
 * Query param: semester_number, draft_id
 */
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuthWithRole(request, ['STUDENT']);
        const { searchParams } = new URL(request.url);
        const semesterNumber = searchParams.get('semester_number');
        const draftIdParam = searchParams.get('draft_id');

        if (!semesterNumber || !draftIdParam) {
            return NextResponse.json({ error: 'Missing semester_number or draft_id' }, { status: 400 });
        }

        const draftId = parseInt(draftIdParam);
        const semNum = parseInt(semesterNumber);

        // Check if locked
        const [sem] = await query<{is_locked: boolean}>(
            `SELECT is_locked FROM student_plan_semesters 
             WHERE draft_id = ? AND semester_number = ?`,
            [draftId, semNum]
        );

        if (!sem || sem.length === 0) {
            return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
        }

        if (sem[0].is_locked) {
            return NextResponse.json({ error: 'Cannot remove locked semester' }, { status: 403 });
        }
        
        // 1. Delete courses in this semester for this draft
        await execute(
            `DELETE FROM student_plan 
             WHERE draft_id = ? AND semester_number = ?`,
            [draftId, semNum]
        );

        // 2. Delete the semester definition
        await execute(
            `DELETE FROM student_plan_semesters 
             WHERE draft_id = ? AND semester_number = ?`,
            [draftId, semNum]
        );

        return NextResponse.json({ message: 'Semester removed' });

    } catch (error) {
        console.error('Error removing semester:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
