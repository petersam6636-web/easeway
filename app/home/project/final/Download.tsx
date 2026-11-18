
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useApp from "@/lib/useApp";
import ProjectLoading from "@/component/Loading";

import {
    FileText,
    GraduationCap,
    Printer,
    Users,
    BookOpen,
    School,
    FileDown,
    ChevronDown,
    X,
    AlertCircle,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

type DataRecord = Record<string, any>;
type Student = DataRecord;
type Project = DataRecord;

type ProjectSubject = {
    key: string;
    name: string;
    shortName: string;
};

type SubjectMark = {
    key: string;
    name: string;
    shortName: string;
    mark: number | null;
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
    passMark: number;
    qualified: boolean;
};

type ProjectGroup = {
    id: string;
    project: Project;
    method: string;
    reports: TerminalReport[];
    subjects: ProjectSubject[];
    passMark: number;
    resultPages: TerminalReport[][];
};

type PrintJob = {
    projectId: string;
    type: "students" | "results";
};

// ======================================================
// SUBJECT CONFIGURATION
// ======================================================

const JHS_SUBJECTS: ProjectSubject[] = [
    { key: "english", name: "English", shortName: "ENGLISH" },
    { key: "mathematics", name: "Mathematics", shortName: "MATHS" },
    { key: "science", name: "Science", shortName: "SCIENCE" },
    { key: "history", name: "History", shortName: "HISTORY" },
    { key: "computing", name: "Computing", shortName: "COMPUTING" },
    { key: "creative_arts", name: "Creative Arts", shortName: "CREATIVE ARTS" },
    { key: "career_technology", name: "Career Technology", shortName: "CAREER TECH." },
    { key: "rme", name: "RME", shortName: "RME" },
    { key: "fante_twi", name: "Fante/Twi", shortName: "FANTE/TWI" },
];

const PRIMARY_SUBJECTS: ProjectSubject[] = [
    { key: "english", name: "English", shortName: "ENGLISH" },
    { key: "mathematics", name: "Mathematics", shortName: "MATHS" },
    { key: "science", name: "Science", shortName: "SCIENCE" },
    { key: "computing", name: "Computing", shortName: "COMPUTING" },
    { key: "creative_arts", name: "Creative Arts", shortName: "CREATIVE ARTS" },
    { key: "rme", name: "RME", shortName: "RME" },
    { key: "peh", name: "PEH", shortName: "PEH" },
    { key: "history", name: "History", shortName: "HISTORY" },
    { key: "fante_twi", name: "Fante/Twi", shortName: "FANTE/TWI" },
];

function getProjectMethod(project: Project): string {
    const method = String(
        project?.method ??
        project?.project_method ??
        "JHS"
    ).trim().toUpperCase();

    return method.includes("PRIMARY") ? "PRIMARY" : "JHS";
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
        english: ["english", "english_language"],
        mathematics: ["mathematics", "maths", "math"],
        science: ["science", "integrated_science"],
        history: ["history"],
        computing: [
            "computing",
            "ict",
            "information_communication_technology",
        ],
        creative_arts: [
            "creative_arts",
            "creative_arts_and_design",
            "creative_arts_design",
        ],
        career_technology: [
            "career_technology",
            "career_tech",
            "career_technology_and_design",
        ],
        rme: [
            "rme",
            "religious_and_moral_education",
            "religious_moral_education",
        ],
        peh: [
            "peh",
            "physical_education",
            "physical_education_and_health",
        ],
        fante_twi: ["fante_twi", "fante/twi", "fante", "twi"],
    };

    return aliases[key] ?? [key];
}

// ======================================================
// GRADING
// ======================================================

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

// ======================================================
// GENERAL HELPERS
// ======================================================

