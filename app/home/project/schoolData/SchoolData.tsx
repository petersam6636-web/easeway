
"use client";

import { useRouter } from "next/navigation";
import useApp from "@/lib/useApp";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";

import SchoolLogoUpload from "./SchoolLogoUpload";

import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  School,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const initialSchoolData = {
  school_name: "",
  location: "",
  logo_image: "",
};

export default function SchoolData() {
  const router = useRouter();

  const {
    schoolData_ui,
    setSchoolData_ui,
    projectId,
  } = useApp();

  const [schoolName, setSchoolName] = useState("");
  const [location, setLocation] = useState("");
  const [logoImage, setLogoImage] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [saveError, setSaveError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Keep track of feedback timers.
  const uploadFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start with a fresh form whenever this page is opened.
  useEffect(() => {
    setSchoolName("");
    setLocation("");
    setLogoImage("");

    setUploadError("");
    setUploadSuccess("");
    setSaveError("");
    setSuccessMessage("");

    setSchoolData_ui({ ...initialSchoolData });

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
  }, [setSchoolData_ui]);

  // Show logo feedback for one second.
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

  // Show save error for one second.
  const showSaveError = (message: string) => {
    if (saveFeedbackTimer.current) {
      clearTimeout(saveFeedbackTimer.current);
    }

    setSaveError(message);

    saveFeedbackTimer.current = setTimeout(() => {
      setSaveError("");
    }, 1000);
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

  // Update school location.
  const updateLocation = (value: string) => {
    setLocation(value);
    setSaveError("");
    setSuccessMessage("");

    setSchoolData_ui((prev) => ({
      ...prev,
      location: value,
    }));
  };

  // Upload school logo to Supabase Storage.
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

      const publicUrl = publicData.publicUrl;

      // Update logo state.
      setLogoImage(publicUrl);

      setSchoolData_ui((prev) => ({
        ...prev,
        logo_image: publicUrl,
      }));

      // Show upload success feedback for one second.
      showUploadFeedback(
        "success",
        "Your school logo has been uploaded successfully!"
      );

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
    setLogoImage("");
    setUploadError("");
    setUploadSuccess("");
    setSuccessMessage("");

    if (uploadFeedbackTimer.current) {
      clearTimeout(uploadFeedbackTimer.current);
    }

    setSchoolData_ui((prev) => ({
      ...prev,
      logo_image: "",
    }));
  };

  // Save school information.
  const handleContinue = async () => {
    if (isSaving || isUploading) return;

    setSaveError("");
    setSuccessMessage("");

    if (saveFeedbackTimer.current) {
      clearTimeout(saveFeedbackTimer.current);
    }

    if (!schoolName.trim()) {
      showSaveError("Please enter your school name.");
      return;
    }

    if (!location.trim()) {
      showSaveError("Please enter your school location.");
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

      const { error } = await supabase
        .from("school_data")
        .insert({
          school_name: schoolName.trim(),
          location: location.trim(),
          logo_image: logoImage,
          project_id: projectId,
        });

      if (error) throw error;

      // Show save success feedback.
      setSuccessMessage(
        "Your school information has been saved successfully!"
      );

      // Wait one second, clear everything, then navigate.
      navigationTimer.current = setTimeout(() => {
        // Clear local form.
        setSchoolName("");
        setLocation("");
        setLogoImage("");

        // Clear global school information.
        setSchoolData_ui({ ...initialSchoolData });

        // Remove success feedback before leaving this page.
        setSuccessMessage("");

        // Navigate to the next page.
        router.push("/home/project");
      }, 800);

    } catch (error: unknown) {
      console.error("School information error:", error);

      showSaveError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving your school information. Please try again."
      );

      setSuccessMessage("");
    } finally {
      setIsSaving(false);
    }
  };

  // Both Back buttons navigate to project process.
  const goBackHome = () => {
    router.push("/home/project");
  };

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
            Add your school's basic information and logo to personalize
            your school reports.
          </p>
        </div>

        {/* Form */}
        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7">

          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              School information
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
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
                  onChange={(e) => updateSchoolName(e.target.value)}
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
                  onChange={(e) => updateLocation(e.target.value)}
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

            {/* Logo upload success feedback */}
            {uploadSuccess && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-2.5 rounded-xl border border-green-100 bg-green-50 p-3.5 text-green-700"
              >
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <p className="text-xs font-medium leading-relaxed">
                  {uploadSuccess}
                </p>
              </div>
            )}

            {/* Logo upload error feedback */}
            {uploadError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-red-700"
              >
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <p className="text-xs leading-relaxed">
                  {uploadError}
                </p>
              </div>
            )}

            {/* School information save error */}
            {saveError && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-red-700"
              >
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <p className="text-xs leading-relaxed">
                  {saveError}
                </p>
              </div>
            )}

            {/* School information save success */}
            {successMessage && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-2.5 rounded-xl border border-green-100 bg-green-50 p-3.5 text-green-700"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <p className="text-xs font-medium leading-relaxed">
                  {successMessage}
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-7 flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

            <button
              type="button"
              onClick={goBackHome}
              className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-5 text-xs font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
            >
              <ArrowLeft size={15} />
              Back
            </button>

            <button
              type="button"
              onClick={handleContinue}
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
              ) : (
                <>
                  Continue
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
