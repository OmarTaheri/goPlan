import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRole } from '@/lib/auth/rbac';
import { query } from '@/lib/db/query';

interface StudentProgram {
  program_id: number;
  type: 'MAJOR' | 'MINOR' | 'CONCENTRATION';
  name: string;
  parent_program_id: number | null;
}

interface RequirementGroup {
  group_id: number;
  program_id: number;
  name: string;
  credits_required: number;
  min_courses_required: number;
  parent_group_id: number | null;
}

interface GroupCourse {
  group_id: number;
  group_name: string;
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  is_mandatory: boolean;
}

interface TakenCourse {
  course_id: number;
  credits: number;
  status?: string;
}

interface RecommendedSequenceEntry {
  course_id: number | null;
  requirement_group_id: number | null;
  semester_number: number;
}

interface CourseDependency {
  course_id: number;
  dependency_course_id: number;
  dependency_course_code: string;
  dependency_type: string;
  logic_set_id: number;
}

interface RecommendedCourse {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  is_mandatory: boolean;
  group_name?: string;
  recommended_semester: number | null;
  prereqs_met: boolean;
  missing_prereqs: string[];
}

/**
 * Check if prerequisites are met for a course
 */
async function checkPrerequisites(
  courseId: number,
  completedCourseIds: Set<number>
): Promise<{ prereqs_met: boolean; missing_prereqs: string[] }> {
  const [dependencies] = await query<CourseDependency>(
    `SELECT cd.course_id, cd.dependency_course_id, c.course_code as dependency_course_code,
            cd.dependency_type, cd.logic_set_id
     FROM course_dependencies cd
     JOIN courses c ON cd.dependency_course_id = c.course_id
     WHERE cd.course_id = ? AND cd.dependency_type = 'PREREQUISITE'`,
    [courseId]
  );

  if (dependencies.length === 0) {
    return { prereqs_met: true, missing_prereqs: [] };
  }

  // Group by logic_set_id (same set = AND, different sets = OR)
  const logicSets = new Map<number, CourseDependency[]>();
  for (const dep of dependencies) {
    const set = logicSets.get(dep.logic_set_id) || [];
    set.push(dep);
    logicSets.set(dep.logic_set_id, set);
  }

  // Check if ANY logic set is fully satisfied (OR between sets)
  for (const [, setDeps] of logicSets) {
    const allMet = setDeps.every(dep => completedCourseIds.has(dep.dependency_course_id));
    if (allMet) {
      return { prereqs_met: true, missing_prereqs: [] };
    }
  }

  // None fully satisfied - collect missing from the first set (simplest case)
  const firstSet = logicSets.get(1) || Array.from(logicSets.values())[0] || [];
  const missing = firstSet
    .filter(dep => !completedCourseIds.has(dep.dependency_course_id))
    .map(dep => dep.dependency_course_code);

  return { prereqs_met: false, missing_prereqs: missing };
}

/**
 * Calculate credits earned for a requirement group
 */
function calculateCreditsEarned(
  groupId: number,
  groupCourses: GroupCourse[],
  takenCourseIds: Set<number>,
  courseCreditsMap: Map<number, number>
): number {
  const coursesInGroup = groupCourses.filter(c => c.group_id === groupId);
  let earned = 0;
  for (const course of coursesInGroup) {
    if (takenCourseIds.has(course.course_id)) {
      earned += courseCreditsMap.get(course.course_id) || course.credits;
    }
  }
  return earned;
}

