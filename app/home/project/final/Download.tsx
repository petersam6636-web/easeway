
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useApp from "@/lib/useApp";
import ProjectLoading from "@/component/Loading";
import {
    Download,
    FileText,
    GraduationCap,
    Printer,
    Users,
} from "lucide-react";

// ==========================================
// SUBJECT CONFIGURATION
// ==========================================

const SUBJECT_NAMES = {
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

const SUBJECT_ORDER = [
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
// HELPER FUNCTIONS
// ==========================================

function getGrade(mark) {
    if (mark >= 80) return "HIGHEST";
    if (mark >= 70) return "HIGH";
    if (mark >= 60) return "AVERAGE";
    if (mark >= 50) return "PASS";
    return "FAIL";
}

function getGradeColor(grade) {
    switch (grade) {
        case "HIGHEST":
            return "text-blue-800";
        case "HIGH":
            return "text-blue-700";
        case "AVERAGE":
            return "text-slate-700";
        case "PASS":
            return "text-amber-700";
        default:
            return "text-red-600";
    }
}

function formatDate(value) {
    if (!value) return "Not specified";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function getStudentInfo(student, method) {
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

function getStudentSubjects(student, method) {
    const subjects =
        method.toLowerCase() === "primary"
            ? student.primary_subjects
            : student.jhs_subjects;

    if (!Array.isArray(subjects)) return {};

    return subjects.reduce(
        (result, subject) => ({
            ...result,
            ...subject,
        }),
        {}
    );
}

function getStudentSubjectMarks(student, method) {
    const subjectData = getStudentSubjects(student, method);

    return SUBJECT_ORDER
        .filter((key) => {
            const value = subjectData[key];

            return (
                value !== null &&
                value !== undefined &&
                value !== "" &&
                Number.isFinite(Number(value))
            );
        })
        .map((key) => ({
            key,
            name: SUBJECT_NAMES[key] ?? key,
            mark: Number(subjectData[key]),
        }));
}

function getPosition(mark, subjectKey, students, method) {
    const marks = students
        .map((student) => {
            const subjectData = getStudentSubjects(student, method);

            return Number(subjectData[subjectKey]);
        })
        .filter((value) => Number.isFinite(value));

    const higherMarks = marks.filter(
        (value) => value > mark
    ).length;

    return higherMarks + 1;
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

function getRemarks(average, studentName) {
    if (average >= 80) {
        return `${studentName} has demonstrated excellent academic performance this term. Keep up the outstanding work!`;
    }

    if (average >= 70) {
        return `${studentName} has performed very well this term. Continue working hard to achieve even greater results.`;
    }

    if (average >= 60) {
        return `${studentName} has shown good progress. More effort and consistency will lead to better results.`;
    }

    if (average >= 50) {
        return `${studentName} has made satisfactory progress. More dedication and regular practice are encouraged.`;
    }

    return `${studentName} needs to put in more effort and receive additional support to improve academic performance.`;
}

// ==========================================
// BUILD STUDENT REPORTS
// ==========================================

function buildReports(projects) {
    const reports = [];

    projects.forEach((project) => {
        const method = String(project.method ?? "jhs").toLowerCase();

        const students = Array.isArray(project.students)
            ? project.students
            : [];

        const school = project.school_data ?? {};

        students.forEach((student) => {
            const studentInfo = getStudentInfo(student, method);

            const marks = getStudentSubjectMarks(student, method);

            const subjects = marks.map((subject) => ({
                ...subject,
                position: getPosition(
                    subject.mark,
                    subject.key,
                    students,
                    method
                ),
                grade: getGrade(subject.mark),
            }));

            const total = subjects.reduce(
                (sum, subject) => sum + subject.mark,
                0
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
            });
        });
    });

    return reports;
}

// ==========================================
// REPORT CARD COMPONENT
// ==========================================

function TerminalReportCard({ report, cardRef }) {
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
    } = report;

    const schoolName =
        school.school_name ??
        project.header ??
        "SCHOOL NAME";

    const schoolLogo =
        school.logo_image ??
        project.school_logo ??
        "";

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

    const gender = student.gender ?? "Not specified";

    const dateOfBirth =
        student.date_of_birth ??
        student.dob ??
        "Not specified";

    return (
        <div
            ref={cardRef}
            className="relative mx-auto box-border min-h-[297mm] w-[210mm] overflow-hidden bg-white p-[9mm] text-slate-900 shadow-xl"
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
                        className="h-[115mm] w-[115mm] object-contain opacity-[0.055]"
                    />
                </div>
            )}

            {/* CARD CONTENT */}

            <div className="relative z-10 flex min-h-[279mm] flex-col">

                {/* SCHOOL HEADER */}

                <header className="border-b-2 border-blue-950 pb-3">

                    <div className="grid grid-cols-[75px_1fr_75px] items-center gap-3">

                        <div className="flex h-[68px] w-[68px] items-center justify-center">
                            {schoolLogo && (
                                <img
                                    src={schoolLogo}
                                    alt="School logo"
                                    crossOrigin="anonymous"
                                    className="h-full w-full object-contain"
                                />
                            )}
                        </div>

                        <div className="text-center">
                            <h1 className="text-[23px] font-extrabold uppercase tracking-wide text-blue-950">
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

                        <div className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full border border-blue-900 bg-white text-center">
                            <span className="text-xl">🇬🇭</span>
                            <span className="text-[8px] font-bold text-blue-950">
                                GHANA
                            </span>
                        </div>
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

                <section className="mt-4 overflow-hidden rounded-md border border-blue-900 text-[11px]">

                    <div className="grid grid-cols-[190px_1fr] border-b border-blue-300">
                        <div className="bg-blue-50 px-3 py-2 font-bold uppercase text-blue-950">
                            Student Name
                        </div>

                        <div className="px-3 py-2 font-bold uppercase">
                            {studentName}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-blue-300 border-b border-blue-300">

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
                                Gender:
                            </span>{" "}
                            {gender}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-blue-300">

                        <div className="px-3 py-2">
                            <span className="font-bold text-blue-950">
                                Date of Birth:
                            </span>{" "}
                            {formatDate(dateOfBirth)}
                        </div>

                        <div className="px-3 py-2">
                            <span className="font-bold text-blue-950">
                                Project Method:
                            </span>{" "}
                            {project.method}
                        </div>
                    </div>
                </section>

                {/* SUBJECT PERFORMANCE TABLE */}

                <section className="mt-5">

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
                                        {ordinal(subject.position)}
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
                                    Aggregate
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

                <section className="mt-5 grid grid-cols-[0.8fr_1.5fr] gap-4">

                    {/* GRADE KEY */}

                    <div className="rounded-md border border-slate-400 p-3">

                        <h3 className="mb-2 inline-block rounded bg-blue-950 px-3 py-1 text-[11px] font-bold uppercase text-white">
                            Grade Key
                        </h3>

                        {[
                            ["80 – 100", "HIGHEST"],
                            ["70 – 79", "HIGH"],
                            ["60 – 69", "AVERAGE"],
                            ["50 – 59", "PASS"],
                            ["0 – 49", "FAIL"],
                        ].map(([range, grade]) => (
                            <div
                                key={grade}
                                className="flex justify-between border-b border-slate-200 py-1 text-[10px]"
                            >
                                <span>{range}</span>
                                <span className="font-semibold">
                                    {grade}
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

                {/* REMARKS */}

                <section className="mt-4 rounded-md border border-blue-900 p-3">

                    <h3 className="-mt-5 mb-2 inline-block rounded bg-blue-950 px-3 py-1 text-[11px] font-bold uppercase text-white">
                        Class Teacher's Remarks
                    </h3>

                    <p className="text-[11px] leading-6">
                        {getRemarks(average, studentName)}
                    </p>
                </section>

                {/* SIGNATURES */}

                <section className="mt-auto pt-8">

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

                {/* FOOTER */}

                <footer className="-mx-[9mm] mt-6 bg-blue-950 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-white">
                    Discipline • Knowledge • Excellence
                </footer>
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

    const cardRefs = useRef([]);

    // ==========================================
    // GENERATE REPORTS
    // ==========================================

    const reports = useMemo(
        () => buildReports(studentsSubject ?? []),
        [studentsSubject]
    );

    // ==========================================
    // DOWNLOAD ALL REPORT CARDS
    // ==========================================

    const downloadAllReports = useCallback(async () => {
        if (downloading || reports.length === 0) return;

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

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true,
            });

            const pageWidth = 210;
            const pageHeight = 297;

            for (let index = 0; index < reports.length; index++) {
                const element = cardRefs.current[index];

                if (!element) continue;

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: "#ffffff",
                    logging: false,
                    width: element.scrollWidth,
                    height: element.scrollHeight,
                    windowWidth: element.scrollWidth,
                });

                const imageData = canvas.toDataURL(
                    "image/jpeg",
                    0.95
                );

                if (index > 0) {
                    pdf.addPage("a4", "portrait");
                }

                const imageRatio = canvas.width / canvas.height;
                const pageRatio = pageWidth / pageHeight;

                let renderWidth = pageWidth;
                let renderHeight = pageHeight;
                let x = 0;
                let y = 0;

                if (imageRatio > pageRatio) {
                    renderHeight = pageWidth / imageRatio;
                    y = (pageHeight - renderHeight) / 2;
                } else {
                    renderWidth = pageHeight * imageRatio;
                    x = (pageWidth - renderWidth) / 2;
                }

                pdf.addImage(
                    imageData,
                    "JPEG",
                    x,
                    y,
                    renderWidth,
                    renderHeight,
                    undefined,
                    "FAST"
                );
            }

            pdf.save("Easeway-Terminal-Report-Cards.pdf");

        } catch (error) {
            console.error("REPORT DOWNLOAD ERROR:", error);

            setDownloadError(
                "Unable to download the report cards. Please try again."
            );
        } finally {
            setDownloading(false);
        }
    }, [downloading, reports]);

    // ==========================================
    // LOADING SCREEN
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
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

            <div className="mx-auto max-w-7xl">

                {/* PAGE HEADER */}

                <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">

                    <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <GraduationCap size={26} />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Terminal Report Cards
                            </h1>

                            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                                Generate and download professional school
                                terminal reports for your students. Each
                                student receives an individual A4 report
                                card containing their academic performance
                                and other assessment details.
                            </p>
                        </div>
                    </div>

                    {/* DOWNLOAD BUTTONS */}

                    <div className="flex flex-wrap gap-3">

                        <button
                            type="button"
                            onClick={downloadAllReports}
                            disabled={downloading || reports.length === 0}
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
                            disabled
                            title="Coming soon"
                            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400"
                        >
                            <Printer size={17} />
                            Download Standard One
                        </button>
                    </div>
                </div>

                {/* REPORT SUMMARY */}

                <div className="mt-5 grid gap-4 sm:grid-cols-2">

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <Users className="text-blue-700" size={22} />

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
                            <FileText className="text-blue-700" size={22} />

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

                {/* DOWNLOAD ERROR */}

                {downloadError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {downloadError}
                    </div>
                )}

                {/* REPORT PREVIEWS */}

                <div className="mt-8">

                    <div className="mb-5 flex flex-col gap-1">
                        <h2 className="text-lg font-bold text-slate-900">
                            Generated Report Cards
                        </h2>

                        <p className="text-sm text-slate-500">
                            Preview each student's report card below.
                            All cards will be included when you download.
                        </p>
                    </div>

                    <div className="space-y-10 overflow-x-auto pb-8">

                        {reports.map((report, index) => (
                            <div
                                key={`${report.project.id}-${report.student.id}`}
                            >

                                <div className="mb-3 flex items-center justify-between gap-3">

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
                                        Student {index + 1} of {reports.length}
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
            </div>
        </main>
    );
}
