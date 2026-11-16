
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useApp from "@/lib/useApp";
import ProjectLoading from "@/component/Loading";

import {
    FileText,
    GraduationCap,
    Download,
    Users,
    BookOpen,
    School,
    FileDown,
    UserRound,
    ChevronDown,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

type DataRecord = Record<string, any>;
type Student = DataRecord;
type Project = DataRecord;

type SubjectMark = {
    key: string;
    name: string;
    mark: number;
};

type ReportSubject = SubjectMark & {
    position: number | null;
    grade: string;
};

type TerminalReport = {
    id: string;
    project: Project;
    school: DataRecord;
    student: Student;
    studentInfo: DataRecord;
    method: string;
    subjects: ReportSubject[];
    total: number;
    maximum: number;
    average: number;
    overallGrade: string;
    overallPosition: number;
    projectStudentCount: number;
};

type ProjectSubject = {
    key: string;
    name: string;
};

// ==========================================
// SUBJECT CONFIGURATION
// ==========================================

const JHS_SUBJECTS: ProjectSubject[] = [
    { key: "english", name: "English Language" },
    { key: "mathematics", name: "Mathematics" },
    { key: "science", name: "Integrated Science" },
    { key: "computing", name: "Computing" },
    { key: "social_studies", name: "Social Studies" },
    { key: "creative_arts", name: "Creative Arts" },
    { key: "career_technology", name: "Career Technology" },
    { key: "rme", name: "Religious and Moral Education" },
    { key: "fante_twi", name: "Fante / Twi" },
];

const PRIMARY_SUBJECTS: ProjectSubject[] = [
    { key: "english", name: "English Language" },
    { key: "mathematics", name: "Mathematics" },
    { key: "science", name: "Science" },
    { key: "computing", name: "Computing" },
    { key: "creative_arts", name: "Creative Arts" },
    { key: "rme", name: "Religious and Moral Education" },
    { key: "peh", name: "Physical Education and Health" },
    { key: "history", name: "History" },
    { key: "fante_twi", name: "Fante / Twi" },
];

function getProjectMethod(project: Project): string {
    return String(project?.method ?? "JHS").trim().toUpperCase();
}

function getProjectSubjects(method: string): ProjectSubject[] {
    return method === "PRIMARY" ? PRIMARY_SUBJECTS : JHS_SUBJECTS;
}

function normalizeSubjectKey(value: string): string {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function getSubjectAliases(key: string): string[] {
    const aliases: Record<string, string[]> = {
        fante_twi: ["fante_twi", "fante/twi", "fante", "twi"],
        creative_arts: ["creative_arts", "creative_arts_and_design"],
        career_technology: ["career_technology", "career_tech"],
        social_studies: ["social_studies", "social_study"],
        peh: ["peh", "physical_education", "physical_education_and_health"],
        rme: ["rme", "religious_and_moral_education"],
        english: ["english", "english_language"],
        mathematics: ["mathematics", "maths", "math"],
        science: ["science", "integrated_science"],
        computing: ["computing", "ict"],
        history: ["history"],
    };

    return aliases[key] ?? [key];
}

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

function getStudentIdentity(student: Student, index = 0): string {
    const identity =
        student.id ??
        student.student_id ??
        student.admission_number ??
        student.full_name ??
        student.name ??
        `student-${index}`;

    return String(identity).trim().toLowerCase();
}

function getProjectIdentity(project: Project, index = 0): string {
    return String(
        project.id ??
        project.project_id ??
        project.header ??
        `project-${index}`
    );
}

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

function getStudentInfo(student: Student, method: string): DataRecord {
    if (method === "PRIMARY") {
        return (
            student.primary_student_data ??
            student.primary_student_info ??
            {}
        );
    }

    return (
        student.jhs_student_data ??
        student.jhs_student_info ??
        {}
    );
}

// ==========================================
// GET THE CORRECT SUBJECT RELATION
// ==========================================

function getStudentSubjectData(
    student: Student,
    method: string
): Record<string, unknown> {
    const relation =
        method === "PRIMARY"
            ? student.primary_subjects
            : student.jhs_subjects;

    if (!relation) return {};

    if (Array.isArray(relation)) {
        const result: Record<string, unknown> = {};

        relation.forEach((subject) => {
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

    if (typeof relation === "object" && !Array.isArray(relation)) {
        return relation;
    }

    return {};
}

// ==========================================
// GET A MARK FOR ONE CONFIGURED SUBJECT
// ==========================================

function getSubjectMark(
    subjectData: Record<string, unknown>,
    subjectKey: string
): number | null {
    const aliases = getSubjectAliases(subjectKey);

    for (const [storedKey, storedValue] of Object.entries(subjectData)) {
        const normalizedStoredKey = normalizeSubjectKey(storedKey);

        const matches = aliases.some(
            (alias) =>
                normalizeSubjectKey(alias) === normalizedStoredKey
        );

        if (!matches) continue;

        if (
            storedValue === null ||
            storedValue === undefined ||
            storedValue === "" ||
            !Number.isFinite(Number(storedValue))
        ) {
            return null;
        }

        return Number(storedValue);
    }

    return null;
}

// ==========================================
// GET SUBJECT MARKS FOR A PROJECT
// ==========================================

function getStudentSubjectMarks(
    student: Student,
    method: string
): SubjectMark[] {
    const subjectData = getStudentSubjectData(student, method);
    const configuredSubjects = getProjectSubjects(method);

    return configuredSubjects
        .map((subject) => {
            const mark = getSubjectMark(subjectData, subject.key);

            if (mark === null) return null;

            return {
                key: subject.key,
                name: subject.name,
                mark,
            };
        })
        .filter((subject): subject is SubjectMark => subject !== null);
}

// ==========================================
// CALCULATE TOTAL
// ==========================================

function getStudentTotal(student: Student, method: string): number {
    return getStudentSubjectMarks(student, method).reduce(
        (total, subject) => total + subject.mark,
        0
    );
}

// ==========================================
// SUBJECT RANKINGS
// ==========================================

function getSubjectRankings(
    students: Student[],
    method: string
): Record<string, Map<Student, number>> {
    const rankings: Record<string, Map<Student, number>> = {};

    const configuredSubjects = getProjectSubjects(method);

    configuredSubjects.forEach((subject) => {
        const rankedStudents = students
            .map((student) => ({
                student,
                mark: getSubjectMark(
                    getStudentSubjectData(student, method),
                    subject.key
                ),
            }))
            .filter(
                (item): item is { student: Student; mark: number } =>
                    item.mark !== null
            )
            .sort((a, b) => b.mark - a.mark);

        rankings[subject.key] = new Map<Student, number>();

        rankedStudents.forEach(({ student }, index) => {
            rankings[subject.key].set(student, index + 1);
        });
    });

    return rankings;
}

// ==========================================
// BUILD REPORTS
// ==========================================

function buildReports(projects: Project[]): TerminalReport[] {
    const reports: TerminalReport[] = [];

    projects.forEach((project, projectIndex) => {
        const method = getProjectMethod(project);

        const rawStudents: Student[] = Array.isArray(project.students)
            ? project.students
            : [];

        const students = getUniqueStudents(rawStudents);
        const school: DataRecord = project.school_data ?? {};

        const rankedStudents = students
            .map((student) => ({
                student,
                total: getStudentTotal(student, method),
            }))
            .sort((a, b) => b.total - a.total);

        const subjectRankings = getSubjectRankings(students, method);

        rankedStudents.forEach(({ student, total }, index) => {
            const studentInfo = getStudentInfo(student, method);

            const marks = getStudentSubjectMarks(student, method);

            const subjects: ReportSubject[] = marks.map((subject) => ({
                ...subject,
                position:
                    subjectRankings[subject.key]?.get(student) ?? null,
                grade: getGrade(subject.mark),
            }));

            const maximum = subjects.length * 100;
            const average =
                subjects.length > 0 ? total / subjects.length : 0;

            const projectIdentity = getProjectIdentity(
                project,
                projectIndex
            );

            reports.push({
                id: `${projectIdentity}-${getStudentIdentity(student, index)}`,
                project,
                school,
                student,
                studentInfo,
                method,
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
// EXTRA STUDENT DETAILS
// ==========================================

function getAdditionalStudentDetails(
    student: Student,
    studentInfo: DataRecord
) {
    const possibleFields = [
        { label: "Gender", keys: ["gender", "sex"] },
        {
            label: "Date of Birth",
            keys: ["date_of_birth", "dob", "birth_date"],
            date: true,
        },
        { label: "Age", keys: ["age"] },
        { label: "House", keys: ["house", "house_name"] },
        {
            label: "Guardian",
            keys: ["guardian_name", "parent_name", "parent_guardian"],
        },
        {
            label: "Guardian Contact",
            keys: ["guardian_phone", "parent_phone", "phone", "contact"],
        },
    ];

    const details: { label: string; value: string }[] = [];

    for (const field of possibleFields) {
        let value: any = null;

        for (const key of field.keys) {
            value = studentInfo?.[key] ?? student?.[key];

            if (value !== null && value !== undefined && value !== "") {
                break;
            }
        }

        if (value === null || value === undefined || value === "") {
            continue;
        }

        if (Array.isArray(value)) {
            value = value.join(", ");
        }

        if (typeof value === "object") continue;

        details.push({
            label: field.label,
            value: field.date ? formatDate(value) : String(value),
        });
    }

    return details;
}

// ==========================================
// PROJECT PASS MARK
// ==========================================

function getProjectPassMark(project: Project): number {
    const value =
        project.passMark ??
        project.pass_mark ??
        project.passmark ??
        0;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

// ==========================================
// WAIT FOR IMAGES
// ==========================================

function waitForImage(img: HTMLImageElement): Promise<void> {
    return new Promise((resolve) => {
        const finish = () => resolve();

        if (img.complete) {
            if (typeof img.decode === "function") {
                img.decode().catch(() => {}).finally(finish);
            } else {
                finish();
            }

            return;
        }

        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", finish, { once: true });
    });
}

// ==========================================
// SCHOOL LOGO
// ==========================================

function SchoolLogo({ src }: { src: string }) {
    return (
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-blue-900 bg-white p-1">
            {src ? (
                <img
                    src={src}
                    alt="School logo"
                    crossOrigin="anonymous"
                    className="h-full w-full rounded-full object-cover"
                />
            ) : (
                <GraduationCap size={24} className="text-blue-900" />
            )}
        </div>
    );
}

// ==========================================
// INDIVIDUAL STUDENT REPORT CARD
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
        method,
    } = report;

    const schoolName =
        school.school_name ??
        project.header ??
        project.name ??
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

    const additionalDetails = getAdditionalStudentDetails(
        student,
        studentInfo
    );

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

    return (
        <div
            ref={cardRef}
            data-report-id={report.id}
            className="report-card relative mx-auto box-border flex h-[297mm] min-h-[297mm] w-[210mm] flex-col overflow-hidden bg-white p-[5mm] text-slate-900"
            style={{
                fontFamily: "Arial, sans-serif",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
            }}
        >
            <div className="pointer-events-none absolute inset-[2.5mm] rounded-md border-2 border-blue-950" />

            {schoolLogo && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <img
                        src={schoolLogo}
                        alt=""
                        crossOrigin="anonymous"
                        className="h-[85mm] w-[85mm] rounded-full object-contain opacity-[0.035]"
                    />
                </div>
            )}

            <div className="relative z-10 flex min-h-0 flex-1 flex-col">

                {/* SCHOOL HEADER */}

                <header className="shrink-0 border-b-2 border-blue-950 pb-1.5">
                    <div className="grid grid-cols-[55px_1fr_55px] items-center gap-2">
                        <SchoolLogo src={schoolLogo} />

                        <div className="min-w-0 text-center">
                            <h1 className="break-words text-[17px] font-extrabold uppercase tracking-wide text-blue-950">
                                {schoolName}
                            </h1>

                            <p className="mt-0.5 inline-block rounded bg-blue-950 px-4 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                Terminal Report
                            </p>

                            <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-wider text-slate-500">
                                {method === "PRIMARY"
                                    ? "Primary School"
                                    : "Junior High School"}
                            </p>
                        </div>

                        <SchoolLogo src={schoolLogo} />
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2 text-[8px]">
                        <div className="border-r border-slate-300 px-2">
                            <p className="font-bold uppercase text-blue-950">
                                Re-opening Date
                            </p>
                            <p className="mt-0.5 font-semibold">
                                {formatDate(reopeningDate)}
                            </p>
                        </div>

                        <div className="border-r border-slate-300 px-2">
                            <p className="font-bold uppercase text-blue-950">
                                State / Region
                            </p>
                            <p className="mt-0.5 font-semibold">{region}</p>
                        </div>

                        <div className="px-2">
                            <p className="font-bold uppercase text-blue-950">
                                Academic Term
                            </p>
                            <p className="mt-0.5 font-semibold">
                                {term}
                                {academicYear && ` (${academicYear})`}
                            </p>
                        </div>
                    </div>
                </header>

                {/* STUDENT INFORMATION */}

                <section className="mt-2 shrink-0 overflow-hidden rounded-md border border-blue-900 text-[8px]">
                    <div className="grid grid-cols-[120px_1fr] border-b border-blue-300">
                        <div className="bg-blue-50 px-2.5 py-1.5 font-bold uppercase text-blue-950">
                            Student Name
                        </div>
                        <div className="px-2.5 py-1.5 font-bold uppercase">
                            {studentName}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-blue-300">
                        <div className="px-2.5 py-1.5">
                            <span className="font-bold text-blue-950">
                                Student ID:
                            </span>{" "}
                            {studentId}
                        </div>

                        <div className="px-2.5 py-1.5">
                            <span className="font-bold text-blue-950">
                                Class:
                            </span>{" "}
                            {studentClass}
                        </div>

                        <div className="px-2.5 py-1.5">
                            <span className="font-bold text-blue-950">
                                Position:
                            </span>{" "}
                            {ordinal(overallPosition)} of {projectStudentCount}
                        </div>
                    </div>
                </section>

                {/* SUBJECT PERFORMANCE */}

                <section className="mt-2 shrink-0">
                    <div className="mb-1 flex items-center justify-between">
                        <h2 className="text-[10px] font-extrabold uppercase tracking-wide text-blue-950">
                            Academic Performance
                        </h2>

                        <span className="text-[7px] font-semibold text-slate-500">
                            {subjects.length} SUBJECTS
                        </span>
                    </div>

                    <table className="w-full border-collapse text-[8px]">
                        <thead>
                            <tr className="bg-blue-950 text-white">
                                <th className="w-[43%] border border-blue-950 px-2.5 py-1.5 text-left uppercase">
                                    Subject
                                </th>
                                <th className="w-[19%] border border-blue-800 px-2 py-1.5 text-center uppercase">
                                    Marks
                                </th>
                                <th className="w-[18%] border border-blue-800 px-2 py-1.5 text-center uppercase">
                                    Position
                                </th>
                                <th className="w-[20%] border border-blue-800 px-2 py-1.5 text-center uppercase">
                                    Grade
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {subjects.map((subject) => (
                                <tr key={subject.key}>
                                    <td className="border border-slate-300 px-2.5 py-1 font-semibold uppercase">
                                        {subject.name}
                                    </td>
                                    <td className="border border-slate-300 px-2 py-1 text-center font-semibold">
                                        {subject.mark}
                                    </td>
                                    <td className="border border-slate-300 px-2 py-1 text-center">
                                        {subject.position !== null
                                            ? ordinal(subject.position)
                                            : "—"}
                                    </td>
                                    <td className={`border border-slate-300 px-2 py-1 text-center font-bold ${getGradeColor(subject.grade)}`}>
                                        {subject.grade}
                                    </td>
                                </tr>
                            ))}

                            {subjects.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="border border-slate-300 px-2 py-3 text-center text-slate-500"
                                    >
                                        No subject scores available.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                        <tfoot>
                            <tr className="bg-blue-950 font-bold text-white">
                                <td className="border border-blue-950 px-2.5 py-1.5 uppercase">
                                    Total
                                </td>
                                <td className="border border-blue-800 px-2 py-1.5 text-center">
                                    {total}/{maximum}
                                </td>
                                <td className="border border-blue-800 px-2 py-1.5 text-center">
                                    {subjects.length > 0
                                        ? `${average.toFixed(1)}%`
                                        : "—"}
                                </td>
                                <td className="border border-blue-800 px-2 py-1.5 text-center">
                                    {subjects.length > 0 ? overallGrade : "—"}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </section>

                {/* ASSESSMENT INFORMATION */}

                <section className="mt-2 grid shrink-0 grid-cols-[0.8fr_1.5fr] gap-2">
                    <div className="rounded-md border border-slate-400 p-1.5">
                        <h3 className="mb-1 inline-block rounded bg-blue-950 px-2 py-0.5 text-[8px] font-bold uppercase text-white">
                            Grade Key
                        </h3>

                        {GRADE_SCALE.map((item) => (
                            <div
                                key={item.grade}
                                className="flex justify-between gap-1 border-b border-slate-200 py-[2px] text-[7px]"
                            >
                                <span>{item.min}–{item.max}</span>
                                <span className="font-semibold">
                                    {item.grade} - {item.description}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-md border border-blue-900 p-1.5">
                        <h3 className="mb-1 inline-block rounded bg-blue-950 px-2 py-0.5 text-[8px] font-bold uppercase text-white">
                            Other Areas of Assessment
                        </h3>

                        <div className="space-y-1 text-[7px]">
                            <div className="grid grid-cols-[105px_8px_1fr]">
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

                            <div className="grid grid-cols-[105px_8px_1fr]">
                                <span className="font-semibold uppercase">
                                    Attitude / Behaviour
                                </span>
                                <span>:</span>
                                <span className="uppercase">
                                    {attitude ?? "Not recorded"}
                                </span>
                            </div>

                            <div className="grid grid-cols-[105px_8px_1fr]">
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

                            <div className="grid grid-cols-[105px_8px_1fr]">
                                <span className="font-semibold uppercase">
                                    Vacation Date
                                </span>
                                <span>:</span>
                                <span>{formatDate(vacationDate)}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* STUDENT PROFILE */}

                {additionalDetails.length > 0 && (
                    <section className="mt-2 shrink-0 rounded-md border border-slate-300 p-1.5">
                        <h3 className="mb-1 text-[8px] font-bold uppercase text-blue-950">
                            Student Profile
                        </h3>

                        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-[7px]">
                            {additionalDetails.map((detail) => (
                                <div key={detail.label}>
                                    <p className="font-bold uppercase text-slate-500">
                                        {detail.label}
                                    </p>
                                    <p className="font-semibold text-slate-800">
                                        {detail.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* REMARKS */}

                {(teacherRemark || headTeacherRemark) && (
                    <section className="mt-2 grid shrink-0 grid-cols-2 gap-2 text-[7px]">
                        <div className="rounded border border-slate-300 p-1.5">
                            <p className="mb-1 font-bold uppercase text-blue-950">
                                Class Teacher's Remark
                            </p>
                            <p className="min-h-[20px]">
                                {teacherRemark || " "}
                            </p>
                        </div>

                        <div className="rounded border border-slate-300 p-1.5">
                            <p className="mb-1 font-bold uppercase text-blue-950">
                                Head Teacher's Remark
                            </p>
                            <p className="min-h-[20px]">
                                {headTeacherRemark || " "}
                            </p>
                        </div>
                    </section>
                )}

                {/* SIGNATURES */}

                <section className="mt-auto grid shrink-0 grid-cols-2 gap-10 px-4 pb-2 pt-5 text-[7px]">
                    <div className="border-t border-slate-500 pt-1 text-center">
                        Class Teacher's Signature
                    </div>
                    <div className="border-t border-slate-500 pt-1 text-center">
                        Head Teacher's Signature
                    </div>
                </section>

                <div className="shrink-0 border-t border-blue-200 pt-1 text-center text-[6px] font-semibold uppercase tracking-wider text-slate-400">
                    Generated by Easeway School Management
                </div>
            </div>
        </div>
    );
}

// ==========================================
// PROJECT CLASS RESULTS SHEET
// ==========================================

function ClassResultSheet({
    project,
    reports,
    sheetRef,
}: {
    project: Project;
    reports: TerminalReport[];
    sheetRef: (element: HTMLDivElement | null) => void;
}) {
    const method = getProjectMethod(project);
    const school = project.school_data ?? {};

    const subjects = getProjectSubjects(method);
    const passMark = getProjectPassMark(project);

    const schoolName =
        school.school_name ??
        project.header ??
        project.name ??
        "SCHOOL NAME";

    const projectName =
        project.header ??
        project.name ??
        `${method} Project`;

    const schoolLogo = String(
        school.logo_image ??
        project.school_logo ??
        ""
    );

    const sortedReports = [...reports].sort(
        (a, b) => b.total - a.total
    );

    const term =
        project.term ??
        project.academic_term ??
        school.term ??
        "Not specified";

    const academicYear =
        project.academic_year ??
        school.academic_year ??
        "";

    return (
        <div
            ref={sheetRef}
            className="class-result-sheet box-border min-h-[210mm] w-[297mm] bg-white p-[7mm] text-slate-900"
            style={{
                fontFamily: "Arial, sans-serif",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
            }}
        >
            <div className="border-2 border-blue-950 p-3">
                {/* SHEET HEADER */}

                <div className="flex items-center justify-between gap-4 border-b-2 border-blue-950 pb-3">
                    <div className="flex items-center gap-3">
                        {schoolLogo ? (
                            <img
                                src={schoolLogo}
                                alt="School logo"
                                crossOrigin="anonymous"
                                className="h-14 w-14 rounded-full border-2 border-blue-900 object-cover"
                            />
                        ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-900">
                                <GraduationCap
                                    size={28}
                                    className="text-blue-900"
                                />
                            </div>
                        )}

                        <div>
                            <h1 className="text-lg font-extrabold uppercase text-blue-950">
                                {schoolName}
                            </h1>
                            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                                Class Academic Results
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                                {projectName}
                            </p>
                        </div>
                    </div>

                    <div className="text-right text-[10px]">
                        <p>
                            <strong>Level:</strong>{" "}
                            {method === "PRIMARY"
                                ? "Primary"
                                : "Junior High School"}
                        </p>
                        <p className="mt-1">
                            <strong>Term:</strong> {term}
                        </p>
                        {academicYear && (
                            <p className="mt-1">
                                <strong>Academic Year:</strong> {academicYear}
                            </p>
                        )}
                        <p className="mt-1">
                            <strong>Pass Mark:</strong> {passMark}
                        </p>
                        <p className="mt-1">
                            <strong>Students:</strong> {sortedReports.length}
                        </p>
                    </div>
                </div>

                {/* RESULTS TABLE */}

                <div className="mt-4">
                    <table className="w-full border-collapse text-[8px]">
                        <thead>
                            <tr className="bg-blue-950 text-white">
                                <th className="border border-blue-800 px-1.5 py-2 text-center">
                                    POS.
                                </th>

                                <th className="min-w-[150px] border border-blue-800 px-2 py-2 text-left">
                                    STUDENT NAME
                                </th>

                                {subjects.map((subject) => (
                                    <th
                                        key={subject.key}
                                        className="border border-blue-800 px-1 py-2 text-center"
                                    >
                                        {subject.name.toUpperCase()}
                                    </th>
                                ))}

                                <th className="border border-blue-800 px-1.5 py-2 text-center">
                                    TOTAL
                                </th>

                                <th className="border border-blue-800 px-1.5 py-2 text-center">
                                    GRADE
                                </th>

                                <th className="border border-blue-800 px-1.5 py-2 text-center">
                                    STATUS
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedReports.map((report, index) => {
                                const failed = report.total < passMark;

                                return (
                                    <tr
                                        key={report.id}
                                        className={
                                            failed
                                                ? "border-t-2 border-t-red-600"
                                                : ""
                                        }
                                    >
                                        <td className="border border-slate-300 px-1.5 py-2 text-center font-bold">
                                            {ordinal(index + 1)}
                                        </td>

                                        <td className="border border-slate-300 px-2 py-2 font-semibold uppercase">
                                            {report.student.full_name ??
                                                report.student.name ??
                                                "Student"}
                                        </td>

                                        {subjects.map((subject) => {
                                            const mark = getSubjectMark(
                                                getStudentSubjectData(
                                                    report.student,
                                                    method
                                                ),
                                                subject.key
                                            );

                                            return (
                                                <td
                                                    key={subject.key}
                                                    className="border border-slate-300 px-1 py-2 text-center"
                                                >
                                                    {mark ?? "—"}
                                                </td>
                                            );
                                        })}

                                        <td className="border border-slate-300 px-1.5 py-2 text-center font-extrabold">
                                            {report.total}
                                        </td>

                                        <td className={`border border-slate-300 px-1.5 py-2 text-center font-bold ${getGradeColor(report.overallGrade)}`}>
                                            {report.overallGrade}
                                        </td>

                                        <td
                                            className={`border border-slate-300 px-1.5 py-2 text-center font-bold ${
                                                failed
                                                    ? "text-red-600"
                                                    : "text-blue-800"
                                            }`}
                                        >
                                            {failed ? "FAIL" : "PASS"}
                                        </td>
                                    </tr>
                                );
                            })}

                            {sortedReports.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={subjects.length + 5}
                                        className="border border-slate-300 px-3 py-8 text-center text-slate-500"
                                    >
                                        No student results available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* LEGEND */}

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-300 pt-2 text-[9px]">
                    <div className="flex items-center gap-2">
                        <span className="inline-block h-3 w-5 border-t-2 border-red-600" />
                        <span className="font-semibold text-red-700">
                            Red top border = Student below the project pass mark
                        </span>
                    </div>

                    <p className="text-slate-500">
                        Generated by Easeway School Management
                    </p>
                </div>
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
    const [downloadingId, setDownloadingId] = useState("");
    const [downloadError, setDownloadError] = useState("");
    const [expandedProjects, setExpandedProjects] = useState<
        Record<string, boolean>
    >({});

    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const sheetRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const projects: Project[] = Array.isArray(studentsSubject)
        ? studentsSubject
        : [];

    const reports = useMemo(
        () => buildReports(projects),
        [studentsSubject]
    );

    // ==========================================
    // GROUP REPORTS BY PROJECT
    // ==========================================

    const projectGroups = useMemo(() => {
        return projects.map((project, index) => {
            const projectId = getProjectIdentity(project, index);
            const method = getProjectMethod(project);

            const projectReports = reports
                .filter((report) => report.project === project)
                .sort((a, b) => b.total - a.total);

            return {
                id: projectId,
                project,
                method,
                reports: projectReports,
                subjects: getProjectSubjects(method),
                passMark: getProjectPassMark(project),
            };
        });
    }, [projects, reports]);

    // ==========================================
    // PDF GENERATION
    // ==========================================

    const generatePdf = useCallback(
        async (
            elements: (HTMLDivElement | null)[],
            filename: string,
            orientation: "portrait" | "landscape"
        ) => {
            const validElements = elements.filter(
                (element): element is HTMLDivElement => Boolean(element)
            );

            if (validElements.length === 0) {
                throw new Error("There is nothing to download.");
            }

            const [
                { default: html2canvas },
                { jsPDF },
            ] = await Promise.all([
                import("html2canvas"),
                import("jspdf"),
            ]);

            await document.fonts.ready;

            const pdf = new jsPDF({
                orientation,
                unit: "mm",
                format: "a4",
                compress: true,
            });

            let addedPages = 0;

            for (const element of validElements) {
                const images = Array.from(
                    element.querySelectorAll<HTMLImageElement>("img")
                );

                await Promise.all(
                    images.map((img) => waitForImage(img))
                );

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: "#ffffff",
                    logging: false,
                    width: element.scrollWidth,
                    height: element.scrollHeight,
                    windowWidth: Math.max(
                        window.innerWidth,
                        element.scrollWidth
                    ),
                    windowHeight: Math.max(
                        window.innerHeight,
                        element.scrollHeight
                    ),
                    scrollX: 0,
                    scrollY: 0,
                });

                const imageData = canvas.toDataURL("image/jpeg", 0.94);

                if (addedPages > 0) {
                    pdf.addPage("a4", orientation);
                }

                const pageWidth = orientation === "portrait" ? 210 : 297;
                const pageHeight = orientation === "portrait" ? 297 : 210;

                // Fit the entire captured card onto one PDF page.
                const ratio = Math.min(
                    pageWidth / canvas.width,
                    pageHeight / canvas.height
                );

                const imageWidth = canvas.width * ratio;
                const imageHeight = canvas.height * ratio;

                const x = (pageWidth - imageWidth) / 2;
                const y = (pageHeight - imageHeight) / 2;

                pdf.addImage(
                    imageData,
                    "JPEG",
                    x,
                    y,
                    imageWidth,
                    imageHeight,
                    undefined,
                    "FAST"
                );

                addedPages++;

                canvas.width = 0;
                canvas.height = 0;
            }

            if (addedPages === 0) {
                throw new Error("The PDF could not be created.");
            }

            pdf.save(filename);
        },
        []
    );

    // ==========================================
    // DOWNLOAD ALL PROJECT CLASS RESULTS
    // ==========================================

    const downloadAllReports = useCallback(async () => {
        if (downloading || reports.length === 0) return;

        setDownloading(true);
        setDownloadError("");

        try {
            const sheets = projectGroups
                .filter((group) => group.reports.length > 0)
                .map((group) => sheetRefs.current[group.id] ?? null);

            await generatePdf(
                sheets,
                "Easeway-Class-Results.pdf",
                "landscape"
            );
        } catch (error) {
            console.error("CLASS RESULTS DOWNLOAD ERROR:", error);

            setDownloadError(
                "Unable to download the class results. Please try again."
            );
        } finally {
            setDownloading(false);
        }
    }, [downloading, reports.length, projectGroups, generatePdf]);

    // ==========================================
    // DOWNLOAD ONE STUDENT REPORT CARD
    // ==========================================

    const downloadSingleReport = useCallback(
        async (report: TerminalReport) => {
            if (downloading || downloadingId) return;

            setDownloadingId(report.id);
            setDownloadError("");

            try {
                const studentName = String(
                    report.student.full_name ??
                    report.student.name ??
                    "Student"
                ).replace(/[^a-z0-9-_]/gi, "-");

                await generatePdf(
                    [cardRefs.current[report.id] ?? null],
                    `${studentName}-Terminal-Report.pdf`,
                    "portrait"
                );
            } catch (error) {
                console.error("SINGLE REPORT DOWNLOAD ERROR:", error);

                setDownloadError(
                    "Unable to download this student's report. Please try again."
                );
            } finally {
                setDownloadingId("");
            }
        },
        [downloading, downloadingId, generatePdf]
    );

    // ==========================================
    // TOGGLE PROJECT STUDENT LIST
    // ==========================================

    const toggleProject = (projectId: string) => {
        setExpandedProjects((previous) => ({
            ...previous,
            [projectId]: !previous[projectId],
        }));
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
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    .report-print-area,
                    .report-print-area * {
                        visibility: visible !important;
                    }

                    .report-print-area {
                        position: static !important;
                        display: block !important;
                        left: auto !important;
                        top: auto !important;
                        z-index: auto !important;
                        width: auto !important;
                        height: auto !important;
                        overflow: visible !important;
                    }

                    .report-card {
                        display: flex !important;
                        width: 210mm !important;
                        min-width: 210mm !important;
                        max-width: 210mm !important;
                        height: 297mm !important;
                        min-height: 297mm !important;
                        max-height: 297mm !important;
                        margin: 0 !important;
                        overflow: hidden !important;
                        break-after: page !important;
                        page-break-after: always !important;
                    }

                    .report-card:last-child {
                        break-after: auto !important;
                        page-break-after: auto !important;
                    }

                    .class-result-sheet {
                        display: none !important;
                    }

                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">

                    {/* PAGE HEADER */}

                    <div className="no-print overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-blue-950 via-blue-800 to-blue-700 px-5 py-6 sm:px-7">
                            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                                        <GraduationCap size={27} />
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                                            Academic Management
                                        </p>

                                        <h1 className="mt-1 text-2xl font-bold text-white">
                                            Terminal Reports
                                        </h1>

                                        <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                                            Download individual student report
                                            cards or generate class results
                                            sheets for your projects.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={downloadAllReports}
                                    disabled={downloading || reports.length === 0}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {downloading ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-800 border-t-transparent" />
                                            Preparing Results...
                                        </>
                                    ) : (
                                        <>
                                            <FileDown size={18} />
                                            Download All Results
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* SUMMARY */}

                        <div className="grid grid-cols-2 divide-x divide-slate-200">
                            <div className="flex items-center justify-center gap-3 px-5 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Total Students
                                    </p>
                                    <p className="text-xl font-bold text-slate-900">
                                        {reports.length}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-3 px-5 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Results Format
                                    </p>
                                    <p className="text-sm font-bold text-slate-900">
                                        A4 Landscape
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DOWNLOAD ERROR */}

                    {downloadError && (
                        <div className="no-print mx-auto mt-4 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {downloadError}
                        </div>
                    )}

                    {/* PROJECT CARDS */}

                    <section className="no-print mx-auto mt-8 max-w-3xl">
                        <div className="mb-5 text-center">
                            <h2 className="text-xl font-bold text-slate-900">
                                Your Projects
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Choose a student to download their individual
                                report card.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {projectGroups.map((group) => {
                                const project = group.project;

                                const projectName =
                                    project.header ??
                                    project.name ??
                                    "Untitled Project";

                                const projectClass =
                                    project.class_name ??
                                    project.class ??
                                    project.grade ??
                                    "";

                                const isExpanded =
                                    expandedProjects[group.id] ?? true;

                                return (
                                    <div
                                        key={group.id}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                    >
                                        {/* PROJECT HEADER */}

                                        <button
                                            type="button"
                                            onClick={() => toggleProject(group.id)}
                                            className="flex w-full cursor-pointer items-center justify-between gap-4 bg-white px-5 py-5 text-left transition hover:bg-slate-50"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                                    <School size={23} />
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="truncate text-base font-bold text-slate-900">
                                                        {projectName}
                                                    </h3>

                                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                                        <span>
                                                            {group.method === "PRIMARY"
                                                                ? "Primary"
                                                                : "JHS"}
                                                        </span>

                                                        {projectClass && (
                                                            <span>
                                                                Class: {projectClass}
                                                            </span>
                                                        )}

                                                        <span>
                                                            {group.reports.length}{" "}
                                                            {group.reports.length === 1
                                                                ? "Student"
                                                                : "Students"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-3">
                                                <span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 sm:inline-flex">
                                                    Pass mark: {group.passMark}
                                                </span>

                                                <ChevronDown
                                                    size={20}
                                                    className={`text-slate-400 transition-transform ${
                                                        isExpanded
                                                            ? "rotate-180"
                                                            : ""
                                                    }`}
                                                />
                                            </div>
                                        </button>

                                        {/* PROJECT DETAILS */}

                                        {isExpanded && (
                                            <div className="border-t border-slate-100 px-5 py-4">
                                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                            Students in this project
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-400">
                                                            Individual report downloads
                                                        </p>
                                                    </div>

                                                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                                                        {group.subjects.length} subjects
                                                    </div>
                                                </div>

                                                {/* SUBJECTS */}

                                                <div className="mb-4 flex flex-wrap justify-center gap-2">
                                                    {group.subjects.map((subject) => (
                                                        <span
                                                            key={subject.key}
                                                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600"
                                                        >
                                                            {subject.name}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* STUDENT LIST */}

                                                <div className="space-y-2">
                                                    {group.reports.map((report) => {
                                                        const studentName =
                                                            report.student.full_name ??
                                                            report.student.name ??
                                                            "Student";

                                                        const failed =
                                                            report.total < group.passMark;

                                                        const isDownloading =
                                                            downloadingId === report.id;

                                                        return (
                                                            <div
                                                                key={report.id}
                                                                className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-center sm:flex-row sm:text-left"
                                                            >
                                                                <div className="flex min-w-0 items-center gap-3">
                                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                                                                        <UserRound size={17} />
                                                                    </div>

                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm font-semibold text-slate-800">
                                                                            {studentName}
                                                                        </p>

                                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                                            Position:{" "}
                                                                            {ordinal(report.overallPosition)}
                                                                            {" · "}
                                                                            Total: {report.total}
                                                                            {failed && (
                                                                                <span className="ml-2 font-bold text-red-600">
                                                                                    Below pass mark
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        downloadSingleReport(report)
                                                                    }
                                                                    disabled={
                                                                        downloading ||
                                                                        Boolean(downloadingId)
                                                                    }
                                                                    className="inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                                                >
                                                                    {isDownloading ? (
                                                                        <>
                                                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                                            Preparing...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Download size={15} />
                                                                            Download
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}

                                                    {group.reports.length === 0 && (
                                                        <p className="py-5 text-center text-sm text-slate-500">
                                                            No students have been added to this project yet.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* HIDDEN PDF STAGING AREA */}

                    <div
                        className="report-print-area pointer-events-none fixed left-0 top-0 -z-10"
                        aria-hidden="true"
                    >
                        {/* INDIVIDUAL STUDENT REPORT CARDS */}

                        {reports.map((report) => (
                            <TerminalReportCard
                                key={report.id}
                                report={report}
                                cardRef={(element) => {
                                    cardRefs.current[report.id] = element;
                                }}
                            />
                        ))}

                        {/* CLASS RESULTS SHEETS */}

                        {projectGroups
                            .filter((group) => group.reports.length > 0)
                            .map((group) => (
                                <ClassResultSheet
                                    key={`sheet-${group.id}`}
                                    project={group.project}
                                    reports={group.reports}
                                    sheetRef={(element) => {
                                        sheetRefs.current[group.id] = element;
                                    }}
                                />
                            ))}
                    </div>
                </div>
            </main>
        </>
    );
}
