
"use client";
import useApp from "@/lib/useApp";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Printer,
    GraduationCap,
    AlertCircle,
} from "lucide-react";

type DataRecord = Record<string, any>;

type CardClientProps = {
    projectId: string;
    studentId: string;
};

type StoredShareData = {
    project: DataRecord;
};

type SubjectResult = {
    name: string;
    mark: number | null;
    position: number | null;
    grade: string;
};

// Exact subject order based on the project method.
const SUBJECTS: Record<"JHS" | "PRIMARY", string[]> = {
    JHS: [
        "English",
        "Mathematics",
        "Science",
        "Computing",
        "social_studies",
        "Creative_arts",
        "Career_technology",
        "RME",
        "Fante/twi",
    ],

    PRIMARY: [
        "English",
        "Mathematics",
        "Science",
        "Computing",
        "Creative_arts",
        "RME",
        "PEH",
        "HIstory",
        "Fante/twi",
    ],
};

// Matches the configured subject names to the names saved in Supabase.
const SUBJECT_ALIASES: Record<string, string[]> = {
    English: ["english", "english language"],

    Mathematics: ["mathematics", "maths", "math"],

    Science: ["science", "integrated science"],

    Computing: [
        "computing",
        "ict",
        "information communication technology",
    ],

    social_studies: [
        "social studies",
        "social_studies",
        "social studies education",
    ],

    Creative_arts: [
        "creative arts",
        "creative_arts",
        "creative arts and design",
        "creative arts design",
    ],

    Career_technology: [
        "career technology",
        "career_technology",
        "career tech",
        "career technology education",
    ],

    RME: ["rme", "religious and moral education"],

    PEH: ["peh", "physical education and health"],

    HIstory: ["history"],

    "Fante/twi": ["fante", "twi", "fante/twi"],
};

const SCORE_KEYS = [
    "value",
    "mark",
    "marks",
    "score",
    "obtained_marks",
    "obtainedMarks",
    "total_score",
];

function normalize(value: unknown) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ");
}

function getMethod(project: DataRecord): "JHS" | "PRIMARY" {
    return String(
        project.method ?? project.project_method ?? "JHS"
    )
        .toUpperCase()
        .includes("PRIMARY")
        ? "PRIMARY"
        : "JHS";
}

function getGrade(mark: number | null) {
    if (mark === null || !Number.isFinite(mark)) return "-";
    if (mark >= 80) return "A";
    if (mark >= 70) return "B";
    if (mark >= 60) return "C";
    if (mark >= 45) return "D";
    if (mark >= 35) return "E";
    return "F";
}

function getSubjectName(record: DataRecord) {
    return (
        record.subject_name ??
        record.subjectName ??
        record.subject ??
        record.name ??
        record.title ??
        ""
    );
}

function getScore(record: DataRecord): number | null {
    for (const key of SCORE_KEYS) {
        const value = record?.[key];

        if (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            Number.isFinite(Number(value))
        ) {
            return Number(value);
        }
    }

    return null;
}

function getSubjectMark(
    student: DataRecord,
    method: "JHS" | "PRIMARY",
    subject: string
): number | null {
    const relationKey =
        method === "PRIMARY"
            ? "primary_subjects"
            : "jhs_subjects";

    const dataKey =
        method === "PRIMARY"
            ? "primary_student_data"
            : "jhs_student_data";

    const aliases = SUBJECT_ALIASES[subject] ?? [normalize(subject)];
    const normalizedAliases = aliases.map(normalize);

    const sources = [
        student?.[relationKey],
        student?.[dataKey],
    ];

    for (const source of sources) {
        if (!source) continue;

        const records = Array.isArray(source) ? source : [source];

        for (const record of records) {
            if (!record || typeof record !== "object") continue;

            const recordSubject = normalize(getSubjectName(record));

            if (
                recordSubject &&
                normalizedAliases.includes(recordSubject)
            ) {
                const score = getScore(record);

                if (score !== null) return score;
            }

            for (const [key, value] of Object.entries(record)) {
                if (!normalizedAliases.includes(normalize(key))) {
                    continue;
                }

                if (
                    value !== null &&
                    value !== undefined &&
                    value !== "" &&
                    typeof value !== "object" &&
                    Number.isFinite(Number(value))
                ) {
                    return Number(value);
                }

                if (value && typeof value === "object") {
                    const nestedScore = getScore(value as DataRecord);

                    if (nestedScore !== null) return nestedScore;
                }
            }
        }
    }

    return null;
}

