
"use client";

import useApp from "@/lib/useApp";
import { useEffect, useMemo, useRef, useState } from "react";
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
    remark: string;
};

const SUBJECTS: Record<"JHS" | "PRIMARY", string[]> = {
    JHS: [
        "English",
        "Mathematics",
        "Science",
        "Computing",
        "Social Studies",
        "Creative Arts",
        "Career Technology",
        "RME",
        "Fante/twi",
    ],

    PRIMARY: [
        "English",
        "Mathematics",
        "Science",
        "Computing",
        "Creative Arts",
        "RME",
        "HIstory",
        "Fante/twi",
    ],
};

const GRADE_SCALE = [
    { min: 80, max: 100, grade: "A", description: "EXCELLENT" },
    { min: 70, max: 79, grade: "B", description: "VERY GOOD" },
    { min: 60, max: 69, grade: "C", description: "GOOD" },
    { min: 45, max: 59, grade: "D", description: "CREDIT" },
    { min: 35, max: 44, grade: "E", description: "PASS" },
    { min: 0, max: 34, grade: "F", description: "FAIL" },
];

const SUBJECT_ALIASES: Record<string, string[]> = {
    English: ["english", "english language"],
    Mathematics: ["mathematics", "maths", "math"],
    Science: ["science", "integrated science"],

    Computing: [
        "computing",
        "ict",
        "information communication technology",
    ],

    "Social Studies": [
        "social studies",
        "social_studies",
        "social studies education",
    ],

    "Creative Arts": [
        "creative arts",
        "creative_arts",
        "creative arts and design",
        "creative arts design",
    ],

    "Career Technology": [
        "career technology",
        "career_technology",
        "career tech",
        "career technology education",
    ],

    RME: ["rme", "religious and moral education"],
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

function getGrade(mark: number | null) {
    if (mark === null || !Number.isFinite(mark)) return "—";

    if (mark >= 80) return "A";
    if (mark >= 70) return "B";
    if (mark >= 60) return "C";
    if (mark >= 45) return "D";
    if (mark >= 35) return "E";

    return "F";
}

function getGradeColor(grade: string) {
    switch (grade) {
        case "A":
            return "text-blue-800";
        case "B":
            return "text-blue-700";
        case "C":
            return "text-slate-700";
        case "D":
            return "text-amber-700";
        case "E":
            return "text-orange-700";
        default:
            return "text-red-600";
    }
}

function getRemark(mark: number | null) {
    if (mark === null || !Number.isFinite(mark)) {
        return "Not Graded";
    }

    if (mark >= 80) return "Excellent";
    if (mark >= 70) return "Very Good";
    if (mark >= 60) return "Good";
    if (mark >= 45) return "Credit";
    if (mark >= 35) return "Pass";

    return "Fail";
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

    const aliases =
        SUBJECT_ALIASES[subject] ?? [normalize(subject)];

    const normalizedAliases = aliases.map(normalize);

    const sources = [
        student?.[relationKey],
        student?.[dataKey],
    ];

    for (const source of sources) {
        if (!source) continue;

        const records = Array.isArray(source)
            ? source
            : [source];

        for (const record of records) {
            if (!record || typeof record !== "object") {
                continue;
            }

            const recordSubject = normalize(
                getSubjectName(record)
            );

            if (
                recordSubject &&
                normalizedAliases.includes(recordSubject)
            ) {
                const score = getScore(record);

                if (score !== null) return score;
            }

            for (const [key, value] of Object.entries(record)) {
                if (
                    !normalizedAliases.includes(normalize(key))
                ) {
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
                    const nestedScore = getScore(
                        value as DataRecord
                    );

                    if (nestedScore !== null) {
                        return nestedScore;
                    }
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
            ? student.primary_student_data ??
              student.primary_student_info
            : student.jhs_student_data ??
              student.jhs_student_info;

    if (Array.isArray(value)) {
        return value[0] ?? {};
    }

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

function getSubjectPosition(
    student: DataRecord,
    students: DataRecord[],
    method: "JHS" | "PRIMARY",
    subject: string
): number | null {
    const studentMark = getSubjectMark(
        student,
        method,
        subject
    );

    if (studentMark === null) return null;

    const sortedStudents = students
        .map((item) => ({
            mark: getSubjectMark(item, method, subject),
        }))
        .filter(
            (
                item
            ): item is {
                mark: number;
            } => item.mark !== null
        )
        .sort((a, b) => b.mark - a.mark);

    const position = sortedStudents.findIndex(
        (item) => item.mark === studentMark
    );

    return position === -1 ? null : position + 1;
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

    const { setSearching } = useApp();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const reportPaperRef = useRef<HTMLElement | null>(null);
    const autoPrintStarted = useRef(false);

    useEffect(() => {
        setSearching(false);

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
    }, [projectId, studentId, setSearching]);

    const report = useMemo(() => {
        if (!storedData) return null;

        const project = storedData.project;

        const method = getMethod(project);

        const subjects = SUBJECTS[method];

        const students: DataRecord[] = Array.isArray(
            project.students
        )
            ? project.students
            : [];

        const student = students.find(
            (item) => String(item.id) === String(studentId)
        );

        if (!student) return null;

        const results: SubjectResult[] = subjects.map(
            (subject) => {
                const mark = getSubjectMark(
                    student,
                    method,
                    subject
                );

                return {
                    name: subject,
                    mark,
                    position: getSubjectPosition(
                        student,
                        students,
                        method,
                        subject
                    ),
                    grade: getGrade(mark),
                    remark: getRemark(mark),
                };
            }
        );

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
            projectStudentCount: students.length,
            passMark,
            qualified: markedSubjects > 0 && total >= passMark,
            overallRemark: getRemark(
                markedSubjects > 0 ? average : null
            ),
            school: project.school_data ?? {},
        };
    }, [storedData, studentId]);

    useEffect(() => {
        if (
            loading ||
            error ||
            !report ||
            !reportPaperRef.current ||
            autoPrintStarted.current
        ) {
            return;
        }

        let cancelled = false;

        const printWhenReady = async () => {
            try {
                await document.fonts.ready;

                const images = Array.from(
                    reportPaperRef.current?.querySelectorAll("img") ?? []
                );

                await Promise.all(
                    images.map(
                        (image) =>
                            new Promise<void>((resolve) => {
                                if (image.complete) {
                                    resolve();
                                    return;
                                }

                                image.addEventListener("load", () => resolve(), {
                                    once: true,
                                });
                                image.addEventListener("error", () => resolve(), {
                                    once: true,
                                });
                            })
                    )
                );

                await new Promise<void>((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => resolve());
                    });
                });

                if (cancelled || autoPrintStarted.current) return;

                autoPrintStarted.current = true;
                window.print();
            } catch (printError) {
                console.error("AUTOMATIC PRINT ERROR:", printError);

                if (!cancelled) {
                    setError(
                        "Unable to prepare your report card for printing. Please try again."
                    );
                }
            }
        };

        void printWhenReady();

        return () => {
            cancelled = true;
        };
    }, [error, loading, report]);

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
        projectStudentCount,
        passMark,
        qualified,
        overallRemark,
        school,
    } = report;

    const schoolName =
        school.school_name ??
        project.header ??
        project.name ??
        "School Name";

    const logo = String(
        school.logo_image ?? project.school_logo ?? ""
    );

    const studentName = getStudentName(student);

    const term =
        project.term ??
        project.academic_term ??
        school.term ??
        "Not specified";

    const academicYear =
        project.academic_year ?? school.academic_year ?? "";

    const reopeningDate =
        project.reopening_date ??
        project.re_opening_date ??
        project.reopen_date ??
        school.reopening_date ??
        school.re_opening_date;

    const vacationDate =
        project.vacation_date ??
        project.vacation ??
        school.vacation_date;

    const region =
        school.location ?? project.location ?? "Not specified";

    const attendance = studentInfo.attendance;
    const attitude =
        studentInfo.attitude ?? studentInfo.behaviour;
    const interest = studentInfo.interest;

    const teacherRemark =
        studentInfo.teacher_remark ??
        studentInfo.class_teacher_remark ??
        studentInfo.remarks ??
        student.teacher_remark ??
        "";

    const headTeacherRemark =
        studentInfo.head_teacher_remark ??
        student.head_teacher_remark ??
        "";

    const profileFields = [
        {
            label: "Age",
            value: studentInfo.age ?? student.age,
        },
        {
            label: "House",
            value:
                studentInfo.house ??
                studentInfo.house_name ??
                student.house ??
                student.house_name,
        },
        {
            label: "Guardian",
            value:
                studentInfo.guardian ??
                studentInfo.guardian_name ??
                studentInfo.parent_name,
        },
        {
            label: "Guardian Contact",
            value:
                studentInfo.guardian_contact ??
                studentInfo.guardian_phone ??
                studentInfo.parent_phone ??
                student.phone,
        },
    ].filter(
        (item) =>
            item.value !== null &&
            item.value !== undefined &&
            item.value !== ""
    );

    return (
        <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6">
            <style jsx global>{`
                /*
                 * PRINT SETTINGS
                 *
                 * The report is placed on one A4 page.
                 * It is absolutely positioned instead of fixed,
                 * because fixed elements can repeat on every page.
                 */

                @page {
                    size: A4 portrait;
                    margin: 0;
                }

                @media print {
                    html,
                    body {
                        width: 210mm !important;
                        height: 297mm !important;
                        min-height: 297mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /*
                     * Hide the complete website, including
                     * navigation, headers and surrounding layout.
                     */
                    body * {
                        visibility: hidden !important;
                    }

                    /*
                     * Make only the report card visible.
                     */
                    .report-paper,
                    .report-paper * {
                        visibility: visible !important;
                    }

                    /*
                     * One-page A4 layout.
                     *
                     * 244.2mm x 345.35mm is scaled by 0.86,
                     * giving an effective size of approximately
                     * 210mm x 297mm.
                     *
                     * This gives the card more layout room before
                     * scaling it down to the physical A4 page.
                     */
                    .report-paper {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;

                        width: 244.2mm !important;
                        height: 345.35mm !important;

                        max-width: none !important;
                        min-width: 0 !important;
                        min-height: 0 !important;

                        box-sizing: border-box !important;
                        margin: 0 !important;
                        padding: 5mm !important;

                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;

                        overflow: hidden !important;

                        zoom: 0.86 !important;

                        break-before: avoid !important;
                        break-after: avoid !important;
                        break-inside: avoid !important;
                        page-break-before: avoid !important;
                        page-break-after: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    /*
                     * Never print the Back or Print buttons.
                     */
                    .no-print {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    /*
                     * Keep the report's colors and backgrounds.
                     */
                    .report-paper,
                    .report-paper * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /*
                     * Prevent table rows and sections from
                     * splitting during printing.
                     */
                    .report-paper table,
                    .report-paper thead,
                    .report-paper tbody,
                    .report-paper tr,
                    .report-paper section,
                    .report-paper header,
                    .report-paper footer {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    /*
                     * Remove screen-only horizontal scrolling.
                     */
                    .report-paper .overflow-x-auto {
                        overflow: visible !important;
                    }
                }
            `}</style>

            {/* Navigation and print controls */}
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

            {/* Report card */}
            {/* <article
                ref={reportPaperRef}
                className="report-paper relative mx-auto box-border flex h-[345.35mm] w-[244.2mm] flex-col overflow-hidden bg-white p-[5mm] text-slate-900"
                style={{
                    fontFamily: "Arial, sans-serif",
                    printColorAdjust: "exact",
                    WebkitPrintColorAdjust: "exact",
                }}
            >
                <div className="pointer-events-none absolute inset-[3mm] border-2 border-blue-950/80" />

                {logo && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <img
                            src={logo}
                            alt=""
                            crossOrigin="anonymous"
                            className="h-[105mm] w-[105mm] rounded-full object-contain opacity-[0.06]"
                        />
                    </div>
                )}

                <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                    <header className="shrink-0 border-b-2 border-blue-950 pb-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                            {logo ? (
                                <img
                                    src={logo}
                                    alt="School logo"
                                    crossOrigin="anonymous"
                                    className="h-[22mm] w-[22mm] shrink-0 rounded-full border border-slate-200 bg-white object-cover"
                                />
                            ) : (
                                <div className="flex h-[22mm] w-[22mm] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-blue-950">
                                    <GraduationCap size={38} />
                                </div>
                            )}

                            <div className="min-w-0 flex-1">
                                <h1 className="break-words text-[22px] font-extrabold uppercase tracking-wide text-blue-950">
                                    {schoolName}
                                </h1>

                                {region && (
                                    <p className="mt-1 text-[11px] text-slate-600">
                                        {region}
                                    </p>
                                )}

                                <div className="mt-3 inline-block rounded-md bg-blue-950 px-10 py-2 text-white">
                                    <h2 className="text-[15px] font-extrabold uppercase tracking-[0.2em]">
                                        Terminal Report
                                    </h2>
                                </div>

                                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                                    {method === "PRIMARY"
                                        ? "Primary School"
                                        : "Junior High School"}
                                </p>
                            </div>

                            {logo ? (
                                <img
                                    src={logo}
                                    alt="School logo"
                                    crossOrigin="anonymous"
                                    className="h-[22mm] w-[22mm] shrink-0 rounded-full border border-slate-200 bg-white object-cover"
                                />
                            ) : (
                                <div className="h-[22mm] w-[22mm]" />
                            )}
                        </div>
                    </header>

                    <section className="mt-4 grid grid-cols-4 gap-3 border-b border-slate-300 pb-3 text-[11px]">
                        <div>
                            <p className="text-slate-500">Term</p>
                            <p className="font-bold text-slate-900">
                                {term}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Academic Year</p>
                            <p className="font-bold text-slate-900">
                                {academicYear ||
                                    (vacationDate
                                        ? new Date(
                                              String(vacationDate)
                                          ).getFullYear()
                                        : "Not specified")}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Reopening Date</p>
                            <p className="font-bold text-slate-900">
                                {formatDate(reopeningDate)}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Vacation Date</p>
                            <p className="font-bold text-slate-900">
                                {formatDate(vacationDate)}
                            </p>
                        </div>
                    </section>

                    <section className="mt-4 grid grid-cols-4 gap-3 rounded-lg border border-slate-300 p-3 text-[11px]">
                        <div className="col-span-2">
                            <p className="text-slate-500">Student Name</p>
                            <p className="mt-1 font-extrabold uppercase text-slate-950">
                                {studentName}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Overall Position</p>
                            <p className="mt-1 font-extrabold text-blue-950">
                                {ordinal(overallPosition)} of {projectStudentCount}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Assessment</p>
                            <p className="mt-1 font-bold text-slate-900">
                                Terminal Assessment
                            </p>
                        </div>
                    </section>

                    <section className="mt-5 shrink-0">
                        <h3 className="mb-2 text-center text-sm font-extrabold uppercase tracking-wider text-blue-950">
                            Academic Performance
                        </h3>

                        <table className="w-full border-collapse text-[11px]">
                            <thead>
                                <tr className="bg-blue-950 text-white">
                                    <th className="border border-blue-950 px-3 py-2 text-left">
                                        Subject
                                    </th>

                                    <th className="border border-blue-800 px-2 py-2 text-center">
                                        Marks
                                    </th>

                                    <th className="border border-blue-800 px-2 py-2 text-center">
                                        Position
                                    </th>

                                    <th className="border border-blue-800 px-2 py-2 text-center">
                                        Grade
                                    </th>

                                    <th className="border border-blue-800 px-2 py-2 text-center">
                                        Remarks
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {results.map((item) => (
                                    <tr key={item.name}>
                                        <td className="border border-slate-300 px-3 py-[7px] font-semibold text-slate-800">
                                            {item.name}
                                        </td>

                                        <td className="border border-slate-300 px-2 py-[7px] text-center font-bold text-slate-900">
                                            {item.mark ?? "—"}
                                        </td>

                                        <td className="border border-slate-300 px-2 py-[7px] text-center text-slate-700">
                                            {item.position !== null
                                                ? ordinal(item.position)
                                                : "-"}
                                        </td>

                                        <td
                                            className={`border border-slate-300 px-2 py-[7px] text-center font-bold ${getGradeColor(item.grade)}`}
                                        >
                                            {item.grade}
                                        </td>

                                        <td className="border border-slate-300 px-2 py-[7px] text-center font-semibold text-slate-700">
                                            {item.remark}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-center">
                        <div className="border-r border-slate-200 p-3">
                            <p className="text-[10px] font-semibold text-slate-500">
                                TOTAL SCORE
                            </p>

                            <p className="mt-1 text-lg font-extrabold">
                                {total}/{maximum}
                            </p>
                        </div>

                        <div className="border-r border-slate-200 p-3">
                            <p className="text-[10px] font-semibold text-slate-500">
                                AVERAGE
                            </p>

                            <p className="mt-1 text-lg font-extrabold">
                                {average.toFixed(1)}%
                            </p>
                        </div>

                        <div className="p-3">
                            <p className="text-[10px] font-semibold text-slate-500">
                                OVERALL REMARK
                            </p>

                            <p className="mt-1 text-base font-extrabold">
                                {overallRemark}
                            </p>
                        </div>
                    </section>

                    <section className="mt-3 flex items-center justify-between rounded-lg border-2 border-blue-950 p-3 text-[11px]">
                        <div>
                            <p className="font-bold uppercase text-blue-950">
                                Project Qualification
                            </p>
                            <p className="mt-1 text-slate-500">
                                Required pass mark: {passMark}
                            </p>
                        </div>

                        <span
                            className={`rounded px-4 py-2 font-extrabold uppercase tracking-wider text-white ${
                                qualified ? "bg-blue-950" : "bg-red-600"
                            }`}
                        >
                            {qualified ? "QUALIFIED" : "NOT QUALIFIED"}
                        </span>
                    </section>

                    <section className="mt-4 grid grid-cols-2 gap-4">
                        <div className="rounded-lg border border-slate-300 p-3">
                            <h3 className="mb-2 inline-block rounded bg-blue-950 px-3 py-1 text-[10px] font-bold uppercase text-white">
                                Grading Key
                            </h3>

                            <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-[10px]">
                                {GRADE_SCALE.map((item) => (
                                    <div
                                        key={item.grade}
                                        className="flex justify-between gap-2 border-b border-slate-100 py-1"
                                    >
                                        <span>
                                            {item.min}–{item.max}
                                        </span>
                                        <span className="font-semibold">
                                            {item.grade} - {item.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-300 p-3">
                            <h3 className="mb-2 inline-block rounded bg-blue-950 px-3 py-1 text-[10px] font-bold uppercase text-white">
                                Other Areas of Assessment
                            </h3>

                            <div className="space-y-2 text-[10px]">
                                <div className="grid grid-cols-[125px_10px_1fr]">
                                    <span className="font-semibold uppercase">
                                        Attendance
                                    </span>
                                    <span>:</span>
                                    <span>
                                        {attendance ?? "Not recorded"}
                                        {attendance !== null &&
                                        attendance !== undefined &&
                                        !String(attendance).includes("%")
                                            ? "%"
                                            : ""}
                                    </span>
                                </div>

                                <div className="grid grid-cols-[125px_10px_1fr]">
                                    <span className="font-semibold uppercase">
                                        Attitude / Behaviour
                                    </span>
                                    <span>:</span>
                                    <span className="uppercase">
                                        {attitude ?? "Not recorded"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-[125px_10px_1fr]">
                                    <span className="font-semibold uppercase">
                                        Interest
                                    </span>
                                    <span>:</span>
                                    <span className="uppercase">
                                        {Array.isArray(interest)
                                            ? interest.join(", ")
                                            : interest ?? "Not recorded"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-[125px_10px_1fr]">
                                    <span className="font-semibold uppercase">
                                        Vacation Date
                                    </span>
                                    <span>:</span>
                                    <span>{formatDate(vacationDate)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {profileFields.length > 0 && (
                        <section className="mt-4 rounded-lg border border-slate-300 p-3">
                            <h3 className="mb-2 text-[10px] font-extrabold uppercase text-blue-950">
                                Student Information
                            </h3>

                            <div className="grid grid-cols-4 gap-3 text-[10px]">
                                {profileFields.map((field) => (
                                    <div key={field.label}>
                                        <p className="font-semibold text-slate-500">
                                            {field.label}
                                        </p>

                                        <p className="mt-1 font-bold text-slate-900">
                                            {String(field.value)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {(teacherRemark || headTeacherRemark) && (
                        <section className="mt-4 grid grid-cols-2 gap-3 text-[10px]">
                            <div className="rounded-lg border border-slate-300 p-3">
                                <p className="mb-1 font-bold uppercase text-blue-950">
                                    Class Teacher&apos;s Remark
                                </p>
                                <p className="min-h-[28px]">
                                    {teacherRemark || " "}
                                </p>
                            </div>

                            <div className="rounded-lg border border-slate-300 p-3">
                                <p className="mb-1 font-bold uppercase text-blue-950">
                                    Head Teacher&apos;s Remark
                                </p>
                                <p className="min-h-[28px]">
                                    {headTeacherRemark || " "}
                                </p>
                            </div>
                        </section>
                    )}

                    <section className="mt-auto grid grid-cols-3 gap-8 px-5 pb-2 pt-8 text-center text-[10px]">
                        <div className="border-t border-slate-500 pt-2 font-semibold">
                            Class Teacher&apos;s Signature
                        </div>
                        <div className="border-t border-slate-500 pt-2 font-semibold">
                            Head Teacher&apos;s Signature
                        </div>
                        <div className="border-t border-slate-500 pt-2 font-semibold">
                            Parent / Guardian
                        </div>
                    </section>

                    <footer className="shrink-0 border-t border-blue-200 pt-2 text-center text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                        Generated by Easeway School Management
                    </footer>
                </div>
            </article>
        </main>
    );
}