function formatDate(value: unknown): string {
    if (!value) return "Not specified";

    const date = new Date(value as string | number);

    if (Number.isNaN(date.getTime())) return String(value);

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

function getStudentName(student: Student): string {
    return String(
        student.full_name ??
        student.name ??
        student.student_name ??
        "Student"
    );
}

function getStudentInfo(student: Student, method: string): DataRecord {
    return method === "PRIMARY"
        ? student.primary_student_data ?? student.primary_student_info ?? {}
        : student.jhs_student_data ?? student.jhs_student_info ?? {};
}

function getProjectPassMark(project: Project): number {
    const value =
        project.passMark ??
        project.pass_mark ??
        project.passmark ??
        0;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

// ======================================================
// METHOD-SPECIFIC SUBJECT DATA
// ======================================================

// IMPORTANT:
// A Primary project reads only primary_subjects and
// primary student data.
// A JHS project reads only jhs_subjects and JHS student data.

function getStudentSubjectData(
    student: Student,
    method: string
): unknown {
    if (method === "PRIMARY") {
        const primarySubjects = student.primary_subjects;

        if (
            primarySubjects !== null &&
            primarySubjects !== undefined &&
            (!Array.isArray(primarySubjects) || primarySubjects.length > 0)
        ) {
            return primarySubjects;
        }

        return (
            student.primary_student_data ??
            student.primary_student_info ??
            {}
        );
    }

    const jhsSubjects = student.jhs_subjects;

    if (
        jhsSubjects !== null &&
        jhsSubjects !== undefined &&
        (!Array.isArray(jhsSubjects) || jhsSubjects.length > 0)
    ) {
        return jhsSubjects;
    }

    return (
        student.jhs_student_data ??
        student.jhs_student_info ??
        {}
    );
}

function extractNumericMark(
    value: unknown,
    depth = 0
): number | null {
    if (
        depth > 6 ||
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    if (typeof value !== "object") return null;

    if (Array.isArray(value)) {
        for (const item of value) {
            const result = extractNumericMark(item, depth + 1);

            if (result !== null) return result;
        }

        return null;
    }

    const record = value as DataRecord;

    const possibleKeys = [
        "value",
        "mark",
        "marks",
        "score",
        "obtained_marks",
        "obtainedMarks",
        "total_score",
    ];

    for (const key of possibleKeys) {
        if (record[key] !== undefined && record[key] !== null) {
            const result = extractNumericMark(
                record[key],
                depth + 1
            );

            if (result !== null) return result;
        }
    }

    return null;
}

function findSubjectMark(
    data: unknown,
    aliases: string[],
    depth = 0
): number | null {
    if (depth > 9 || data === null || data === undefined) {
        return null;
    }

    const normalizedAliases = aliases.map(normalizeSubjectKey);

    if (Array.isArray(data)) {
        for (const item of data) {
            const result = findSubjectMark(
                item,
                aliases,
                depth + 1
            );

            if (result !== null) return result;
        }

        return null;
    }

    if (typeof data !== "object") return null;

    const record = data as DataRecord;

    // First check whether the subject is stored as an object key.
    for (const [storedKey, storedValue] of Object.entries(record)) {
        if (
            normalizedAliases.includes(
                normalizeSubjectKey(storedKey)
            )
        ) {
            const result = extractNumericMark(storedValue);

            if (result !== null) return result;
        }
    }

    // Then check subject records such as:
    // { subject_name: "English", mark: 80 }

    const subjectName =
        record.subject_name ??
        record.subjectName ??
        record.subject ??
        record.name ??
        record.title;

    if (
        typeof subjectName === "string" &&
        normalizedAliases.includes(normalizeSubjectKey(subjectName))
    ) {
        const result = extractNumericMark(record);

        if (result !== null) return result;
    }

    // Finally search nested objects and relations.
    for (const value of Object.values(record)) {
        if (value && typeof value === "object") {
            const result = findSubjectMark(
                value,
                aliases,
                depth + 1
            );

            if (result !== null) return result;
        }
    }

    return null;
}

function getSubjectMark(
    subjectData: unknown,
    subjectKey: string
): number | null {
    return findSubjectMark(
        subjectData,
        getSubjectAliases(subjectKey)
    );
}

function getStudentSubjectMarks(
    student: Student,
    method: string
): SubjectMark[] {
    const subjectData = getStudentSubjectData(student, method);

    // Only the subjects belonging to this project's method
    // are returned here.
    return getProjectSubjects(method).map((subject) => ({
        key: subject.key,
        name: subject.name,
        shortName: subject.shortName,
        mark: getSubjectMark(subjectData, subject.key),
    }));
}

function getStudentTotal(student: Student, method: string): number {
    return getStudentSubjectMarks(student, method).reduce(
        (total, subject) => total + (subject.mark ?? 0),
        0
    );
}

// ======================================================
// SUBJECT RANKINGS
// ======================================================

function getSubjectRankings(
    students: Student[],
    method: string
): Record<string, Map<Student, number>> {
    const rankings: Record<string, Map<Student, number>> = {};

    getProjectSubjects(method).forEach((subject) => {
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

// ======================================================
// BUILD REPORTS
// ======================================================

function buildReports(projects: Project[]): TerminalReport[] {
    const reports: TerminalReport[] = [];

    projects.forEach((project, projectIndex) => {
        const method = getProjectMethod(project);

        const rawStudents: Student[] = Array.isArray(project.students)
            ? project.students
            : [];

        const students = getUniqueStudents(rawStudents);
        const school: DataRecord = project.school_data ?? {};
        const passMark = getProjectPassMark(project);

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
                    subject.mark !== null
                        ? subjectRankings[subject.key]?.get(student) ?? null
                        : null,
                grade:
                    subject.mark !== null
                        ? getGrade(subject.mark)
                        : "—",
            }));

            const availableSubjects = subjects.filter(
                (subject) => subject.mark !== null
            );

            const maximum = availableSubjects.length * 100;

            const average =
                availableSubjects.length > 0
                    ? total / availableSubjects.length
                    : 0;

            const qualified =
                availableSubjects.length > 0 && total >= passMark;

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
                overallGrade:
                    availableSubjects.length > 0
                        ? getGrade(average)
                        : "—",
                overallPosition: index + 1,
                projectStudentCount: students.length,
                passMark,
                qualified,
            });
        });
    });

    return reports;
}