function getStudentInfo(
    student: DataRecord,
    method: "JHS" | "PRIMARY"
): DataRecord {
    const value =
        method === "PRIMARY"
            ? student.primary_student_data ?? student.primary_student_info
            : student.jhs_student_data ?? student.jhs_student_info;

    if (Array.isArray(value)) return value[0] ?? {};

    return value ?? {};
}

function getStudentName(student: DataRecord) {
    return (
        student.full_name ??
        student.name ??
        student.student_name ??
        "Student"
    );
}

function getPosition(
    score: number | null,
    scores: Array<number | null>
): number | null {
    if (score === null) return null;

    const validScores = scores.filter(
        (value): value is number => value !== null
    );

    return (
        1 +
        validScores.filter((value) => value > score).length
    );
}

function getStudentTotal(
    student: DataRecord,
    method: "JHS" | "PRIMARY",
    subjects: string[]
) {
    return subjects.reduce((total, subject) => {
        return (
            total +
            (getSubjectMark(student, method, subject) ?? 0)
        );
    }, 0);
}

function formatDate(value: unknown) {
    if (!value) return "Not specified";

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}
        

function ordinal(value: number | null) {
    if (!value) return "N/A";

    const remainder = value % 100;

    if (remainder >= 11 && remainder <= 13) {
        return `${value}th`;
    }

    switch (value % 10) {
        case 1:
            return `${value}st`;
        case 2:
            return `${value}nd`;
        case 3:
            return `${value}rd`;
        default:
            return `${value}th`;
    }
}

