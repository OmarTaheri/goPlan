/* eslint-disable max-lines */
import * as fs from "fs";
import * as path from "path";

import { NextRequest, NextResponse } from "next/server";

import { requireAuthWithRole } from "@/lib/auth/rbac";
import { query } from "@/lib/db/query";

interface StudentProgram {
  program_id: number;
  type: "MAJOR" | "MINOR" | "CONCENTRATION";
  name: string;
}

interface RecommendedSequenceEntry {
  sequence_id: number;
  course_id: number | null;
  requirement_group_id: number | null;
  semester_number: number;
  recommended_order: number;
}

interface CourseInfo {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
}

interface GroupCourse extends CourseInfo {
  group_id: number;
  is_mandatory: boolean;
}

interface CourseDependency {
  dependency_course_id: number;
  dependency_course_code: string;
  logic_set_id: number;
}

interface AutoFillAddition {
  course_id: number;
  course_code: string;
  title: string;
  credits: number;
  suggested_semester: number;
  prereqs_met: boolean;
  missing_prereqs: string[];
  category: string;
}

interface AutoFillConflict {
  course_code: string;
  reason: string;
}

/**
 * Check if prerequisites are met for a course
 */
async function checkPrerequisites(
  courseId: number,
  completedCourseIds: Set<number>,
): Promise<{ prereqs_met: boolean; missing_prereqs: string[] }> {
  const [dependencies] = await query<CourseDependency>(
    `SELECT cd.dependency_course_id, c.course_code as dependency_course_code, cd.logic_set_id
     FROM course_dependencies cd
     JOIN courses c ON cd.dependency_course_id = c.course_id
     WHERE cd.course_id = ? AND cd.dependency_type = 'PREREQUISITE'`,
    [courseId],
  );

  if (dependencies.length === 0) {
    return { prereqs_met: true, missing_prereqs: [] };
  }

  // Group by logic_set_id (same set = AND, different sets = OR)
  const logicSets = new Map<number, CourseDependency[]>();
  for (const dep of dependencies) {
    const set = logicSets.get(dep.logic_set_id) ?? [];
    set.push(dep);
    logicSets.set(dep.logic_set_id, set);
  }

  // Check if ANY logic set is fully satisfied (OR between sets)
  for (const [, setDeps] of logicSets) {
    const allMet = setDeps.every((dep) => completedCourseIds.has(dep.dependency_course_id));
    if (allMet) {
      return { prereqs_met: true, missing_prereqs: [] };
    }
  }

  // None fully satisfied - collect missing from the first set
  const firstSet = logicSets.get(1);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const missing = (firstSet ?? Array.from(logicSets.values())[0] ?? [])
    .filter((dep) => !completedCourseIds.has(dep.dependency_course_id))
    .map((dep) => dep.dependency_course_code);

  return { prereqs_met: false, missing_prereqs: missing };
}

const logPath = path.join(process.cwd(), "auto-fill-debug.txt");

function logDebug(message: string) {
  try {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
  } catch {
    // ignore
  }
}

/**
 * POST /api/student/plan/auto-fill
 * Generate auto-fill suggestions based on recommended sequences and prerequisites
 */
