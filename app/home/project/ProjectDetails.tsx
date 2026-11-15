
"use client";

import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";

import {
  BookOpen,
  GraduationCap,
  Target,
  Layers,
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import useApp from "@/lib/useApp";
import { supabase } from "@/lib/supabase-client";
type PageType = "select" | "details";

type ProjectDetailsProps = {
  method: "JHS" | "Primary" | null;
  setPage: (value: PageType) => void;
};

type ProjectDetailsState = {
  header: string;
  description: string;
  passMark: number;
  index: number;
};

export default function ProjectDetails({
  method,
  setPage
}: ProjectDetailsProps) {
  const router = useRouter();

  const {
    loginUserInfo,
    setProjectId,
    setProjectDetails,
    projectDetails,
    projectMethod,
    setProjectMethod,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save the selected academic method to global state.
  useEffect(() => {
    if (method) {
      setProjectMethod(method);
    }
  }, [method, setProjectMethod]);

  // Use the current selection, or the previously saved selection.
  const selectedMethod = method ?? projectMethod;

  const isJHS = selectedMethod === "JHS";

  // Reset project details to their original defaults.
  const resetForm = () => {
    setProjectDetails({
      header: "",
      description: "",
      method: selectedMethod ?? "",
      passMark: 0,
      index: 0,
      user_id: loginUserInfo?.id ?? "",
      deleted: 'No'
    });
  };

  // Clear pending timers when the component is removed.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  // Handle browser back/forward restoration.
  useEffect(() => {
    const handlePageShow = () => {
      setLoading(false);
      setErrorMessage("");
      setSuccessMessage("");
      resetForm();
    };

    const handlePopState = () => {
      setLoading(false);
      setErrorMessage("");
      setSuccessMessage("");
      resetForm();
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleChange = (
    field: keyof ProjectDetailsState,
    value: string | number
  ) => {
    setProjectDetails((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleDescriptionChange = (
    e: ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;

    handleChange("description", value);

    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Show an error for one second, then remove it.
  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage("");

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }

    errorTimerRef.current = setTimeout(() => {
      setErrorMessage("");
      errorTimerRef.current = null;
    }, 300);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading || successMessage) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }

    if (!projectDetails.header.trim()) {
      showError("Please enter a project header.");
      return;
    }

    if (!projectDetails.description.trim()) {
      showError("Please enter a project description.");
      return;
    }

    if (!selectedMethod) {
      showError("Please select an academic method.");
      return;
    }

    if (
      !Number.isFinite(projectDetails.passMark) ||
      projectDetails.passMark < 0
    ) {
      showError("Please enter a valid pass mark.");
      return;
    }

    if (!loginUserInfo?.id) {
      showError("User information is missing. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (user.id !== loginUserInfo.id) {
        throw new Error(
          "Your account information does not match your current session. Please log in again."
        );
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          header: projectDetails.header.trim(),
          description: projectDetails.description.trim(),
          method: selectedMethod,
          passMark: projectDetails.passMark,
          index: projectDetails.index,
          user_id: loginUserInfo.id,
          deleted: projectDetails.deleted
        })
        .select("id")
        .single();

      if (error) throw error;

      if (!data?.id) {
        throw new Error(
          "Project was created, but its ID could not be retrieved."
        );
      }

      // Keep the newly created project ID.
      setProjectId(data.id);

      // Display success feedback for one second.
      setSuccessMessage(
        "Your project has been created successfully! Redirecting..."
      );

      timerRef.current = setTimeout(() => {
        // Remove success UI.
        setSuccessMessage("");

        // Reset form values.
        resetForm();

        setLoading(false);

        // Continue with the existing navigation.
        router.push("/home/project/schoolData");
        timerRef.current = null;
      }, 300);

    } catch (error: unknown) {
      console.error("Project creation error:", error);

      let message = "Something went wrong while creating your project.";

      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "object" && error !== null) {
        const supabaseError = error as {
          message?: string;
          details?: string;
          hint?: string;
          code?: string;
        };

        message = supabaseError.message || message;

        console.error("Supabase error details:", {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code,
        });
      }

      // Preserve the user's form data when creation fails.
      showError(message);
      setSuccessMessage("");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Card Header */}
        <div className="px-5 sm:px-7 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Project Details
            </h3>

            <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
              Fill in the information below
            </p>
          </div>

          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
        </div>

        {/* Form Fields */}
        <div className="p-5 sm:p-7 space-y-6">

          {/* Academic Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Academic Method
            </label>

            <div
              className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                isJHS
                  ? "bg-blue-50/60 border-blue-100"
                  : "bg-green-50/60 border-green-100"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isJHS
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isJHS ? (
                  <GraduationCap size={22} />
                ) : (
                  <BookOpen size={21} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">
                  {isJHS ? "Junior High School" : "Primary School"}
                </p>

                <p className="text-[11px] text-gray-500 mt-0.5">
                  Your selected academic level
                </p>
              </div>

              <CheckCircle2
                size={19}
                className={isJHS ? "text-blue-600" : "text-green-600"}
              />
            </div>
          </div>

          {/* Project Header */}
          <div>
            <label
              htmlFor="project-header"
              className="block text-xs font-semibold text-gray-700 mb-2"
            >
              Project Header
              <span className="text-red-500 ml-1">*</span>
            </label>

            <input
              id="project-header"
              type="text"
              required
              disabled={loading}
              value={projectDetails.header}
              onChange={(e) =>
                handleChange("header", e.target.value)
              }
              placeholder="e.g. 2026 First Term Assessment"
              className="w-full h-11 px-4 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 disabled:opacity-60"
            />

            <p className="text-[11px] text-gray-400 mt-1.5">
              Give your project a short and recognizable name.
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="project-description"
              className="block text-xs font-semibold text-gray-700 mb-2"
            >
              Project Description
              <span className="text-red-500 ml-1">*</span>
            </label>

            <textarea
              id="project-description"
              name="description"
              required
              disabled={loading}
              value={projectDetails.description}
              onChange={handleDescriptionChange}
              placeholder="Describe what this project is about..."
              rows={4}
              className="w-full min-h-[120px] resize-none overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
            />

            <div className="flex justify-end mt-1.5">
              <span className="text-[11px] text-gray-400">
                {projectDetails.description.length} characters
              </span>
            </div>
          </div>

          {/* Pass Mark */}
          <div>
            <label
              htmlFor="project-passmark"
              className="block text-xs font-semibold text-gray-700 mb-2"
            >
              Pass Mark
              <span className="text-red-500 ml-1">*</span>
            </label>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600">
                <Target size={18} />
              </div>

 <input
  id="project-passmark"
  type="number"
  min="0"
  required
  disabled={loading}
  value={projectDetails.passMark}
  onFocus={(e) => {
    if (projectDetails.passMark === 0) {
      e.currentTarget.select();
    }
  }}
  onChange={(e) =>
    handleChange(
      "passMark",
      e.target.value === "" ? 0 : Number(e.target.value)
    )
  }
  className="w-full h-11 pl-11 pr-16 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 disabled:opacity-60"
  placeholder="Enter pass mark"
/>

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                Marks
              </span>
            </div>

            <p className="text-[11px] text-gray-400 mt-1.5">
              Enter the minimum score required to pass.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700"
            >
              <AlertCircle size={17} className="shrink-0 mt-0.5" />

              <p className="text-xs leading-relaxed">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-green-50 border border-green-100 text-green-700"
            >
              <CheckCircle2 size={17} className="shrink-0 mt-0.5" />

              <p className="text-xs leading-relaxed font-medium">
                {successMessage}
              </p>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-5 sm:px-7 py-5 bg-gray-50/70 border-t border-gray-100">
          <div className="flex items-start gap-2 mb-5">
            <CheckCircle2
              size={15}
              className="text-blue-600 shrink-0 mt-0.5"
            />

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Your selected academic method and account information
              are automatically assigned to this project.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !!successMessage}
            className="w-full sm:w-auto sm:min-w-[190px] h-11 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Creating Project...
              </>
            ) : successMessage ? (
              <>
                <CheckCircle2 size={17} />
                Project Created
              </>
            ) : (
              <>
                Create Project
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
