
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { supabase } from "@/lib/supabase-client";
import ProjectLoading from "@/component/Loading";

type DataRecord = Record<string, any>;

type FindPageProps = {
    projectId: string;
};

function normalizeName(value: unknown) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

function getMethod(project: DataRecord) {
    return String(
        project.method ?? project.project_method ?? "JHS"
    ).toUpperCase().includes("PRIMARY")
        ? "PRIMARY"
        : "JHS";
}

export default function FindPage({ projectId }: FindPageProps) {
    const router = useRouter();

    const [project, setProject] = useState<DataRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [studentName, setStudentName] = useState("");
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadProject() {
            try {
                setLoading(true);
                setLoadError("");

                if (!projectId) {
                    throw new Error("This project link is invalid.");
                }

                const db = supabase as any;

                // 1. Fetch the selected project.
                const {
                    data: projectData,
                    error: projectError,
                } = await db
                    .from("projects")
                    .select("*")
                    .eq("id", projectId)
                    .maybeSingle();

                if (projectError) throw projectError;

                if (!projectData) {
                    throw new Error(
                        "This shared project could not be found. Please check your QR code or contact your school."
                    );
                }

                // 2. Determine the academic method from this project.
                const method = getMethod(projectData);

                // 3. Fetch the school_data record connected
                // to this project through its project_id foreign key.
                const {
                    data: schoolData,
                    error: schoolError,
                } = await db
                    .from("school_data")
                    .select("*")
                    .eq("project_id", projectData.id)
                    .maybeSingle();

                if (schoolError) throw schoolError;

                // 4. Select ONLY the tables belonging to this project method.
                const studentTable =
                    method === "PRIMARY"
                        ? "primary_students"
                        : "jhs_students";

                const studentDataTable =
                    method === "PRIMARY"
                        ? "primary_student_data"
                        : "jhs_student_data";

                const subjectTable =
                    method === "PRIMARY"
                        ? "primary_subjects"
                        : "jhs_subjects";

                // 5. Fetch students from the selected method only.
                const {
                    data: studentsData,
                    error: studentsError,
                } = await db
                    .from(studentTable)
                    .select("*")
                    .eq("project_id", projectData.id);

                if (studentsError) throw studentsError;

                const students: DataRecord[] = studentsData ?? [];

                let enrichedStudents: DataRecord[] = [];

                const studentIds = students
                    .map((student) => student.id)
                    .filter(
                        (studentId) =>
                            studentId !== null &&
                            studentId !== undefined
                    );

                // 6. Fetch the selected method's student information
                // and subject records.
                if (studentIds.length > 0) {
                    const [
                        { data: infoData, error: infoError },
                        { data: subjectsData, error: subjectsError },
                    ] = await Promise.all([
                        db
                            .from(studentDataTable)
                            .select("*")
                            .in("student_id", studentIds),

                        db
                            .from(subjectTable)
                            .select("*")
                            .in("student_id", studentIds),
                    ]);

                    if (infoError) throw infoError;
                    if (subjectsError) throw subjectsError;

                    enrichedStudents = students.map((student) => {
                        const studentInfo =
                            (infoData ?? []).find(
                                (item: DataRecord) =>
                                    String(item.student_id) ===
                                    String(student.id)
                            ) ?? {};

                        const studentSubjects =
                            (subjectsData ?? []).filter(
                                (item: DataRecord) =>
                                    String(item.student_id) ===
                                    String(student.id)
                            );

                        // Attach records using the correct method relation.
                        return method === "PRIMARY"
                            ? {
                                ...student,
                                primary_student_data: studentInfo,
                                primary_subjects: studentSubjects,
                            }
                            : {
                                ...student,
                                jhs_student_data: studentInfo,
                                jhs_subjects: studentSubjects,
                            };
                    });
                }

                // 7. Prepare the complete project data for the report card.
                const completeProject = {
                    ...projectData,
                    method,
                    school_data: schoolData ?? {},
                    students: enrichedStudents,
                };

                if (!cancelled) {
                    setProject(completeProject);
                }
            } catch (err) {
                console.error("SHARED PROJECT ERROR:", err);

                if (!cancelled) {
                    setLoadError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load this project."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProject();

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    function findStudent() {
        if (searching || !project) return;

        const searchName = normalizeName(studentName);

        if (!searchName) {
            setError("Please enter your full name before searching.");
            return;
        }

        setSearching(true);
        setError("");

        const students: DataRecord[] = Array.isArray(project.students)
            ? project.students
            : [];

        const matchedStudent = students.find((student) => {
            const name =
                student.full_name ??
                student.name ??
                student.student_name ??
                "";

            return normalizeName(name) === searchName;
        });

        if (!matchedStudent) {
            setSearching(false);
            setError(
                "We couldn't find a student with that name in this project. Please check the spelling and try again."
            );
            return;
        }

        const studentId = String(matchedStudent.id ?? "");

        if (!studentId) {
            setSearching(false);
            setError(
                "The matching student record is incomplete. Please contact your school."
            );
            return;
        }

        try {
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
                `/home/share/${encodeURIComponent(projectId)}/${encodeURIComponent(studentId)}`
            );
        } catch (storageError) {
            console.error("SHARE STORAGE ERROR:", storageError);
            setSearching(false);
            setError(
                "Unable to prepare your report card. Please try again."
            );
        }
    }

    if (loading) {
        return <ProjectLoading />;
    }

    if (loadError || !project) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-5 py-2">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-3xl" />
                    <div className="absolute -bottom-40 -right-20 h-[550px] w-[550px] rounded-full bg-indigo-200/40 blur-3xl" />
                </div>

                <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-8 text-center shadow-2xl shadow-blue-900/10 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <AlertCircle size={30} />
                    </div>

                    <h1 className="mt-5 text-xl font-bold text-slate-900">
                        Project Not Available
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {loadError || "We couldn't find this project."}
                    </p>

                    <p className="mt-5 text-xs text-slate-400">
                        Please contact your school if you believe this link is correct.
                    </p>
                </div>
            </main>
        );
    }

    const method = getMethod(project);
    const school = project.school_data ?? {};

    const schoolName =
        school.school_name ??
        project.header ??
        project.name ??
        "School Report Portal";

    // Use the logo_image belonging to the related school_data record.
    const logo = school.logo_image ?? "";

    return (
<main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-2">

            {/* Full-page background decoration */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-200/40 blur-3xl" />

                <div className="absolute -bottom-48 -right-40 h-[650px] w-[650px] rounded-full bg-indigo-200/50 blur-3xl" />

                <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/40 blur-3xl" />

                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-blue-100/30" />
            </div>

            <div className="relative z-10 w-full max-w-lg">
                <div className="mb-7 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-900/10">
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

                </div>

<section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.16),0_8px_20px_-8px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03]">             <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-6 py-7 text-white sm:px-8">
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
                            Enter your full name exactly as registered by your school.
                        </p>
                    </div>

                    <div className="px-6 py-7 sm:px-8">
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-800">
                                <School size={20} />
                            </div>

                            <div>
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
                                className="ml-auto text-blue-700"
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
                                    setError("");
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") findStudent();
                                }}
                                placeholder="Enter your full name"
                                disabled={searching}
                                className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={findStudent}
                            disabled={searching}
                            className="mt-4 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
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
                            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                            <p>
                                Your report is matched against the student records for this shared project.
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
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-red-100"
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
