
"use client";

import { useRouter } from "next/navigation";
import useApp from "@/lib/useApp";
import { useState } from "react";
import { supabase } from "@/lib/supabase-client";

import SchoolLogoUpload from "./SchoolLogoUpload";

import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  School,
} from "lucide-react";

export default function SchoolData() {
  const router = useRouter();

  const { schoolData_ui, setSchoolData_ui } = useApp();

  const [schoolName, setSchoolName] = useState(
    schoolData_ui?.school_name || ""
  );

  const [location, setLocation] = useState(
    schoolData_ui?.location || ""
  );

  const [logoImage, setLogoImage] = useState(
    schoolData_ui?.logo_image || ""
  );

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const updateSchoolName = (value: string) => {
    setSchoolName(value);

    setSchoolData_ui((prev) => ({
      ...prev,
      school_name: value,
    }));
  };

  const updateLocation = (value: string) => {
    setLocation(value);

    setSchoolData_ui((prev) => ({
      ...prev,
      location: value,
    }));
  };

  // Upload school logo to Supabase Storage
  const uploadSchoolLogo = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError("");

      // Get the currently authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please log in before uploading your logo.");
      }

      // Create a unique file path for this user's logo
      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() || "png";

      const filePath = `${user.id}/${Date.now()}.${fileExtension}`;

      // Upload the actual image file
      const { data, error } = await supabase.storage
        .from("school-logos")
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get the public URL of the uploaded image
      const { data: publicData } = supabase.storage
        .from("school-logos")
        .getPublicUrl(data.path);

      const publicUrl = publicData.publicUrl;

      // Update local state
      setLogoImage(publicUrl);

      // Update the global app state
      setSchoolData_ui((prev) => ({
        ...prev,
        logo_image: publicUrl,
      }));
    } catch (error) {
      console.error("School logo upload error:", error);

      setUploadError(
        error instanceof Error
          ? error.message
          : "Unable to upload your school logo. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Remove logo from the current app state
  const removeLogo = () => {
    setLogoImage("");

    setUploadError("");

    setSchoolData_ui((prev) => ({
      ...prev,
      logo_image: "",
    }));
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 px-2 py-2 sm:px-2 sm:py-2 lg:px-2 lg:py-2">
      <div className="mx-auto w-full max-w-6xl">

        {/* Top navigation */}
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1 text-sm font-semibold text-slate-600 transition-all hover:bg-white hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Back to Home
          </button>

          <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <span className="text-xs font-semibold text-blue-700">
              School Setup
            </span>
          </div>
        </div>

        {/* Page heading */}
        <div className="mx-auto mb-9 max-w-2xl text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tell us about your school
          </h1>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-2 lg:gap-10">

          {/* Form section */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-7 text-center">
              <h2 className="text-lg font-bold text-slate-900">
                School information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Provide the basic details of your institution.
              </p>
            </div>

            <div className="space-y-6">

              {/* School name */}
              <div className="space-y-2">
                <label
                  htmlFor="school-name"
                  className="text-sm font-semibold text-slate-700"
                >
                  School Name
                </label>

                <div className="relative">
                  <School
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="school-name"
                    type="text"
                    value={schoolName}
                    onChange={(e) =>
                      updateSchoolName(e.target.value)
                    }
                    placeholder="Enter your school's name"
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* School location */}
              <div className="space-y-2">
                <label
                  htmlFor="school-location"
                  className="text-sm font-semibold text-slate-700"
                >
                  School Location
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="school-location"
                    type="text"
                    value={location}
                    onChange={(e) =>
                      updateLocation(e.target.value)
                    }
                    placeholder="e.g. Accra, Greater Accra"
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* School logo upload */}
              <SchoolLogoUpload
                value={logoImage}
                onUpload={uploadSchoolLogo}
                onRemove={removeLogo}
                isUploading={isUploading}
                uploadError={uploadError}
              />
            </div>

            {/* Buttons */}
            <div className="mt-9 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                type="button"
                disabled={isUploading}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-700 px-7 text-sm font-semibold text-white shadow-lg shadow-blue-700/15 transition-all hover:bg-blue-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
                <ArrowRight size={17} />
              </button>
            </div>
          </section>

          {/* Sticky Live Preview */}
          <section className="hidden lg:sticky lg:top-25 lg:block lg:self-start">

            {/* Live Preview heading stays sticky with the card */}
            <div className="mb-1">
              <h2 className="text-base  font-bold text-slate-900">
                Live Preview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Preview your school report card heading.
              </p>
            </div>

            {/* Taller Report Card */}
            <div className="relative min-h-[420px] w-full overflow-hidden rounded-2xl border border-slate-300 bg-white p-8 shadow-sm">

              {/* Report header content aligned at the top */}
              <div className="relative z-10 flex items-start justify-between gap-5">

                {/* Left logo */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                  {logoImage && (
                    <img
                      src={logoImage}
                      alt="School logo"
                      className="h-full w-full rounded-full object-contain"
                    />
                  )}
                </div>

                {/* School name aligned at the top */}
                <div className="min-w-0 flex-1 pt-1 text-center">
                  {schoolName.trim() && (
                    <h3 className="break-words text-base font-bold uppercase leading-relaxed text-black 4xl:text-xl">
                      {schoolName.trim()}
                    </h3>
                  )}
                </div>

                {/* Right logo */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                  {logoImage && (
                    <img
                      src={logoImage}
                      alt="School logo"
                      className="h-full w-full rounded-full object-contain"
                    />
                  )}
                </div>

              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-400">
          Powered by Easeway · Making school management easier.
        </p>

      </div>
    </main>
  );
}