// ======================================================
// ADDITIONAL STUDENT DETAILS
// DOB AND GENDER EXCLUDED
// ======================================================

function getAdditionalStudentDetails(
    student: Student,
    studentInfo: DataRecord
): { label: string; value: string }[] {
    const possibleFields = [
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
        let value: unknown = null;

        for (const key of field.keys) {
            value = studentInfo?.[key] ?? student?.[key];

            if (value !== null && value !== undefined && value !== "") {
                break;
            }
        }

        if (value === null || value === undefined || value === "") {
            continue;
        }

        if (Array.isArray(value)) value = value.join(", ");

        if (typeof value === "object") continue;

        details.push({
            label: field.label,
            value: String(value),
        });
    }

    return details;
}

// ======================================================
// IMAGE HELPERS
// ======================================================

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

// ======================================================
// SCHOOL LOGO
// ======================================================

function SchoolLogo({ src }: { src: string }) {
    return (
        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-blue-900 bg-white p-1">
            {src ? (
                <img
                    src={src}
                    alt="School logo"
                    crossOrigin="anonymous"
                    className="h-full w-full rounded-full object-cover"
                />
            ) : (
                <GraduationCap size={21} className="text-blue-900" />
            )}
        </div>
    );
}

// ======================================================
// INDIVIDUAL STUDENT REPORT CARD
// COMPACT A4 PORTRAIT
// ======================================================

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
        passMark,
        qualified,
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

    const studentName = getStudentName(student);

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
            className="report-card relative mx-auto box-border flex h-[250mm] min-h-[240mm] w-[180mm] flex-col overflow-hidden bg-white p-[4mm] text-slate-900"
            style={{
                fontFamily: "Arial, sans-serif",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
            }}
        >
            <div className="pointer-events-none absolute inset-[2mm] rounded border-2 border-blue-950" />

            {schoolLogo && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <img
                        src={schoolLogo}
                        alt=""
                        crossOrigin="anonymous"
                        className="h-[75mm] w-[75mm] rounded-full object-contain opacity-[0.035]"
                    />
                </div>
            )}

            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                {/* SCHOOL HEADER */}

                <header className="shrink-0 border-b-2 border-blue-950 pb-1">
                    <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
                        <SchoolLogo src={schoolLogo} />

                        <div className="min-w-0 text-center">
                            <h1 className="break-words text-[15px] font-extrabold uppercase tracking-wide text-blue-950">
                                {schoolName}
                            </h1>

                            <p className="mt-0.5 inline-block rounded bg-blue-950 px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                Terminal Report
                            </p>

                            <p className="mt-0.5 text-[6.5px] font-semibold uppercase tracking-wider text-slate-500">
                                {method === "PRIMARY"
                                    ? "Primary School"
                                    : "Junior High School"}
                            </p>
                        </div>

                        <SchoolLogo src={schoolLogo} />
                    </div>

                    <div className="mt-1.5 grid grid-cols-3 gap-1 text-[7px]">
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
                                Location / Region
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

                <section className="mt-1.5 shrink-0 overflow-hidden rounded border border-blue-900 text-[7px]">
                    <div className="grid grid-cols-[100px_1fr] border-b border-blue-300">
                        <div className="bg-blue-50 px-2 py-1 font-bold uppercase text-blue-950">
                            Student Name
                        </div>
                        <div className="px-2 py-1 font-bold uppercase">
                            {studentName}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-blue-300">
                        <div className="px-2 py-1">
                            <span className="font-bold text-blue-950">
                                Student ID:
                            </span>{" "}
                            {studentId}
                        </div>

                        <div className="px-2 py-1">
                            <span className="font-bold text-blue-950">
                                Class:
                            </span>{" "}
                            {studentClass}
                        </div>

                        <div className="px-2 py-1">
                            <span className="font-bold text-blue-950">
                                Position:
                            </span>{" "}
                            {ordinal(overallPosition)} of {projectStudentCount}
                        </div>
                    </div>
                </section>

                {/* ACADEMIC PERFORMANCE */}

                <section className="mt-1.5 shrink-0">
                    <div className="mb-0.5 flex items-center justify-between">
                        <h2 className="text-[9px] font-extrabold uppercase tracking-wide text-blue-950">
                            Academic Performance
                        </h2>

                        <span className="text-[6px] font-semibold text-slate-500">
                            {subjects.length} SUBJECTS
                        </span>
                    </div>

                    <table className="w-full border-collapse text-[7px] leading-tight">
                        <thead>
                            <tr className="bg-blue-950 text-white">
                                <th className="w-[43%] border border-blue-950 px-2 py-1 text-left uppercase">
                                    Subject
                                </th>
                                <th className="w-[19%] border border-blue-800 px-1 py-1 text-center uppercase">
                                    Marks
                                </th>
                                <th className="w-[18%] border border-blue-800 px-1 py-1 text-center uppercase">
                                    Position
                                </th>
                                <th className="w-[20%] border border-blue-800 px-1 py-1 text-center uppercase">
                                    Grade
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {subjects.map((subject) => (
                                <tr key={subject.key}>
                                    <td className="border border-slate-300 px-2 py-[3px] font-semibold uppercase">
                                        {subject.name}
                                    </td>
                                    <td className="border border-slate-300 px-1 py-[3px] text-center font-semibold">
                                        {subject.mark ?? "—"}
                                    </td>
                                    <td className="border border-slate-300 px-1 py-[3px] text-center">
                                        {subject.position !== null
                                            ? ordinal(subject.position)
                                            : "—"}
                                    </td>
                                    <td
                                        className={`border border-slate-300 px-1 py-[3px] text-center font-bold ${getGradeColor(subject.grade)}`}
                                    >
                                        {subject.grade}
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                        <tfoot>
                            <tr className="bg-blue-950 font-bold text-white">
                                <td className="border border-blue-950 px-2 py-1 uppercase">
                                    Total
                                </td>
                                <td className="border border-blue-800 px-1 py-1 text-center">
                                    {total}/{maximum}
                                </td>
                                <td className="border border-blue-800 px-1 py-1 text-center">
                                    {maximum > 0
                                        ? `${average.toFixed(1)}%`
                                        : "—"}
                                </td>
                                <td className="border border-blue-800 px-1 py-1 text-center">
                                    {overallGrade}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </section>

                {/* QUALIFICATION */}

                <section className="mt-1.5 flex shrink-0 items-center justify-between rounded border-2 border-blue-950 px-2.5 py-1.5">
                    <div>
                        <p className="text-[7px] font-bold uppercase tracking-wide text-blue-950">
                            Project Qualification
                        </p>
                        <p className="text-[6px] text-slate-500">
                            Required pass mark: {passMark}
                        </p>
                    </div>

                    <div
                        className={`rounded px-3 py-1 text-[8px] font-extrabold uppercase tracking-wider ${
                            qualified
                                ? "bg-blue-950 text-white"
                                : "bg-red-600 text-white"
                        }`}
                    >
                        {qualified ? "QUALIFIED" : "NOT QUALIFIED"}
                    </div>
                </section>

                {/* GRADE KEY AND ASSESSMENT */}

                <section className="mt-1.5 grid shrink-0 grid-cols-[0.8fr_1.5fr] gap-1.5">
                    <div className="rounded border border-slate-400 p-1">
                        <h3 className="mb-0.5 inline-block rounded bg-blue-950 px-1.5 py-0.5 text-[7px] font-bold uppercase text-white">
                            Grade Key
                        </h3>

                        {GRADE_SCALE.map((item) => (
                            <div
                                key={item.grade}
                                className="flex justify-between gap-1 border-b border-slate-200 py-[1px] text-[6px]"
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

                    <div className="rounded border border-blue-900 p-1">
                        <h3 className="mb-1 inline-block rounded bg-blue-950 px-1.5 py-0.5 text-[7px] font-bold uppercase text-white">
                            Other Areas of Assessment
                        </h3>

                        <div className="space-y-1 text-[6px]">
                            <div className="grid grid-cols-[95px_7px_1fr]">
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

                            <div className="grid grid-cols-[95px_7px_1fr]">
                                <span className="font-semibold uppercase">
                                    Attitude / Behaviour
                                </span>
                                <span>:</span>
                                <span className="uppercase">
                                    {attitude ?? "Not recorded"}
                                </span>
                            </div>

                            <div className="grid grid-cols-[95px_7px_1fr]">
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

                            <div className="grid grid-cols-[95px_7px_1fr]">
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
                    <section className="mt-1.5 shrink-0 rounded border border-slate-300 p-1">
                        <h3 className="mb-1 text-[7px] font-bold uppercase text-blue-950">
                            Student Profile
                        </h3>

                        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[6px]">
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
                    <section className="mt-1.5 grid shrink-0 grid-cols-2 gap-1.5 text-[6px]">
                        <div className="rounded border border-slate-300 p-1">
                            <p className="mb-0.5 font-bold uppercase text-blue-950">
                                Class Teacher's Remark
                            </p>
                            <p className="min-h-[16px]">
                                {teacherRemark || " "}
                            </p>
                        </div>

                        <div className="rounded border border-slate-300 p-1">
                            <p className="mb-0.5 font-bold uppercase text-blue-950">
                                Head Teacher's Remark
                            </p>
                            <p className="min-h-[16px]">
                                {headTeacherRemark || " "}
                            </p>
                        </div>
                    </section>
                )}

                {/* SIGNATURES */}

                <section className="mt-auto grid shrink-0 grid-cols-2 gap-10 px-4 pb-1 pt-4 text-[6px]">
                    <div className="border-t border-slate-500 pt-1 text-center">
                        Class Teacher's Signature
                    </div>
                    <div className="border-t border-slate-500 pt-1 text-center">
                        Head Teacher's Signature
                    </div>
                </section>

                <div className="shrink-0 border-t border-blue-200 pt-1 text-center text-[5.5px] font-semibold uppercase tracking-wider text-slate-400">
                    Generated by Easeway School Management
                </div>
            </div>
        </div>
    );
}

// ======================================================
// CLASS RESULTS SHEET
// A4 LANDSCAPE
// ======================================================

function ClassResultSheet({
    project,
    reports,
    pageNumber,
    totalPages,
    sheetRef,
}: {
    project: Project;
    reports: TerminalReport[];
    pageNumber: number;
    totalPages: number;
    sheetRef: (element: HTMLDivElement | null) => void;
}) {
    const method = getProjectMethod(project);
    const school = project.school_data ?? {};
    const passMark = getProjectPassMark(project);
    const subjects = getProjectSubjects(method);

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

    const term =
        project.term ??
        project.academic_term ??
        school.term ??
        "Not specified";

    const academicYear =
        project.academic_year ??
        school.academic_year ??
        "";

    // Calculate column widths so the table is exactly 100% wide.
    const subjectColumnWidth =
        (100 - 4 - 18 - 6 - 5 - 10) / subjects.length;

    return (
        <div
            ref={sheetRef}
            className="class-result-sheet relative box-border h-[210mm] min-h-[210mm] w-[297mm] overflow-hidden bg-white p-[6mm] text-slate-900"
            style={{
                fontFamily: "Arial, sans-serif",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
            }}
        >
            <div className="flex h-full flex-col border-2 border-blue-950 p-2.5">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-blue-950 pb-2">
                    <div className="flex min-w-0 items-center gap-2">
                        {schoolLogo ? (
                            <img
                                src={schoolLogo}
                                alt="School logo"
                                crossOrigin="anonymous"
                                className="h-10 w-10 shrink-0 rounded-full border-2 border-blue-900 object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-blue-900">
                                <GraduationCap
                                    size={21}
                                    className="text-blue-900"
                                />
                            </div>
                        )}

                        <div className="min-w-0">
                            <h1 className="truncate text-[13px] font-extrabold uppercase text-blue-950">
                                {schoolName}
                            </h1>
                            <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-600">
                                Class Academic Results
                            </p>
                            <p className="mt-0.5 truncate text-[7px] text-slate-500">
                                {projectName}
                            </p>
                        </div>
                    </div>

                    <div className="shrink-0 text-right text-[7px]">
                        <p>
                            <strong>Level:</strong>{" "}
                            {method === "PRIMARY" ? "Primary" : "JHS"}
                        </p>
                        <p className="mt-0.5">
                            <strong>Term:</strong> {term}
                        </p>
                        {academicYear && (
                            <p className="mt-0.5">
                                <strong>Academic Year:</strong> {academicYear}
                            </p>
                        )}
                        <p className="mt-0.5">
                            <strong>Pass Mark:</strong> {passMark}
                        </p>
                    </div>
                </div>

                <div className="mt-1.5 flex shrink-0 items-center justify-between text-[6.5px] font-semibold text-slate-600">
                    <span>STUDENTS: {reports.length} ON THIS PAGE</span>
                    <span>
                        PAGE {pageNumber} OF {totalPages}
                    </span>
                </div>

                <div className="mt-1 min-h-0 flex-1">
                    <table className="w-full table-fixed border-collapse text-[6px] leading-tight">
                        <colgroup>
                            <col style={{ width: "4%" }} />
                            <col style={{ width: "18%" }} />

                            {subjects.map((subject) => (
                                <col
                                    key={subject.key}
                                    style={{
                                        width: `${subjectColumnWidth}%`,
                                    }}
                                />
                            ))}

                            <col style={{ width: "6%" }} />
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "10%" }} />
                        </colgroup>

                        <thead>
                            <tr className="bg-blue-950 text-white">
                                <th className="border border-blue-800 px-0.5 py-1.5 text-center">
                                    POS.
                                </th>

                                <th className="border border-blue-800 px-1 py-1.5 text-left">
                                    STUDENT NAME
                                </th>

                                {subjects.map((subject) => (
                                    <th
                                        key={subject.key}
                                        className="break-words border border-blue-800 px-0.5 py-1 text-center"
                                    >
                                        {subject.shortName}
                                    </th>
                                ))}

                                <th className="border border-blue-800 px-0.5 py-1 text-center">
                                    TOTAL
                                </th>

                                <th className="border border-blue-800 px-0.5 py-1 text-center">
                                    GRADE
                                </th>

                                <th className="border border-blue-800 px-0.5 py-1 text-center">
                                    QUALIFICATION
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {reports.map((report, index) => (
                                <tr key={report.id}>
                                    <td className="border border-slate-300 px-0.5 py-1.5 text-center font-bold">
                                        {ordinal(
                                            (pageNumber - 1) * 14 + index + 1
                                        )}
                                    </td>

                                    <td className="break-words border border-slate-300 px-1 py-1.5 font-semibold uppercase">
                                        {getStudentName(report.student)}
                                    </td>

                                    {subjects.map((subject) => {
                                        const mark = report.subjects.find(
                                            (item) => item.key === subject.key
                                        )?.mark;

                                        return (
                                            <td
                                                key={subject.key}
                                                className="border border-slate-300 px-0.5 py-1.5 text-center"
                                            >
                                                {mark ?? "—"}
                                            </td>
                                        );
                                    })}

                                    <td className="border border-slate-300 px-0.5 py-1.5 text-center font-extrabold">
                                        {report.total}
                                    </td>

                                    <td
                                        className={`border border-slate-300 px-0.5 py-1.5 text-center font-bold ${getGradeColor(report.overallGrade)}`}
                                    >
                                        {report.overallGrade}
                                    </td>

                                    <td
                                        className={`border border-slate-300 px-0.5 py-1.5 text-center font-extrabold ${
                                            report.qualified
                                                ? "text-blue-800"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {report.qualified
                                            ? "QUALIFIED"
                                            : "NOT QUALIFIED"}
                                    </td>
                                </tr>
                            ))}

                            {reports.length === 0 && (
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

                <div className="mt-1.5 flex shrink-0 items-center justify-between border-t border-slate-300 pt-1.5 text-[6.5px]">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-blue-800">
                            QUALIFIED: Total ≥ {passMark}
                        </span>
                        <span className="font-bold text-red-600">
                            NOT QUALIFIED: Total below {passMark}
                        </span>
                    </div>

                    <span className="text-slate-400">
                        Generated by Easeway School Management
                    </span>
                </div>
            </div>
        </div>
    );
}

// ======================================================
// SPLIT RESULTS INTO PAGES
// ======================================================

function splitIntoPages<T>(items: T[], pageSize: number): T[][] {
    const pages: T[][] = [];

    for (let index = 0; index < items.length; index += pageSize) {
        pages.push(items.slice(index, index + pageSize));
    }

    return pages;
}

// ======================================================
// MAIN PAGE
// ======================================================
export default function TerminalReportPage() {
    const {
        studentsSubject,
        studentsSubjectLoading,
    } = useApp();

    const [busyKey, setBusyKey] = useState("");
    const [printJob, setPrintJob] = useState<PrintJob | null>(null);
    const [popupError, setPopupError] = useState("");

    const [expandedProjects, setExpandedProjects] = useState<
        Record<string, boolean>
    >({});

    const [isPrinting, setIsPrinting] = useState(false);

    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const sheetRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const projects: Project[] = Array.isArray(studentsSubject)
        ? studentsSubject
        : [];

    const reports = useMemo(
        () => buildReports(projects),
        [studentsSubject]
    );

    // ==================================================
    // GROUP REPORTS BY PROJECT
    // ==================================================

    const projectGroups: ProjectGroup[] = useMemo(() => {
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
                resultPages: splitIntoPages(projectReports, 14),
            };
        });
    }, [projects, reports]);

    // ==================================================
    // PRINT SELECTED PROJECT
    // ==================================================

    const printProject = useCallback(
        (group: ProjectGroup, type: "students" | "results") => {
            if (busyKey || isPrinting) return;

            if (group.reports.length === 0) {
                setPopupError(
                    "There are no student results available to print."
                );
                return;
            }

            setPopupError("");
            setBusyKey(`${group.id}-${type}`);

            setPrintJob({
                projectId: group.id,
                type,
            });
        },
        [busyKey, isPrinting]
    );

    // ==================================================
    // PREPARE PRINT CONTENT
    // ==================================================

    useEffect(() => {
        if (!printJob) return;

        let cancelled = false;

        const prepareAndPrint = async () => {
            try {
                setIsPrinting(true);

                // Wait for the hidden print content to render.
                await new Promise<void>((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => resolve());
                    });
                });

                if (cancelled) return;

                const group = projectGroups.find(
                    (item) => item.id === printJob.projectId
                );

                if (!group) {
                    throw new Error(
                        "The selected project could not be found."
                    );
                }

                const elements =
                    printJob.type === "students"
                        ? group.reports.map(
                              (report) => cardRefs.current[report.id]
                          )
                        : group.resultPages.map(
                              (_, pageIndex) =>
                                  sheetRefs.current[
                                      `${group.id}-${pageIndex}`
                                  ]
                          );

                const validElements = elements.filter(
                    (element): element is HTMLDivElement =>
                        Boolean(element)
                );

                if (validElements.length === 0) {
                    throw new Error(
                        "The print pages could not be prepared."
                    );
                }

                await document.fonts.ready;

                await Promise.all(
                    validElements.flatMap((element) =>
                        Array.from(
                            element.querySelectorAll<HTMLImageElement>("img")
                        ).map((img) => waitForImage(img))
                    )
                );

                if (cancelled) return;

                // Give the browser another frame to finish painting.
                await new Promise<void>((resolve) => {
                    requestAnimationFrame(() => resolve());
                });

                if (cancelled) return;

                window.print();
            } catch (error) {
                console.error("PRINT ERROR:", error);

                setPopupError(
                    error instanceof Error
                        ? error.message
                        : "Unable to prepare the print pages. Please try again."
                );

                setPrintJob(null);
                setBusyKey("");
                setIsPrinting(false);
            }
        };

        prepareAndPrint();

        return () => {
            cancelled = true;
        };
    }, [printJob, projectGroups]);

    // ==================================================
    // CLEAR PRINT STATE
    // ==================================================

    useEffect(() => {
        const handleAfterPrint = () => {
            setPrintJob(null);
            setBusyKey("");
            setIsPrinting(false);
        };

        window.addEventListener("afterprint", handleAfterPrint);

        return () => {
            window.removeEventListener("afterprint", handleAfterPrint);
        };
    }, []);

    // ==================================================
    // TOGGLE PROJECT
    // ==================================================

    const toggleProject = (projectId: string) => {
        setExpandedProjects((previous) => ({
            ...previous,
            [projectId]: !previous[projectId],
        }));
    };

    // ==================================================
    // LOADING
    // ==================================================

    if (studentsSubjectLoading) {
        return <ProjectLoading />;
    }

    // ==================================================
    // EMPTY STATE
    // ==================================================

    if (projects.length === 0 || reports.length === 0) {
        return (
            <main className="flex min-h-[75vh] flex-col items-center justify-center px-5 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <FileText size={38} />
                </div>

                <h1 className="text-2xl font-bold text-slate-900">
                    Terminal Reports
                </h1>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                    Your students' terminal report cards will appear here
                    once you have created a project and added students
                    with their subject results.
                </p>
            </main>
        );
    }

    // ==================================================
    // PAGE UI
    // ==================================================

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page {
                        size: ${printJob?.type === "results"
                            ? "A4 landscape"
                            : "A4 portrait"};
                        margin: 0;
                    }

                    html,
                    body {
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        overflow: visible !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    #easeway-print-area,
                    #easeway-print-area * {
                        visibility: visible !important;
                    }

                    #easeway-print-area {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: white !important;
                        z-index: 999999 !important;
                    }

                    #easeway-print-area .print-page {
                        display: block !important;
                        position: relative !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        break-after: page !important;
                        page-break-after: always !important;
                    }

                    #easeway-print-area .print-page:last-child {
                        break-after: auto !important;
                        page-break-after: auto !important;
                    }

                    #easeway-print-area .report-card {
                        width: 210mm !important;
                        height: 297mm !important;
                        min-height: 297mm !important;
                        max-height: 297mm !important;
                        margin: 0 !important;
                        padding: 4mm !important;
                        overflow: hidden !important;
                        box-sizing: border-box !important;
                    }

                    #easeway-print-area .class-result-sheet {
                        width: 297mm !important;
                        height: 210mm !important;
                        min-height: 210mm !important;
                        max-height: 210mm !important;
                        margin: 0 !important;
                        padding: 6mm !important;
                        overflow: hidden !important;
                        box-sizing: border-box !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">
                    {/* PAGE HEADER */}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-blue-950 via-blue-800 to-blue-700 px-5 py-7 sm:px-7">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
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
                                            Prepare professional student report
                                            cards and complete class results
                                            for each academic project.
                                        </p>
                                    </div>
                                </div>
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
                                        Projects
                                    </p>
                                    <p className="text-xl font-bold text-slate-900">
                                        {projectGroups.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PROJECT DOWNLOAD AREA */}

                    <section className="mx-auto mt-8 max-w-4xl">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                Your Projects
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Select a project to print its individual
                                student reports or complete class results.
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

                                const qualifiedCount =
                                    group.reports.filter(
                                        (report) => report.qualified
                                    ).length;

                                const notQualifiedCount =
                                    group.reports.length - qualifiedCount;

                                const printingStudents =
                                    busyKey === `${group.id}-students`;

                                const printingResults =
                                    busyKey === `${group.id}-results`;

                                return (
                                    <article
                                        key={group.id}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                                    >
                                        {/* PROJECT HEADER */}

                                        <button
                                            type="button"
                                            onClick={() => toggleProject(group.id)}
                                            className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6"
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
                                                                : "Junior High School"}
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

                                        {/* PROJECT CONTENT */}

                                        {isExpanded && (
                                            <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
                                                <div className="mb-5">
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        Academic report centre
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                                        Print individual A4
                                                        report cards for every
                                                        student or generate a
                                                        ranked class results
                                                        sheet showing subject
                                                        marks, total scores and
                                                        qualification status.
                                                    </p>
                                                </div>

                                                {/* PROJECT STATISTICS */}

                                                <div className="mb-5 grid grid-cols-3 gap-2">
                                                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                                                        <p className="text-[10px] font-medium text-slate-500">
                                                            Students
                                                        </p>
                                                        <p className="mt-1 text-lg font-bold text-slate-900">
                                                            {group.reports.length}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-3">
                                                        <p className="text-[10px] font-medium text-blue-700">
                                                            Qualified
                                                        </p>
                                                        <p className="mt-1 text-lg font-bold text-blue-900">
                                                            {qualifiedCount}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-3">
                                                        <p className="text-[10px] font-medium text-red-600">
                                                            Not Qualified
                                                        </p>
                                                        <p className="mt-1 text-lg font-bold text-red-700">
                                                            {notQualifiedCount}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* METHOD-SPECIFIC SUBJECTS */}

                                                <div className="mb-5">
                                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                        {group.method === "PRIMARY"
                                                            ? "Primary subjects in this project"
                                                            : "JHS subjects in this project"}
                                                    </p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {group.subjects.map((subject) => (
                                                            <span
                                                                key={subject.key}
                                                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600"
                                                            >
                                                                {subject.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* PRINT BUTTONS */}

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            printProject(group, "students")
                                                        }
                                                        disabled={
                                                            Boolean(busyKey) ||
                                                            group.reports.length === 0
                                                        }
                                                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {printingStudents ? (
                                                            <>
                                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                                Preparing Reports...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Printer size={17} />
                                                                Print Student Reports
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            printProject(group, "results")
                                                        }
                                                        disabled={
                                                            Boolean(busyKey) ||
                                                            group.reports.length === 0
                                                        }
                                                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm font-bold text-blue-950 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {printingResults ? (
                                                            <>
                                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-800 border-t-transparent" />
                                                                Preparing Results...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FileDown size={17} />
                                                                Print All Results
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">
                                                    Student reports: A4 portrait
                                                    {" · "}
                                                    Class results: A4 landscape
                                                    {" · "}
                                                    Choose your printer or Save as PDF
                                                </p>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </main>

            {/* ==================================================
                HIDDEN PRINT AREA
                ONLY THE SELECTED PROJECT IS RENDERED HERE
            ================================================== */}

            <div
                id="easeway-print-area"
                aria-hidden="true"
                className="pointer-events-none fixed -left-[100000px] top-0"
            >
                {printJob &&
                    projectGroups
                        .filter((group) => group.id === printJob.projectId)
                        .map((group) => (
                            <div
                                key={`${group.id}-${printJob.type}`}
                                data-print-group={group.id}
                            >
                                {printJob.type === "students" &&
                                    group.reports.map((report) => (
                                        <div
                                            key={report.id}
                                            className="print-page"
                                        >
                                            <TerminalReportCard
                                                report={report}
                                                cardRef={(element) => {
                                                    cardRefs.current[report.id] =
                                                        element;
                                                }}
                                            />
                                        </div>
                                    ))}

                                {printJob.type === "results" &&
                                    group.resultPages.map(
                                        (pageReports, pageIndex) => (
                                            <div
                                                key={`${group.id}-page-${pageIndex}`}
                                                className="print-page"
                                            >
                                                <ClassResultSheet
                                                    project={group.project}
                                                    reports={pageReports}
                                                    pageNumber={pageIndex + 1}
                                                    totalPages={
                                                        group.resultPages.length
                                                    }
                                                    sheetRef={(element) => {
                                                        sheetRefs.current[
                                                            `${group.id}-${pageIndex}`
                                                        ] = element;
                                                    }}
                                                />
                                            </div>
                                        )
                                    )}
                            </div>
                        ))}
            </div>

            {/* ERROR POPUP */}

            {popupError && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/50 p-4">
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="print-error-title"
                        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                    <AlertCircle size={22} />
                                </div>

                                <h2
                                    id="print-error-title"
                                    className="text-base font-bold text-red-800"
                                >
                                    Printing Error
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPopupError("")}
                                aria-label="Close error"
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-100 hover:text-red-700"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="px-5 py-5">
                            <p className="text-sm leading-6 text-slate-600">
                                {popupError}
                            </p>

                            <button
                                type="button"
                                onClick={() => setPopupError("")}
                                className="mt-5 w-full cursor-pointer rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