/**
 * GET /api/student/recommended-courses
 * Get recommended courses for the student based on their degree, minor, and concentration
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(request, ['STUDENT']);
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('draft_id');

    // 1. Get student's enrolled programs
    const [programs] = await query<StudentProgram>(
      `SELECT sp.program_id, sp.type, p.name, p.parent_program_id
       FROM student_programs sp
       JOIN programs p ON sp.program_id = p.program_id
       WHERE sp.student_id = ?`,
      [user.user_id]
    );

    if (programs.length === 0) {
      return NextResponse.json({
        error: 'No programs assigned. Please contact your advisor.',
      }, { status: 400 });
    }

    const majorProgram = programs.find(p => p.type === 'MAJOR');
    const minorProgram = programs.find(p => p.type === 'MINOR');
    const concentrationProgram = programs.find(p => p.type === 'CONCENTRATION');

    if (!majorProgram) {
      return NextResponse.json({
        error: 'No major assigned. Please contact your advisor.',
      }, { status: 400 });
    }

    // 2. Get courses already taken (transcript) or planned - with credits and status
    const [transcriptCourses] = await query<TakenCourse>(
      `SELECT DISTINCT st.course_id, c.credits, st.status
       FROM student_transcript st
       JOIN courses c ON st.course_id = c.course_id
       WHERE st.student_id = ?`,
      [user.user_id]
    );

    let planCourses: TakenCourse[] = [];
    if (draftId) {
      const [planned] = await query<TakenCourse>(
        `SELECT DISTINCT sp.course_id, c.credits
         FROM student_plan sp
         JOIN courses c ON sp.course_id = c.course_id
         WHERE sp.student_id = ? AND sp.draft_id = ?`,
        [user.user_id, draftId]
      );
      planCourses = planned;
    } else {
      const [planned] = await query<TakenCourse>(
        `SELECT DISTINCT sp.course_id, c.credits
         FROM student_plan sp
         JOIN student_plan_drafts spd ON sp.draft_id = spd.draft_id
         JOIN courses c ON sp.course_id = c.course_id
         WHERE sp.student_id = ? AND spd.is_default = TRUE`,
        [user.user_id]
      );
      planCourses = planned;
    }

    const takenCourseIds = new Set([
      ...transcriptCourses.map(c => c.course_id),
      ...planCourses.map(c => c.course_id)
    ]);

    // Courses that count as completed for prerequisites (only from transcript with COMPLETED or IN_PROGRESS)
    const completedForPrereqs = new Set(
      transcriptCourses
        .filter(c => c.status === 'COMPLETED' || c.status === 'IN_PROGRESS')
        .map(c => c.course_id)
    );

    // Map course_id to credits for calculations
    const courseCreditsMap = new Map<number, number>();
    for (const c of transcriptCourses) courseCreditsMap.set(c.course_id, c.credits);
    for (const c of planCourses) courseCreditsMap.set(c.course_id, c.credits);

    // 3. Get recommended sequences for the major
    const [sequences] = await query<RecommendedSequenceEntry>(
      `SELECT course_id, requirement_group_id, semester_number
       FROM recommended_sequence
       WHERE program_id = ?`,
      [majorProgram.program_id]
    );

    // Build maps for course -> recommended semester and group -> recommended semesters
    const courseRecommendedSemester = new Map<number, number>();
    const groupRecommendedSemesters = new Map<number, number[]>();
    for (const seq of sequences) {
      if (seq.course_id) {
        courseRecommendedSemester.set(seq.course_id, seq.semester_number);
      }
      if (seq.requirement_group_id) {
        const semesters = groupRecommendedSemesters.get(seq.requirement_group_id) || [];
        semesters.push(seq.semester_number);
        groupRecommendedSemesters.set(seq.requirement_group_id, semesters);
      }
    }

    // 4. Get requirement groups for the major
    const [majorGroups] = await query<RequirementGroup>(
      `SELECT * FROM program_requirement_groups WHERE program_id = ?`,
      [majorProgram.program_id]
    );

    // Find GenEd parent group
    const genedParentGroup = majorGroups.find(
      g => g.parent_group_id === null && g.name.toLowerCase().includes('general education')
    );

    // Get GenEd sub-groups
    const genedSubGroups = genedParentGroup
      ? majorGroups.filter(g => g.parent_group_id === genedParentGroup.group_id)
      : [];

    // Get Major Core groups
    const majorCoreGroups = majorGroups.filter(
      g => g.parent_group_id === null &&
           !g.name.toLowerCase().includes('general education') &&
           !g.name.toLowerCase().includes('minor') &&
           !g.name.toLowerCase().includes('concentration') &&
           !g.name.toLowerCase().includes('elective')
    );

    // 5. Fetch all courses for calculation
    const allGroupIds = [
      ...majorCoreGroups.map(g => g.group_id),
      ...genedSubGroups.map(g => g.group_id)
    ];

    let allGroupCourses: GroupCourse[] = [];
    if (allGroupIds.length > 0) {
      const [courses] = await query<GroupCourse>(
        `SELECT rgc.group_id, prg.name as group_name, rgc.course_id,
                c.course_code, c.title, c.credits, rgc.is_mandatory
         FROM requirement_group_courses rgc
         JOIN courses c ON rgc.course_id = c.course_id
         JOIN program_requirement_groups prg ON rgc.group_id = prg.group_id
         WHERE rgc.group_id IN (${allGroupIds.map(() => '?').join(',')})
           AND c.is_active = TRUE`,
        allGroupIds
      );
      allGroupCourses = courses;
    }

    // 6. Build degree courses with prerequisites and semester info
    const majorCoreGroupIds = majorCoreGroups.map(g => g.group_id);
    const degreeCourses: RecommendedCourse[] = [];
    
    for (const group of majorCoreGroups) {
      const groupCourses = allGroupCourses.filter(c => c.group_id === group.group_id);
      const creditsEarned = calculateCreditsEarned(group.group_id, allGroupCourses, takenCourseIds, courseCreditsMap);
      const isFulfilled = creditsEarned >= group.credits_required;

      for (const course of groupCourses) {
        // Skip if already taken
        if (takenCourseIds.has(course.course_id)) continue;
        
        // Skip non-mandatory courses if group is fulfilled
        if (isFulfilled && !course.is_mandatory) continue;

        const { prereqs_met, missing_prereqs } = await checkPrerequisites(course.course_id, completedForPrereqs);
        
        degreeCourses.push({
          course_id: course.course_id,
          course_code: course.course_code,
          title: course.title,
          credits: course.credits,
          is_mandatory: Boolean(course.is_mandatory),
          group_name: course.group_name,
          recommended_semester: courseRecommendedSemester.get(course.course_id) || null,
          prereqs_met,
          missing_prereqs
        });
      }
    }

    // 7. GenEd categories with credit tracking
    const genedCategories: Array<{
      category_name: string;
      group_id: number;
      credits_required: number;
      credits_earned: number;
      fulfilled: boolean;
      courses: RecommendedCourse[];
    }> = [];

    for (const subGroup of genedSubGroups) {
      const [groupCourses] = await query<GroupCourse>(
        `SELECT rgc.group_id, prg.name as group_name, rgc.course_id,
                c.course_code, c.title, c.credits, rgc.is_mandatory
         FROM requirement_group_courses rgc
         JOIN courses c ON rgc.course_id = c.course_id
         JOIN program_requirement_groups prg ON rgc.group_id = prg.group_id
         WHERE rgc.group_id = ? AND c.is_active = TRUE
         ORDER BY rgc.is_mandatory DESC, c.course_code`,
        [subGroup.group_id]
      );

      const creditsEarned = calculateCreditsEarned(subGroup.group_id, groupCourses, takenCourseIds, courseCreditsMap);
      const isFulfilled = creditsEarned >= subGroup.credits_required;

      // Filter courses - hide if fulfilled (except mandatory)
      const availableCourses: RecommendedCourse[] = [];
      for (const course of groupCourses) {
        if (takenCourseIds.has(course.course_id)) continue;
        if (isFulfilled && !course.is_mandatory) continue;

        const { prereqs_met, missing_prereqs } = await checkPrerequisites(course.course_id, completedForPrereqs);
        
        availableCourses.push({
          course_id: course.course_id,
          course_code: course.course_code,
          title: course.title,
          credits: course.credits,
          is_mandatory: Boolean(course.is_mandatory),
          recommended_semester: courseRecommendedSemester.get(course.course_id) || null,
          prereqs_met,
          missing_prereqs
        });
      }

      genedCategories.push({
        category_name: subGroup.name,
        group_id: subGroup.group_id,
        credits_required: subGroup.credits_required,
        credits_earned: creditsEarned,
        fulfilled: isFulfilled,
        courses: availableCourses
      });
    }

    // 8. Minor courses (if student has a minor)
    let minorCourses: RecommendedCourse[] = [];
    const minorRecommendedSemesters: number[] = [];

    // Get recommended semesters for minor from major's sequence
    const minorGroupId = majorGroups.find(g => g.name.toLowerCase().includes('minor'))?.group_id;
    if (minorGroupId) {
      const semesters = groupRecommendedSemesters.get(minorGroupId) || [];
      minorRecommendedSemesters.push(...semesters);
    }

    if (minorProgram) {
      const [minorGroups] = await query<RequirementGroup>(
        `SELECT * FROM program_requirement_groups WHERE program_id = ?`,
        [minorProgram.program_id]
      );

      const minorGroupIds = minorGroups.map(g => g.group_id);
      if (minorGroupIds.length > 0) {
        const [courses] = await query<GroupCourse>(
          `SELECT rgc.group_id, prg.name as group_name, rgc.course_id,
                  c.course_code, c.title, c.credits, rgc.is_mandatory
           FROM requirement_group_courses rgc
           JOIN courses c ON rgc.course_id = c.course_id
           JOIN program_requirement_groups prg ON rgc.group_id = prg.group_id
           WHERE prg.program_id = ? AND c.is_active = TRUE
           ORDER BY rgc.is_mandatory DESC, c.course_code`,
          [minorProgram.program_id]
        );

        // Calculate credits earned per minor group
        let semesterIndex = 0;
        for (const group of minorGroups) {
          const groupCourses = courses.filter(c => c.group_id === group.group_id);
          const creditsEarned = calculateCreditsEarned(group.group_id, groupCourses, takenCourseIds, courseCreditsMap);
          const isFulfilled = creditsEarned >= group.credits_required;

          for (const course of groupCourses) {
            if (takenCourseIds.has(course.course_id)) continue;
            if (isFulfilled && !course.is_mandatory) continue;

            const { prereqs_met, missing_prereqs } = await checkPrerequisites(course.course_id, completedForPrereqs);
            
            minorCourses.push({
              course_id: course.course_id,
              course_code: course.course_code,
              title: course.title,
              credits: course.credits,
              is_mandatory: Boolean(course.is_mandatory),
              group_name: course.group_name,
              recommended_semester: minorRecommendedSemesters[semesterIndex % minorRecommendedSemesters.length] || null,
              prereqs_met,
              missing_prereqs
            });
            semesterIndex++;
          }
        }
      }
    }

    // 9. Concentration courses (if student has a concentration)
    let concentrationCourses: RecommendedCourse[] = [];

    if (concentrationProgram) {
      const [concGroups] = await query<RequirementGroup>(
        `SELECT * FROM program_requirement_groups WHERE program_id = ?`,
        [concentrationProgram.program_id]
      );

      const concGroupIds = concGroups.map(g => g.group_id);
      if (concGroupIds.length > 0) {
        const [courses] = await query<GroupCourse>(
          `SELECT rgc.group_id, prg.name as group_name, rgc.course_id,
                  c.course_code, c.title, c.credits, rgc.is_mandatory
           FROM requirement_group_courses rgc
           JOIN courses c ON rgc.course_id = c.course_id
           JOIN program_requirement_groups prg ON rgc.group_id = prg.group_id
           WHERE prg.program_id = ? AND c.is_active = TRUE
           ORDER BY rgc.is_mandatory DESC, c.course_code`,
          [concentrationProgram.program_id]
        );

        for (const group of concGroups) {
          const groupCourses = courses.filter(c => c.group_id === group.group_id);
          const creditsEarned = calculateCreditsEarned(group.group_id, groupCourses, takenCourseIds, courseCreditsMap);
          const isFulfilled = creditsEarned >= group.credits_required;

          for (const course of groupCourses) {
            if (takenCourseIds.has(course.course_id)) continue;
            if (isFulfilled && !course.is_mandatory) continue;

            const { prereqs_met, missing_prereqs } = await checkPrerequisites(course.course_id, completedForPrereqs);
            
            concentrationCourses.push({
              course_id: course.course_id,
              course_code: course.course_code,
              title: course.title,
              credits: course.credits,
              is_mandatory: Boolean(course.is_mandatory),
              group_name: course.group_name,
              recommended_semester: null, // Could be enhanced with concentration sequence
              prereqs_met,
              missing_prereqs
            });
          }
        }
      }
    }

    return NextResponse.json({
      major_name: majorProgram.name,
      minor_name: minorProgram?.name || null,
      concentration_name: concentrationProgram?.name || null,
      degree_courses: degreeCourses,
      gened_categories: genedCategories,
      minor_courses: minorCourses,
      concentration_courses: concentrationCourses
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching recommended courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
