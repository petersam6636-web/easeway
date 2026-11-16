
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import ProjectLoading from "@/component/Loading";

import {
  UserRound,
  BookOpen,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Award,
  Users,
  ArrowLeft,
  X,
  Copy,
  ClipboardCheck,
} from "lucide-react";

export default function ProjectPage() {
  const router = useRouter();

  // Resolve project ID without useParams or usePathname.
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isProjectIdReady, setIsProjectIdReady] = useState(false);

  useEffect(() => {
    const pathParts = window.location.pathname
      .split("/")
      .filter(Boolean);

    const projectPosition = pathParts.indexOf("project");
    const urlId = pathParts[projectPosition + 1];

    if (
      projectPosition !== -1 &&
      urlId &&
      !["final", "undefined", "null"].includes(urlId)
    ) {
      try {
        setProjectId(decodeURIComponent(urlId));
      } catch {
        setProjectId(null);
      }
    } else {
      setProjectId(null);
    }

    setIsProjectIdReady(true);
  }, []);

  // Project states.
  const [project, setProject] = useState<any>(null);
  const [projectSubjects, setProjectSubjects] = useState<string[]>([]);
  const [positionCounter, setPositionCounter] = useState(0);

  // Student states.
  const [originalStudents, setOriginalStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  // Form states.
  const [studentName, setStudentName] = useState("");
  const [marks, setMarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRestoringProgress, setIsRestoringProgress] = useState(true);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [showStudents, setShowStudents] = useState(false);

  const [copyNotice, setCopyNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projectMethod = String(project?.method || "").toLowerCase();

  const currentSubject = String(
    projectSubjects[positionCounter] || ""
  ).trim();

  // Progress calculations.
  const totalStudents = originalStudents.length;
  const studentsLeft = allStudents.length;
  const studentsAdded = Math.max(0, totalStudents - studentsLeft);

  const progressPercentage =
    totalStudents > 0 ? (studentsAdded / totalStudents) * 100 : 0;

  // Select tables based on project method.
  const getStudentTable = (method: string) => {
    if (method === "jhs") return "jhs_students";
    if (method === "primary") return "primary_students";
    return null;
  };

  const getSubjectTable = (method: string) => {
    if (method === "jhs") return "jhs_subjects";
    if (method === "primary") return "primary_subjects";
    return null;
  };

  // Restore project progress.
  useEffect(() => {
    // Wait until the URL project ID has been resolved.
    if (!isProjectIdReady) return;

    let cancelled = false;

    const restoreProject = async () => {
      setIsRestoringProgress(true);
      setProject(null);
      setProjectSubjects([]);
      setPositionCounter(0);
      setOriginalStudents([]);
      setAllStudents([]);
      setFeedback(null);

      try {
        // 1. Check project ID.
        if (!projectId) {
          throw new Error(
            "Project ID is missing. Please check the project URL."
          );
        }

        // 2. Fetch project.
        const { data: projectData, error: projectError } =
          await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();

        if (projectError) {
          throw new Error(
            `Could not fetch project: ${projectError.message}`
          );
        }

        if (!projectData) {
          throw new Error("This project could not be found.");
        }

        if (cancelled) return;

        setProject(projectData);

        // 3. Select the correct tables.
        const method = String(projectData.method || "").toLowerCase();

        const studentTable = getStudentTable(method);
        const subjectTable = getSubjectTable(method);

        if (!studentTable || !subjectTable) {
          throw new Error(
            `Invalid project method: "${method}". Expected "jhs" or "primary".`
          );
        }

        // 4. Fetch students from ONLY the selected student table.
        const { data: students, error: studentsError } =
          await supabase
            .from(studentTable)
            .select("*")
            .eq("project_id", projectId);

        if (studentsError) {
          throw new Error(
            `Could not fetch students: ${studentsError.message}`
          );
        }

        if (cancelled) return;

        const projectStudents = students || [];

        setOriginalStudents(projectStudents);

        // 5. Fetch this project's subject records.
        let subjectRecords: any[] = [];

        if (projectStudents.length > 0) {
          const studentIds = projectStudents.map(
            (student: any) => student.id
          );

          const { data, error: subjectError } = await supabase
            .from(subjectTable)
            .select("*")
            .in("student_id", studentIds);

          if (subjectError) {
            throw new Error(
              `Could not fetch subject records: ${subjectError.message}`
            );
          }

          subjectRecords = data || [];
        }

        if (cancelled) return;

        // 6. Discover subject columns.
        let subjectSource = subjectRecords[0] || null;

        // If this project has no subject records, inspect
        // one record from the SAME selected subject table.
        if (!subjectSource) {
          const { data: sampleRecords, error: sampleError } =
            await supabase
              .from(subjectTable)
              .select("*")
              .limit(1);

          if (sampleError) {
            throw new Error(
              `Could not inspect ${subjectTable}: ${sampleError.message}`
            );
          }

          subjectSource = sampleRecords?.[0] || null;
        }

        if (!subjectSource) {
          throw new Error(
            `No records exist in ${subjectTable}. Subject columns cannot be detected until a record exists in this table.`
          );
        }

        const subjects = Object.keys(subjectSource).filter(
          (column) => column !== "id" && column !== "student_id"
        );

        if (subjects.length === 0) {
          throw new Error(
            `No subject columns were detected in ${subjectTable}.`
          );
        }

        if (cancelled) return;

        setProjectSubjects(subjects);

        // 7. Validate the saved subject index.
        const savedIndex = Number(projectData.index ?? 0);

        if (!Number.isInteger(savedIndex) || savedIndex < 0) {
          throw new Error("The saved project index is invalid.");
        }

        if (savedIndex > subjects.length) {
          throw new Error(
            "The saved project index is greater than the available subject count."
          );
        }

        // 8. Find the first subject that still has students
        // who have not entered their marks.
        let nextAvailablePosition = -1;
        let nextAvailableStudents: any[] = [];

        for (let i = savedIndex; i < subjects.length; i++) {
          const subject = subjects[i];

          const completedStudentIds = new Set(
            subjectRecords
              .filter((record) => record[subject] != null)
              .map((record) => String(record.student_id))
          );

          const remainingStudents = projectStudents.filter(
            (student: any) =>
              !completedStudentIds.has(String(student.id))
          );

          // Stop when we find a subject with students remaining.
          if (remainingStudents.length > 0) {
            nextAvailablePosition = i;
            nextAvailableStudents = remainingStudents;
            break;
          }
        }

        if (cancelled) return;

        // 9. No students remain in any subject.
        // Save the completed index and go to the final route.
        if (nextAvailablePosition === -1) {
          const { error: updateError } = await supabase
            .from("projects")
            .update({ index: subjects.length })
            .eq("id", projectId);

          if (updateError) {
            throw new Error(
              `Could not update completed project: ${updateError.message}`
            );
          }

          if (cancelled) return;

          router.replace("/home/project/final");
          return;
        }

        // 10. Save the correct position if completed subjects
        // had to be skipped.
        if (nextAvailablePosition !== savedIndex) {
          const { error: updateError } = await supabase
            .from("projects")
            .update({ index: nextAvailablePosition })
            .eq("id", projectId);

          if (updateError) {
            throw new Error(
              `Could not update project progress: ${updateError.message}`
            );
          }
        }

        if (cancelled) return;

        // Restore the subject and remaining students.
        setPositionCounter(nextAvailablePosition);
        setAllStudents(nextAvailableStudents);
      } catch (error) {
        console.error("RESTORE PROJECT ERROR:", error);

        if (!cancelled) {
          setFeedback({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not restore your project.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsRestoringProgress(false);
        }
      }
    };

    restoreProject();

    return () => {
      cancelled = true;
    };
  }, [projectId, isProjectIdReady, router]);

  // Clear timers when component unmounts.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Copy student name.
  const handleCopyStudentName = async (fullName: string) => {
    try {
      await navigator.clipboard.writeText(fullName);

      setShowStudents(false);
      setCopyNotice({
        type: "success",
        message: `${fullName} copied successfully!`,
      });
    } catch (error) {
      console.error("COPY ERROR:", error);

      setCopyNotice({
        type: "error",
        message: "Could not copy the student's name.",
      });
    }

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = setTimeout(() => {
      setCopyNotice(null);
      copyTimeoutRef.current = null;
    }, 1500);
  };

  // Move to the next subject.
  const moveToNextSubject = async () => {
    const nextPosition = positionCounter + 1;

    setLoading(true);

    try {
      // All subjects completed.
      if (nextPosition >= projectSubjects.length) {
        const { error } = await supabase
          .from("projects")
          .update({ index: projectSubjects.length })
          .eq("id", projectId);

        if (error) throw error;

        router.push("/home/project/final");
        return;
      }

      const nextSubject = projectSubjects[nextPosition];
      const subjectTable = getSubjectTable(projectMethod);

      if (!nextSubject || !subjectTable) {
        throw new Error("The next subject is not available.");
      }

      // Fetch only this project's subject records.
      let subjectRecords: any[] = [];

      if (originalStudents.length > 0) {
        const studentIds = originalStudents.map(
          (student) => student.id
        );

        const { data, error } = await supabase
          .from(subjectTable)
          .select("*")
          .in("student_id", studentIds);

        if (error) throw error;

        subjectRecords = data || [];
      }

      // Find students who have completed the next subject.
      const completedNextSubjectIds = new Set(
        subjectRecords
          .filter((record) => record[nextSubject] != null)
          .map((record) => String(record.student_id))
      );

      const nextStudents = originalStudents.filter(
        (student) =>
          !completedNextSubjectIds.has(String(student.id))
      );

      // Save the next subject position.
      const { error: updateError } = await supabase
        .from("projects")
        .update({ index: nextPosition })
        .eq("id", projectId);

      if (updateError) throw updateError;

      // If the next subject is already completed,
      // continue checking the following subjects.
      if (nextStudents.length === 0) {
        setPositionCounter(nextPosition);
        setAllStudents([]);
        setStudentName("");
        setMarks("");
        setFeedback(null);

        // Check whether there are any subjects left.
        const followingPosition = nextPosition + 1;

        if (followingPosition >= projectSubjects.length) {
          const { error: finalUpdateError } = await supabase
            .from("projects")
            .update({ index: projectSubjects.length })
            .eq("id", projectId);

          if (finalUpdateError) throw finalUpdateError;

          router.replace("/home/project/final");
          return;
        }

        // Continue to the next subject.
        setTimeout(() => {
          moveToNextSubject();
        }, 0);

        return;
      }

      setAllStudents(nextStudents);
      setPositionCounter(nextPosition);
      setStudentName("");
      setMarks("");
      setFeedback(null);
      setShowStudents(false);
    } catch (error) {
      console.error("NEXT SUBJECT ERROR:", error);

      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not move to the next subject.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add student marks.
  const handleAddStudent = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading || isRestoringProgress) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setFeedback(null);

    const fullName = studentName.trim();
    const numericMarks = Number(marks);

    if (!fullName) {
      setFeedback({
        type: "error",
        message: "Please enter the student's full name.",
      });
      return;
    }

    if (
      marks.trim() === "" ||
      !Number.isFinite(numericMarks) ||
      numericMarks < 0 ||
      numericMarks > 100
    ) {
      setFeedback({
        type: "error",
        message: "Enter a valid mark between 0 and 100.",
      });
      return;
    }

    if (!currentSubject) {
      setFeedback({
        type: "error",
        message: "No subject is currently available.",
      });
      return;
    }

    const matchedStudent = allStudents.find(
      (student) =>
        String(student.full_name || "").trim().toLowerCase() ===
        fullName.toLowerCase()
    );

    if (!matchedStudent) {
      setFeedback({
        type: "error",
        message: `Student "${fullName}" does not exist in this project or has already been completed.`,
      });
      return;
    }

    const subjectTable = getSubjectTable(projectMethod);

    if (!subjectTable) {
      setFeedback({
        type: "error",
        message: "The project method is invalid.",
      });
      return;
    }

    setLoading(true);

    try {
      // First subject: insert a new record.
      if (positionCounter === 0) {
        const insertData = {
          student_id: matchedStudent.id,
          [currentSubject]: numericMarks,
        };

        const { error } = await supabase
          .from(subjectTable)
          .insert(insertData);

        if (error) throw new Error(error.message);
      } else {
        // Other subjects: update the existing record.
        const { data, error } = await supabase
          .from(subjectTable)
          .update({ [currentSubject]: numericMarks })
          .eq("student_id", matchedStudent.id)
          .select("student_id")
          .maybeSingle();

        if (error) throw new Error(error.message);

        if (!data) {
          throw new Error(
            `No subject record was found for ${matchedStudent.full_name}.`
          );
        }
      }

      // Remove completed student from the remaining list.
      const remainingStudents = allStudents.filter(
        (student) =>
          String(student.id) !== String(matchedStudent.id)
      );

      setAllStudents(remainingStudents);
      setStudentName("");
      setMarks("");

      const subjectCompleted = remainingStudents.length === 0;

      setFeedback({
        type: "success",
        message: `${matchedStudent.full_name}'s ${currentSubject} mark was successfully saved!`,
      });

      // Automatically move forward when all students are completed.
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        timeoutRef.current = null;

        if (subjectCompleted) {
          moveToNextSubject();
        }
      }, 400);
    } catch (error) {
      console.error("SAVE STUDENT MARKS ERROR:", error);

      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not save student marks.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading screen.
  if (!isProjectIdReady || isRestoringProgress) {
    return <ProjectLoading />;
  }

  // Project loading error.
  if (!project) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle size={35} className="mx-auto text-red-500 mb-3" />

          <h2 className="text-lg font-bold text-slate-800">
            Project Could Not Be Loaded
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            {feedback?.message || "We could not find this project."}
          </p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-5 px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No subject available.
  if (!currentSubject) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle size={35} className="mx-auto text-red-500 mb-3" />

          <h2 className="text-lg font-bold text-slate-800">
            No Subject Available
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            {feedback?.message ||
              "Please check your project subject configuration."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Copy notification */}
      {copyNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm">
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl shadow-xl border ${
              copyNotice.type === "success"
                ? "bg-white border-green-100 text-green-700"
                : "bg-white border-red-100 text-red-600"
            }`}
          >
            {copyNotice.type === "success" ? (
              <ClipboardCheck size={20} />
            ) : (
              <AlertCircle size={20} />
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {copyNotice.type === "success"
                  ? "Name Copied!"
                  : "Copy Failed"}
              </p>

              <p className="text-xs mt-0.5 break-words">
                {copyNotice.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCopyNotice(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Close notification"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="min-h-[60vh] flex items-center justify-center px-2 py-2">
        <div className="w-full max-w-lg">
          {/* Heading */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-bold text-slate-800">
              Enter Student Marks
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Record each student's marks for the selected subject.
            </p>

            <p className="text-xs font-semibold text-blue-700 mt-2">
              {project.header}
            </p>
          </div>

          {/* Main card */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 sm:p-6">
            {/* Student progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-blue-700" />

                  <p className="text-sm font-semibold text-slate-700">
                    Student Progress
                  </p>
                </div>

                <span className="text-xs font-semibold text-blue-700">
                  {Math.round(progressPercentage)}% completed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-2xl font-bold text-red-600 tabular-nums">
                    {studentsLeft}
                  </p>

                  <p className="text-xs font-medium text-red-600 mt-1">
                    Students Left
                  </p>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-2xl font-bold text-green-600 tabular-nums">
                    {studentsAdded}
                  </p>

                  <p className="text-xs font-medium text-green-600 mt-1">
                    Students Added
                  </p>
                </div>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowStudents(true)}
                disabled={studentsLeft === 0 || loading}
                className="mt-3 w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Users size={16} />
                View Students Left
              </button>
            </div>

            {/* Current subject */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-white flex items-center justify-center text-blue-700">
                <BookOpen size={22} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-600">
                  Current Subject
                </p>

                <h3 className="text-lg font-bold text-blue-950 capitalize truncate">
                  {currentSubject}
                </h3>
              </div>

              <div className="ml-auto text-blue-600">
                <Award size={22} />
              </div>
            </div>

            {/* Marks form */}
            <form onSubmit={handleAddStudent} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Student Full Name
                </label>

                <div className="relative">
                  <UserRound
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      setFeedback(null);
                    }}
                    placeholder="Enter student's full name"
                    disabled={loading}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 capitalize">
                  {currentSubject} Marks
                </label>

                <div className="relative">
                  <Award
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={marks}
                    onChange={(e) => {
                      setMarks(e.target.value);
                      setFeedback(null);
                    }}
                    placeholder="Enter marks obtained"
                    disabled={loading}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:opacity-60"
                  />
                </div>
              </div>

              {feedback && (
                <div
                  className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                    feedback.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 size={19} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={19} className="shrink-0 mt-0.5" />
                  )}

                  <p className="whitespace-pre-wrap break-words min-w-0">
                    {feedback.message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !currentSubject || studentsLeft === 0}
                className="w-full h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    Saving Marks...
                  </>
                ) : studentsLeft === 0 ? (
                  <>
                    <CheckCircle2 size={19} />
                    All Students Completed
                  </>
                ) : (
                  <>
                    <Plus size={19} />
                    Add Student Marks
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            Enter one student's marks at a time.
          </p>
        </div>
      </div>

      {/* Students left popup */}
      {showStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3 py-5">
          <div className="w-full max-w-md max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-800">
                      Students Left
                    </h2>

                    <p className="text-xs text-slate-500">
                      {studentsLeft} students remaining
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowStudents(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                  aria-label="Close students list"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-3">
                Click a student's name to copy it.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {allStudents.length > 0 ? (
                allStudents.map((student, index) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() =>
                      handleCopyStudentName(student.full_name)
                    }
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition cursor-pointer group"
                  >
                    <div className="w-9 h-9 shrink-0 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm group-hover:bg-white">
                      {student.full_name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {student.full_name}
                      </p>

                      <p className="text-xs text-slate-400">
                        Student #{index + 1}
                      </p>
                    </div>

                    <div className="shrink-0 text-slate-400 group-hover:text-blue-700">
                      <Copy size={17} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center">
                  <Users size={32} className="mx-auto text-slate-300 mb-3" />

                  <p className="text-sm font-semibold text-slate-600">
                    No students left
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    All students have been completed.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStudents(false)}
                className="w-full h-11 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft size={17} />
                Back to Enter Marks
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
