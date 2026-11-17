
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    GraduationCap,
    Search,
    UserRound,
    School,
    BookOpen,
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    X,
} from "lucide-react";

type DataRecord = Record<string, any>;

export default function FindPage({
    project,
}: {
    project: DataRecord;
}) {
    const router = useRouter();
    const params = useParams();

    const projectId = String(params.id ?? project.id ?? "");
    const students: DataRecord[] = Array.isArray(project.students)
        ? project.students
        : [];

    const method = String(
        project.method ?? project.project_method ?? "JHS"
    ).toUpperCase().includes("PRIMARY")
        ? "PRIMARY"
        : "JHS";

    const school = project.school_data ?? {};

    const schoolName =
        school.school_name ??
        project.header ??
        project.name ??
        "School Report Portal";

    const logo = school.logo_image ?? "";

    const [studentName, setStudentName] = useState("");
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");

    function findStudent() {
        if (searching) return;

        const searchName = studentName
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase();

        if (!searchName) {
            setError("Please enter your full name before searching.");
            return;
        }

        setSearching(true);
        setError("");

        const matchedStudent = students.find((student) => {
            const name = String(
                student.full_name ??
                student.name ??
                student.student_name ??
                ""
            )
                .trim()
                .replace(/\s+/g, " ")
                .toLowerCase();

            return name === searchName;
        });

        if (!matchedStudent) {
            setSearching(false);
            setError(
                "We couldn't find a student with that name in this project. Please check the spelling and try again."
            );
            return;
        }

        const studentId = String(
            matchedStudent.id ??
            matchedStudent.student_id ??
            matchedStudent.admission_number ??
            ""
        );

        if (!studentId) {
            setSearching(false);
            setError(
                "We found a matching student, but their student record is incomplete. Please contact your school."
            );
            return;
        }

        try {
            // Keep the selected student and complete project data
            // available to the report-card page, including on refresh.
            const storageKey = `easeway-share-${projectId}`;

            sessionStorage.setItem(
                storageKey,
                JSON.stringify({
                    project,
                    studentId,
                    savedAt: Date.now(),
                })
            );

            router.push(
                `/home/share/${encodeURIComponent(projectId)}/Card?student=${encodeURIComponent(studentId)}`
            );
        } catch (storageError) {
            console.error("SHARE STORAGE ERROR:", storageError);
            setSearching(false);
            setError(
                "We couldn't prepare your report card. Please allow this site to use session storage and try again."
            );
        }
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
            <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />

            <div className="relative z-10 w-full max-w-lg">
                <div className="mb-7 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                        {logo ? (
                            <img
                                src={logo}
                                alt={`${schoolName} logo`}
                                className="h-full w-full object-contain p-2"
                            />
                        ) : (
                            <GraduationCap
                                size={34}
                                className="text-blue-900"
                            />
                        )}
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                        Easeway Student Portal
                    </p>

                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                        {schoolName}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Access your academic report card securely.
                    </p>
                </div>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                    <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-6 py-7 text-white sm:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                                <BookOpen size={23} />
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                                    Student report access
                                </p>
                                <h2 className="mt-0.5 text-xl font-bold">
                                    Find Your Report
                                </h2>
                            </div>
                        </div>

                        <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">
                            Enter your full name exactly as it was registered
                            by your school to view your terminal report.
                        </p>
                    </div>

                    <div className="px-6 py-7 sm:px-8">
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-800">
                                <School size={20} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                    Academic level
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-slate-800">
                                    {method === "PRIMARY"
                                        ? "Primary School"
                                        : "Junior High School"}
                                </p>
                            </div>

                            <ShieldCheck
                                size={19}
                                className="ml-auto shrink-0 text-blue-700"
                            />
                        </div>

                        <label
                            htmlFor="student-name"
                            className="mb-2 block text-sm font-bold text-slate-800"
                        >
                            Student's Full Name
                        </label>

                        <div className="relative">
                            <UserRound
                                size={19}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                id="student-name"
                                type="text"
                                autoComplete="name"
                                value={studentName}
                                onChange={(event) => {
                                    setStudentName(event.target.value);
                                    if (error) setError("");
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") findStudent();
                                }}
                                placeholder="Enter your full name"
                                disabled={searching}
                                className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={findStudent}
                            disabled={searching}
                            className="mt-4 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-bold text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {searching ? (
                                <>
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Finding your report...
                                </>
                            ) : (
                                <>
                                    <Search size={19} />
                                    Find My Report
                                    <ArrowRight size={18} className="ml-auto" />
                                </>
                            )}
                        </button>

                        <div className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-slate-400">
                            <ShieldCheck
                                size={15}
                                className="mt-0.5 shrink-0"
                            />
                            <p>
                                Your report is matched against the student
                                records for this school's shared project.
                            </p>
                        </div>
                    </div>
                </section>

                <p className="mt-6 text-center text-xs text-slate-400">
                    Powered by{" "}
                    <span className="font-bold text-blue-900">
                        Easeway School Management
                    </span>
                </p>
            </div>

            {/* NOT FOUND / VALIDATION POPUP */}

            {error && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="student-error-title"
                        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                    <AlertCircle size={22} />
                                </div>

                                <h2
                                    id="student-error-title"
                                    className="font-bold text-red-800"
                                >
                                    Student Not Found
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setError("")}
                                aria-label="Close"
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-100 hover:text-red-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-5 py-5">
                            <p className="text-sm leading-6 text-slate-600">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => setError("")}
                                className="mt-5 w-full cursor-pointer rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