/* eslint-disable complexity, max-depth */
export async function POST(request: NextRequest) {
  try {
    logDebug("--- START AUTO-FILL ---");
    const user = await requireAuthWithRole(request, ["STUDENT"]);
    const body = await request.json();
    const { draft_id, fill_mode = "remaining" } = body; // 'all' or 'remaining'

    // 1. Get student's enrolled programs
    const [programs] = await query<StudentProgram>(
      `SELECT sp.program_id, sp.type, p.name
       FROM student_programs sp
       JOIN programs p ON sp.program_id = p.program_id
       WHERE sp.student_id = ?`,
      [user.user_id],
    );

    const majorProgram = programs.find((p) => p.type === "MAJOR");
    const minorProgram = programs.find((p) => p.type === "MINOR");
    const concentrationProgram = programs.find((p) => p.type === "CONCENTRATION");

    if (!majorProgram) {
      return NextResponse.json({ error: "No major assigned" }, { status: 400 });
    }

    // 2. Get completed courses from transcript
    const [transcriptCourses] = await query<{ course_id: number; status: string }>(
      `SELECT course_id, status FROM student_transcript WHERE student_id = ?`,
      [user.user_id],
    );
    const completedCourseIds = new Set(
      transcriptCourses.filter((c) => c.status === "COMPLETED" || c.status === "IN_PROGRESS").map((c) => c.course_id),
    );

    // 3. Get already-planned courses
    let plannedCourseIds = new Set<number>();
    if (draft_id) {
      const [plannedCourses] = await query<{ course_id: number }>(
        `SELECT course_id FROM student_plan WHERE student_id = ? AND draft_id = ?`,
        [user.user_id, draft_id],
      );
      plannedCourseIds = new Set(plannedCourses.map((c) => c.course_id));
    }

    // Combined set of courses to skip
    const skipCourseIds = new Set([...completedCourseIds, ...plannedCourseIds]);
    logDebug(`Skip set size: ${skipCourseIds.size}`);
    logDebug(`Has MTH 1312 (95)? ${skipCourseIds.has(95)}`);

    // 4. Get recommended sequence for the major
    const [sequences] = await query<RecommendedSequenceEntry>(
      `SELECT sequence_id, course_id, requirement_group_id, semester_number, recommended_order
       FROM recommended_sequence
       WHERE program_id = ?
       ORDER BY semester_number, recommended_order`,
      [majorProgram.program_id],
    );

    // 5. Get historical semesters count to calculate plan semester numbers
    const [historicalData] = await query<{ count: number }>(
      `SELECT COUNT(DISTINCT semester_id) as count 
       FROM student_transcript 
       WHERE student_id = ?`,
      [user.user_id],
    );
    const historicalSemesters = historicalData[0]?.count ?? 0;

    // 6. Build additions list
    const additions: AutoFillAddition[] = [];
    const conflicts: AutoFillConflict[] = [];
    const addedCourseIds = new Set<number>();

    // Track what will be completed after each semester for prereq checking
    const willBeCompleted = new Set([...completedCourseIds]);

    // Group sequences by semester
    const semesterSequences = new Map<number, RecommendedSequenceEntry[]>();
    for (const seq of sequences) {
      const seqs = semesterSequences.get(seq.semester_number) ?? [];
      seqs.push(seq);
      semesterSequences.set(seq.semester_number, seqs);
    }

    // Process each semester in order
    for (const [semesterNum, seqs] of Array.from(semesterSequences.entries()).sort((a, b) => a[0] - b[0])) {
      // Calculate plan semester (relative to student's current position)
      const planSemester = semesterNum - historicalSemesters;

      // Skip past semesters if fill_mode is 'remaining'
      if (fill_mode === "remaining" && planSemester < 1) {
        continue;
      }

      for (const seq of seqs) {
        if (seq.course_id) {
          // Direct course recommendation
          if (skipCourseIds.has(seq.course_id) || addedCourseIds.has(seq.course_id)) {
            continue;
          }

          const [courseInfo] = await query<CourseInfo>(
            `SELECT course_id, course_code, title, credits 
             FROM courses 
             WHERE course_id = ? AND is_active = TRUE`,
            [seq.course_id],
          );

          if (courseInfo.length === 0) continue;

          const course = courseInfo[0];
          const { prereqs_met, missing_prereqs } = await checkPrerequisites(course.course_id, willBeCompleted);

          additions.push({
            course_id: course.course_id,
            course_code: course.course_code,
            title: course.title,
            credits: course.credits,
            suggested_semester: Math.max(1, planSemester),
            prereqs_met,
            missing_prereqs,
            category: "Major Core",
          });

          addedCourseIds.add(course.course_id);

          // Add to willBeCompleted for next semester prereq checks
          willBeCompleted.add(course.course_id);
        } else if (seq.requirement_group_id) {
          // Group-based recommendation (minor, electives, concentration)
          const [groupInfo] = await query<{ name: string }>(
            `SELECT name FROM program_requirement_groups WHERE group_id = ?`,
            [seq.requirement_group_id],
          );

          const groupName = groupInfo[0]?.name ?? "Elective";
          let targetProgramId: number | null = null;
          let category = groupName;

          // Determine which program to pull courses from
          if (groupName.toLowerCase().includes("minor")) {
            targetProgramId = minorProgram?.program_id ?? null;
            category = `Minor (${minorProgram?.name ?? "Not Selected"})`;
          } else if (groupName.toLowerCase().includes("concentration")) {
            targetProgramId = concentrationProgram?.program_id ?? null;
            category = `Concentration (${concentrationProgram?.name ?? "Not Selected"})`;
          }

          if (targetProgramId) {
            // Get courses from the target program's requirement groups
            const [groupCourses] = await query<GroupCourse>(
              `SELECT DISTINCT c.course_id, c.course_code, c.title, c.credits, 
                      rgc.group_id, rgc.is_mandatory
               FROM requirement_group_courses rgc
               JOIN courses c ON rgc.course_id = c.course_id
               JOIN program_requirement_groups prg ON rgc.group_id = prg.group_id
               WHERE prg.program_id = ? AND c.is_active = TRUE
               ORDER BY rgc.is_mandatory DESC, c.course_code`,
              [targetProgramId],
            );

            // Find first available course not already added
            for (const course of groupCourses) {
              if (skipCourseIds.has(course.course_id) || addedCourseIds.has(course.course_id)) {
                continue;
              }

              const { prereqs_met, missing_prereqs } = await checkPrerequisites(course.course_id, willBeCompleted);

              additions.push({
                course_id: course.course_id,
                course_code: course.course_code,
                title: course.title,
                credits: course.credits,
                suggested_semester: Math.max(1, planSemester),
                prereqs_met,
                missing_prereqs,
                category,
              });

              addedCourseIds.add(course.course_id);
              willBeCompleted.add(course.course_id);
              break; // Only add one course per slot
            }
          } else if (!groupName.toLowerCase().includes("minor") && !groupName.toLowerCase().includes("concentration")) {
            // Free electives - could suggest any course, but for now add a conflict note
            conflicts.push({
              course_code: `${groupName} Slot`,
              reason: "Manual selection recommended for elective slots",
            });
          }
        }
      }
    }

    // 7. MAJOR REQUIREMENTS: Add remaining required courses from the degree
    // This handles courses like computing electives that may not be in the sequence
    const [majorGroups] = await query<{ group_id: number; name: string; credits_required: number }>(
      `SELECT group_id, name, credits_required 
       FROM program_requirement_groups 
       WHERE program_id = ? AND parent_group_id IS NULL`,
      [majorProgram.program_id],
    );

    // Get all courses from degree requirement groups (excluding GenEd, Minor, Concentration placeholders)
    for (const group of majorGroups) {
      // Skip groups that are just placeholders for minor/concentration/genEd
      if (
        group.name.toLowerCase().includes("minor") ||
        group.name.toLowerCase().includes("concentration") ||
        group.name.toLowerCase().includes("general education") ||
        (group.name.toLowerCase().includes("elective") && group.credits_required === 0)
      ) {
        // Only skip if 0 credits required
        continue;
      }

      const [groupCourses] = await query<GroupCourse>(
        `SELECT DISTINCT c.course_id, c.course_code, c.title, c.credits, 
                rgc.group_id, rgc.is_mandatory
         FROM requirement_group_courses rgc
         JOIN courses c ON rgc.course_id = c.course_id
         WHERE rgc.group_id = ? AND c.is_active = TRUE
         ORDER BY rgc.is_mandatory DESC, c.course_code`,
        [group.group_id],
      );

      // Calculate credits already fulfilled (Historical + Planned + Added in Step 6)
      let fulfilledCredits = 0;

      // Check historical and planned
      for (const c of groupCourses) {
        if (skipCourseIds.has(c.course_id)) {
          fulfilledCredits += c.credits;
        }
      }

      // Check additions from Step 6
      for (const added of additions) {
        if (groupCourses.some((gc) => gc.course_id === added.course_id)) {
          fulfilledCredits += added.credits;
        }
      }

      let remainingCredits = group.credits_required - fulfilledCredits;

      if (remainingCredits <= 0) continue;

      for (const course of groupCourses) {
        if (remainingCredits <= 0) break;

        // Skip if already taken, planned, or added
        if (skipCourseIds.has(course.course_id) || addedCourseIds.has(course.course_id)) {
          continue;
        }

        const { prereqs_met, missing_prereqs } = await checkPrerequisites(course.course_id, willBeCompleted);

        // For non-mandatory courses in a competitive bucket (like major electives),
        // we might only want to auto-fill if prereqs are met to be safe.
        // But for mandatory courses, we should suggest them even if prereqs missing (with warning)

        const targetSemester = 1;

        additions.push({
          course_id: course.course_id,
          course_code: course.course_code,
          title: course.title,
          credits: course.credits,
          suggested_semester: targetSemester,
          prereqs_met,
          missing_prereqs,
          category: group.name,
        });

        addedCourseIds.add(course.course_id);
        willBeCompleted.add(course.course_id);
        remainingCredits -= course.credits;
      }
    }

    // 8. MINOR REQUIREMENTS: Add remaining required courses for the minor
    if (minorProgram) {
      logDebug(`Processing Minor: ${minorProgram.name} (${minorProgram.program_id})`);
      const [minorGroups] = await query<{ group_id: number; name: string; credits_required: number }>(
        `SELECT group_id, name, credits_required 
             FROM program_requirement_groups 
             WHERE program_id = ? AND parent_group_id IS NULL`,
        [minorProgram.program_id],
      );
      logDebug(`Found ${minorGroups.length} minor groups`);

      for (const group of minorGroups) {
        const [groupCourses] = await query<GroupCourse>(
          `SELECT DISTINCT c.course_id, c.course_code, c.title, c.credits, 
                        rgc.group_id, rgc.is_mandatory
                 FROM requirement_group_courses rgc
                 JOIN courses c ON rgc.course_id = c.course_id
                 WHERE rgc.group_id = ? AND c.is_active = TRUE
                 ORDER BY rgc.is_mandatory DESC, c.course_code`,
          [group.group_id],
        );

        logDebug(`Group ${group.name} (${group.group_id}): Found ${groupCourses.length} courses`);

        let fulfilledCredits = 0;
        // Check historical and planned
        for (const c of groupCourses) {
          if (skipCourseIds.has(c.course_id)) {
            fulfilledCredits += c.credits;
          }
        }
        // Check additions from Step 6 & 7
        for (const added of additions) {
          if (groupCourses.some((gc) => gc.course_id === added.course_id)) {
            fulfilledCredits += added.credits;
          }
        }

        let remainingCredits = group.credits_required - fulfilledCredits;
        logDebug(
          `Group ${group.name}: Required ${group.credits_required}, Fulfilled ${fulfilledCredits}, Remaining ${remainingCredits}`,
        );

        if (remainingCredits <= 0) {
          logDebug(`Group ${group.name} satisfied.`);
          continue;
        }

        for (const course of groupCourses) {
          if (remainingCredits <= 0) break;
          if (skipCourseIds.has(course.course_id) || addedCourseIds.has(course.course_id)) {
            continue;
          }

          const { prereqs_met, missing_prereqs } = await checkPrerequisites(course.course_id, willBeCompleted);

          logDebug(`Adding ${course.course_code} to Minor. Prereqs met: ${prereqs_met}`);

          additions.push({
            course_id: course.course_id,
            course_code: course.course_code,
            title: course.title,
            credits: course.credits,
            suggested_semester: 1, // Suggest for next available
            prereqs_met,
            missing_prereqs,
            category: `Minor: ${group.name}`,
          });

          addedCourseIds.add(course.course_id);
          willBeCompleted.add(course.course_id);
          remainingCredits -= course.credits;
        }
      }
    } else {
      logDebug("No minor program found");
    }

    logDebug(`Total additions: ${additions.length}`);
    return NextResponse.json({
      additions,
      conflicts,
      major_name: majorProgram.name,
      minor_name: minorProgram?.name ?? null,
      concentration_name: concentrationProgram?.name ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in auto-fill:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable complexity, max-depth */
/* eslint-enable max-lines */
