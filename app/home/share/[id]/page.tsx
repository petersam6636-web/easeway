
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProjectLoading from "@/component/Loading";
import {supabase} from "@/lib/supabase-client";
import FindPage from "./FindPage";

type DataRecord = Record<string, any>;

export default function ShareProjectPage() {
    const params = useParams();
    const projectId = String(params.id ?? "");

    const [project, setProject] = useState<DataRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!projectId) {
            setError("The project link is invalid.");
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function loadProject() {
            try {
                setLoading(true);
                setError("");

                // 1. Fetch the project.
                const { data: projectData, error: projectError } =
                    await supabase
                        .from("projects")
                        .select("*")
                        .eq("id", projectId)
                        .maybeSingle();

                if (projectError) throw projectError;

                if (!projectData) {
                    throw new Error(
                        "This shared project could not be found. Please check the QR code or ask your school for a new link."
                    );
                }

                const method = String(
                    projectData.method ??
                    projectData.project_method ??
                    "JHS"
                ).trim().toUpperCase().includes("PRIMARY")
                    ? "PRIMARY"
                    : "JHS";

                // 2. Fetch school information.
                const { data: schoolData, error: schoolError } =
                    await supabase
                        .from("school_data")
                        .select("*")
                        .eq("project_id", projectId)
                        .limit(1)
                        .maybeSingle();

                if (schoolError) throw schoolError;

                // 3. Select ONLY the tables for this project method.
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

                // 4. Fetch students belonging to this project.
                const { data: studentsData, error: studentsError } =
                    await supabase
                        .from(studentTable)
                        .select("*")
                        .eq("project_id", projectId);

                if (studentsError) throw studentsError;

                const students = studentsData ?? [];

                // 5. Fetch student-specific data and subject marks.
                let enrichedStudents: DataRecord[] = [];

                if (students.length > 0) {
                    const studentIds = students
                        .map((student: DataRecord) => student.id)
                        .filter(Boolean);

                    if (studentIds.length > 0) {
                        const [
                            { data: studentInfoData, error: infoError },
                            { data: subjectsData, error: subjectsError },
                        ] = await Promise.all([
                            supabase
                                .from(studentDataTable)
                                .select("*")
                                .in("student_id", studentIds),

                            supabase
                                .from(subjectTable)
                                .select("*")
                                .in("student_id", studentIds),
                        ]);

                        if (infoError) throw infoError;
                        if (subjectsError) throw subjectsError;

                        enrichedStudents = students.map(
                            (student: DataRecord) => {
                                const studentInfo =
                                    (studentInfoData ?? []).find(
                                        (item: DataRecord) =>
                                            String(item.student_id) ===
                                            String(student.id)
                                    ) ?? {};

                                const subjectRecords =
                                    (subjectsData ?? []).filter(
                                        (item: DataRecord) =>
                                            String(item.student_id) ===
                                            String(student.id)
                                    );

                                return method === "PRIMARY"
                                    ? {
                                        ...student,
                                        primary_student_data: studentInfo,
                                        primary_subjects: subjectRecords,
                                    }
                                    : {
                                        ...student,
                                        jhs_student_data: studentInfo,
                                        jhs_subjects: subjectRecords,
                                    };
                            }
                        );
                    }
                }

                const completeProject = {
                    ...projectData,
                    school_data: schoolData ?? {},
                    students: enrichedStudents,
                };

                if (!cancelled) {
                    setProject(completeProject);
                }
            } catch (err) {
                console.error("SHARED PROJECT ERROR:", err);

                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load this project. Please try again."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadProject();

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    if (loading) return <ProjectLoading />;

    if (error || !project) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m15 9-6 6" />
                            <path d="m9 9 6 6" />
                        </svg>
                    </div>

                    <h1 className="mt-5 text-xl font-bold text-slate-900">
                        Project Not Available
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {error || "We couldn't find this shared project."}
                    </p>

                    <p className="mt-5 text-xs text-slate-400">
                        Please contact your school if you believe this link is correct.
                    </p>
                </div>
            </main>
        );
    }

    return <FindPage project={project} />;
}
