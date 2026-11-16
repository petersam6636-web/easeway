
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useApp from "@/lib/useApp";
import ProjectLoading from "@/component/Loading";

import {
    FileText,
    GraduationCap,
    Download,
    Users,
    Printer,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

// Supabase returns related records with different
// structures depending on the project method.
//
// This type is used at the data boundary because
// the related database records are dynamically shaped.
type DataRecord = Record<string, any>;

type SubjectMark = {
    key: string;
    name: string;
    mark: number;
};

type ReportSubject = SubjectMark & {
    position: number | null;
    grade: string;
};

type Student = DataRecord;
type Project = DataRecord;

type StudentRanking = Map<Student, number>;

type SubjectRankings = Record<string, StudentRanking>;

type TerminalReport = {
    project: Project;
    school: DataRecord;
    student: Student;
    studentInfo: DataRecord;
    subjects: ReportSubject[];
    total: number;
    maximum: number;
    average: number;
    overallGrade: string;
    overallPosition: number;
    projectStudentCount: number;
};

// ==========================================
// SUBJECT CONFIGURATION
// ==========================================

const SUBJECT_NAMES: Record<string, string> = {
    english: "English Language",
    science: "Integrated Science",
    mathematics: "Mathematics",
    history: "History",
    computing: "Computing",
    creative_arts: "Creative Arts",
    career_technology: "Career Technology",
    rme: "Religious and Moral Education",
    "fante/twi": "Ghanaian Language",
};

const SUBJECT_ORDER: string[] = [
    "english",
    "mathematics",
    "science",
    "computing",
    "history",
    "career_technology",
    "creative_arts",
    "rme",
    "fante/twi",
];

// ==========================================
// GRADING SYSTEM
// ==========================================

const GRADE_SCALE = [
    { min: 80, max: 100, grade: "A", description: "EXCELLENT" },
    { min: 70, max: 79, grade: "B", description: "VERY GOOD" },
    { min: 60, max: 69, grade: "C", description: "GOOD" },
    { min: 45, max: 59, grade: "D", description: "CREDIT" },
    { min: 35, max: 44, grade: "E", description: "PASS" },
    { min: 0, max: 34, grade: "F", description: "FAIL" },
] as const;

function getGrade(mark: number): string {
    return (
        GRADE_SCALE.find(
            (item) => mark >= item.min && mark <= item.max
        )?.grade ?? "F"
    );
}

function getGradeColor(grade: string): string {
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

// ==========================================
// GENERAL HELPERS
// ==========================================

function formatDate(value: unknown): string {
    if (!value) return "Not specified";

    const date = new Date(value as string | number);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function ordinal(value: number): string {
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

function getStudentIdentity(
    student: Student,
    index = 0
): string {
    const identity =
        student.id ??
        student.student_id ??
        student.admission_number ??
        student.full_name ??
        student.name ??
        `student-${index}`;

    return String(identity).trim().toLowerCase();
}

// ==========================================
// REMOVE DUPLICATE STUDENTS
// ==========================================

function getUniqueStudents(students: Student[]): Student[] {
    const uniqueStudents = new Map<string, Student>();

    students.forEach((student, index) => {
        const identity = getStudentIdentity(student, index);

        if (!uniqueStudents.has(identity)) {
            uniqueStudents.set(identity, student);
        }
    });

    return Array.from(uniqueStudents.values());
}

// ==========================================
// STUDENT INFORMATION
// ==========================================

function getStudentInfo(
    student: Student,
    method: string
): DataRecord {
    if (method.toLowerCase() === "primary") {
        return (
            student.primary_student_data ??
            student.jhs_student_data ??
            {}
        );
    }

    return (
        student.jhs_student_data ??
        student.primary_student_data ??
        {}
    );
}

// ==========================================
// GET STUDENT SUBJECT DATA
// ==========================================

function getStudentSubjects(
    student: Student,
    method: string
): Record<string, unknown> {
    const subjects =
        method.toLowerCase() === "primary"
            ? student.primary_subjects
            : student.jhs_subjects;

    if (!Array.isArray(subjects)) {
        return {};
    }

    const result: Record<string, unknown> = {};

    subjects.forEach((subject: unknown) => {
        if (
            subject &&
            typeof subject === "object" &&
            !Array.isArray(subject)
        ) {
            Object.assign(result, subject);
        }
    });

    return result;
}

// ==========================================
// GET STUDENT SUBJECT MARKS
// ==========================================

function getStudentSubjectMarks(
    student: Student,
    method: string
): SubjectMark[] {
    const subjectData = getStudentSubjects(student, method);

    return Object.entries(subjectData)
        .filter(([key, value]) => {
            return (
                key !== "id" &&
                key !== "student_id" &&
                value !== null &&
                value !== undefined &&
                value !== "" &&
                Number.isFinite(Number(value))
            );
        })
        .map(([key, value]) => ({
            key,
            name:
                SUBJECT_NAMES[key] ??
                key.replaceAll("_", " "),
            mark: Number(value),
        }))
        .sort((a, b) => {
            const aIndex = SUBJECT_ORDER.indexOf(a.key);
            const bIndex = SUBJECT_ORDER.indexOf(b.key);

            if (aIndex === -1 && bIndex === -1) {
                return a.name.localeCompare(b.name);
            }

            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;

            return aIndex - bIndex;
        });
}

// ==========================================
// CALCULATE TOTAL MARKS
// ==========================================

function getStudentTotal(
    student: Student,
    method: string
): number {
    const subjectData = getStudentSubjects(student, method);

    return Object.entries(subjectData).reduce(
        (total, [key, value]) => {
            if (
                key === "id" ||
                key === "student_id" ||
                value === null ||
                value === undefined ||
                value === "" ||
                !Number.isFinite(Number(value))
            ) {
                return total;
            }

            return total + Number(value);
        },
        0
    );
}

// ==========================================
// RANK STUDENTS IN EACH SUBJECT
// ==========================================

function getSubjectRankings(
    students: Student[],
    method: string
): SubjectRankings {
    const rankings: SubjectRankings = {};

    const subjectKeys = new Set<string>();

    // Find all available subjects.
    students.forEach((student) => {
        const subjectData = getStudentSubjects(student, method);

        Object.entries(subjectData).forEach(([key, value]) => {
            if (
                key !== "id" &&
                key !== "student_id" &&
                value !== null &&
                value !== undefined &&
                value !== "" &&
                Number.isFinite(Number(value))
            ) {
                subjectKeys.add(key);
            }
        });
    });

    // Calculate each subject independently.
    subjectKeys.forEach((subjectKey) => {
        const rankedStudents = students
            .map((student) => {
                const subjectData = getStudentSubjects(
                    student,
                    method
                );

                return {
                    student,
                    mark: subjectData[subjectKey],
                };
            })
            .filter(({ mark }) => {
                return (
                    mark !== null &&
                    mark !== undefined &&
                    mark !== "" &&
                    Number.isFinite(Number(mark))
                );
            })
            .map(({ student, mark }) => ({
                student,
                mark: Number(mark),
            }))
            .sort((a, b) => b.mark - a.mark);

        rankings[subjectKey] = new Map<Student, number>();

        rankedStudents.forEach(({ student }, index) => {
            rankings[subjectKey].set(student, index + 1);
        });
    });

    return rankings;
}

// ==========================================
// BUILD REPORTS
// ==========================================

function buildReports(projects: Project[]): TerminalReport[] {
    const reports: TerminalReport[] = [];

    projects.forEach((project) => {
        const method = String(
            project.method ?? "jhs"
        ).toLowerCase();

        const rawStudents: Student[] = Array.isArray(
            project.students
        )
            ? project.students
            : [];

        // Remove duplicate students within this project.
        const students = getUniqueStudents(rawStudents);

        const school: DataRecord = project.school_data ?? {};

        // Calculate total marks and overall rankings.
        const rankedStudents = students
            .map((student) => ({
                student,
                total: getStudentTotal(student, method),
            }))
            .sort((a, b) => b.total - a.total);

        // Calculate individual subject rankings.
        const subjectRankings = getSubjectRankings(
            students,
            method
        );

        // Build individual report cards.
        rankedStudents.forEach(({ student, total }, index) => {
            const studentInfo = getStudentInfo(student, method);

            const marks = getStudentSubjectMarks(
                student,
                method
            );

            const subjects: ReportSubject[] = marks.map(
                (subject) => ({
                    ...subject,
                    position:
                        subjectRankings[subject.key]?.get(student) ??
                        null,
                    grade: getGrade(subject.mark),
                })
            );

            const maximum = subjects.length * 100;

            const average =
                subjects.length > 0
                    ? total / subjects.length
                    : 0;

            reports.push({
                project,
                school,
                student,
                studentInfo,
                subjects,
                total,
                maximum,
                average,
                overallGrade: getGrade(average),
                overallPosition: index + 1,
                projectStudentCount: students.length,
            });
        });
    });

    return reports;
}

// ==========================================
// WAIT FOR IMAGES
// ==========================================

function waitForImage(
    img: HTMLImageElement
): Promise<void> {
    return new Promise((resolve) => {
        const finish = () => resolve();

        // Already loaded.
        if (img.complete) {
            if (typeof img.decode === "function") {
                img.decode().catch(() => {}).finally(finish);
            } else {
                finish();
            }

            return;
        }

        // Wait until the image loads or fails.
        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", finish, { once: true });
    });
}

// ==========================================
// SCHOOL LOGO
// ==========================================

function SchoolLogo({ src }: { src: string }) {
    return (
        <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-blue-900 bg-white p-1">
            {src ? (
                <img
                    src={src}
                    alt="School logo"
                    crossOrigin="anonymous"
                    className="h-full w-full rounded-full object-cover"
                />
            ) : (
                <GraduationCap
                    size={28}
                    className="text-blue-900"
                />
            )}
        </div>
    );
}

// ==========================================
// REPORT CARD
// ==========================================

function TerminalReportCard({
    report,
    cardRef,
}: {
    report: TerminalReport;
    cardRef: (element: HTMLDivElement | null) => void;
}) {
    const {
        project,
        school,
        student,
        studentInfo,
        subjects,
        total,
        maximum,
        average,
        overallGrade,
        overallPosition,
        projectStudentCount,
    } = report;

    const schoolName =
        school.school_name ??
        project.header ??
        "SCHOOL NAME";

    const schoolLogo = String(
        school.logo_image ??
        project.school_logo ??
        ""
    );

    const studentName =
        student.full_name ??
        student.name ??
        "Student";

    const studentClass =
        student.class_name ??
        student.class ??
        student.current_class ??
        student.grade ??
        "Not specified";

    const attendance = studentInfo.attendance;
    const attitude = studentInfo.attitude;
    const interest = studentInfo.interest;

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
        school.location ??
        project.location ??
        "Not specified";

    const term =
        project.term ??
        project.academic_term ??
        school.term ??
        "Not specified";

    const academicYear =
        project.academic_year ??
        school.academic_year ??
        "";

    const studentId =
        student.student_id ??
        student.admission_number ??
        student.id ??
        "Not specified";

    return (
        <div
            ref={cardRef}
            className="report-card relative mx-auto box-border flex h-[297mm] min-h-[297mm] w-[210mm] flex-col overflow-hidden bg-white p-[8mm] text-slate-900 shadow-xl"
            style={{
                fontFamily: "Arial, sans-serif",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
            }}
        >
            {/* OUTER BORDER */}

            <div className="pointer-events-none absolute inset-[3mm] rounded-md border-2 border-blue-950" />

            {/* SCHOOL WATERMARK */}

            {schoolLogo && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <img
                        src={schoolLogo}
                        alt=""
                        crossOrigin="anonymous"
                        className="h-[115mm] w-[115mm] rounded-full object-contain opacity-[0.055]"
                    />
                </div>
            )}

            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                {/* SCHOOL HEADER */}

                <header className="shrink-0 border-b-2 border-blue-950 pb-3">
                    <div className="grid grid-cols-[75px_1fr_75px] items-center gap-3">
                        <SchoolLogo src={schoolLogo} />

                        <div className="min-w-0 text-center">
                            <h1 className="break-words text-[22px] font-extrabold uppercase tracking-wide text-blue-950">
                                {schoolName}
                            </h1>

                            <p className="mt-1 inline-block bg-blue-950 px-5 py-1 text-sm font-bold uppercase tracking-wider text-white">
                                Terminal Report
                            </p>

                            {school.location && (
                                <p className="mt-1 text-[9px] font-medium text-slate-600">
                                    {school.location}
                                </p>
                            )}
                        </div>

                        <SchoolLogo src={schoolLogo} />
                    </div>

                    {/* TERM INFORMATION */}

                    <div className="mt-4 grid grid-cols-3 gap-3 text-[10px]">
                        <div className="border-r border-slate-300 px-2">
                            <p className="font-bold uppercase text-blue-950">
                                Re-opening Date
                            </p>

                            <p className="mt-1 font-semibold">
                                {formatDate(reopeningDate)}
                            </p>
                        </div>

                        <div className="border-r border-slate-300 px-2">
                            <p className="font-bold uppercase text-blue-950">
                                State / Region
                            </p>

                            <p className="mt-1 font-semibold">
                                {region}
                            </p>
                        </div>

                        <div className="px-2">
                            <p className="font-bold uppercase text-blue-950">
                                Academic Term
                            </p>

                            <p className="mt-1 font-semibold">
                                {term}
                                {academicYear && ` (${academicYear})`}
                            </p>
                        </div>
                    </div>
                </header>

                {/* STUDENT INFORMATION */}

                <section className="mt-4 shrink-0 overflow-hidden rounded-md border border-blue-900 text-[11px]">
                    <div className="grid grid-cols-[190px_1fr] border-b border-blue-300">
                        <div className="bg-blue-50 px-3 py-2 font-bold uppercase text-blue-950">
                            Student Name
                        </div>

                        <div className="px-3 py-2 font-bold uppercase">
                            {studentName}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-blue-300">
                        <div className="px-3 py-2">
                            <span className="font-bold text-blue-950">
                                Student ID:
                            </span>{" "}
                            {studentId}
                        </div>

                        <div className="px-3 py-2">
                            <span className="font-bold text-blue-950">
                                Class:
                            </span>{" "}
                            {studentClass}
                        </div>

                        <div className="px-3 py-2">
                            <span className="font-bold text-blue-950">
                                Overall Position:
                            </span>{" "}
                            {ordinal(overallPosition)} of {projectStudentCount}
                        </div>
                    </div>
                </section>

                {/* SUBJECT PERFORMANCE */}

                <section className="mt-5 shrink-0">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-sm font-extrabold uppercase tracking-wide text-blue-950">
                            Academic Performance
                        </h2>

                        <span className="text-[9px] font-semibold text-slate-500">
                            SUBJECT RESULTS
                        </span>
                    </div>

                    <table className="w-full border-collapse text-[10px]">
                        <thead>
                            <tr className="bg-blue-950 text-white">
                                <th className="w-[43%] border border-blue-950 px-3 py-3 text-left uppercase">
                                    Subject
                                </th>

                                <th className="w-[19%] border border-blue-800 px-2 py-3 text-center uppercase">
                                    Marks Obtained
                                </th>

                                <th className="w-[18%] border border-blue-800 px-2 py-3 text-center uppercase">
                                    Position
                                </th>

                                <th className="w-[20%] border border-blue-800 px-2 py-3 text-center uppercase">
                                    Grade
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {subjects.map((subject) => (
                                <tr key={subject.key}>
                                    <td className="border border-slate-300 px-3 py-[8px] font-semibold uppercase">
                                        {subject.name}
                                    </td>

                                    <td className="border border-slate-300 px-2 py-[8px] text-center font-semibold">
                                        {subject.mark}
                                    </td>

                                    <td className="border border-slate-300 px-2 py-[8px] text-center">
                                        {subject.position !== null
                                            ? ordinal(subject.position)
                                            : "—"}
                                    </td>

                                    <td className={`border border-slate-300 px-2 py-[8px] text-center font-bold ${getGradeColor(subject.grade)}`}>
                                        {subject.grade}
                                    </td>
                                </tr>
                            ))}

                            {subjects.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="border border-slate-300 px-3 py-8 text-center text-slate-500"
                                    >
                                        No subject scores available.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                        <tfoot>
                            <tr className="bg-blue-950 font-bold text-white">
                                <td className="border border-blue-950 px-3 py-3 uppercase">
                                    Total
                                </td>

                                <td className="border border-blue-800 px-2 py-3 text-center">
                                    {total}/{maximum}
                                </td>

                                <td className="border border-blue-800 px-2 py-3 text-center">
                                    {subjects.length > 0
                                        ? `${average.toFixed(1)}%`
                                        : "—"}
                                </td>

                                <td className="border border-blue-800 px-2 py-3 text-center">
                                    {subjects.length > 0
                                        ? overallGrade
                                        : "—"}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </section>

                {/* ASSESSMENT INFORMATION */}

                <section className="mt-5 grid shrink-0 grid-cols-[0.8fr_1.5fr] gap-4">
                    {/* GRADE KEY */}

                    <div className="rounded-md border border-slate-400 p-3">
                        <h3 className="mb-2 inline-block rounded bg-blue-950 px-3 py-1 text-[11px] font-bold uppercase text-white">
                            Grade Key
                        </h3>

                        {GRADE_SCALE.map((item) => (
                            <div
                                key={item.grade}
                                className="flex justify-between gap-2 border-b border-slate-200 py-1 text-[9px]"
                            >
                                <span>
                                    {item.min} – {item.max}
                                </span>

                                <span className="font-semibold">
                                    {item.grade} - {item.description}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* OTHER ASSESSMENTS */}

                    <div className="rounded-md border border-blue-900 p-3">
                        <h3 className="mb-3 inline-block rounded bg-blue-950 px-3 py-1 text-[11px] font-bold uppercase text-white">
                            Other Areas of Assessment
                        </h3>

                        <div className="space-y-2 text-[10px]">
                            <div className="grid grid-cols-[145px_12px_1fr]">
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

                            <div className="grid grid-cols-[145px_12px_1fr]">
                                <span className="font-semibold uppercase">
                                    Attitude / Behaviour
                                </span>

                                <span>:</span>

                                <span className="uppercase">
                                    {attitude ?? "Not recorded"}
                                </span>
                            </div>

                            <div className="grid grid-cols-[145px_12px_1fr]">
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

                            <div className="grid grid-cols-[145px_12px_1fr]">
                                <span className="font-semibold uppercase">
                                    Vacation Date
                                </span>

                                <span>:</span>

                                <span>
                                    {formatDate(vacationDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SIGNATURES */}

                <section className="mt-auto shrink-0 pt-8">
                    <div className="grid grid-cols-4 items-end gap-3 text-center">
                        <div>
                            <div className="mb-2 border-b border-blue-950 pb-2" />

                            <p className="text-[9px] font-bold uppercase">
                                Class Teacher
                            </p>

                            <p className="mt-1 text-[8px] text-slate-500">
                                Signature
                            </p>
                        </div>

                        <div>
                            <div className="mb-2 border-b border-blue-950 pb-2" />

                            <p className="text-[9px] font-bold uppercase">
                                Head of School
                            </p>

                            <p className="mt-1 text-[8px] text-slate-500">
                                Signature
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <div className="flex h-[65px] w-[65px] flex-col items-center justify-center rounded-full border-2 border-blue-950 text-center text-[8px] font-bold uppercase text-blue-950">
                                <span>Official</span>

                                <span className="text-[11px]">
                                    Seal
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 border-b border-blue-950 pb-2" />

                            <p className="text-[9px] font-bold uppercase">
                                Parent / Guardian
                            </p>

                            <p className="mt-1 text-[8px] text-slate-500">
                                Signature
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function TerminalReportPage() {
    const {
        studentsSubject,
        studentsSubjectLoading,
    } = useApp();

    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState("");

    // Explicitly type the report card DOM references.
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    // ==========================================
    // BUILD REPORTS
    // ==========================================

    const reports = useMemo(
        () => buildReports(studentsSubject ?? []),
        [studentsSubject]
    );

    // ==========================================
    // DOWNLOAD ALL REPORT CARDS AS PDF
    // ==========================================

    const downloadAllReports = useCallback(async () => {
        if (downloading || reports.length === 0) {
            return;
        }

        setDownloading(true);
        setDownloadError("");

        try {
            const [
                { default: html2canvas },
                { jsPDF },
            ] = await Promise.all([
                import("html2canvas"),
                import("jspdf"),
            ]);

            await document.fonts.ready;

            let pdf: InstanceType<typeof jsPDF> | null = null;
            let addedPages = 0;

            for (
                let index = 0;
                index < reports.length;
                index++
            ) {
                const element = cardRefs.current[index];

                if (!element) continue;

                // Get properly typed HTML image elements.
                const images = Array.from(
                    element.querySelectorAll<HTMLImageElement>("img")
                );

                // Wait for all images before capturing.
                await Promise.all(
                    images.map((img) => waitForImage(img))
                );

                // Capture the complete A4 report card.
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: "#ffffff",
                    logging: false,
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    windowWidth: element.offsetWidth,
                    windowHeight: element.offsetHeight,
                    scrollX: 0,
                    scrollY: 0,
                });

                const imageData = canvas.toDataURL(
                    "image/jpeg",
                    0.95
                );

                if (!pdf) {
                    pdf = new jsPDF({
                        orientation: "portrait",
                        unit: "mm",
                        format: "a4",
                        compress: true,
                    });
                } else {
                    pdf.addPage("a4", "portrait");
                }

                // Every student receives exactly one A4 page.
                pdf.addImage(
                    imageData,
                    "JPEG",
                    0,
                    0,
                    210,
                    297,
                    undefined,
                    "FAST"
                );

                addedPages++;
            }

            if (!pdf || addedPages === 0) {
                throw new Error(
                    "No report cards were available to download."
                );
            }

            pdf.save("Easeway-Terminal-Report-Cards.pdf");

        } catch (error) {
            console.error("REPORT DOWNLOAD ERROR:", error);

            setDownloadError(
                "Unable to download the report cards. Please try again. Check that html2canvas and jspdf are installed."
            );
        } finally {
            setDownloading(false);
        }
    }, [downloading, reports]);

    // ==========================================
    // PRINT REPORT CARDS
    // ==========================================

    const printReports = () => {
        window.print();
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (studentsSubjectLoading) {
        return <ProjectLoading />;
    }

    // ==========================================
    // EMPTY STATE
    // ==========================================

    if (
        !studentsSubject ||
        studentsSubject.length === 0 ||
        reports.length === 0
    ) {
        return (
            <main className="flex min-h-[75vh] flex-col items-center justify-center px-5 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <FileText size={38} />
                </div>

                <h1 className="text-2xl font-bold text-slate-900">
                    Terminal Reports
                </h1>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                    Your students' terminal report cards will appear
                    here once you have created a project and added
                    students with their subject results.
                </p>
            </main>
        );
    }

    // ==========================================
    // PAGE UI
    // ==========================================

    return (
        <>
            {/* PRINT STYLES */}

            <style jsx global>{`
                @page {
                    size: A4 portrait;
                    margin: 0;
                }

                @media print {
                    html,
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    body * {
                        visibility: hidden;
                    }

                    .report-print-area,
                    .report-print-area * {
                        visibility: visible;
                    }

                    .report-print-area {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 210mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        overflow: visible !important;
                    }

                    .report-card {
                        width: 210mm !important;
                        min-width: 210mm !important;
                        max-width: 210mm !important;
                        height: 297mm !important;
                        min-height: 297mm !important;
                        margin: 0 !important;
                        padding: 8mm !important;
                        overflow: hidden !important;
                        box-shadow: none !important;
                        break-after: page !important;
                        page-break-after: always !important;
                    }

                    .report-card:last-child {
                        break-after: auto !important;
                        page-break-after: auto !important;
                    }

                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">

                    {/* PAGE HEADER */}

                    <div className="no-print flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <GraduationCap size={26} />
                            </div>

                            <div>
                                <h1 className="text-xl font-bold text-slate-900">
                                    Terminal Report Cards
                                </h1>

                                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                                    Generate and download professional
                                    school terminal reports for your
                                    students. Each student receives an
                                    individual A4 report card.
                                </p>
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={downloadAllReports}
                                disabled={
                                    downloading ||
                                    reports.length === 0
                                }
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {downloading ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Preparing PDF...
                                    </>
                                ) : (
                                    <>
                                        <Download size={17} />
                                        Download Report Cards
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={printReports}
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <Printer size={17} />
                                Print
                            </button>
                        </div>
                    </div>

                    {/* DOWNLOAD ERROR */}

                    {downloadError && (
                        <div className="no-print mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {downloadError}
                        </div>
                    )}

                    {/* REPORT SUMMARY */}

                    <div className="no-print mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center gap-3">
                                <Users
                                    className="text-blue-700"
                                    size={22}
                                />

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Total Students
                                    </p>

                                    <p className="text-xl font-bold text-slate-900">
                                        {reports.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center gap-3">
                                <FileText
                                    className="text-blue-700"
                                    size={22}
                                />

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Total Projects
                                    </p>

                                    <p className="text-xl font-bold text-slate-900">
                                        {studentsSubject.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* REPORT PREVIEWS */}

                    <div className="no-print mb-5 mt-8 flex flex-col gap-1">
                        <h2 className="text-lg font-bold text-slate-900">
                            Generated Report Cards
                        </h2>

                        <p className="text-sm text-slate-500">
                            Students are ranked by their total marks.
                            Subject positions are calculated separately
                            for every subject.
                        </p>
                    </div>

                    {/* ALL REPORT CARDS */}

                    <div className="report-print-area space-y-10 overflow-x-auto pb-8">
                        {reports.map((report, index) => (
                            <div
                                key={`${report.project.id}-${getStudentIdentity(report.student)}`}
                            >
                                <div className="no-print mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {report.student.full_name ??
                                                report.student.name}
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            {report.school.school_name ??
                                                report.project.header}
                                            {" · "}
                                            {report.project.method}
                                        </p>
                                    </div>

                                    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                        Overall Position{" "}
                                        {report.overallPosition}
                                        {" · "}
                                        Student {index + 1} of{" "}
                                        {reports.length}
                                    </span>
                                </div>

                                <TerminalReportCard
                                    report={report}
                                    cardRef={(element) => {
                                        cardRefs.current[index] = element;
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