export default function CardClient({
    projectId,
    studentId,
}: CardClientProps) {
    const [storedData, setStoredData] =
        useState<StoredShareData | null>(null);
const { setSearching} = useApp()
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load the project data using the project ID from the URL.
    // The selected student ID comes directly from the URL too.
    useEffect(() => {
        setSearching(false)
        let active = true;

        try {
            if (!projectId || !studentId) {
                throw new Error(
                    "The report card link is invalid."
                );
            }

            const storageKey = `easeway-share-${projectId}`;
            const saved = sessionStorage.getItem(storageKey);

            if (!saved) {
                throw new Error(
                    "Your report information is no longer available. Please return to the student search page and search again."
                );
            }

            const parsed = JSON.parse(saved) as StoredShareData;

            if (
                !parsed?.project ||
                String(parsed.project.id) !== String(projectId)
            ) {
                throw new Error(
                    "The saved report information is invalid. Please search for your name again."
                );
            }

            const students = Array.isArray(parsed.project.students)
                ? parsed.project.students
                : [];

            const studentExists = students.some(
                (student: DataRecord) =>
                    String(student.id) === String(studentId)
            );

            if (!studentExists) {
                throw new Error(
                    "The student record could not be found in this project. Please search again."
                );
            }

            if (active) {
                setStoredData(parsed);
            }
        } catch (err) {
            console.error("REPORT CARD LOAD ERROR:", err);

            if (active) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load this report card."
                );
            }
        } finally {
            if (active) {
                setLoading(false);
            }
        }

        return () => {
            active = false;
        };
    }, [projectId, studentId]);

    const report = useMemo(() => {
        if (!storedData) return null;

        const project = storedData.project;

        // First check the project method.
        const method = getMethod(project);

        // Select the correct subject list for this project.
        const subjects = SUBJECTS[method];

        const students: DataRecord[] = Array.isArray(project.students)
            ? project.students
            : [];

        // Find the student using the studentId route parameter.
        const student = students.find(
            (item) =>
                String(item.id) === String(studentId)
        );

        if (!student) return null;

        // Generate subject results using the selected method's subjects.
        const results: SubjectResult[] = subjects.map((subject) => {
            const mark = getSubjectMark(
                student,
                method,
                subject
            );

            const allMarks = students.map((item) =>
                getSubjectMark(item, method, subject)
            );

            return {
                name: subject,
                mark,
                position: getPosition(mark, allMarks),
                grade: getGrade(mark),
            };
        });

        // Calculate totals using only the selected method's subjects.
        const total = results.reduce(
            (sum, item) => sum + (item.mark ?? 0),
            0
        );

        const markedSubjects = results.filter(
            (item) => item.mark !== null
        ).length;

        const maximum = markedSubjects * 100;

        const average =
            markedSubjects > 0
                ? total / markedSubjects
                : 0;

        const allTotals = students.map((item) =>
            getStudentTotal(item, method, subjects)
        );

        const overallPosition = getPosition(
            total,
            allTotals
        );

        const rawPassMark = Number(project.passMark ?? 0);

        const passMark = Number.isFinite(rawPassMark)
            ? rawPassMark
            : 0;

        const studentInfo = getStudentInfo(
            student,
            method
        );

        return {
            project,
            method,
            student,
            studentInfo,
            results,
            total,
            maximum,
            average,
            overallPosition,
            passMark,
            qualified: total >= passMark,
            school: project.school_data ?? {},
        };
    }, [storedData, studentId]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-950" />
                    <p className="mt-4 text-sm font-medium text-slate-500">
                        Preparing your report card...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <AlertCircle size={30} />
                    </div>

                    <h1 className="mt-5 text-xl font-bold text-slate-900">
                        Report Card Unavailable
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        {error ||
                            "Unable to prepare this report card."}
                    </p>

                    <Link
                        href={`/home/share/${encodeURIComponent(projectId)}`}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
                    >
                        <ArrowLeft size={17} />
                        Search Again
                    </Link>
                </div>
            </main>
        );
    }

    const {
        project,
        method,
        student,
        studentInfo,
        results,
        total,
        maximum,
        average,
        overallPosition,
        passMark,
        qualified,
        school,
    } = report;

    const schoolName =
        school.school_name ??
        project.header ??
        "School Name";

    const logo = school.logo_image ?? "";

    const studentName = getStudentName(student);

    const grade = getGrade(average);

    const studentClass =
        student.class_name ??
        student.class ??
        studentInfo.class_name ??
        studentInfo.class ??
        "Not specified";

    const admissionNumber =
        student.admission_number ??
        student.student_number ??
        student.id ??
        "Not specified";

    const profileFields = [
        {
            label: "Age",
            value: studentInfo.age,
        },
        {
            label: "House",
            value: studentInfo.house,
        },
        {
            label: "Guardian",
            value:
                studentInfo.guardian ??
                studentInfo.guardian_name,
        },
        {
            label: "Guardian Contact",
            value:
                studentInfo.guardian_contact ??
                studentInfo.guardian_phone,
        },
    ].filter(
        (item) =>
            item.value !== null &&
            item.value !== undefined &&
            item.value !== ""
    );

    return (
        <main className="min-h-screen bg-slate-100 px-3 py-6 sm:px-6">
            <style jsx global>{`
                @page {
                    size: A4 portrait;
                    margin: 8mm;
                }

                @media print {
                    html,
                    body {
                        background: #ffffff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .report-paper {
                        width: 100% !important;
                        max-width: none !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 5mm !important;
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }

                    .report-paper * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            <div className="no-print mx-auto mb-5 flex w-full max-w-[850px] items-center justify-between gap-3">
                <Link
                    href={`/home/share/${encodeURIComponent(projectId)}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    <ArrowLeft size={17} />
                    Back
                </Link>

                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                    <Printer size={17} />
                    Print Report
                </button>
            </div>

            <article className="report-paper relative mx-auto w-full max-w-[850px] overflow-hidden border border-slate-300 bg-white p-5 shadow-xl sm:p-8">
                <div className="pointer-events-none absolute inset-3 border-2 border-blue-950/80" />

                <div className="relative z-10">
                    <header className="border-b-2 border-blue-950 pb-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                            {logo ? (
                                <img
                                    src={logo}
                                    alt="School logo"
                                    className="h-16 w-16 object-contain"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-900">
                                    <GraduationCap size={35} />
                                </div>
                            )}

                            <div>
                                <h1 className="text-xl font-extrabold uppercase tracking-wide text-blue-950 sm:text-2xl">
                                    {schoolName}
                                </h1>

                                {school.location && (
                                    <p className="mt-1 text-xs text-slate-600">
                                        {school.location}
                                    </p>
                                )}
                            </div>

                            {logo && (
                                <img
                                    src={logo}
                                    alt="School logo"
                                    className="hidden h-16 w-16 object-contain sm:block"
                                />
                            )}
                        </div>

                        <div className="mt-4 inline-block rounded-md bg-blue-950 px-8 py-2 text-white">
                            <h2 className="text-sm font-extrabold uppercase tracking-[0.2em]">
                                Terminal Report
                            </h2>
                        </div>

                        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                            {method === "PRIMARY"
                                ? "Primary School"
                                : "Junior High School"}
                        </p>
                    </header>

                    <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 border-b border-slate-300 pb-3 text-xs sm:grid-cols-4">
                        <div>
                            <p className="text-slate-500">Term</p>
                            <p className="font-bold text-slate-900">
                                {school.term || "Not specified"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">
                                Academic Year
                            </p>
                            <p className="font-bold text-slate-900">
                                {school.academic_year || "Not specified"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">
                                Reopening Date
                            </p>
                            <p className="font-bold text-slate-900">
                                {formatDate(school.reopening_date)}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">
                                Vacation Date
                            </p>
                            <p className="font-bold text-slate-900">
                                {formatDate(school.vacation_date)}
                            </p>
                        </div>
                    </div>

                    <section className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-300 p-3 text-xs sm:grid-cols-3">
                        <div className="col-span-2 sm:col-span-1">
                            <p className="text-slate-500">
                                Student Name
                            </p>
                            <p className="mt-1 font-extrabold uppercase text-slate-950">
                                {studentName}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">
                                Student ID
                            </p>
                            <p className="mt-1 font-bold text-slate-900">
                                {admissionNumber}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Class</p>
                            <p className="mt-1 font-bold text-slate-900">
                                {studentClass}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">
                                Overall Position
                            </p>
                            <p className="mt-1 font-extrabold text-blue-950">
                                {ordinal(overallPosition)}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">
                                Assessment
                            </p>
                            <p className="mt-1 font-bold text-slate-900">
                                Terminal Assessment
                            </p>
                        </div>
                    </section>

                    <section className="mt-5">
                        <h3 className="mb-2 text-center text-sm font-extrabold uppercase tracking-wider text-blue-950">
                            Academic Performance
                        </h3>

                        <table className="w-full border-collapse text-xs">
                            <thead>
                                <tr className="bg-blue-950 text-white">
                                    <th className="border border-blue-950 px-2 py-2 text-left">
                                        Subject
                                    </th>
                                    <th className="border border-blue-950 px-2 py-2 text-center">
                                        Marks
                                    </th>
                                    <th className="border border-blue-950 px-2 py-2 text-center">
                                        Position
                                    </th>
                                    <th className="border border-blue-950 px-2 py-2 text-center">
                                        Grade
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {results.map((item) => (
                                    <tr key={item.name}>
                                        <td className="border border-slate-300 px-2 py-2 font-semibold text-slate-800">
                                            {item.name}
                                        </td>

                                        <td className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-900">
                                            {item.mark === null
                                                ? "-"
                                                : item.mark}
                                        </td>

                                        <td className="border border-slate-300 px-2 py-2 text-center text-slate-700">
                                            {item.position ?? "-"}
                                        </td>

                                        <td className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-900">
                                            {item.grade}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg bg-blue-950 text-center text-white">
                        <div className="border-r border-white/20 p-3">
                            <p className="text-[10px] font-medium text-blue-200">
                                TOTAL SCORE
                            </p>
                            <p className="mt-1 text-lg font-extrabold">
                                {total}/{maximum}
                            </p>
                        </div>

                        <div className="border-r border-white/20 p-3">
                            <p className="text-[10px] font-medium text-blue-200">
                                AVERAGE
                            </p>
                            <p className="mt-1 text-lg font-extrabold">
                                {average.toFixed(1)}%
                            </p>
                        </div>

                        <div className="p-3">
                            <p className="text-[10px] font-medium text-blue-200">
                                OVERALL GRADE
                            </p>
                            <p className="mt-1 text-lg font-extrabold">
                                {grade}
                            </p>
                        </div>
                    </section>

                    <section className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-300 p-3 text-xs">
                        <div>
                            <p className="text-slate-500">Pass Mark</p>
                            <p className="mt-1 font-bold text-slate-900">
                                {passMark}
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-slate-500">
                                Qualification Status
                            </p>
                            <p
                                className={`mt-1 font-extrabold ${
                                    qualified
                                        ? "text-blue-900"
                                        : "text-red-700"
                                }`}
                            >
                                {qualified
                                    ? "QUALIFIED"
                                    : "NOT QUALIFIED"}
                            </p>
                        </div>
                    </section>

                    <section className="mt-4">
                        <h3 className="mb-2 text-xs font-extrabold uppercase text-blue-950">
                            Grading Key
                        </h3>

                        <div className="grid grid-cols-3 gap-2 text-[10px] sm:grid-cols-6">
                            {[
                                ["A", "80–100"],
                                ["B", "70–79"],
                                ["C", "60–69"],
                                ["D", "45–59"],
                                ["E", "35–44"],
                                ["F", "0–34"],
                            ].map(([letter, range]) => (
                                <div
                                    key={letter}
                                    className="rounded border border-slate-200 px-2 py-2 text-center"
                                >
                                    <p className="font-extrabold text-blue-950">
                                        {letter}
                                    </p>
                                    <p className="mt-0.5 text-slate-500">
                                        {range}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {profileFields.length > 0 && (
                        <section className="mt-4 border-t border-slate-300 pt-3">
                            <h3 className="mb-2 text-xs font-extrabold uppercase text-blue-950">
                                Student Information
                            </h3>

                            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                {profileFields.map((field) => (
                                    <div key={field.label}>
                                        <p className="text-slate-500">
                                            {field.label}
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900">
                                            {String(field.value)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-300 pt-4 text-center text-[10px]">
                        <div>
                            <div className="mb-7 border-b border-slate-500" />
                            <p className="font-bold text-slate-800">
                                Class Teacher
                            </p>
                        </div>

                        <div>
                            <div className="mb-7 border-b border-slate-500" />
                            <p className="font-bold text-slate-800">
                                Headteacher
                            </p>
                        </div>

                        <div>
                            <div className="mb-7 border-b border-slate-500" />
                            <p className="font-bold text-slate-800">
                                Parent / Guardian
                            </p>
                        </div>
                    </section>

                    <footer className="mt-5 border-t border-slate-300 pt-2 text-center text-[9px] text-slate-500">
                        Generated by Easeway School Management
                    </footer>
                </div>
            </article>
        </main>
    );
}
