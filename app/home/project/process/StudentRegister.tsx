
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  UserRound,
  ClipboardList,
  CalendarCheck,
  Heart,
  BookOpen,
  Plus,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";

type AssessmentValues = {
  attendance: string;
  attitude: string;
  interest: string;
};

type Student = {
  id: string;
  full_name: string;
  project_id: string;
};

type Project = {
  id: string;
  method: "JHS" | "Primary";
};

const initialAssessments: AssessmentValues = {
  attendance: "",
  attitude: "",
  interest: "",
};

export default function AddStudent() {
  const router = useRouter();

  // GLOBAL APP CONTEXT
  const {
    projects = [],
    projectId,
    projectMethod,
    loginUserInfo,
    allStudents = [],
    setAllStudents,
  } = useApp();

  const cardRef = useRef<HTMLDivElement | null>(null);

  // GET CURRENT PROJECT
  const currentProject = projects?.find(
    (project: Project) => project.id === projectId
  );

  const selectedMethod = currentProject?.method ?? projectMethod;

  // SELECT ONLY THE TABLE FOR THE CURRENT PROJECT METHOD
  const studentTable =
    selectedMethod === "JHS"
      ? "jhs_students"
      : selectedMethod === "Primary"
        ? "primary_students"
        : null;

  const studentDataTable =
    selectedMethod === "JHS"
      ? "jhs_student_data"
      : selectedMethod === "Primary"
        ? "primary_student_data"
        : null;

  // FORM STATES
  const [fullName, setFullName] = useState("");

  const [assessments, setAssessments] =
    useState<AssessmentValues>(initialAssessments);

  const [duplicate, setDuplicate] = useState(false);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const [showContinueConfirmation, setShowContinueConfirmation] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // STUDENT COUNT LOADING STATE
  const [countLoading, setCountLoading] = useState(true);

  // PREVENT OUTDATED REQUESTS FROM UPDATING CONTEXT
  const countRequestRef = useRef(0);

  // SUCCESS TIMEOUT
  const successTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // TEXTAREA REFERENCES
  const attitudeRef = useRef<HTMLTextAreaElement>(null);
  const interestRef = useRef<HTMLTextAreaElement>(null);

  // NORMALIZE STUDENT NAMES
  const normalizeName = (name: string): string => {
    return name
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  };

  // FETCH STUDENTS FROM ONLY THE SELECTED TABLE
  const fetchStudents = useCallback(
    async (showLoader = true): Promise<Student[]> => {
      const requestId = ++countRequestRef.current;

      if (!projectId || !studentTable) {
        setAllStudents([]);
        setCountLoading(false);
        return [];
      }

      if (showLoader) {
        setCountLoading(true);
      }

      try {
        const fetchedStudents: Student[] = [];

        const pageSize = 1000;
        let offset = 0;

        // FETCH ALL STUDENTS USING PAGINATION
        while (true) {
          const { data, error } = await supabase
            .from(studentTable)
            .select("id, full_name, project_id")
            .eq("project_id", projectId)
            .range(offset, offset + pageSize - 1);

          if (error) {
            throw error;
          }

          const batch = (data ?? []) as Student[];

          fetchedStudents.push(...batch);

          if (batch.length < pageSize) {
            break;
          }

          offset += pageSize;
        }

        // ONLY THE LATEST REQUEST CAN UPDATE GLOBAL STATE
        if (requestId === countRequestRef.current) {
          setAllStudents(fetchedStudents);
        }

        return fetchedStudents;
      } catch (err) {
        console.error("Student fetching failed:", err);
        throw err;
      } finally {
        if (requestId === countRequestRef.current) {
          setCountLoading(false);
        }
      }
    },
    [projectId, studentTable, setAllStudents]
  );

  // GSAP ANIMATION
  useGSAP(
    () => {
      if (!cardRef.current) return;

      gsap.fromTo(
        cardRef.current,
        {
          y: 100,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.2,
          ease: "power2.out",
        }
      );
    },
    { scope: cardRef }
  );

  // FETCH STUDENTS WHEN COMPONENT LOADS OR PROJECT CHANGES
  useEffect(() => {
    const loadStudents = async () => {
      if (!projectId || !studentTable) {
        setAllStudents([]);
        setCountLoading(false);
        return;
      }

      setCountLoading(true);

      try {
        await fetchStudents();
      } catch (err) {
        console.error("Initial student fetch failed:", err);
      }
    };

    loadStudents();

    return () => {
      countRequestRef.current += 1;
    };
  }, [fetchStudents, projectId, studentTable, setAllStudents]);

  // CLEAN UP SUCCESS TIMEOUT
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // CHECK OPTIONAL ASSESSMENT
  const hasAssessment = Object.values(assessments).some(
    (value) => value.trim() !== ""
  );

  // EXTRACT SUPABASE ERRORS
  const getErrorMessage = (err: unknown): string => {
    if (typeof err === "object" && err !== null && "message" in err) {
      const dbError = err as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      };

      return [
        dbError.message,
        dbError.details,
        dbError.hint ? `Hint: ${dbError.hint}` : "",
        dbError.code ? `Code: ${dbError.code}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    }

    return err instanceof Error
      ? err.message
      : "An unexpected error occurred.";
  };

  // CLEAR SUCCESS TIMEOUT
  const clearSuccessTimeout = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  };

  // SHOW SUCCESS MESSAGE
  const showSuccessMessage = (message: string) => {
    clearSuccessTimeout();

    setSuccess(message);

    successTimeoutRef.current = setTimeout(() => {
      setSuccess("");
      successTimeoutRef.current = null;
    }, 200);
  };

  // RESIZE TEXTAREAS
  const resizeTextarea = (
    textarea: HTMLTextAreaElement | null
  ) => {
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // UPDATE ASSESSMENT FIELDS
  const handleAssessment = (
    field: keyof AssessmentValues,
    value: string
  ) => {
    setAssessments((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // CHECK DUPLICATE STUDENT NAMES
  const checkDuplicate = (
    nameToCheck: string,
    studentList: Student[]
  ): boolean => {
    const enteredName = normalizeName(nameToCheck);

    if (!enteredName) return false;

    return studentList.some(
      (student) =>
        normalizeName(student.full_name ?? "") === enteredName &&
        student.project_id === projectId
    );
  };

  // VALIDATE STUDENT AND OPEN CONFIRMATION
  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    clearSuccessTimeout();

    setError("");
    setSuccess("");
    setDuplicate(false);
    setShowConfirmation(false);

    const submittedName = fullName.trim();

    if (!submittedName) {
      setError("Please enter the student's full name.");
      return;
    }

    if (!projectId) {
      setError(
        "Project information is missing. Please reopen this project."
      );
      return;
    }

    if (!loginUserInfo?.id) {
      setError("User information is missing. Please sign in again.");
      return;
    }

    if (!studentTable || !studentDataTable) {
      setError(
        "Your project method is missing or invalid. Please reopen this project."
      );
      return;
    }

    setLoading(true);

    try {
      // GET FRESH STUDENTS FROM SUPABASE
      const latestStudents = await fetchStudents(false);

      // CHECK FOR DUPLICATES
      const exists = checkDuplicate(
        submittedName,
        latestStudents
      );

      if (exists) {
        setDuplicate(true);

        setError(
          "A student with this name already exists in this project. Please include a prefix such as Senior or Junior to distinguish the student."
        );

        return;
      }

      // OPEN CONFIRMATION MODAL
      setShowConfirmation(true);
    } catch (err) {
      console.error("Duplicate check error:", err);

      setError(
        `Unable to check the student name: ${getErrorMessage(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  // SAVE STUDENT AND OPTIONAL ASSESSMENT
  const saveStudent = async () => {
    if (loading) return;

    if (!projectId || !loginUserInfo?.id) {
      setError("Project or user information is missing.");
      setShowConfirmation(false);
      return;
    }

    if (!studentTable || !studentDataTable) {
      setError("Your project method is missing or invalid.");
      setShowConfirmation(false);
      return;
    }

    const submittedName = fullName.trim();

    if (!submittedName) {
      setError("Please enter the student's full name.");
      setShowConfirmation(false);
      return;
    }

    setLoading(true);
    setShowConfirmation(false);

    setError("");
    setSuccess("");

    clearSuccessTimeout();

    try {
      // CHECK AGAIN USING FRESH DATABASE DATA
      const latestStudents = await fetchStudents(false);

      const exists = checkDuplicate(
        submittedName,
        latestStudents
      );

      if (exists) {
        setDuplicate(true);

        setError(
          "This student name already exists. Please add a prefix to distinguish the student."
        );

        return;
      }

      // STEP 1: INSERT STUDENT INTO SELECTED TABLE
      const { data: student, error: studentError } = await supabase
        .from(studentTable)
        .insert({
          full_name: submittedName,
          project_id: projectId,
          user_id: loginUserInfo.id,
        })
        .select("id")
        .single();

      if (studentError) {
        throw new Error(
          `Student registration failed: ${getErrorMessage(studentError)}`
        );
      }

      const newStudentId = student.id;

      console.log("New student ID:", newStudentId);

      // STEP 2: INSERT OPTIONAL ASSESSMENT
      if (hasAssessment) {
        const { error: assessmentError } = await supabase
          .from(studentDataTable)
          .insert({
            student_id: newStudentId,
            attendance: assessments.attendance.trim() || null,
            attitude: assessments.attitude.trim() || null,
            interest: assessments.interest.trim() || null,
          });

        // STEP 3: ROLLBACK STUDENT IF ASSESSMENT FAILS
        if (assessmentError) {
          console.error(
            "Assessment insertion failed:",
            assessmentError
          );

          const { error: rollbackError } = await supabase
            .from(studentTable)
            .delete()
            .eq("id", newStudentId);

          if (rollbackError) {
            console.error(
              "Student rollback failed:",
              rollbackError
            );

            await fetchStudents(false);

            throw new Error(
              `Assessment insertion failed: ${getErrorMessage(
                assessmentError
              )}. Student rollback also failed: ${getErrorMessage(
                rollbackError
              )}`
            );
          }

          throw new Error(
            `Assessment could not be saved. Student registration was rolled back. ${getErrorMessage(
              assessmentError
            )}`
          );
        }
      }

      // STEP 4: FETCH ACTUAL STUDENTS AGAIN
      // THIS UPDATES THE GLOBAL allStudents STATE
      await fetchStudents(false);

      // STEP 5: SHOW SUCCESS
      showSuccessMessage(
        hasAssessment
          ? "Student and assessment added successfully!"
          : "Student added successfully!"
      );

      // STEP 6: RESET FORM
      setFullName("");
      setAssessments({ ...initialAssessments });

      setDuplicate(false);
      setError("");
      setShowConfirmation(false);

      // RESET TEXTAREA HEIGHTS
      if (attitudeRef.current) {
        attitudeRef.current.style.height = "auto";
      }

      if (interestRef.current) {
        interestRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Student save error:", err);

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // CLOSE REGISTRATION CONFIRMATION
  const closeConfirmation = () => {
    if (!loading) {
      setShowConfirmation(false);
    }
  };

  // OPEN CONTINUE CONFIRMATION
  const handleContinue = () => {
    setShowContinueConfirmation(true);
  };

  // NAVIGATE TO STUDENT SCORES
  const confirmContinue = () => {
    setShowContinueConfirmation(false);
    router.push("/home/project/scores");
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-8">

      {/* MAIN FORM CARD */}
      <div
        ref={cardRef}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8"
      >

        {/* HEADING */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <UserRound size={23} />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Add New Student
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Register a student for this project.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* STUDENT INFORMATION */}
          <div className="mb-9">
            <div className="flex items-center gap-2 mb-4">
              <UserRound size={18} className="text-blue-700" />

              <h3 className="font-bold text-slate-800 text-sm">
                Student Information
              </h3>

              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                REQUIRED
              </span>
            </div>

            <label
              htmlFor="full-name"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Student Full Name <span className="text-red-500">*</span>
            </label>

            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setDuplicate(false);
                setError("");
              }}
              placeholder="e.g. John Mensah"
              required
              disabled={loading}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            />

            <p className="text-xs text-slate-400 mt-2">
              Enter the student's complete name.
            </p>
          </div>

          {/* OPTIONAL ASSESSMENT SECTION */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-6 bg-slate-50/60">

            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <ClipboardList size={21} />
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">
                    Student Assessment
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Additional student information.
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1.5 rounded-full shrink-0">
                OPTIONAL
              </span>
            </div>

            {/* EXPLANATION */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100 mb-6">
              <Info size={17} className="text-blue-600 shrink-0 mt-0.5" />

              <p className="text-xs text-blue-700 leading-relaxed">
                These assessment details are optional. You can provide
                them now or add them later.
              </p>
            </div>

            {/* ATTENDANCE */}
            <div className="mb-6">
              <label
                htmlFor="attendance"
                className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2"
              >
                <CalendarCheck size={17} className="text-blue-700" />
                Attendance
              </label>

              <input
                id="attendance"
                type="number"
                min="0"
                step="1"
                value={assessments.attendance}
                onChange={(e) =>
                  handleAssessment("attendance", e.target.value)
                }
                placeholder="Enter attendance (e.g. 85)"
                disabled={loading}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-60"
              />

              <p className="text-xs text-slate-400 mt-2">
                Enter the student's attendance figure.
              </p>
            </div>

            {/* ATTITUDE */}
            <div className="mb-6">
              <label
                htmlFor="attitude"
                className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2"
              >
                <Heart size={17} className="text-blue-700" />
                Attitude
              </label>

              <textarea
                ref={attitudeRef}
                id="attitude"
                value={assessments.attitude}
                onChange={(e) => {
                  handleAssessment("attitude", e.target.value);
                  resizeTextarea(e.currentTarget);
                }}
                placeholder="Describe the student's attitude, behaviour and participation..."
                rows={3}
                disabled={loading}
                className="w-full resize-none overflow-hidden min-h-20 p-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-60"
              />
            </div>

            {/* INTEREST */}
            <div>
              <label
                htmlFor="interest"
                className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2"
              >
                <BookOpen size={17} className="text-blue-700" />
                Interest
              </label>

              <textarea
                ref={interestRef}
                id="interest"
                value={assessments.interest}
                onChange={(e) => {
                  handleAssessment("interest", e.target.value);
                  resizeTextarea(e.currentTarget);
                }}
                placeholder="Describe the student's interest in learning and school activities..."
                rows={3}
                disabled={loading}
                className="w-full resize-none overflow-hidden min-h-20 p-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-60"
              />
            </div>
          </div>

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">
              <Check size={19} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle
                size={19}
                className="text-amber-600 shrink-0 mt-0.5"
              />

              <div>
                <p className="text-sm font-medium text-amber-800">
                  {duplicate
                    ? "Student already exists"
                    : "Unable to continue"}
                </p>

                <p className="text-xs text-amber-700 mt-1 leading-relaxed break-words">
                  {error}
                </p>

                {duplicate && (
                  <p className="text-xs text-amber-800 font-medium mt-2">
                    Example: Senior John Mensah or Junior John Mensah.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SUBMIT ACTIONS */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* ADD STUDENT */}
            <button
              type="submit"
              disabled={
                loading ||
                countLoading ||
                !fullName.trim() ||
                !studentTable ||
                !projectId
              }
              className="w-full h-12 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Checking...
                </>
              ) : countLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Loading students...
                </>
              ) : (
                <>
                  <Plus size={19} />
                  Add Student ({allStudents.length})
                </>
              )}
            </button>

            {/* CONTINUE */}
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="w-full h-12 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 active:scale-[0.99] text-blue-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Continue
              <Check size={18} />
            </button>

          </div>

          <p className="text-center text-xs text-slate-400 mt-3">
            Only the student's full name is required.
          </p>
        </form>
      </div>

      {/* STUDENT REGISTRATION CONFIRMATION MODAL */}
      {showConfirmation && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeConfirmation();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <UserRound size={24} />
              </div>

              <button
                type="button"
                onClick={closeConfirmation}
                disabled={loading}
                className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X size={19} />
              </button>
            </div>

            <h3
              id="confirmation-title"
              className="text-xl font-bold text-slate-800 mt-5"
            >
              Confirm Student Registration
            </h3>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to add this student? Please confirm
              the information before saving.
            </p>

            {/* STUDENT PREVIEW */}
            <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Student Full Name
              </p>

              <p className="text-base font-bold text-slate-800 mt-1">
                {fullName.trim()}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-3">
                  Additional Assessment
                </p>

                {hasAssessment ? (
                  <div className="space-y-3">
                    {(
                      Object.keys(assessments) as Array<
                        keyof AssessmentValues
                      >
                    ).map(
                      (key) =>
                        assessments[key].trim() && (
                          <div key={key}>
                            <p className="text-xs font-semibold text-slate-600 capitalize">
                              {key}
                            </p>

                            <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap break-words">
                              {assessments[key]}
                            </p>
                          </div>
                        )
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No additional assessment provided.
                  </p>
                )}
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">

              <button
                type="button"
                onClick={closeConfirmation}
                disabled={loading}
                className="order-2 sm:order-1 w-full h-11 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Go Back
              </button>

              <button
                type="button"
                onClick={saveStudent}
                disabled={loading}
                className="order-1 sm:order-2 w-full h-11 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    Confirm & Add
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* CONTINUE CONFIRMATION MODAL */}
      {showContinueConfirmation && (
        <div
          className="fixed inset-0 z-[110] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowContinueConfirmation(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="continue-confirmation-title"
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <BookOpen size={24} />
              </div>

              <button
                type="button"
                onClick={() => setShowContinueConfirmation(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X size={19} />
              </button>
            </div>

            <h3
              id="continue-confirmation-title"
              className="text-xl font-bold text-slate-800 mt-5"
            >
              Continue to Student Scores?
            </h3>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to proceed? You will be taken to
              the student scores section, where you can add scores
              for each student in this project.
            </p>

            {/* CONTINUE MODAL ACTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">

              <button
                type="button"
                onClick={() => setShowContinueConfirmation(false)}
                className="order-2 sm:order-1 w-full h-11 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Go Back
              </button>

              <button
                type="button"
                onClick={confirmContinue}
                className="order-1 sm:order-2 w-full h-11 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Check size={17} />
                Yes, Continue
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
