
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
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
  ArrowRight,
  ArrowLeft,
  X,
  Copy,
  ClipboardCheck,
} from "lucide-react";

type ProjectPageClientProps = {
  projectId: string;
};

type Student = {
  id: string | number;
  full_name: string;
  [key: string]: any;
};

type SubjectRecord = {
  student_id: string | number;
  [key: string]: unknown;
};

const fallbackSubjectsByMethod: Record<string, string[]> = {
  jhs: [
    "english",
    "mathematics",
    "science",
    "computing",
    "social_studies",
    "creative_arts",
    "career_technology",
    "rme",
    "fante/twi",
  ],
  primary: [
    "english",
    "mathematics",
    "science",
    "computing",
    "creative_arts",
    "rme",
    "history",
    "fante/twi",
  ],
};

function getStudentsWithoutSubjectMark(
  students: Student[],
  records: SubjectRecord[],
  subject: string
) {
  const completedIds = new Set(
    records
      .filter((record) => record[subject.toLowerCase()] != null)
      .map((record) => String(record.student_id))
  );

  return students.filter(
    (student) => !completedIds.has(String(student.id))
  );
}

function formatSubjectName(subject: string) {
  return subject
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getManualSubjectStorageKey(projectId: string) {
  return `easeway-manual-subject-${projectId}`;
}

function readManualSubject(projectId: string) {
  try {
    return window.sessionStorage.getItem(
      getManualSubjectStorageKey(projectId)
    );
  } catch (error) {
    console.error("READ MANUAL SUBJECT RESTORE ERROR:", error);
    return null;
  }
}

function saveManualSubject(projectId: string, subject: string) {
  try {
    window.sessionStorage.setItem(
      getManualSubjectStorageKey(projectId),
      subject
    );
  } catch (error) {
    console.error("SAVE MANUAL SUBJECT RESTORE ERROR:", error);
  }
}

function clearManualSubject(projectId: string) {
  try {
    window.sessionStorage.removeItem(
      getManualSubjectStorageKey(projectId)
    );
  } catch (error) {
    console.error("CLEAR MANUAL SUBJECT RESTORE ERROR:", error);
  }
}

type Feedback = {
  type: "success" | "error";
  message: string;
};

export default function ProjectPageClient({
  projectId,
}: ProjectPageClientProps) {
  const router = useRouter();

  // Project states
  const [project, setProject] = useState<any>(null);
  const [projectSubjects, setProjectSubjects] = useState<string[]>([]);
  const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
  const [completedSubjects, setCompletedSubjects] = useState<string[]>([]);
  const [manualSelectedSubject, setManualSelectedSubject] =
    useState<string | null>(null);
  const [positionCounter, setPositionCounter] = useState(0);

  // Student states
  const [originalStudents, setOriginalStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // Form states
  const [studentName, setStudentName] = useState("");
  const [marks, setMarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRestoringProgress, setIsRestoringProgress] = useState(true);

  // UI states
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const [copyNotice, setCopyNotice] = useState<Feedback | null>(null);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always use the ID passed from the dynamic project route.
  const activeProjectId = projectId;

  const projectMethod = String(project?.method || "").toLowerCase();
  const isManualEntry =
    String(project?.entryMethod || "automatic").toLowerCase() === "manual";

  const currentSubject = String(
    isManualEntry
      ? manualSelectedSubject || ""
      : projectSubjects[positionCounter] || ""
  ).trim();

  const availableManualSubjects = projectSubjects.filter(
    (subject) =>
      !completedSubjects.some(
        (completedSubject) =>
          completedSubject.toLowerCase() === subject.toLowerCase()
      )
  );

  // Progress calculations
  const totalStudents = originalStudents.length;
  const studentsLeft = allStudents.length;
  const studentsAdded = Math.max(0, totalStudents - studentsLeft);

  const progressPercentage =
    totalStudents > 0
      ? (studentsAdded / totalStudents) * 100
      : 0;

  // Correct Supabase tables
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

  // Restore the exact project and its saved progress.
  const restoreProject = useCallback(async () => {
    setIsRestoringProgress(true);
    setProject(null);
    setProjectSubjects([]);
    setSubjectRecords([]);
    setCompletedSubjects([]);
    setManualSelectedSubject(null);
    setPositionCounter(0);
    setOriginalStudents([]);
    setAllStudents([]);
    setFeedback(null);

    try {
      if (!activeProjectId) {
        throw new Error("Project ID is missing.");
      }

      // 1. Fetch the project we were previously working on.
      const { data: projectData, error: projectError } =
        await supabase
          .from("projects")
          .select("*")
          .eq("id", activeProjectId)
          .single();

      if (projectError) throw projectError;

      if (!projectData) {
        throw new Error("This project could not be found.");
      }

      setProject(projectData);

      const method = String(projectData.method || "").toLowerCase();

      const studentTable = getStudentTable(method);
      const subjectTable = getSubjectTable(method);

      if (!studentTable || !subjectTable) {
        throw new Error(`Invalid project method: ${method}.`);
      }

      // 2. Fetch ALL students belonging to this project.
      // This includes students added after the project started.
      const { data: students, error: studentsError } =
        await supabase
          .from(studentTable)
          .select("*")
          .eq("project_id", activeProjectId);

      if (studentsError) throw studentsError;

      const projectStudents = (students || []) as Student[];

      setOriginalStudents(projectStudents);

      // 3. Fetch their saved subject records.
      let subjectRecords: SubjectRecord[] = [];

      if (projectStudents.length > 0) {
        const studentIds = projectStudents.map(
          (student) => student.id
        );

        const { data, error } = await supabase
          .from(subjectTable)
          .select("*")
          .in("student_id", studentIds);

        if (error) throw error;

        subjectRecords = (data || []) as SubjectRecord[];
      }

      // 4. Discover the subject columns.
      let subjectSource = subjectRecords[0] || null;

      if (!subjectSource) {
        const { data, error } = await supabase
          .from(subjectTable)
          .select("*")
          .limit(1);

        if (error) throw error;

        subjectSource = data?.[0] || null;
      }

      const manualEntry =
        String(projectData.entryMethod || "automatic").toLowerCase() ===
        "manual";
      let subjects = subjectSource
        ? Object.keys(subjectSource).filter(
            (column) =>
              ![
                "id",
                "student_id",
                "created_at",
                "updated_at",
              ].includes(column)
          )
        : [];

      if (subjects.length === 0 && manualEntry) {
        subjects = fallbackSubjectsByMethod[method] || [];
      }

      if (subjects.length === 0) {
        throw new Error(
          `Could not detect subject columns in ${subjectTable}.`
        );
      }

      setProjectSubjects(subjects);
      setSubjectRecords(subjectRecords);

      if (manualEntry) {
        const completed = subjects.filter((subject) => {
          if (projectStudents.length === 0) return false;

          return projectStudents.every((student) => {
            const record = subjectRecords.find(
              (item) => String(item.student_id) === String(student.id)
            );

            return record?.[subject.toLowerCase()] != null;
          });
        });
        const completedSubjectNames = completed.map((subject) =>
          subject.toLowerCase()
        );
        const savedIndex = Number(projectData.index ?? 0);

        if (
          !Number.isInteger(savedIndex) ||
          savedIndex < 0 ||
          savedIndex > subjects.length
        ) {
          throw new Error("The saved project index is invalid.");
        }

        setCompletedSubjects(completed);

        if (
          projectStudents.length > 0 &&
          completed.length === subjects.length
        ) {
          clearManualSubject(activeProjectId);

          const { error: completeError } = await supabase
            .from("projects")
            .update({ index: subjects.length })
            .eq("id", activeProjectId);

          if (completeError) throw completeError;

          router.replace("/home/project/final");
          return;
        }

        const indexedManualSubject =
          savedIndex > 0 ? subjects[savedIndex - 1] : null;
        const storedSubjectName = readManualSubject(activeProjectId);
        const storedManualSubject = storedSubjectName
          ? subjects.find(
              (subject) =>
                subject.toLowerCase() === storedSubjectName.toLowerCase()
            )
          : null;
        const completedSubjectSet = new Set(completedSubjectNames);
        const savedManualSubject = [
          storedManualSubject,
          indexedManualSubject,
        ].find(
          (subject) =>
            subject &&
            !completedSubjectSet.has(subject.toLowerCase())
        ) ?? null;

        if (
          savedManualSubject &&
          !completedSubjectNames.includes(savedManualSubject.toLowerCase())
        ) {
          const savedManualSubjectIndex = subjects.findIndex(
            (subject) =>
              subject.toLowerCase() === savedManualSubject.toLowerCase()
          );

          setManualSelectedSubject(savedManualSubject);
          setPositionCounter(savedManualSubjectIndex);
          setAllStudents(
            getStudentsWithoutSubjectMark(
              projectStudents,
              subjectRecords,
              savedManualSubject
            )
          );
        } else {
          clearManualSubject(activeProjectId);
          setManualSelectedSubject(null);
          setPositionCounter(0);
          setAllStudents(projectStudents);

          if (savedIndex > 0) {
            const { error: clearIndexError } = await supabase
              .from("projects")
              .update({ index: 0 })
              .eq("id", activeProjectId);

            if (clearIndexError) throw clearIndexError;
          }
        }

        return;
      }

      // 5. Read the last saved project position.
      const savedIndex = Number(projectData.index ?? 0);

      if (
        !Number.isInteger(savedIndex) ||
        savedIndex < 0 ||
        savedIndex > subjects.length
      ) {
        throw new Error("The saved project index is invalid.");
      }

      // 6. Find the earliest subject with unfinished students.
      // The saved index may be ahead of a newly added student's progress.
      let nextPosition = -1;
      let nextStudents: Student[] = [];

      for (let i = 0; i < subjects.length; i++) {
        const subject = subjects[i];

        const completedIds = new Set(
          subjectRecords
            .filter((record) => record[subject] != null)
            .map((record) => String(record.student_id))
        );

        const remaining = projectStudents.filter(
          (student) => !completedIds.has(String(student.id))
        );

        if (remaining.length > 0) {
          nextPosition = i;
          nextStudents = remaining;
          break;
        }
      }

      // 7. All subjects are completed.
      if (nextPosition === -1) {
        const { error } = await supabase
          .from("projects")
          .update({ index: subjects.length })
          .eq("id", activeProjectId);

        if (error) throw error;

        router.replace("/home/project/final");
        return;
      }

      // 8. Keep the database project index synchronized.
      if (nextPosition !== savedIndex) {
        const { error } = await supabase
          .from("projects")
          .update({ index: nextPosition })
          .eq("id", activeProjectId);

        if (error) throw error;
      }

      // 9. Restore the correct subject and remaining students.
      setPositionCounter(nextPosition);
      setAllStudents(nextStudents);
    } catch (error) {
      console.error("RESTORE PROJECT ERROR:", error);

      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not restore your project.",
      });
    } finally {
      setIsRestoringProgress(false);
    }
  }, [activeProjectId, router]);

  // Restore whenever the active project changes.
  useEffect(() => {
    restoreProject();

    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, [restoreProject]);

  const handleManualSubjectSelect = (subject: string) => {
    if (
      completedSubjects.some(
        (completedSubject) =>
          completedSubject.toLowerCase() === subject.toLowerCase()
      )
    ) {
      return;
    }

    const subjectIndex = projectSubjects.indexOf(subject);

    if (subjectIndex < 0) {
      setFeedback({
        type: "error",
        message: "That subject is not available for this project.",
      });
      return;
    }

    setFeedback(null);
    saveManualSubject(activeProjectId, subject);
    setManualSelectedSubject(subject);
    setPositionCounter(subjectIndex);
    setAllStudents(
      getStudentsWithoutSubjectMark(
        originalStudents,
        subjectRecords,
        subject
      )
    );
    setStudentName("");
    setMarks("");
  };

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

  // Save student marks.
  const handleAddStudent = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading || isRestoringProgress) return;

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

    // Find the student only inside this project's student list.
    const matchedStudent = allStudents.find(
      (student) =>
        String(student.full_name || "").trim().toLowerCase() ===
        fullName.toLowerCase()
    );

    if (!matchedStudent) {
      setFeedback({
        type: "error",
        message:
          `Student "${fullName}" does not exist in this project ` +
          "or has already completed this subject.",
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
    let saveSucceeded = false;

    try {
      // 1. Check whether this student already has a subject row.
      const { data: existingRecord, error: findError } =
        await supabase
          .from(subjectTable)
          .select("id, student_id")
          .eq("student_id", matchedStudent.id)
          .maybeSingle();

      if (findError) throw findError;

      const markData = {
        [currentSubject]: numericMarks,
      };

      // 2. Update an existing record.
      if (existingRecord) {
        const { error: updateError } = await supabase
          .from(subjectTable)
          .update(markData)
          .eq("student_id", matchedStudent.id);

        if (updateError) throw updateError;
      } else {
        // 3. Create a new record if this is a newly added student.
        const { error: insertError } = await supabase
          .from(subjectTable)
          .insert({
            student_id: matchedStudent.id,
            ...markData,
          });

        if (insertError) throw insertError;
      }

      saveSucceeded = true;
    } catch (error) {
      console.error("SAVE STUDENT MARKS ERROR:", error);

      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not save student marks.",
      });

      // Do not reload if saving fails.
    } finally {
      setLoading(false);
      if (saveSucceeded) {
        window.location.reload();
      }
    }
  };

  // Initial loading screen.
  if (isRestoringProgress) {
    return <ProjectLoading />;
  }

  // Project loading error.
  if (!project) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle
            size={35}
            className="mx-auto text-red-500 mb-3"
          />

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

  if (isManualEntry && !manualSelectedSubject) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Manual subject entry
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Choose a subject
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Select a subject to enter marks for every student.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500">
              {completedSubjects.length} of {projectSubjects.length} subjects
              completed
            </p>
          </div>

          {feedback && (
            <div
              role="status"
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "border-green-100 bg-green-50 text-green-800"
                  : "border-red-100 bg-red-50 text-red-800"
              }`}
            >
              {feedback.message}
            </div>
          )}

          {availableManualSubjects.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableManualSubjects.map((subject) => {
                const studentsRemaining = getStudentsWithoutSubjectMark(
                  originalStudents,
                  subjectRecords,
                  subject
                ).length;

                return (
                  <button
                    key={subject}
                    type="button"
                    disabled={loading || studentsRemaining === 0}
                    onClick={() => handleManualSubjectSelect(subject)}
                    className="group flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <BookOpen size={21} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-800">
                        {formatSubjectName(subject)}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {studentsRemaining} students left
                      </span>
                    </span>
                    <ArrowRight
                      size={17}
                      className="shrink-0 text-blue-600 transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-6 text-center">
              <CheckCircle2 size={26} className="mx-auto text-green-600" />
              <p className="mt-2 font-semibold text-green-800">
                All subjects are complete
              </p>
              <p className="mt-1 text-sm text-green-700">
                Every student has marks for each subject.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // No subject available.
  if (!currentSubject) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle
            size={35}
            className="mx-auto text-red-500 mb-3"
          />

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
                  style={{
                    width: `${progressPercentage}%`,
                  }}
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
            <form
              onSubmit={handleAddStudent}
              className="space-y-5"
            >
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
                    <CheckCircle2
                      size={19}
                      className="shrink-0 mt-0.5"
                    />
                  ) : (
                    <AlertCircle
                      size={19}
                      className="shrink-0 mt-0.5"
                    />
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
