
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Printer,
  FileText,
  Users,
  GraduationCap,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Link from "next/link";

import useApp from "@/lib/useApp";

import ProjectLoading  from "@/component/Loading";

import TerminalReportCard from "./TerminalReportCard";
import ClassResultSheet from "./ClassResultSheet";

import {
  buildReports,
  getProjectMethod,
  getProjectTitle,
  getSchoolName,
} from "./reportHelpers";

// ==========================================
// TYPES
// ==========================================

type ProjectRecord = {
  id: string | number;
  header?: string | null;
  description?: string | null;
  method?: string | null;
  passMark?: number | string | null;
  deleted?: string | null;
  school_data?: any;
  students?: any[];
  jhs_students?: any[];
  primary_students?: any[];
  [key: string]: any;
};

type ReportRecord = {
  student?: any;
  studentName?: string;
  studentId?: string | number;
  total?: number;
  average?: number;
  position?: number;
  [key: string]: any;
};

type PrintMode = "individual" | "all" | "class";

// ==========================================
// HELPERS
// ==========================================

function getRouteProjectId(value: unknown): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? "").trim();
  }

  return String(value ?? "").trim();
}

function getStudentName(report: ReportRecord): string {
  return (
    report.studentName ||
    report.student?.full_name ||
    report.student?.fullName ||
    report.student?.name ||
    report.student?.student_name ||
    "Unnamed Student"
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function TerminalReportPage() {
  // ==========================================
  // GLOBAL APP DATA
  // ==========================================

  const {
    studentsSubject,
    studentsSubjectLoading,
  } = useApp();

  // ==========================================
  // GET PROJECT ID FROM THE URL
  // ==========================================

  const params = useParams();

  const routeProjectId = getRouteProjectId(
    params?.projectId
  );

  // ==========================================
  // SELECT ONLY THE PROJECT IN THE URL
  // ==========================================

  const project = useMemo<ProjectRecord | null>(() => {
    if (!routeProjectId) {
      return null;
    }

    if (!Array.isArray(studentsSubject)) {
      return null;
    }

    const selectedProject = (
      studentsSubject as ProjectRecord[]
    ).find(
      (item) =>
        String(item.id) === routeProjectId &&
        item.deleted !== "Yes"
    );

    return selectedProject ?? null;
  }, [studentsSubject, routeProjectId]);

  // ==========================================
  // REPORT STATE
  // ==========================================

  const [selectedStudent, setSelectedStudent] =
    useState<string>("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [printMode, setPrintMode] =
    useState<PrintMode | null>(null);

  const [classPage, setClassPage] =
    useState(1);

  const [printing, setPrinting] =
    useState(false);

  const [printError, setPrintError] =
    useState("");

  // ==========================================
  // BUILD REPORTS FOR THIS PROJECT ONLY
  // ==========================================

  const reports = useMemo<ReportRecord[]>(() => {
    if (!project) {
      return [];
    }

    // IMPORTANT:
    // We pass one project, not all projects.
    // Its attached students and subject records
    // are already available from PageRender.

    return buildReports([project]) as ReportRecord[];
  }, [project]);

  // ==========================================
  // PROJECT INFORMATION
  // ==========================================

  const projectMethod = useMemo(() => {
    if (!project) return "";

    return getProjectMethod(project);
  }, [project]);

  const projectTitle = useMemo(() => {
    if (!project) return "";

    return getProjectTitle(project);
  }, [project]);

  const schoolName = useMemo(() => {
    if (!project) return "";

    return getSchoolName(project);
  }, [project]);

  // ==========================================
  // SELECT FIRST STUDENT AUTOMATICALLY
  // ==========================================

  useEffect(() => {
    if (!reports.length) {
      setSelectedStudent("");
      return;
    }

    setSelectedStudent((current) => {
      const stillExists = reports.some(
        (report) =>
          String(
            report.studentId ??
            report.student?.id ??
            ""
          ) === current
      );

      if (stillExists) {
        return current;
      }

      return String(
        reports[0].studentId ??
        reports[0].student?.id ??
        ""
      );
    });
  }, [reports]);

  // ==========================================
  // FILTER STUDENTS
  // ==========================================

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return reports;
    }

    return reports.filter((report) => {
      const name = getStudentName(report).toLowerCase();

      const studentId = String(
        report.studentId ??
        report.student?.student_id ??
        report.student?.admission_number ??
        ""
      ).toLowerCase();

      return (
        name.includes(query) ||
        studentId.includes(query)
      );
    });
  }, [reports, searchTerm]);

  // ==========================================
  // SELECTED STUDENT REPORT
  // ==========================================

  const currentReport = useMemo(() => {
    if (!selectedStudent) {
      return reports[0] ?? null;
    }

    return (
      reports.find(
        (report) =>
          String(
            report.studentId ??
            report.student?.id ??
            ""
          ) === selectedStudent
      ) ??
      reports[0] ??
      null
    );
  }, [reports, selectedStudent]);

  // ==========================================
  // CLASS REPORT PAGINATION
  // ==========================================

  const studentsPerPage = 14;

  const totalClassPages = Math.max(
    1,
    Math.ceil(reports.length / studentsPerPage)
  );

  useEffect(() => {
    setClassPage((current) =>
      Math.min(current, totalClassPages)
    );
  }, [totalClassPages]);

  // ==========================================
  // PRINT HANDLER
  // ==========================================

  const handlePrint = useCallback(
    async (mode: PrintMode) => {
      if (!reports.length || printing) {
        return;
      }

      setPrintError("");
      setPrinting(true);
      setPrintMode(mode);

      // Give React time to render the print content.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      try {
        const root = document.querySelector(
          ".print-root"
        );

        if (!root) {
          throw new Error(
            "The report content could not be prepared."
          );
        }

        // Wait for report images to load.
        const images = Array.from(
          root.querySelectorAll("img")
        );

        await Promise.all(
          images.map(
            (image) =>
              new Promise<void>((resolve) => {
                if (image.complete) {
                  resolve();
                  return;
                }

                image.onload = () => resolve();
                image.onerror = () => resolve();

                // Avoid waiting forever for a failed image.
                window.setTimeout(resolve, 5000);
              })
          )
        );

        window.print();
      } catch (error) {
        console.error("Print error:", error);

        setPrintError(
          error instanceof Error
            ? error.message
            : "Unable to prepare the report for printing."
        );
      } finally {
        setPrinting(false);
      }
    },
    [reports, printing]
  );

  // ==========================================
  // RESET PRINT MODE AFTER PRINTING
  // ==========================================

  useEffect(() => {
    function handleAfterPrint() {
      setPrintMode(null);
    }

    window.addEventListener(
      "afterprint",
      handleAfterPrint
    );

    return () => {
      window.removeEventListener(
        "afterprint",
        handleAfterPrint
      );
    };
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (studentsSubjectLoading) {
    return <ProjectLoading />;
  }

  // ==========================================
  // MISSING PROJECT ID
  // ==========================================

  if (!routeProjectId) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-5">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-7 text-center shadow-sm">
          <AlertCircle
            size={38}
            className="mx-auto text-amber-500 mb-4"
          />

          <h2 className="text-lg font-bold text-gray-900">
            Project ID is missing
          </h2>

          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            The report page could not find a project ID
            in the current URL.
          </p>

          <Link
            href="/home"
            className="inline-flex mt-6 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={17} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // PROJECT NOT FOUND
  // ==========================================

  if (!project) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-5">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-7 text-center shadow-sm">
          <AlertCircle
            size={38}
            className="mx-auto text-red-500 mb-4"
          />

          <h2 className="text-lg font-bold text-gray-900">
            Project not found
          </h2>

          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            The selected project could not be found in
            the loaded project data.
          </p>

          <p className="mt-3 text-xs text-gray-400 break-all">
            Project ID: {routeProjectId}
          </p>

          <Link
            href="/home"
            className="inline-flex mt-6 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={17} />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // NO STUDENTS
  // ==========================================

  if (!reports.length) {
    return (
      <section className="w-full space-y-6">
        <Link
          href={`/home/project/${project.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Project
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <Users
            size={42}
            className="mx-auto text-gray-300 mb-4"
          />

          <h2 className="text-lg font-bold text-gray-800">
            No student reports available
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            This project does not currently have student
            records with report information.
          </p>
        </div>
      </section>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <section className="w-full min-w-0 space-y-6">

      {/* ====================================== */}
      {/* PAGE HEADER */}
      {/* ====================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="min-w-0">

          <Link
            href={`/home/project/${project.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors mb-3"
          >
            <ArrowLeft size={15} />
            Back to Project
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Terminal Reports
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            {projectTitle} · {schoolName}
          </p>

        </div>

        <button
          type="button"
          onClick={() => handlePrint("all")}
          disabled={printing}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
        >
          {printing ? (
            <RefreshCw
              size={17}
              className="animate-spin"
            />
          ) : (
            <Printer size={17} />
          )}

          {printing
            ? "Preparing..."
            : "Print All Reports"}
        </button>

      </div>

      {/* ====================================== */}
      {/* PROJECT SUMMARY */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <GraduationCap
                size={21}
                className="text-blue-600"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Project Method
              </p>

              <p className="font-bold text-gray-900">
                {projectMethod}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users
                size={21}
                className="text-indigo-600"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Total Students
              </p>

              <p className="font-bold text-gray-900">
                {reports.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <FileText
                size={21}
                className="text-sky-600"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Pass Mark
              </p>

              <p className="font-bold text-gray-900">
                {project.passMark ?? 0}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ====================================== */}
      {/* PRINT ERROR */}
      {/* ====================================== */}

      {printError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={19}
            className="text-red-600 shrink-0 mt-0.5"
          />

          <p className="text-sm text-red-700">
            {printError}
          </p>
        </div>
      )}

      {/* ====================================== */}
      {/* PRINT ACTIONS */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <button
          type="button"
          onClick={() => handlePrint("class")}
          disabled={printing}
          className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:bg-blue-50/30 transition-colors text-left cursor-pointer disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users
                size={22}
                className="text-blue-600"
              />
            </div>

            <div>
              <p className="font-bold text-gray-900 text-sm">
                Class Results
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Print the complete class results sheet
              </p>
            </div>
          </div>

          <Printer
            size={19}
            className="text-gray-400 shrink-0"
          />
        </button>

        <button
          type="button"
          onClick={() => handlePrint("all")}
          disabled={printing}
          className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:bg-blue-50/30 transition-colors text-left cursor-pointer disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FileText
                size={22}
                className="text-indigo-600"
              />
            </div>

            <div>
              <p className="font-bold text-gray-900 text-sm">
                All Student Reports
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Print every student's individual report
              </p>
            </div>
          </div>

          <Printer
            size={19}
            className="text-gray-400 shrink-0"
          />
        </button>

      </div>

      {/* ====================================== */}
      {/* STUDENT REPORT LIST */}
      {/* ====================================== */}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        <div className="p-5 border-b border-gray-100">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <h2 className="font-bold text-gray-900">
                Individual Student Reports
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Select a student to view and print their report.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="Search students..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

        </div>

        <div className="divide-y divide-gray-100">

          {filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">
                No students match your search.
              </p>
            </div>
          ) : (
            filteredReports.map((report, index) => {
              const id = String(
                report.studentId ??
                report.student?.id ??
                ""
              );

              const active = id === selectedStudent;

              return (
                <div
                  key={
                    id ||
                    report.student?.admission_number ||
                    index
                  }
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors ${
                    active
                      ? "bg-blue-50/60"
                      : "hover:bg-gray-50"
                  }`}
                >

                  <button
                    type="button"
                    onClick={() => setSelectedStudent(id)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">

                      <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {getStudentName(report)
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${
                          active
                            ? "text-blue-700"
                            : "text-gray-900"
                        }`}>
                          {getStudentName(report)}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {report.student?.admission_number ||
                            report.student?.student_id ||
                            report.studentId ||
                            "Student"}
                        </p>
                      </div>

                    </div>
                  </button>

                  <div className="flex items-center justify-between sm:justify-end gap-4">

                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        Total Score
                      </p>

                      <p className="text-sm font-bold text-gray-900">
                        {report.total ?? 0}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(id);
                        handlePrint("individual");
                      }}
                      disabled={printing}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      <Printer size={15} />
                      Print
                    </button>

                  </div>

                </div>
              );
            })
          )}

        </div>

      </div>

      {/* ====================================== */}
      {/* SELECTED STUDENT PREVIEW */}
      {/* ====================================== */}

      {currentReport && (
        <div className="space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Report Preview
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                {getStudentName(currentReport)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handlePrint("individual")}
              disabled={printing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Printer size={17} />
              Print This Report
            </button>

          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-100 p-3 sm:p-5">
            <div className="mx-auto w-fit max-w-full">
              <TerminalReportCard
                report={currentReport as any}
              />
            </div>
          </div>

        </div>
      )}

      {/* ====================================== */}
      {/* CLASS PAGE CONTROLS */}
      {/* ====================================== */}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">

        <div>
          <p className="text-sm font-bold text-gray-900">
            Class Results Pages
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {totalClassPages} page(s), up to 14 students per page
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            disabled={classPage <= 1}
            onClick={() =>
              setClassPage((page) => Math.max(1, page - 1))
            }
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-xs font-semibold text-gray-600 tabular-nums">
            {classPage} / {totalClassPages}
          </span>

          <button
            type="button"
            disabled={classPage >= totalClassPages}
            onClick={() =>
              setClassPage((page) =>
                Math.min(totalClassPages, page + 1)
              )
            }
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>

        </div>

      </div>

      {/* ====================================== */}
      {/* HIDDEN PRINT CONTENT */}
      {/* ====================================== */}

      <div
        className={`print-root ${
          printMode ? "print-active" : ""
        }`}
        aria-hidden={!printMode}
      >

        {printMode === "individual" && currentReport && (
          <div data-individual-report>
            <TerminalReportCard
              report={currentReport as any}
            />
          </div>
        )}

        {printMode === "all" && (
          <div data-all-reports>
            {reports.map((report, index) => (
              <div
                key={
                  String(
                    report.studentId ??
                    report.student?.id ??
                    index
                  )
                }
                className="individual-print-page"
                data-individual-report
              >
                <TerminalReportCard
                  report={report as any}
                />
              </div>
            ))}
          </div>
        )}

        {printMode === "class" && (
          <div data-class-result>
            <ClassResultSheet
              reports={reports as any}
              pageNumber={classPage}
              totalPages={totalClassPages}
            />
          </div>
        )}

      </div>

      {/* ====================================== */}
      {/* PRINT STYLES */}
      {/* ====================================== */}

      <style jsx global>{`
        .print-root {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .print-root,
          .print-root * {
            visibility: visible !important;
          }

          .print-root {
            display: block !important;
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .individual-print-page {
            display: block !important;
            width: 210mm !important;
            min-height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
          }

          .individual-print-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          [data-individual-report] {
            display: block !important;
          }

          [data-class-result] {
            display: block !important;
          }

          body:has([data-class-result]) {
            /* Class result pages use landscape. */
          }

          body:has([data-class-result]) .print-root {
            width: 100% !important;
          }

          body:has([data-class-result]) .individual-print-page {
            display: none !important;
          }

          body:has([data-class-result]) {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

    </section>
  );
}
