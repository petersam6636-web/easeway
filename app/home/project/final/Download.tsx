"use client";
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useApp from "@/lib/useApp";
import { FileText,Home, ArrowRight, GraduationCap, Printer, Users, BookOpen, School, ChevronDown, X, AlertCircle, } from "lucide-react";
// ======================================================
// SUBJECT CONFIGURATION
// ======================================================
const JHS_SUBJECTS = [
    { key: "english", name: "English", shortName: "ENGLISH" },
    { key: "mathematics", name: "Mathematics", shortName: "MATHS" },
    { key: "science", name: "Science", shortName: "SCIENCE" },
    { key: "computing", name: "Computing", shortName: "COMPUTING" },
    { key: "social_studies", name: "Social Studies", shortName: "SOCIAL STUDIES" },
    { key: "creative_arts", name: "Creative Arts", shortName: "CREATIVE ARTS" },
    { key: "career_technology", name: "Career Technology", shortName: "CAREER TECH." },
    { key: "rme", name: "RME", shortName: "RME" },
    { key: "fante_twi", name: "Fante/twi", shortName: "FANTE/TWI" },
];
const PRIMARY_SUBJECTS = [
    { key: "english", name: "English", shortName: "ENGLISH" },
    { key: "mathematics", name: "Mathematics", shortName: "MATHS" },
    { key: "science", name: "Science", shortName: "SCIENCE" },
    { key: "computing", name: "Computing", shortName: "COMPUTING" },
    { key: "creative_arts", name: "Creative Arts", shortName: "CREATIVE ARTS" },
    { key: "rme", name: "RME", shortName: "RME" },
    { key: "history", name: "HIstory", shortName: "HISTORY" },
    { key: "fante_twi", name: "Fante/twi", shortName: "FANTE/TWI" },
];
function getProjectMethod(project) {
    const method = String(project?.method ??
        project?.project_method ??
        "JHS").trim().toUpperCase();
    return method.includes("PRIMARY") ? "PRIMARY" : "JHS";
}
function getProjectSubjects(method) {
    return method === "PRIMARY" ? PRIMARY_SUBJECTS : JHS_SUBJECTS;
}
function normalizeSubjectKey(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}
function getSubjectAliases(key) {
    const aliases = {
        english: ["english", "english_language"],
        mathematics: ["mathematics", "maths", "math"],
        science: ["science", "integrated_science"],
        history: ["history"],
        social_studies: ["social_studies", "social studies", "social_studies_education"],
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
];
function getGrade(mark) {
    if (mark >= 80)
        return "A";
    if (mark >= 70)
        return "B";
    if (mark >= 60)
        return "C";
    if (mark >= 45)
        return "D";
    if (mark >= 35)
        return "E";
    return "F";
}
function getRemark(mark) {
    if (mark === null || !Number.isFinite(mark))
        return "Not Graded";
    if (mark >= 80)
        return "Excellent";
    if (mark >= 70)
        return "Very Good";
    if (mark >= 60)
        return "Good";
    if (mark >= 45)
        return "Credit";
    if (mark >= 35)
        return "Pass";
    return "Fail";
}
function getGradeColor(grade) {
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
function formatDate(value) {
    if (!value)
        return "Not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return String(value);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}
function ordinal(value) {
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
function getStudentIdentity(student, index = 0) {
    const identity = student.id ??
        student.student_id ??
        student.admission_number ??
        student.full_name ??
        student.name ??
        `student-${index}`;
    return String(identity).trim().toLowerCase();
}
function getProjectIdentity(project, index = 0) {
    return String(project.id ??
        project.project_id ??
        project.header ??
        `project-${index}`);
}
function getUniqueStudents(students) {
    const uniqueStudents = new Map();
    students.forEach((student, index) => {
        const identity = getStudentIdentity(student, index);
        if (!uniqueStudents.has(identity)) {
            uniqueStudents.set(identity, student);
        }
    });
    return Array.from(uniqueStudents.values());
}
function getStudentName(student) {
    return String(student.full_name ??
        student.name ??
        student.student_name ??
        "Student");
}
function getStudentInfo(student, method) {
    const value = method === "PRIMARY"
        ? student.primary_student_data ?? student.primary_student_info
        : student.jhs_student_data ?? student.jhs_student_info;
    return Array.isArray(value) ? value[0] ?? {} : value ?? {};
}
function getProjectPassMark(project) {
    const value = project.passMark ??
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
function getStudentSubjectData(student, method) {
    if (method === "PRIMARY") {
        const primarySubjects = student.primary_subjects;
        if (primarySubjects !== null &&
            primarySubjects !== undefined &&
            (!Array.isArray(primarySubjects) || primarySubjects.length > 0)) {
            return primarySubjects;
        }
        return (student.primary_student_data ??
            student.primary_student_info ??
            {});
    }
    const jhsSubjects = student.jhs_subjects;
    if (jhsSubjects !== null &&
        jhsSubjects !== undefined &&
        (!Array.isArray(jhsSubjects) || jhsSubjects.length > 0)) {
        return jhsSubjects;
    }
    return (student.jhs_student_data ??
        student.jhs_student_info ??
        {});
}
function extractNumericMark(value, depth = 0) {
    if (depth > 6 ||
        value === null ||
        value === undefined ||
        value === "") {
        return null;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof value !== "object")
        return null;
    if (Array.isArray(value)) {
        for (const item of value) {
            const result = extractNumericMark(item, depth + 1);
            if (result !== null)
                return result;
        }
        return null;
    }
    const record = value;
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
            const result = extractNumericMark(record[key], depth + 1);
            if (result !== null)
                return result;
        }
    }
    return null;
}
function findSubjectMark(data, aliases, depth = 0) {
    if (depth > 9 || data === null || data === undefined) {
        return null;
    }
    const normalizedAliases = aliases.map(normalizeSubjectKey);
    if (Array.isArray(data)) {
        for (const item of data) {
            const result = findSubjectMark(item, aliases, depth + 1);
            if (result !== null)
                return result;
        }
        return null;
    }
    if (typeof data !== "object")
        return null;
    const record = data;
    // First check whether the subject is stored as an object key.
    for (const [storedKey, storedValue] of Object.entries(record)) {
        if (normalizedAliases.includes(normalizeSubjectKey(storedKey))) {
            const result = extractNumericMark(storedValue);
            if (result !== null)
                return result;
        }
    }
    // Then check subject records such as:
    // { subject_name: "English", mark: 80 }
    const subjectName = record.subject_name ??
        record.subjectName ??
        record.subject ??
        record.name ??
        record.title;
    if (typeof subjectName === "string" &&
        normalizedAliases.includes(normalizeSubjectKey(subjectName))) {
        const result = extractNumericMark(record);
        if (result !== null)
            return result;
    }
    // Finally search nested objects and relations.
    for (const value of Object.values(record)) {
        if (value && typeof value === "object") {
            const result = findSubjectMark(value, aliases, depth + 1);
            if (result !== null)
                return result;
        }
    }
    return null;
}
function getSubjectMark(subjectData, subjectKey) {
    return findSubjectMark(subjectData, getSubjectAliases(subjectKey));
}
function getStudentSubjectMarks(student, method) {
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
function getStudentTotal(student, method) {
    return getStudentSubjectMarks(student, method).reduce((total, subject) => total + (subject.mark ?? 0), 0);
}
// ======================================================
// SUBJECT RANKINGS
// ======================================================
function getSubjectRankings(students, method) {
    const rankings = {};
    getProjectSubjects(method).forEach((subject) => {
        const rankedStudents = students
            .map((student) => ({
            student,
            mark: getSubjectMark(getStudentSubjectData(student, method), subject.key),
        }))
            .filter((item) => item.mark !== null)
            .sort((a, b) => b.mark - a.mark);
        rankings[subject.key] = new Map();
        rankedStudents.forEach(({ student }, index) => {
            rankings[subject.key].set(student, index + 1);
        });
    });
    return rankings;
}
// ======================================================
// BUILD REPORTS
// ======================================================
function buildReports(projects) {
    const reports = [];
    projects.forEach((project, projectIndex) => {
        const method = getProjectMethod(project);
        const rawStudents = Array.isArray(project.students)
            ? project.students
            : [];
        const students = getUniqueStudents(rawStudents);
        const school = project.school_data ?? {};
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
            const subjects = marks.map((subject) => ({
                ...subject,
                position: subject.mark !== null
                    ? subjectRankings[subject.key]?.get(student) ?? null
                    : null,
                grade: subject.mark !== null
                    ? getGrade(subject.mark)
                    : "—",
            }));
            const availableSubjects = subjects.filter((subject) => subject.mark !== null);
            const maximum = availableSubjects.length * 100;
            const average = availableSubjects.length > 0
                ? total / availableSubjects.length
                : 0;
            const qualified = availableSubjects.length > 0 && total >= passMark;
            const projectIdentity = getProjectIdentity(project, projectIndex);
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
                overallGrade: availableSubjects.length > 0
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
function getAdditionalStudentDetails(student, studentInfo) {
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
    const details = [];
    for (const field of possibleFields) {
        let value = null;
        for (const key of field.keys) {
            value = studentInfo?.[key] ?? student?.[key];
            if (value !== null && value !== undefined && value !== "") {
                break;
            }
        }
        if (value === null || value === undefined || value === "") {
            continue;
        }
        if (Array.isArray(value))
            value = value.join(", ");
        if (typeof value === "object")
            continue;
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
function waitForImage(img) {
    return new Promise((resolve) => {
        const finish = () => resolve(undefined);
        if (img.complete) {
            if (typeof img.decode === "function") {
                img.decode().catch(() => { }).finally(finish);
            }
            else {
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
function SchoolLogo({ src }) {
    return (<div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-blue-900 bg-white p-1">
            {src ? (<img src={src} alt="School logo" crossOrigin="anonymous" className="h-full w-full rounded-full object-cover"/>) : (<GraduationCap size={21} className="text-blue-900"/>)}
        </div>);
}
// ======================================================
// INDIVIDUAL STUDENT REPORT CARD
// COMPACT A4 PORTRAIT
// ======================================================
function TerminalReportCard({ report, cardRef, }) {
    const { project, school, student, studentInfo, subjects, total, maximum, average, overallGrade, overallPosition, projectStudentCount, method, passMark, qualified, } = report;
    const schoolName = school.school_name ?? project.header ?? project.name ?? "School Name";
    const schoolLogo = String(school.logo_image ?? project.school_logo ?? "");
    const studentName = getStudentName(student);
    const studentClass = student.class_name ?? student.class ?? student.current_class ?? student.grade ?? studentInfo.class_name ?? studentInfo.class ?? "Not specified";
    const studentId = student.student_id ?? student.admission_number ?? student.id ?? "Not specified";
    const term = project.term ?? project.academic_term ?? school.term ?? "Not specified";
    const academicYear = project.academic_year ?? school.academic_year ?? "";
    const reopeningDate = project.reopening_date ?? project.re_opening_date ?? project.reopen_date ?? school.reopening_date ?? school.re_opening_date;
    const vacationDate = project.vacation_date ?? project.vacation ?? school.vacation_date;
    const region = school.location ?? project.location ?? "Not specified";
    const attendance = studentInfo.attendance;
    const attitude = studentInfo.attitude ?? studentInfo.behaviour;
    const interest = studentInfo.interest;
    const teacherRemark = studentInfo.teacher_remark ?? studentInfo.class_teacher_remark ?? studentInfo.remarks ?? student.teacher_remark ?? "";
    const headTeacherRemark = studentInfo.head_teacher_remark ?? student.head_teacher_remark ?? "";
    const additionalDetails = getAdditionalStudentDetails(student, studentInfo);
    const profileDetails = [
        ...additionalDetails,
        ...[
            { label: "Guardian", value: studentInfo.guardian ?? studentInfo.guardian_name ?? studentInfo.parent_name },
            { label: "Guardian Contact", value: studentInfo.guardian_contact ?? studentInfo.guardian_phone ?? studentInfo.parent_phone },
        ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "")
    ].filter((item, index, all) => all.findIndex((other) => other.label === item.label) === index);
    return (<div ref={cardRef} data-report-id={report.id} className="report-card relative mx-auto box-border flex h-[345.35mm] w-[244.2mm] flex-col overflow-hidden bg-white p-[5mm] text-slate-900" style={{ fontFamily: "Arial, sans-serif", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
            <div className="pointer-events-none absolute inset-[3mm] border-2 border-blue-950/80"/>
            {schoolLogo && (<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <img src={schoolLogo} alt="" crossOrigin="anonymous" className="h-[105mm] w-[105mm] rounded-full object-contain opacity-[0.035]"/>
                </div>)}

            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                <header className="shrink-0 border-b-2 border-blue-950 pb-4 text-center">
                    <div className="flex items-center justify-center gap-4">
                        {schoolLogo ? (<img src={schoolLogo} alt="School logo" crossOrigin="anonymous" className="h-[22mm] w-[22mm] shrink-0 rounded-full border border-slate-200 bg-white object-cover"/>) : (<div className="flex h-[22mm] w-[22mm] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-blue-950"><GraduationCap size={38}/></div>)}
                        <div className="min-w-0 flex-1">
                            <h1 className="break-words text-[22px] font-extrabold uppercase tracking-wide text-blue-950">{schoolName}</h1>
                            {region && <p className="mt-1 text-[11px] text-slate-600">{region}</p>}
                            <div className="mt-3 inline-block rounded-md bg-blue-950 px-10 py-2 text-white">
                                <h2 className="text-[15px] font-extrabold uppercase tracking-[0.2em]">Terminal Report</h2>
                            </div>
                            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-700">{method === "PRIMARY" ? "Primary School" : "Junior High School"}</p>
                        </div>
                        {schoolLogo ? <img src={schoolLogo} alt="School logo" crossOrigin="anonymous" className="h-[22mm] w-[22mm] shrink-0 rounded-full border border-slate-200 bg-white object-cover"/> : <div className="h-[22mm] w-[22mm]"/>}
                    </div>
                </header>

                <section className="mt-4 grid grid-cols-4 gap-3 border-b border-slate-300 pb-3 text-[11px]">
                    <div><p className="text-slate-500">Term</p><p className="font-bold text-slate-900">{term}</p></div>
                    <div><p className="text-slate-500">Academic Year</p><p className="font-bold text-slate-900">{academicYear || (vacationDate ? new Date(String(vacationDate)).getFullYear() : "Not specified")}</p></div>
                    <div><p className="text-slate-500">Reopening Date</p><p className="font-bold text-slate-900">{formatDate(reopeningDate)}</p></div>
                    <div><p className="text-slate-500">Vacation Date</p><p className="font-bold text-slate-900">{formatDate(vacationDate)}</p></div>
                </section>

                <section className="mt-4 grid grid-cols-4 gap-3 rounded-lg border border-slate-300 p-3 text-[11px]">
                    <div className="col-span-2"><p className="text-slate-500">Student Name</p><p className="mt-1 font-extrabold uppercase text-slate-950">{studentName}</p></div>
                    <div><p className="text-slate-500">Overall Position</p><p className="mt-1 font-extrabold text-blue-950">{ordinal(overallPosition)} of {projectStudentCount}</p></div>
                    <div><p className="text-slate-500">Assessment</p><p className="mt-1 font-bold text-slate-900">Terminal Assessment</p></div>
                    <div><p className="text-slate-500">Method</p><p className="mt-1 font-bold text-slate-900">{method === "PRIMARY" ? "Primary" : "JHS"}</p></div>
                </section>

                <section className="mt-5 shrink-0">
                    <h3 className="mb-2 text-center text-sm font-extrabold uppercase tracking-wider text-blue-950">Academic Performance</h3>
                    <table className="w-full border-collapse text-[11px]">
                        <thead><tr className="bg-blue-950 text-white">
                            <th className="border border-blue-950 px-3 py-2 text-left">Subject</th>
                            <th className="border border-blue-800 px-2 py-2 text-center">Marks</th>
                            <th className="border border-blue-800 px-2 py-2 text-center">Position</th>
                            <th className="border border-blue-800 px-2 py-2 text-center">Grade</th>
                            <th className="border border-blue-800 px-2 py-2 text-center">Remarks</th>
                        </tr></thead>
                        <tbody>{subjects.map((item) => (<tr key={item.key}>
                                <td className="border border-slate-300 px-3 py-[7px] font-semibold text-slate-800">{item.name}</td>
                                <td className="border border-slate-300 px-2 py-[7px] text-center font-bold text-slate-900">{item.mark ?? "-"}</td>
                                <td className="border border-slate-300 px-2 py-[7px] text-center text-slate-700">{item.position !== null ? ordinal(item.position) : "-"}</td>
                                <td className={`border border-slate-300 px-2 py-[7px] text-center font-bold ${getGradeColor(item.grade)}`}>{item.grade}</td>
                                <td className="border border-slate-300 px-2 py-[7px] text-center font-semibold text-slate-700">{getRemark(item.mark)}</td>
                            </tr>))}</tbody>
                    </table>
                </section>

                <section className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-center">
                    <div className="border-r border-slate-200 p-3"><p className="text-[10px] font-semibold text-slate-500">TOTAL SCORE</p><p className="mt-1 text-lg font-extrabold">{total}/{maximum}</p></div>
                    <div className="border-r border-slate-200 p-3"><p className="text-[10px] font-semibold text-slate-500">AVERAGE</p><p className="mt-1 text-lg font-extrabold">{average.toFixed(1)}%</p></div>
                    <div className="p-3"><p className="text-[10px] font-semibold text-slate-500">OVERALL REMARK</p><p className="mt-1 text-base font-extrabold">{getRemark(subjects.some((item) => item.mark !== null) ? average : null)}</p></div>
                </section>

                <section className="mt-3 flex items-center justify-between rounded-lg border-2 border-blue-950 p-3 text-[11px]">
                    <div><p className="font-bold uppercase text-blue-950">Project Qualification</p><p className="mt-1 text-slate-500">Required pass mark: {passMark}</p></div>
                    <span className={`rounded px-4 py-2 font-extrabold uppercase tracking-wider text-white ${qualified ? "bg-blue-950" : "bg-red-600"}`}>{qualified ? "QUALIFIED" : "NOT QUALIFIED"}</span>
                </section>

                <section className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-slate-300 p-3">
                        <h3 className="mb-2 inline-block rounded bg-blue-950 px-3 py-1 text-[10px] font-bold uppercase text-white">Grading Key</h3>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-[10px]">{GRADE_SCALE.map((item) => <div key={item.grade} className="flex justify-between gap-2 border-b border-slate-100 py-1"><span>{item.min}–{item.max}</span><span className="font-semibold">{item.grade} - {item.description}</span></div>)}</div>
                    </div>
                    <div className="rounded-lg border border-slate-300 p-3">
                        <h3 className="mb-2 inline-block rounded bg-blue-950 px-3 py-1 text-[10px] font-bold uppercase text-white">Other Areas of Assessment</h3>
                        <div className="space-y-2 text-[10px]">
                            <div className="grid grid-cols-[125px_10px_1fr]"><span className="font-semibold uppercase">Attendance</span><span>:</span><span>{attendance ?? "Not recorded"}{attendance !== null && attendance !== undefined && !String(attendance).includes("%") ? "%" : ""}</span></div>
                            <div className="grid grid-cols-[125px_10px_1fr]"><span className="font-semibold uppercase">Attitude / Behaviour</span><span>:</span><span className="uppercase">{attitude ?? "Not recorded"}</span></div>
                            <div className="grid grid-cols-[125px_10px_1fr]"><span className="font-semibold uppercase">Interest</span><span>:</span><span className="uppercase">{Array.isArray(interest) ? interest.join(", ") : interest ?? "Not recorded"}</span></div>
                            <div className="grid grid-cols-[125px_10px_1fr]"><span className="font-semibold uppercase">Vacation Date</span><span>:</span><span>{formatDate(vacationDate)}</span></div>
                        </div>
                    </div>
                </section>

                {profileDetails.length > 0 && <section className="mt-4 rounded-lg border border-slate-300 p-3">
                    <h3 className="mb-2 text-[10px] font-extrabold uppercase text-blue-950">Student Information</h3>
                    <div className="grid grid-cols-4 gap-3 text-[10px]">{profileDetails.map((field) => <div key={field.label}><p className="font-semibold text-slate-500">{field.label}</p><p className="mt-1 font-bold text-slate-900">{String(field.value)}</p></div>)}</div>
                </section>}

                {(teacherRemark || headTeacherRemark) && <section className="mt-4 grid grid-cols-2 gap-3 text-[10px]">
                    <div className="rounded-lg border border-slate-300 p-3"><p className="mb-1 font-bold uppercase text-blue-950">Class Teacher's Remark</p><p className="min-h-[28px]">{teacherRemark || " "}</p></div>
                    <div className="rounded-lg border border-slate-300 p-3"><p className="mb-1 font-bold uppercase text-blue-950">Head Teacher's Remark</p><p className="min-h-[28px]">{headTeacherRemark || " "}</p></div>
                </section>}

                <section className="mt-auto grid grid-cols-3 gap-8 px-5 pb-2 pt-8 text-center text-[10px]">
                    <div className="border-t border-slate-500 pt-2 font-semibold">Class Teacher's Signature</div>
                    <div className="border-t border-slate-500 pt-2 font-semibold">Head Teacher's Signature</div>
                    <div className="border-t border-slate-500 pt-2 font-semibold">Parent / Guardian</div>
                </section>
                <footer className="shrink-0 border-t border-blue-200 pt-2 text-center text-[8px] font-semibold uppercase tracking-wider text-slate-400">Generated by Easeway School Management</footer>
            </div>
        </div>);
}
// ======================================================
// CLASS RESULTS SHEET
// A4 LANDSCAPE
// ======================================================
function ClassResultSheet({ project, reports, pageNumber, totalPages, sheetRef, }) {
    const method = getProjectMethod(project);
    const school = project.school_data ?? {};
    const passMark = getProjectPassMark(project);
    const subjects = getProjectSubjects(method);
    const schoolName = school.school_name ??
        project.header ??
        project.name ??
        "SCHOOL NAME";
    const projectName = project.header ??
        project.name ??
        `${method} Project`;
    const schoolLogo = String(school.logo_image ??
        project.school_logo ??
        "");
    const term = project.term ??
        project.academic_term ??
        school.term ??
        "Not specified";
    const academicYear = project.academic_year ??
        school.academic_year ??
        "";
    // Calculate column widths so the table is exactly 100% wide.
    const subjectColumnWidth = (100 - 4 - 18 - 6 - 5 - 10) / subjects.length;
    return (<div ref={sheetRef} className="class-result-sheet relative box-border h-[210mm] min-h-[210mm] w-[297mm] overflow-hidden bg-white p-[6mm] text-slate-900" style={{
            fontFamily: "Arial, sans-serif",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
        }}>
            <div className="flex h-full flex-col border-2 border-blue-950 p-2.5">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-blue-950 pb-2">
                    <div className="flex min-w-0 items-center gap-2">
                        {schoolLogo ? (<img src={schoolLogo} alt="School logo" crossOrigin="anonymous" className="h-10 w-10 shrink-0 rounded-full border-2 border-blue-900 object-cover"/>) : (<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-blue-900">
                                <GraduationCap size={21} className="text-blue-900"/>
                            </div>)}

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
                        {academicYear && (<p className="mt-0.5">
                                <strong>Academic Year:</strong> {academicYear}
                            </p>)}
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
                            <col style={{ width: "4%" }}/>
                            <col style={{ width: "18%" }}/>

                            {subjects.map((subject) => (<col key={subject.key} style={{
                width: `${subjectColumnWidth}%`,
            }}/>))}

                            <col style={{ width: "6%" }}/>
                            <col style={{ width: "5%" }}/>
                            <col style={{ width: "10%" }}/>
                        </colgroup>

                        <thead>
                            <tr className="bg-blue-950 text-white">
                                <th className="border border-blue-800 px-0.5 py-1.5 text-center">
                                    POS.
                                </th>

                                <th className="border border-blue-800 px-1 py-1.5 text-left">
                                    STUDENT NAME
                                </th>

                                {subjects.map((subject) => (<th key={subject.key} className="break-words border border-blue-800 px-0.5 py-1 text-center">
                                        {subject.shortName}
                                    </th>))}

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
                            {reports.map((report, index) => (<tr key={report.id}>
                                    <td className="border border-slate-300 px-0.5 py-1.5 text-center font-bold">
                                        {ordinal((pageNumber - 1) * 14 + index + 1)}
                                    </td>

                                    <td className="break-words border border-slate-300 px-1 py-1.5 font-semibold uppercase">
                                        {getStudentName(report.student)}
                                    </td>

                                    {subjects.map((subject) => {
                const mark = report.subjects.find((item) => item.key === subject.key)?.mark;
                return (<td key={subject.key} className="border border-slate-300 px-0.5 py-1.5 text-center">
                                                {mark ?? "—"}
                                            </td>);
            })}

                                    <td className="border border-slate-300 px-0.5 py-1.5 text-center font-extrabold">
                                        {report.total}
                                    </td>

                                    <td className={`border border-slate-300 px-0.5 py-1.5 text-center font-bold ${getGradeColor(report.overallGrade)}`}>
                                        {report.overallGrade}
                                    </td>

                                    <td className={`border border-slate-300 px-0.5 py-1.5 text-center font-extrabold ${report.qualified
                ? "text-blue-800"
                : "text-red-600"}`}>
                                        {report.qualified
                ? "QUALIFIED"
                : "NOT QUALIFIED"}
                                    </td>
                                </tr>))}

                            {reports.length === 0 && (<tr>
                                    <td colSpan={subjects.length + 5} className="border border-slate-300 px-3 py-8 text-center text-slate-500">
                                        No student results available.
                                    </td>
                                </tr>)}
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
        </div>);
}
// ======================================================
// SPLIT RESULTS INTO PAGES
// ======================================================
function splitIntoPages(items, pageSize) {
    const pages = [];
    for (let index = 0; index < items.length; index += pageSize) {
        pages.push(items.slice(index, index + pageSize));
    }
    return pages;
}
// ======================================================
// MAIN PAGE
// ======================================================


export default function FetchStudentsSubject() {
    const { studentsSubject, studentsSubjectLoading, projectId } = useApp();

    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [projectResolved, setProjectResolved] = useState(false);
    const [busyKey, setBusyKey] = useState("");
    const [printJob, setPrintJob] = useState<any>(null);
    const [popupError, setPopupError] = useState("");
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const sheetRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Resolve ONLY the project selected on the Home page.
    // studentsSubject already contains the project with its related
    // students, school_data and method-specific student information.
    useEffect(() => {
        let active = true;

        setProjectResolved(false);

        if (!projectId) {
            setSelectedProject(null);
            setExpandedProjectId(null);
            setProjectResolved(true);
            return () => {
                active = false;
            };
        }

        if (studentsSubjectLoading) {
            return () => {
                active = false;
            };
        }

        const allProjects = Array.isArray(studentsSubject)
            ? studentsSubject
            : [];

        const matchedProject = allProjects.find((project) =>
            String(project?.id ?? project?.project_id ?? "") === String(projectId)
        ) ?? null;

        if (active) {
            setSelectedProject(matchedProject);
            setExpandedProjectId(
                matchedProject
                    ? String(matchedProject.id ?? matchedProject.project_id)
                    : null
            );
            setProjectResolved(true);
        }

        return () => {
            active = false;
        };
    }, [projectId, studentsSubject, studentsSubjectLoading]);

    // Every calculation and print action below receives a one-project array.
    // No other project can enter the report calculations or print area.
    const projects = useMemo(
        () => selectedProject ? [selectedProject] : [],
        [selectedProject]
    );

    const reports = useMemo(() => buildReports(projects), [projects]);
    // ==================================================
    // GROUP REPORTS BY PROJECT
    // ==================================================
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
                resultPages: splitIntoPages(projectReports, 14),
            };
        });
    }, [projects, reports]);
    // ==================================================
    // PRINT SELECTED PROJECT
    // ==================================================
const printProject = (group, type, studentId = "") => {
    if (busyKey || isPrinting) return;

    if (group.reports.length === 0) {
        setPopupError("There are no student results available to print.");
        return;
    }

    setPopupError("");
    setBusyKey(`${group.id}-${type}`);

    setPrintJob({
        projectId: group.id,
        type,
        studentId,
    });
};
    // ==================================================
    // PREPARE PRINT CONTENT
    // ==================================================
    useEffect(() => {
        if (!printJob)
            return;
        let cancelled = false;
        const prepareAndPrint = async () => {
            try {
                setIsPrinting(true);
                // Wait for the hidden print content to render.
                await new Promise((resolve) => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => resolve(undefined));
                    });
                });
                if (cancelled)
                    return;
                const group = projectGroups.find((item) => item.id === printJob.projectId);
                if (!group) {
                    throw new Error("The selected project could not be found.");
                }
                const selectedStudentReports = printJob.type === "student"
                    ? group.reports.filter((report) => getStudentIdentity(report.student) === printJob.studentId)
                    : group.reports;
                const elements = printJob.type === "students" || printJob.type === "student"
                    ? selectedStudentReports.map((report) => cardRefs.current[report.id])
                    : group.resultPages.map((_, pageIndex) => sheetRefs.current[`${group.id}-${pageIndex}`]);
                const validElements = elements.filter((element) => Boolean(element));
                if (validElements.length === 0) {
                    throw new Error("The print pages could not be prepared.");
                }
                await document.fonts.ready;
                await Promise.all(validElements.flatMap((element) => Array.from(element.querySelectorAll("img")).map((img) => waitForImage(img))));
                if (cancelled)
                    return;
                // Give the browser another frame to finish painting.
                await new Promise((resolve) => {
                    requestAnimationFrame(() => resolve(undefined));
                });
                if (cancelled)
                    return;
                window.print();
            }
            catch (error) {
                console.error("PRINT ERROR:", error);
                setPopupError(error instanceof Error
                    ? error.message
                    : "Unable to prepare the print pages. Please try again.");
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
    const toggleProject = (projectId) => {
        setExpandedProjectId((current) => current === projectId ? null : projectId);
    };
    // ==================================================
    // LOADING
    // ==================================================
    if (studentsSubjectLoading || !projectResolved) {
        return (<main className="flex min-h-[75vh] items-center justify-center px-5">
                <div className="flex flex-col items-center gap-3 text-center">
                    <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-900"/>
                    <p className="text-sm font-semibold text-slate-600">
                        Loading student reports...
                    </p>
                </div>
            </main>);
    }
    // ==================================================
    // EMPTY STATE
    // ==================================================
    if (!selectedProject) {
        return (
<main className="flex min-h-[75vh] flex-col items-center justify-center px-5 py-10 text-center">
    {/* ICON */}

    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
        <GraduationCap size={40} strokeWidth={1.8} />
    </div>

    {/* HEADING */}

    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        We're Preparing Your Report Card
    </h1>

    {/* DESCRIPTION */}

    <p className="mt-3 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
        Your report card is currently being prepared. Please return to your
        homepage and <b>come back right now</b> by selecting the correct project or the first  project to
        view your completed report.
    </p>

    {/* STATUS */}

    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
        Report card preparation in progress
    </div>

    {/* HOME BUTTON */}

    <Link
        href="/home"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30"
    >
        <Home size={18} />
        Return to Homepage
        <ArrowRight size={17} />
    </Link>

    <p className="mt-4 text-xs text-slate-400">
        Thank you for your patience.
    </p>
</main>
);
    }

    if (reports.length === 0) {
        return (<main className="flex min-h-[75vh] flex-col items-center justify-center px-5 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <FileText size={38}/>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                    No Student Reports Yet
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                    This project was found, but it does not contain students with report data yet.
                </p>
            </main>);
    }
    // ==================================================
    // PAGE UI
    // ==================================================
    return (<>
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
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        box-shadow: none !important;
                        break-after: page !important;
                        page-break-after: always !important;
                    }

                    #easeway-print-area .print-page:last-child {
                        break-after: auto !important;
                        page-break-after: auto !important;
                    }

                    #easeway-print-area .print-page-results {
                        width: 297mm !important;
                        height: 210mm !important;
                    }

                    #easeway-print-area .report-card {
                        position: relative !important;
                        width: 244.2mm !important;
                        height: 345.35mm !important;
                        min-height: 345.35mm !important;
                        max-height: 345.35mm !important;
                        margin: 0 !important;
                        padding: 5mm !important;
                        overflow: hidden !important;
                        box-sizing: border-box !important;
                        zoom: 0.86 !important;
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
                                        <GraduationCap size={27}/>
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
                                            for the project you selected.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SUMMARY */}

                        <div className="grid grid-cols-2 divide-x divide-slate-200">
                            <div className="flex items-center justify-center gap-3 px-5 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                                    <Users size={20}/>
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
                                    <BookOpen size={20}/>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Selected Project
                                    </p>
                                    <p className="text-xl font-bold text-slate-900">
                                        {projectGroups.length ? "1" : "0"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PROJECT DOWNLOAD AREA */}

                    <section className="mx-auto mt-8 max-w-4xl">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                Selected Project
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Only this project’s students, school details and academic results are shown here.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {projectGroups
            .filter((group) => !expandedProjectId || group.id === expandedProjectId)
            .map((group) => {
            const project = group.project;
            const projectName = project.header ??
                project.name ??
                "Untitled Project";
            const projectClass = project.class_name ??
                project.class ??
                project.grade ??
                "";
            const isExpanded = expandedProjectId === group.id;
            const qualifiedCount = group.reports.filter((report) => report.qualified).length;
            const notQualifiedCount = group.reports.length - qualifiedCount;
            const printingStudents = busyKey === `${group.id}-students`;
            const printingResults = busyKey === `${group.id}-results`;
            return (<article key={group.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                                        {/* PROJECT HEADER */}

                                        <button type="button" onClick={() => toggleProject(group.id)} className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                                    <School size={23}/>
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

                                                        {projectClass && (<span>
                                                                Class: {projectClass}
                                                            </span>)}

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

                                                <ChevronDown size={20} className={`text-slate-400 transition-transform ${isExpanded
                    ? "rotate-180"
                    : ""}`}/>
                                            </div>
                                        </button>

                                        {/* PROJECT CONTENT */}

                                        {isExpanded && (<div className="border-t border-slate-100 px-5 py-5 sm:px-6">
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
                                                        {group.subjects.map((subject) => (<span key={subject.key} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                                                                {subject.name}
                                                            </span>))}
                                                    </div>
                                                </div>

                                                {/* INDIVIDUAL STUDENT PRINTING */}

                        

                                                {/* PRINT BUTTONS */}

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <button type="button" onClick={() => printProject(group, "students", "")} disabled={Boolean(busyKey) ||
                        group.reports.length === 0} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                                                        {printingStudents ? (<>
                                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                                                                Preparing Reports...
                                                            </>) : (<>
                                                                <Printer size={17}/>
                                                                Print Student Reports
                                                            </>)}
                                                    </button>

                                                    <button type="button" onClick={() => printProject(group, "results", "")} disabled={Boolean(busyKey) ||
                        group.reports.length === 0} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm font-bold text-blue-950 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">
                                                        {printingResults ? (<>
                                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-800 border-t-transparent"/>
                                                                Preparing Results...
                                                            </>) : (<>
                                                                <Printer size={17}/>
                                                                Print All Results
                                                            </>)}
                                                    </button>
                                                </div>

                                                <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">
                                                    Student reports: A4 portrait
                                                    {" · "}
                                                    Class results: A4 landscape
                                                    {" · "}
                                                    Use your printer to print the selected project
                                                </p>
                                            </div>)}
                                    </article>);
        })}
                        </div>
                    </section>
                </div>
            </main>

            {/* ==================================================
            HIDDEN PRINT AREA
            ONLY THE SELECTED PROJECT IS RENDERED HERE
        ================================================== */}

            <div id="easeway-print-area" aria-hidden="true" className="pointer-events-none fixed -left-[100000px] top-0">
                {printJob &&
            projectGroups
                .filter((group) => group.id === printJob.projectId)
                .map((group) => (<div key={`${group.id}-${printJob.type}`} data-print-group={group.id}>
                                {(printJob.type === "students" || printJob.type === "student") &&
                    group.reports
                        .filter((report) => printJob.type === "students" || getStudentIdentity(report.student) === printJob.studentId)
                        .map((report) => (<div key={report.id} className="print-page">
                                            <TerminalReportCard report={report} cardRef={(element) => {
                            cardRefs.current[report.id] =
                                element;
                        }}/>
                                        </div>))}

                                {printJob.type === "results" &&
                    group.resultPages.map((pageReports, pageIndex) => (<div key={`${group.id}-page-${pageIndex}`} className="print-page print-page-results">
                                                <ClassResultSheet project={group.project} reports={pageReports} pageNumber={pageIndex + 1} totalPages={group.resultPages.length} sheetRef={(element) => {
                            sheetRefs.current[`${group.id}-${pageIndex}`] = element;
                        }}/>
                                            </div>))}
                            </div>))}
            </div>

            {/* ERROR POPUP */}

            {popupError && (<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/50 p-4">
                    <div role="alertdialog" aria-modal="true" aria-labelledby="print-error-title" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                    <AlertCircle size={22}/>
                                </div>

                                <h2 id="print-error-title" className="text-base font-bold text-red-800">
                                    Printing Error
                                </h2>
                            </div>

                            <button type="button" onClick={() => setPopupError("")} aria-label="Close error" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-100 hover:text-red-700">
                                <X size={19}/>
                            </button>
                        </div>

                        <div className="px-5 py-5">
                            <p className="text-sm leading-6 text-slate-600">
                                {popupError}
                            </p>

                            <button type="button" onClick={() => setPopupError("")} className="mt-5 w-full cursor-pointer rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800">
                                Close
                            </button>
                        </div>
                    </div>
                </div>)}
        </>);
}
