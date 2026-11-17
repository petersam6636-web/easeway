"use client";

import {
  getProjectTitle,
  getSchoolLogo,
  getSchoolName,
  ordinal,
  splitIntoPages,
  type TerminalReport,
} from "./reportHelpers";

type Props = {
  reports: TerminalReport[];
  pageNumber?: number;
  totalPages?: number;
};

export default function ClassResultSheet({
  reports,
  pageNumber = 1,
  totalPages,
}: Props) {
  const sortedReports = [...reports].sort(
    (a, b) => b.total - a.total
  );

  const pages = splitIntoPages(sortedReports, 14);
  const currentPage = pages[pageNumber - 1] ?? [];
  const pageCount = totalPages ?? pages.length;

  const firstReport = sortedReports[0];

  if (!firstReport) return null;

  const project = firstReport.project;
  const schoolName = getSchoolName(project);
  const logo = getSchoolLogo(project);

  const cell: React.CSSProperties = {
    border: "1px solid #cbd5e1",
    padding: "5px 3px",
    fontSize: "8px",
    textAlign: "center",
    overflowWrap: "anywhere",
  };

  return (
    <section
      data-class-result
      style={{
        width: "297mm",
        height: "210mm",
        minHeight: "210mm",
        maxHeight: "210mm",
        boxSizing: "border-box",
        padding: "6mm",
        background: "#ffffff",
        color: "#172033",
        fontFamily: "Arial, Helvetica, sans-serif",
        overflow: "hidden",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "grid",
          gridTemplateColumns: "22mm 1fr 22mm",
          alignItems: "center",
          borderBottom: "2px solid #17365d",
          paddingBottom: "4mm",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          {logo && (
            <img
              src={logo}
              alt="School logo"
              crossOrigin="anonymous"
              style={{
                width: "18mm",
                height: "18mm",
                objectFit: "cover",
                borderRadius: "50%",
                border: "2px solid #17365d",
              }}
            />
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "17px",
              fontWeight: 900,
              color: "#17365d",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            {schoolName}
          </h1>

          <h2
            style={{
              fontSize: "13px",
              color: "#17365d",
              fontWeight: 900,
              margin: "4px 0",
            }}
          >
            CLASS TERMINAL RESULTS
          </h2>

          <p style={{ fontSize: "9px", margin: 0 }}>
            {getProjectTitle(project)}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          {logo && (
            <img
              src={logo}
              alt="School logo"
              crossOrigin="anonymous"
              style={{
                width: "18mm",
                height: "18mm",
                objectFit: "cover",
                borderRadius: "50%",
                border: "2px solid #17365d",
              }}
            />
          )}
        </div>
      </header>

      {/* METADATA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "#17365d",
          color: "#ffffff",
          padding: "7px 10px",
          fontSize: "9px",
          fontWeight: 700,
          marginTop: "8px",
        }}
      >
        <span>CLASS: {project?.class_name ?? project?.class ?? "N/A"}</span>
        <span>METHOD: {firstReport.method}</span>
        <span>PASS MARK: {firstReport.passMark}</span>
        <span>STUDENTS: {sortedReports.length}</span>
        <span>
          PAGE: {pageNumber} / {pageCount}
        </span>
      </div>

      {/* RESULTS TABLE */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          marginTop: "8px",
        }}
      >
        <thead>
          <tr style={{ background: "#e8eef7", color: "#17365d" }}>
            <th style={{ ...cell, width: "3%" }}>NO.</th>
            <th style={{ ...cell, width: "15%" }}>STUDENT NAME</th>
            <th style={{ ...cell, width: "8%" }}>STUDENT ID</th>

            {firstReport.subjects.map((subject) => (
              <th
                key={subject.key}
                style={{ ...cell, fontSize: "7px" }}
              >
                {subject.name.toUpperCase()}
              </th>
            ))}

            <th style={{ ...cell, width: "5%" }}>TOTAL</th>
            <th style={{ ...cell, width: "5%" }}>AVERAGE</th>
            <th style={{ ...cell, width: "4%" }}>GRADE</th>
            <th style={{ ...cell, width: "5%" }}>POSITION</th>
            <th style={{ ...cell, width: "7%" }}>STATUS</th>
          </tr>
        </thead>

        <tbody>
          {currentPage.map((report, index) => (
            <tr
              key={report.id}
              style={{
                background:
                  index % 2 === 0 ? "#ffffff" : "#f1f5f9",
              }}
            >
              <td style={cell}>
                {(pageNumber - 1) * 14 + index + 1}
              </td>

              <td
                style={{
                  ...cell,
                  textAlign: "left",
                  fontWeight: 700,
                }}
              >
                {report.student?.full_name ??
                  report.student?.student_name ??
                  report.student?.name ??
                  report.studentInfo?.full_name ??
                  "Unknown Student"}
              </td>

              <td style={cell}>
                {report.student?.admission_number ??
                  report.student?.student_id ??
                  report.id}
              </td>

              {firstReport.subjects.map((subject) => {
                const studentSubject = report.subjects.find(
                  (item) => item.key === subject.key
                );

                return (
                  <td key={subject.key} style={cell}>
                    {studentSubject?.mark ?? 0}
                  </td>
                );
              })}

              <td style={{ ...cell, fontWeight: 800 }}>
                {report.total}
              </td>

              <td style={cell}>
                {report.average.toFixed(1)}
              </td>

              <td style={{ ...cell, fontWeight: 800 }}>
                {report.overallGrade}
              </td>

              <td style={cell}>
                {ordinal(report.overallPosition)}
              </td>

              <td
                style={{
                  ...cell,
                  fontWeight: 800,
                  color: report.qualified ? "#166534" : "#b91c1c",
                  fontSize: "7px",
                }}
              >
                {report.qualified ? "QUALIFIED" : "NOT QUALIFIED"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FOOTER */}
      <footer
        style={{
          marginTop: "auto",
          paddingTop: "8px",
          borderTop: "1px solid #17365d",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "8px",
          color: "#17365d",
          fontWeight: 700,
        }}
      >
        <span>{schoolName}</span>
        <span>CLASS TERMINAL RESULTS</span>
        <span>
          PAGE {pageNumber} OF {pageCount}
        </span>
      </footer>
    </section>
  );
}