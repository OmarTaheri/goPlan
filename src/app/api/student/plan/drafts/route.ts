import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query, execute } from '@/lib/db/query';

interface DraftRow {
  draft_id: number;
  student_id: number;
  name: string;
  is_default: boolean;
  created_at: Date;
  course_count?: number;
}

/**
 * GET /api/student/plan/drafts
 * Get all plan drafts for the current student
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);

    const [drafts] = await query<DraftRow>(
      `SELECT d.*, 
              COALESCE((
                SELECT COUNT(*) 
                FROM student_plan sp 
                WHERE sp.draft_id = d.draft_id
              ), 0) as course_count
       FROM student_plan_drafts d
       WHERE d.student_id = ?
       ORDER BY d.is_default DESC, d.created_at ASC`,
      [user.user_id]
    );

    // If no drafts exist, create a default one
    if (drafts.length === 0) {
      const result = await execute(
        `INSERT INTO student_plan_drafts (student_id, name, is_default)
         VALUES (?, 'Default Plan', TRUE)`,
        [user.user_id]
      );
      
      return NextResponse.json({
        drafts: [{
          draft_id: result.insertId,
          name: 'Default Plan',
          is_default: true,
          created_at: new Date().toISOString(),
          course_count: 0,
        }],
      });
    }

    return NextResponse.json({
      drafts: drafts.map(d => ({
        draft_id: d.draft_id,
        name: d.name,
        is_default: Boolean(d.is_default),
        created_at: d.created_at,
        course_count: d.course_count || 0,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching drafts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/student/plan/drafts
 * Create a new plan draft
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);
    
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Draft name is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Draft name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Check for duplicate names
    const [existing] = await query<DraftRow>(
      `SELECT * FROM student_plan_drafts 
       WHERE student_id = ? AND name = ?`,
      [user.user_id, name.trim()]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A draft with this name already exists' },
        { status: 400 }
      );
    }

    const result = await execute(
      `INSERT INTO student_plan_drafts (student_id, name, is_default)
       VALUES (?, ?, FALSE)`,
      [user.user_id, name.trim()]
    );

    const newDraftId = result.insertId;

    // Auto-generate 8 semesters based on student's enrollment year
    const [profile] = await query<{ enrollment_year: number | null }>(
      'SELECT enrollment_year FROM student_profiles WHERE user_id = ?',
      [user.user_id]
    );

    // Get latest transcript semester to determine which semesters should be locked
    const [transcriptSemesters] = await query<{ semester_id: number }>(
      `SELECT DISTINCT t.semester_id 
       FROM student_transcript t 
       WHERE t.student_id = ? AND t.semester_id IS NOT NULL`,
      [user.user_id]
    );
    const completedSemesterCount = transcriptSemesters.length;

    const startYear = profile[0]?.enrollment_year || new Date().getFullYear();

    // Generate 8 semesters: Fall Year1, Spring Year1+1, Fall Year1+1, Spring Year1+2, etc.
    for (let i = 0; i < 8; i++) {
      const term = i % 2 === 0 ? 'FALL' : 'SPRING';
      const yearOffset = Math.floor(i / 2);
      const year = i % 2 === 0 ? startYear + yearOffset : startYear + yearOffset + 1;
      const isLocked = i < completedSemesterCount;

      await execute(
        `INSERT INTO student_plan_semesters (draft_id, semester_number, term, year, is_locked)
         VALUES (?, ?, ?, ?, ?)`,
        [newDraftId, i + 1, term, year, isLocked]
      );
    }

    return NextResponse.json({
      message: 'Draft created successfully',
      draft: {
        draft_id: newDraftId,
        name: name.trim(),
        is_default: false,
        created_at: new Date().toISOString(),
        course_count: 0,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error creating draft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
