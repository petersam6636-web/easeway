
"use client";

import { useRouter } from "next/navigation";
import useApp from "@/lib/useApp";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import ProjectLoading from "@/component/Loading";
import SchoolLogoUpload from "./SchoolLogoUpload";

import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  School,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  CalendarCheck,
  GraduationCap,
} from "lucide-react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type FormStep = "school" | "date";

const initialSchoolData = {
  school_name: "",
  location: "",
  logo_image: "",
  vacation_date: "",
  reopening_date: "",
  term: "First Term",
};

export default function SchoolData() {
  const router = useRouter();

  const {
    setSchoolData_ui,
    projectId,
    setPage,
  } = useApp();

  // Current form step
  const [step, setStep] = useState<FormStep>("school");

  // School information
  const [schoolName, setSchoolName] = useState("");
  const [location, setLocation] = useState("");
  const [logoImage, setLogoImage] = useState("");

  // Academic calendar
  const [vacationDate, setVacationDate] = useState("");
  const [reopeningDate, setReopeningDate] = useState("");
  const [term, setTerm] = useState("First Term");

  // Loading states
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Feedback states
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Animation reference
  const cardRef = useRef<HTMLElement | null>(null);

  // Timers
  const uploadFeedbackTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveFeedbackTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigationTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate whenever the current step changes.
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
          clearProps: "transform,opacity",
        }
      );
    },
    {
      scope: cardRef,
      dependencies: [step],
      revertOnUpdate: true,
    }
  );

  // Initialize form.
  useEffect(() => {
    setPage("select");

    setStep("school");

    setSchoolName("");
    setLocation("");
    setLogoImage("");

    setVacationDate("");
    setReopeningDate("");
    setTerm("First Term");

    setUploadError("");
    setUploadSuccess("");
    setSaveError("");
    setSuccessMessage("");

    setSchoolData_ui({ ...initialSchoolData });

    setIsPageLoading(false);

    return () => {
      if (uploadFeedbackTimer.current) {
        clearTimeout(uploadFeedbackTimer.current);
      }

      if (saveFeedbackTimer.current) {
        clearTimeout(saveFeedbackTimer.current);
      }

      if (navigationTimer.current) {
        clearTimeout(navigationTimer.current);
      }
    };
  }, [setSchoolData_ui, setPage]);

  // Show upload feedback.
  const showUploadFeedback = (
    type: "success" | "error",
    message: string
  ) => {
    if (uploadFeedbackTimer.current) {
      clearTimeout(uploadFeedbackTimer.current);
    }

    setUploadSuccess(type === "success" ? message : "");
    setUploadError(type === "error" ? message : "");

    uploadFeedbackTimer.current = setTimeout(() => {
      setUploadSuccess("");
      setUploadError("");
    }, 1000);
  };

  // Show save error.
  const showSaveError = (message: string) => {
    if (saveFeedbackTimer.current) {
      clearTimeout(saveFeedbackTimer.current);
    }

    setSaveError(message);

    saveFeedbackTimer.current = setTimeout(() => {
      setSaveError("");
    }, 500);
  };

  // Update school name.
  const updateSchoolName = (value: string) => {
    setSchoolName(value);
    setSaveError("");
    setSuccessMessage("");

    setSchoolData_ui((prev) => ({
      ...prev,
      school_name: value,
    }));
  };

  // Update location.
  const updateLocation = (value: string) => {
    setLocation(value);
    setSaveError("");
    setSuccessMessage("");

    setSchoolData_ui((prev) => ({
      ...prev,
      location: value,
    }));
  };

  // Update logo.
  const updateLogo = (value: string) => {
    setLogoImage(value);

    setSchoolData_ui((prev) => ({
      ...prev,
      logo_image: value,
    }));
  };

  // Update vacation date.
  const updateVacationDate = (value: string) => {
    setVacationDate(value);
    setSaveError("");
    setSuccessMessage("");

    setSchoolData_ui((prev) => ({
      ...prev,
      vacation_date: value,
    }));
  };

  // Update reopening date.
  const updateReopeningDate = (value: string) => {
    setReopeningDate(value);
    setSaveError("");
    setSuccessMessage("");

    setSchoolData_ui((prev) => ({
      ...prev,
      reopening_date: value,
    }));
  };

  // Update term.
  const updateTerm = (value: string) => {
    setTerm(value);
    setSaveError("");
    setSuccessMessage("");

    setSchoolData_ui((prev) => ({
      ...prev,
      term: value,
    }));
  };

  // Upload school logo.
  const uploadSchoolLogo = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError("");
      setUploadSuccess("");
      setSuccessMessage("");

      if (uploadFeedbackTimer.current) {
        clearTimeout(uploadFeedbackTimer.current);
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error(
          "Please log in before uploading your logo."
        );
      }

      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() || "png";

      const filePath = `${user.id}/${Date.now()}.${fileExtension}`;

      const { data, error } = await supabase.storage
        .from("school-logos")
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from("school-logos")
        .getPublicUrl(data.path);

      updateLogo(publicData.publicUrl);

      showUploadFeedback("success", "Logo uploaded successfully.");

    } catch (error: unknown) {
      console.error("School logo upload error:", error);

      showUploadFeedback(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to upload your school logo. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Remove logo.
  const removeLogo = () => {
    updateLogo("");
    setUploadError("");
    setUploadSuccess("");
    setSuccessMessage("");

    if (uploadFeedbackTimer.current) {
      clearTimeout(uploadFeedbackTimer.current);
    }
  };

  // Move from school information to academic calendar.
  const handleSchoolContinue = () => {
    setSaveError("");
    setSuccessMessage("");

    if (!schoolName.trim()) {
      showSaveError("Please enter your school name.");
      return;
    }

    if (!location.trim()) {
      showSaveError("Please enter your school location.");
      return;
    }

    if (isUploading) return;

    setStep("date");
  };

  // Move back to school information.
  const handleBackToSchool = () => {
    setSaveError("");
    setSuccessMessage("");

    setStep("school");
  };

  // Save everything together.
  const handleSave = async () => {
    if (isSaving || isUploading) return;

    setSaveError("");
    setSuccessMessage("");

    if (saveFeedbackTimer.current) {
      clearTimeout(saveFeedbackTimer.current);
    }

    if (!schoolName.trim()) {
      setStep("school");
      showSaveError("Please enter your school name.");
      return;
    }

    if (!location.trim()) {
      setStep("school");
      showSaveError("Please enter your school location.");
      return;
    }

    // Academic calendar fields are all required.
    if (!term.trim()) {
      showSaveError("Please select your academic term.");
      return;
    }

    if (!vacationDate) {
      showSaveError("Please select your vacation date.");
      return;
    }

    if (!reopeningDate) {
      showSaveError("Please select your reopening date.");
      return;
    }

    if (!projectId) {
      showSaveError(
        "Project information is missing. Please create your project again."
      );
      return;
    }

    try {
      setIsSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      // All school and academic calendar values are
      // inserted into school_data in one request.
      const { error } = await supabase
        .from("school_data")
        .insert({
          school_name: schoolName.trim(),
          location: location.trim(),
          logo_image: logoImage || null,

          vacation_date: vacationDate,
          reopening_date: reopeningDate,
          term,

          project_id: projectId,
        });

      if (error) throw error;

      setSuccessMessage(
        "Your school information has been saved successfully!"
      );

      navigationTimer.current = setTimeout(() => {
        setSchoolName("");
        setLocation("");
        setLogoImage("");

        setVacationDate("");
        setReopeningDate("");
        setTerm("First Term");


        setSchoolData_ui({ ...initialSchoolData });
        setStep("school");
        setSuccessMessage("");

        router.push("/home/project/process");
      }, 300);

    } catch (error: unknown) {
      console.error("School information error:", error);

      showSaveError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving. Please try again."
      );

      setSuccessMessage("");
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate back home.
  const goBackHome = () => {
    router.push("/home/project");
  };

  if (isPageLoading) {
    return <ProjectLoading />;
  }

  return (
    <main className="min-h-screen w-full bg-slate-50 px-3 py-2 sm:px-5">
      <div className="mx-auto w-full max-w-3xl">

        {/* Top navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goBackHome}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-blue-700 sm:text-sm"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>

          <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

            <span className="text-[11px] font-semibold text-blue-700 sm:text-xs">
              School Setup
            </span>
          </div>
        </div>

        {/* Page heading */}
        <div className="mx-auto mb-3 max-w-xl text-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
            Tell us about your school
          </h1>

          <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
            Add your school's information and academic calendar
            to personalize your school records.
          </p>
        </div>

        {/* Main animated card */}
        <section
          ref={cardRef}
          className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7"
        >

          {/* ================================= */}
          {/* STEP 1: SCHOOL INFORMATION */}
          {/* ================================= */}

          {step === "school" && (
            <div>
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <School size={19} className="text-blue-700" />

                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    School Information
                  </h2>
                </div>

                <p className="text-xs text-slate-500 sm:text-sm">
                  Provide the basic details of your institution.
                </p>
              </div>

              <div className="space-y-5">

                {/* School name */}
                <div className="space-y-2">
                  <label
                    htmlFor="school-name"
                    className="text-xs font-semibold text-slate-700 sm:text-sm"
                  >
                    School Name
                  </label>

                  <div className="relative">
                    <School
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="school-name"
                      type="text"
                      value={schoolName}
                      onChange={(e) =>
                        updateSchoolName(e.target.value)
                      }
                      placeholder="Enter your school's name"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Enter the official name of your school.
                  </p>
                </div>

                {/* School location */}
                <div className="space-y-2">
                  <label
                    htmlFor="school-location"
                    className="text-xs font-semibold text-slate-700 sm:text-sm"
                  >
                    School Location
                  </label>

                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="school-location"
                      type="text"
                      value={location}
                      onChange={(e) =>
                        updateLocation(e.target.value)
                      }
                      placeholder="e.g. Accra, Greater Accra"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Enter the town, city, or region where your school is located.
                  </p>
                </div>

                {/* School logo */}
                <div className="pt-1">
                  <SchoolLogoUpload
                    value={logoImage}
                    onUpload={uploadSchoolLogo}
                    onRemove={removeLogo}
                    isUploading={isUploading}
                    uploadError={uploadError}
                  />
                </div>

                {/* Upload success */}
                {uploadSuccess && (
                  <div
                    role="status"
                    className="flex items-start gap-2.5 rounded-xl border border-green-100 bg-green-50 p-3.5 text-green-700"
                  >
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0" />

                    <p className="text-xs font-medium">
                      {uploadSuccess}
                    </p>
                  </div>
                )}

                {/* Upload error */}
                {uploadError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-red-700"
                  >
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />

                    <p className="text-xs">
                      {uploadError}
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ================================= */}
          {/* STEP 2: ACADEMIC CALENDAR */}
          {/* ================================= */}

          {step === "date" && (
            <div>
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <CalendarDays size={20} className="text-blue-700" />

                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    Academic Calendar
                  </h2>
                </div>

                <p className="text-xs text-slate-500 sm:text-sm">
                  Set your school's academic term, vacation date,
                  and reopening date.
                </p>
              </div>

              {/* Academic calendar group */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm">
                    <CalendarDays size={21} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                      Term Schedule
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                      Enter your current academic calendar details.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">

                  {/* Academic term */}
                  <div className="rounded-xl border border-blue-100 bg-white p-3.5 sm:p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <GraduationCap
                        size={16}
                        className="text-blue-600"
                      />

                      <label
                        htmlFor="academic-term"
                        className="text-xs font-semibold text-slate-700 sm:text-sm"
                      >
                        Academic Term
                      </label>
                    </div>

                    <select
                      id="academic-term"
                      required
                      value={term}
                      onChange={(e) => updateTerm(e.target.value)}
                      className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-blue-800 outline-none transition-all hover:border-blue-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="First Term">
                        First Term
                      </option>

                      <option value="Second Term">
                        Second Term
                      </option>

                      <option value="Third Term">
                        Third Term
                      </option>
                    </select>
                  </div>

                  {/* Vacation date */}
                  <div className="rounded-xl border border-blue-100 bg-white p-3.5 sm:p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CalendarDays
                        size={16}
                        className="text-blue-600"
                      />

                      <label
                        htmlFor="vacation-date"
                        className="text-xs font-semibold text-slate-700 sm:text-sm"
                      >
                        Vacation Date
                      </label>
                    </div>

                    <input
                      id="vacation-date"
                      type="date"
                      required
                      value={vacationDate}
                      onChange={(e) =>
                        updateVacationDate(e.target.value)
                      }
                      className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-all hover:border-blue-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                    <p className="mt-2 text-[11px] text-slate-400">
                      Choose when your school closes for vacation.
                    </p>
                  </div>

                  {/* Reopening date */}
                  <div className="rounded-xl border border-blue-100 bg-white p-3.5 sm:p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CalendarCheck
                        size={16}
                        className="text-blue-600"
                      />

                      <label
                        htmlFor="reopening-date"
                        className="text-xs font-semibold text-slate-700 sm:text-sm"
                      >
                        Reopening Date
                      </label>
                    </div>

                    <input
                      id="reopening-date"
                      type="date"
                      required
                      value={reopeningDate}
                      onChange={(e) =>
                        updateReopeningDate(e.target.value)
                      }
                      className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-all hover:border-blue-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                    <p className="mt-2 text-[11px] text-slate-400">
                      Choose when students return to school.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ================================= */}
          {/* ERROR AND SUCCESS FEEDBACK */}
          {/* ================================= */}

          {saveError && (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-red-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />

              <p className="text-xs leading-relaxed">
                {saveError}
              </p>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              aria-live="polite"
              className="mt-5 flex items-start gap-2.5 rounded-xl border border-green-100 bg-green-50 p-3.5 text-green-700"
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

              <p className="text-xs font-medium leading-relaxed">
                {successMessage}
              </p>
            </div>
          )}

          {/* ================================= */}
          {/* STEP BUTTONS */}
          {/* ================================= */}

          <div className="mt-7 flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

            {/* Back button */}
            <button
              type="button"
              onClick={
                step === "school"
                  ? goBackHome
                  : handleBackToSchool
              }
              disabled={isSaving}
              className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-5 text-xs font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              <ArrowLeft size={15} />

              {step === "school" ? "Back" : "Back to School"}
            </button>

            {/* Continue / Save button */}
            <button
              type="button"
              onClick={
                step === "school"
                  ? handleSchoolContinue
                  : handleSave
              }
              disabled={isUploading || isSaving}
              className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving School...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading Logo...
                </>
              ) : successMessage ? (
                <>
                  <CheckCircle2 size={16} />
                  Saved Successfully
                </>
              ) : step === "school" ? (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Save & Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>

          </div>
        </section>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-slate-400">
          Powered by Easeway · Making school management easier.
        </p>

      </div>
    </main>
  );
}
