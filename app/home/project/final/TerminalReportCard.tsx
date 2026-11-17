"use client";

import {
  formatDate,
  getSchoolLogo,
  getSchoolName,
  getProjectTitle,
  getStudentDetail,
  getStudentName,
  ordinal,
  type TerminalReport,
} from "./reportHelpers";

type Props = {
  report: TerminalReport;
};

export default function TerminalReportCard({ report }: Props) {
  const { project, student, studentInfo, subjects } = report;

  const schoolName = getSchoolName(project);
  const logo = getSchoolLogo(project);

  const location =
    project?.school_data?.location ??
    report?.school?.location ??
    " ";

  const academicYear =
    project?.academic_year ??
    project?.academicYear ??
    project?.year ??
    " ";

  const term =
    project?.term ??
    project?.academic_term ??
    " ";

  const className =
    student?.class_name ??
    student?.class ??
    project?.class_name ??
    project?.class ??
    " ";

  const studentName = getStudentName(student);

  const studentId =
    student?.admission_number ??
    student?.student_id ??
    student?.id ??
    "N/A";

  const attendance = getStudentDetail(
    student,
    ["attendance", "attendance_record", "days_present"]
  );

  const attitude = getStudentDetail(
    student,
    ["attitude", "conduct"]
  );

  const interest = getStudentDetail(
    student,
    ["interest", "participation"]
  );

  const age = getStudentDetail(student, ["age"]);
  const house = getStudentDetail(student, ["house", "house_name"]);

  const guardian = getStudentDetail(
    student,
    ["guardian", "parent_name", "guardian_name"]
  );

  const guardianContact = getStudentDetail(
    student,
    ["guardian_contact", "parent_contact", "phone", "contact"]
  );

  const teacherRemark =
    studentInfo?.class_teacher_remark ??
    studentInfo?.teacher_remark ??
    studentInfo?.class_teacher_remarks ??
    " ";

  const headRemark =
    studentInfo?.headteacher_remark ??
    studentInfo?.head_teacher_remark ??
    studentInfo?.headteacher_remarks ??
    " ";

  const vacationDate =
    project?.vacation_date ??
    project?.vacationDate ??
    " ";

  const reopeningDate =
    project?.reopening_date ??
    project?.next_reopening_date ??
    project?.reopeningDate ??
    " ";

  const cellStyle: React.CSSProperties = {
    border: "1px solid #cbd5e1",
    padding: "5px 4px",
    fontSize: "9px",
    textAlign: "center",
    verticalAlign: "middle",
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 700,
    color: "#17365d",
  };

  return (
    <article
      data-individual-report
      className="terminal-report-card"
      style={{
        width: "210mm",
        height: "297mm",
        minHeight: "297mm",
        maxHeight: "297mm",
        boxSizing: "border-box",
        padding: "4mm",
        background: "#ffffff",
        color: "#172033",
        fontFamily: "Arial, Helvetica, sans-serif",
        position: "relative",
        overflow: "hidden",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      {/* Outer border */}
      <div
        style={{
          position: "absolute",
          inset: "2mm",
          border: "3px double #17365d",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Watermark */}
      {logo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <img
            src={logo}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: "105mm",
              height: "105mm",
              objectFit: "contain",
              opacity: 0.055,
            }}
          />
        </div>
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* SCHOOL HEADER */}
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "23mm 1fr 23mm",
            alignItems: "center",
            gap: "3mm",
            borderBottom: "2px solid #17365d",
            paddingBottom: "3mm",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            {logo && (
              <img
                src={logo}
                alt="School logo"
                crossOrigin="anonymous"
                style={{
                  width: "20mm",
                  height: "20mm",
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
                color: "#17365d",
                fontWeight: 900,
                fontSize: "18px",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {schoolName}
            </h1>

            <p
              style={{
                fontSize: "9px",
                margin: "3px 0",
                fontWeight: 600,
              }}
            >
              {location}
            </p>

            <h2
              style={{
                fontSize: "14px",
                fontWeight: 900,
                color: "#17365d",
                margin: "5px 0 2px",
                letterSpacing: "1px",
              }}
            >
              TERMINAL REPORT
            </h2>

            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              {report.method === "JHS" ? "JUNIOR HIGH SCHOOL" : "PRIMARY SCHOOL"}
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            {logo && (
              <img
                src={logo}
                alt="School logo"
                crossOrigin="anonymous"
                style={{
                  width: "20mm",
                  height: "20mm",
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: "2px solid #17365d",
                }}
              />
            )}
          </div>
        </header>

        {/* ACADEMIC INFORMATION */}
        <div
          style={{
            background: "#17365d",
            color: "#ffffff",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "5px",
            padding: "7px 9px",
            marginTop: "7px",
            fontSize: "9px",
            fontWeight: 700,
          }}
        >
          <span>ACADEMIC YEAR: {academicYear}</span>
          <span style={{ textAlign: "center" }}>TERM: {term}</span>
          <span style={{ textAlign: "right" }}>CLASS: {className}</span>
        </div>

        {/* STUDENT INFORMATION */}
        <section
          style={{
            marginTop: "9px",
            border: "1px solid #cbd5e1",
            padding: "8px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "7px 15px",
            fontSize: "9px",
          }}
        >
          <div>
            <span style={labelStyle}>STUDENT NAME: </span>
            {studentName}
          </div>

          <div>
            <span style={labelStyle}>STUDENT ID: </span>
            {studentId}
          </div>

          <div>
            <span style={labelStyle}>CLASS POSITION: </span>
            {ordinal(report.overallPosition)}
          </div>

          <div>
            <span style={labelStyle}>CLASS SIZE: </span>
            {report.projectStudentCount}
          </div>
        </section>

        {/* SUBJECT RESULTS */}
        <section style={{ marginTop: "9px" }}>
          <h3
            style={{
              background: "#17365d",
              color: "#ffffff",
              padding: "6px 8px",
              margin: 0,
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.5px",
            }}
          >
            ACADEMIC PERFORMANCE
          </h3>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              background: "transparent",
            }}
          >
            <thead>
              <tr style={{ background: "#e8eef7", color: "#17365d" }}>
                <th style={{ ...cellStyle, width: "35%", textAlign: "left" }}>
                  SUBJECT
                </th>
                <th style={{ ...cellStyle, width: "13%" }}>MARK</th>
                <th style={{ ...cellStyle, width: "12%" }}>GRADE</th>
                <th style={{ ...cellStyle, width: "15%" }}>POSITION</th>
                <th style={{ ...cellStyle, width: "25%" }}>REMARK</th>
              </tr>
            </thead>

            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.key}>
                  <td
                    style={{
                      ...cellStyle,
                      textAlign: "left",
                      fontWeight: 700,
                    }}
                  >
                    {subject.name}
                  </td>

                  <td style={cellStyle}>
                    {subject.mark}
                  </td>

                  <td style={{ ...cellStyle, fontWeight: 800 }}>
                    {subject.grade}
                  </td>

                  <td style={cellStyle}>
                    {ordinal(subject.position)}
                  </td>

                  <td
                    style={{
                      ...cellStyle,
                      fontWeight: 700,
                      fontSize: "8px",
                    }}
                  >
                    {subject.remark}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* TOTALS */}
        <section
          style={{
            marginTop: "8px",
            border: "1px solid #17365d",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            fontSize: "9px",
          }}
        >
          <div style={{ padding: "7px", borderRight: "1px solid #cbd5e1" }}>
            <div style={labelStyle}>TOTAL SCORE</div>
            <strong style={{ fontSize: "13px" }}>
              {report.total}
            </strong>
          </div>

          <div style={{ padding: "7px", borderRight: "1px solid #cbd5e1" }}>
            <div style={labelStyle}>AVERAGE</div>
            <strong style={{ fontSize: "13px" }}>
              {report.average.toFixed(2)}%
            </strong>
          </div>

          <div style={{ padding: "7px" }}>
            <div style={labelStyle}>OVERALL GRADE</div>
            <strong style={{ fontSize: "13px" }}>
              {report.overallGrade}
            </strong>
          </div>
        </section>

        {/* QUALIFICATION */}
        <section
          style={{
            marginTop: "7px",
            border: "1px solid #17365d",
            padding: "7px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "9px",
          }}
        >
          <div>
            <strong style={labelStyle}>PASS MARK: </strong>
            {report.passMark}
          </div>

          <div>
            <strong style={labelStyle}>PERFORMANCE: </strong>
            {report.overallRemark}
          </div>

          <strong
            style={{
              color: report.qualified ? "#166534" : "#b91c1c",
              fontSize: "11px",
            }}
          >
            {report.qualified ? "QUALIFIED" : "NOT QUALIFIED"}
          </strong>
        </section>

        {/* GRADING LEGEND */}
        <section style={{ marginTop: "8px" }}>
          <h3
            style={{
              color: "#17365d",
              fontSize: "9px",
              margin: "0 0 4px",
              fontWeight: 800,
            }}
          >
            GRADING SYSTEM
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              border: "1px solid #cbd5e1",
            }}
          >
            {[
              ["A", "80–100", "EXCELLENT"],
              ["B", "70–79", "VERY GOOD"],
              ["C", "60–69", "GOOD"],
              ["D", "45–59", "CREDIT"],
              ["E", "35–44", "PASS"],
              ["F", "0–34", "FAIL"],
            ].map(([grade, range, remark]) => (
              <div
                key={grade}
                style={{
                  textAlign: "center",
                  padding: "5px 2px",
                  borderRight: "1px solid #cbd5e1",
                  fontSize: "7px",
                }}
              >
                <strong style={{ color: "#17365d", fontSize: "10px" }}>
                  {grade}
                </strong>
                <div>{range}</div>
                <div style={{ fontWeight: 700 }}>{remark}</div>
              </div>
            ))}
          </div>
        </section>

        {/* STUDENT ASSESSMENT */}
        <section style={{ marginTop: "8px" }}>
          <h3
            style={{
              background: "#17365d",
              color: "#ffffff",
              padding: "5px 8px",
              fontSize: "9px",
              margin: 0,
            }}
          >
            STUDENT ASSESSMENT
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              border: "1px solid #cbd5e1",
              fontSize: "9px",
            }}
          >
            {[
              ["Attendance", attendance],
              ["Attitude", attitude],
              ["Interest", interest],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  padding: "7px",
                  borderRight: "1px solid #cbd5e1",
                }}
              >
                <strong style={labelStyle}>{label}: </strong>
                {value}
              </div>
            ))}
          </div>
        </section>

        {/* STUDENT PROFILE */}
        <section style={{ marginTop: "8px" }}>
          <h3
            style={{
              color: "#17365d",
              fontSize: "9px",
              margin: "0 0 4px",
            }}
          >
            STUDENT PROFILE
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              border: "1px solid #cbd5e1",
              fontSize: "8px",
            }}
          >
            {[
              ["AGE", age],
              ["HOUSE", house],
              ["GUARDIAN", guardian],
              ["GUARDIAN CONTACT", guardianContact],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  padding: "6px 4px",
                  borderRight: "1px solid #cbd5e1",
                  minWidth: 0,
                  overflowWrap: "anywhere",
                }}
              >
                <strong style={labelStyle}>{label}</strong>
                <div>{value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TEACHER REMARKS */}
        <section style={{ marginTop: "8px" }}>
          <h3
            style={{
              background: "#17365d",
              color: "#ffffff",
              padding: "5px 8px",
              fontSize: "9px",
              margin: 0,
            }}
          >
            TEACHER'S REMARKS
          </h3>

          <div
            style={{
              border: "1px solid #cbd5e1",
              padding: "7px",
              minHeight: "25px",
              fontSize: "9px",
            }}
          >
            <strong style={labelStyle}>CLASS TEACHER: </strong>
            {teacherRemark}
          </div>

          <div
            style={{
              border: "1px solid #cbd5e1",
              borderTop: 0,
              padding: "7px",
              minHeight: "25px",
              fontSize: "9px",
            }}
          >
            <strong style={labelStyle}>HEADTEACHER: </strong>
            {headRemark}
          </div>
        </section>

        {/* SIGNATURES */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "25mm",
            marginTop: "auto",
            padding: "9mm 8mm 4mm",
          }}
        >
          <div style={{ textAlign: "center", fontSize: "8px" }}>
            <div style={{ borderTop: "1px solid #17365d", paddingTop: "5px" }}>
              CLASS TEACHER'S SIGNATURE
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: "8px" }}>
            <div style={{ borderTop: "1px solid #17365d", paddingTop: "5px" }}>
              HEADTEACHER'S SIGNATURE
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            background: "#17365d",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            padding: "6px 8px",
            fontSize: "8px",
            fontWeight: 700,
            marginTop: "3mm",
          }}
        >
          <span>{schoolName}</span>
          <span>TERMINAL REPORT</span>
          <span>
            REOPENING: {reopeningDate ? formatDate(reopeningDate) : "N/A"}
          </span>
        </footer>

        {vacationDate && (
          <div
            style={{
              textAlign: "center",
              fontSize: "7px",
              marginTop: "3px",
            }}
          >
            VACATION DATE: {formatDate(vacationDate)}
          </div>
        )}
      </div>
    </article>
  );
}