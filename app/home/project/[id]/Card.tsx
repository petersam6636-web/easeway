"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";
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
  const { projectId } = useParams();

  const { subjectSteps } = useApp();

  // Store the project fetched directly from Supabase.
  const [project, setProject] = useState(null);

  // Get the method from the fetched project.
  const projectMethod = String(project?.method || "").toLowerCase();

  // Select the correct student table using the project's method.
  const getStudentTable = (method = projectMethod) => {
    if (method === "jhs") return "jhs_students";
    if (method === "primary") return "primary_students";
    return null;
  };

  // Select the correct subject table using the project's method.
  const getSubjectTable = (method = projectMethod) => {
    if (method === "jhs") return "jhs_subjects";
    if (method === "primary") return "primary_subjects";
    return null;
  };

  // Subject navigation.
  const [positionCounter, setPositionCounter] = useState(0);

  const currentSubject = String(
    subjectSteps?.[positionCounter] || ""
  ).trim();

  // Students belonging only to this project.
  const [originalStudents, setOriginalStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  const totalStudents = originalStudents.length;
  const studentsLeft = allStudents.length;
  const studentsAdded = Math.max(0, totalStudents - studentsLeft);

  const progressPercentage =
    totalStudents > 0
      ? (studentsAdded / totalStudents) * 100
      : 0;

  // Form states.
  const [studentName, setStudentName] = useState("");
  const [marks, setMarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRestoringProgress, setIsRestoringProgress] = useState(true);

  const [feedback, setFeedback] = useState(null);
  const [showStudents, setShowStudents] = useState(false);
  const [copyNotice, setCopyNotice] = useState(null);

  const timeoutRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  // Fetch the project directly from Supabase and restore its saved progress.
  useEffect(() => {
    let cancelled = false;

    const restoreProject = async () => {
      setIsRestoringProgress(true);

      try {
        // Get the project whose ID matches the dynamic URL.
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projectError) throw projectError;

        if (cancelled) return;

        // Save the fetched project in state.
        setProject(projectData);

        // Get the method from the fetched project.
        const method = String(projectData.method || "").toLowerCase();

        // Select only the tables belonging to this project's method.
        const studentTable = getStudentTable(method);
        const subjectTable = getSubjectTable(method);

        if (!studentTable || !subjectTable) {
          throw new Error(
            `Invalid project method: "${method}". Expected JHS or Primary.`
          );
        }

        if (!Array.isArray(subjectSteps) || subjectSteps.length === 0) {
          throw new Error("No subjects are available for this project.");
        }

        // Fetch students from ONLY the selected student table.
        const { data: students, error: studentsError } = await supabase
          .from(studentTable)
          .select("*")
          .eq("project_id", projectId);

        if (studentsError) throw studentsError;

        if (cancelled) return;

        const projectStudents = students || [];

        setOriginalStudents(projectStudents);

        // Restore this project's saved subject position.
        const savedIndex = Number(projectData.index ?? 0);

        const restoredPosition = Number.isFinite(savedIndex)
          ? Math.max(0, Math.min(savedIndex, subjectSteps.length - 1))
          : 0;

        if (cancelled) return;

        setPositionCounter(restoredPosition);

        // Get the subject for the restored position.
        const restoredSubject = String(
          subjectSteps[restoredPosition] || ""
        )
          .trim()
          .toLowerCase();

        if (!restoredSubject) {
          throw new Error("The saved subject position is invalid.");
        }

        // Fetch marks from ONLY the selected subject table.
        const { data: subjectRecords, error: subjectError } = await supabase
          .from(subjectTable)
          .select(`student_id, ${restoredSubject}`);

        if (subjectError) throw subjectError;

        if (cancelled) return;

        // Only consider records belonging to students in this project.
        const projectStudentIds = new Set(
          projectStudents.map((student) => String(student.id))
        );

        // Students who already have marks for this subject.
        const completedStudentIds = new Set(
          (subjectRecords || [])
            .filter(
              (record) =>
                projectStudentIds.has(String(record.student_id)) &&
                record[restoredSubject] != null
            )
            .map((record) => String(record.student_id))
        );

        // Keep students who have not yet received marks for this subject.
        const remainingStudents = projectStudents.filter(
          (student) => !completedStudentIds.has(String(student.id))
        );

        setAllStudents(remainingStudents);
      } catch (error) {
        console.error("RESTORE PROJECT PROGRESS ERROR:", error);

        if (!cancelled) {
          setFeedback({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not restore your previous progress.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsRestoringProgress(false);
        }
      }
    };

    if (projectId) {
      void restoreProject();
    }

    return () => {
      cancelled = true;
    };
  }, [projectId, subjectSteps]);

  // Clear timeouts when the component unmounts.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Copy a student's full name.
  const handleCopyStudentName = async (fullName) => {
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
        message: "Could not copy the student's name. Please try again.",
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

  // Move to the next subject or the final page.
  const moveToNextSubject = async () => {
    if (positionCounter >= subjectSteps.length - 1) {
      router.push("/home/project/final");
      return;
    }

    const subjectTable = getSubjectTable();

    if (!subjectTable) {
      setFeedback({
        type: "error",
        message: `Invalid project method: "${projectMethod}".`,
      });
      return;
    }

    setLoading(true);

    try {
      const nextPosition = positionCounter + 1;

      const nextSubject = String(
        subjectSteps[nextPosition] || ""
      )
        .trim()
        .toLowerCase();

      if (!nextSubject) {
        throw new Error("The next subject is not available.");
      }

      // Get the saved records for the next subject.
      const { data, error } = await supabase
        .from(subjectTable)
        .select(`student_id, ${nextSubject}`);

      if (error) throw error;

      // Only use students belonging to this project.
      const projectStudentIds = new Set(
        originalStudents.map((student) => String(student.id))
      );

      // Find students who have not completed the next subject.
      const completedNextSubjectIds = new Set(
        (data || [])
          .filter(
            (record) =>
              projectStudentIds.has(String(record.student_id)) &&
              record[nextSubject] != null
          )
          .map((record) => String(record.student_id))
      );

      const nextStudents = originalStudents.filter(
        (student) =>
          !completedNextSubjectIds.has(String(student.id))
      );

      // Save the next subject position to this project.
      const { error: updateProjectError } = await supabase
        .from("projects")
        .update({ index: nextPosition })
        .eq("id", projectId);

      if (updateProjectError) throw updateProjectError;

      // Update the page to the next subject.
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
            : "Could not continue to the next subject.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add marks for a student.
  const handleAddStudent = async (e) => {
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
        message: "Please enter a valid mark between 0 and 100.",
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

    const subjectColumn = currentSubject.toLowerCase();

    const matchedStudent = allStudents.find(
      (student) =>
        student.full_name?.trim().toLowerCase() ===
        fullName.toLowerCase()
    );

    if (!matchedStudent) {
      setFeedback({
        type: "error",
        message: `Student "${fullName}" does not exist in this project.`,
      });
      return;
    }

    const subjectTable = getSubjectTable();

    if (!subjectTable) {
      setFeedback({
        type: "error",
        message: `Invalid project method: "${projectMethod}".`,
      });
      return;
    }

    setLoading(true);

    try {
      if (positionCounter === 0) {
        // First subject: create the student's subject record.
        const insertData = {
          student_id: matchedStudent.id,
          [subjectColumn]: numericMarks,
        };

        const { error } = await supabase
          .from(subjectTable)
          .insert(insertData);

        if (error) {
          console.error("SUPABASE INSERT ERROR:", error);
          throw new Error(`Database error: ${error.message}`);
        }
      } else {
        // Later subjects: update the student's existing subject record.
        const { data, error } = await supabase
          .from(subjectTable)
          .update({
            [subjectColumn]: numericMarks,
          })
          .eq("student_id", matchedStudent.id)
          .select("student_id")
          .maybeSingle();

        if (error) {
          console.error("SUPABASE UPDATE ERROR:", error);
          throw new Error(`Database error: ${error.message}`);
        }

        if (!data) {
          throw new Error(
            `No existing subject record was found for ${matchedStudent.full_name}.`
          );
        }
      }

      // Remove the completed student from the remaining list.
      const remainingStudents = allStudents.filter(
        (student) => String(student.id) !== String(matchedStudent.id)
      );

      setAllStudents(remainingStudents);
      setStudentName("");
      setMarks("");

      const subjectCompleted = remainingStudents.length === 0;

      setFeedback({
        type: "success",
        message: `${matchedStudent.full_name}'s ${currentSubject} mark was successfully saved!`,
      });

      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        timeoutRef.current = null;

        // Continue only after every student has completed this subject.
        if (subjectCompleted) {
          void moveToNextSubject();
        }
      }, 400);
    } catch (error) {
      console.error("ERROR SAVING STUDENT MARKS:", error);

      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "An unknown error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show your existing project loading component while fetching and restoring.
  if (isRestoringProgress) {
    return <ProjectLoading />;
  }

  // Project not found.
  if (!project) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle
            size={35}
            className="mx-auto text-red-500 mb-3"
          />
          <h2 className="text-lg font-bold text-slate-800">
            Project Not Found
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            We could not find this project.
          </p>
        </div>
      </div>
    );
  }

  if (!currentSubject) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle
            size={35}
            className="mx-auto text-red-500 mb-3"
          />
          <h2 className="text-lg font-bold text-slate-800">
            No Subject Available
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Please check your project subject configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Copy Notification */}
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

          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 sm:p-6">
            {/* Student Progress */}
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

            {/* Current Subject */}
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

            {/* Form */}
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
                disabled={
                  loading ||
                  !currentSubject ||
                  studentsLeft === 0
                }
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

      {/* Students Left Popup */}
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
                  <Users
                    size={32}
                    className="mx-auto text-slate-300 mb-3"
                  />
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