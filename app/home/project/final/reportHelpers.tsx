// reportHelpers.ts

export type DataRecord = Record<string, any>;
export type ReportMethod = "JHS" | "PRIMARY";

export type SubjectConfig = {
  key: string;
  label: string;
  aliases: string[];
};

export type ReportSubject = {
  key: string;
  name: string;
  mark: number;
  maximum: number;
  grade: string;
  remark: string;
  position: number;
};

export type TerminalReport = {
  id: string;
  project: DataRecord;
  student: DataRecord;
  studentInfo: DataRecord;
  school: DataRecord;
  method: ReportMethod;
  subjects: ReportSubject[];
  total: number;
  maximum: number;
  average: number;
  overallGrade: string;
  overallRemark: string;
  overallPosition: number;
  projectStudentCount: number;
  passMark: number;
  qualified: boolean;
};

export const SUBJECT_CONFIG: Record<ReportMethod, SubjectConfig[]> = {
  JHS: [
    { key: "english", label: "English", aliases: ["English Language"] },
    { key: "mathematics", label: "Mathematics", aliases: ["Maths", "Math"] },
    { key: "science", label: "Science", aliases: ["Integrated Science"] },
    { key: "history", label: "History", aliases: [] },
    { key: "computing", label: "Computing", aliases: ["ICT", "Information Technology"] },
    { key: "creativearts", label: "Creative Arts", aliases: ["Creative Arts and Design", "CAD"] },
    { key: "careertechnology", label: "Career Technology", aliases: ["Career Tech"] },
    { key: "rme", label: "RME", aliases: ["Religious and Moral Education"] },
    { key: "socialstudies", label: "Social Studies", aliases: ["Social Science"] },
    { key: "fantetwi", label: "Fante/Twi", aliases: ["Fante", "Twi", "Ghanaian Language"] },
  ],
  PRIMARY: [
    { key: "english", label: "English", aliases: ["English Language"] },
    { key: "mathematics", label: "Mathematics", aliases: ["Maths", "Math"] },
    { key: "science", label: "Science", aliases: ["Integrated Science"] },
    { key: "computing", label: "Computing", aliases: ["ICT", "Information Technology"] },
    { key: "creativearts", label: "Creative Arts", aliases: ["Creative Arts and Design", "CAD"] },
    { key: "rme", label: "RME", aliases: ["Religious and Moral Education"] },
    { key: "history", label: "HIstory", aliases: ["History"] },
    { key: "fantetwi", label: "Fante/Twi", aliases: ["Fante", "Twi", "Ghanaian Language"] },
  ],
};

export function getProjectMethod(project: DataRecord): ReportMethod {
  const value = String(
    project?.method ??
    project?.project_method ??
    project?.projectMethod ??
    ""
  ).toUpperCase();

  return value.includes("PRIMARY") ? "PRIMARY" : "JHS";
}

export function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

export function ordinal(value: number): string {
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

export function formatDate(value: unknown): string {
  if (!value) return "N/A";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function getGrade(mark: number): {
  grade: string;
  remark: string;
} {
  if (mark >= 80) return { grade: "A", remark: "EXCELLENT" };
  if (mark >= 70) return { grade: "B", remark: "VERY GOOD" };
  if (mark >= 60) return { grade: "C", remark: "GOOD" };
  if (mark >= 45) return { grade: "D", remark: "CREDIT" };
  if (mark >= 35) return { grade: "E", remark: "PASS" };

  return { grade: "F", remark: "FAIL" };
}

export function extractNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const match = cleaned.match(/-?\d+(\.\d+)?/);

    if (!match) return null;

    const number = Number(match[0]);
    return Number.isFinite(number) ? number : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = extractNumber(item);
      if (result !== null) return result;
    }

    return null;
  }

  if (typeof value === "object") {
    const possibleFields = [
      "total",
      "total_mark",
      "total_marks",
      "final_mark",
      "final_marks",
      "subject_mark",
      "subject_marks",
      "marks",
      "mark",
      "score",
      "obtained_marks",
      "value",
      "ca",
      "exam",
      "examination",
    ];

    for (const field of possibleFields) {
      if (value[field] !== undefined) {
        const result = extractNumber(value[field]);

        if (result !== null) return result;
      }
    }
  }

  return null;
}

function findMatchingValue(
  record: DataRecord,
  config: SubjectConfig
): number {
  if (!record || typeof record !== "object") return 0;

  const acceptedKeys = [
    config.key,
    config.label,
    ...config.aliases,
  ].map(normalizeKey);

  for (const [key, value] of Object.entries(record)) {
    if (!acceptedKeys.includes(normalizeKey(key))) continue;

    const result = extractNumber(value);

    if (result !== null) return result;
  }

  // Some records store the subject name inside a nested object.
  for (const value of Object.values(record)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    const nestedName = normalizeKey(
      value.subject_name ??
      value.subject ??
      value.name ??
      value.header
    );

    if (acceptedKeys.includes(nestedName)) {
      const result = extractNumber(value);

      if (result !== null) return result;
    }
  }

  return 0;
}

export function getStudentName(student: DataRecord): string {
  const info = getStudentInfo(student);

  return (
    info?.full_name ??
    info?.student_name ??
    info?.name ??
    student?.full_name ??
    student?.student_name ??
    student?.name ??
    "Unknown Student"
  );
}

export function getStudentInfo(student: DataRecord): DataRecord {
  return (
    student?.jhs_student_data ??
    student?.primary_student_data ??
    student?.student_data ??
    student?.jhs_student_info ??
    student?.primary_student_info ??
    student?.student_info ??
    {}
  );
}

export function getStudentSubjects(
  student: DataRecord,
  method: ReportMethod
): DataRecord[] {
  const records =
    method === "PRIMARY"
      ? student?.primary_subjects
      : student?.jhs_subjects;

  return Array.isArray(records) ? records : [];
}

export function getStudentDetail(
  student: DataRecord,
  keys: string[],
  fallback = "N/A"
): string {
  const info = getStudentInfo(student);

  for (const key of keys) {
    const value = info?.[key] ?? student?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value);
    }
  }

  return fallback;
}

export function getSchoolName(project: DataRecord): string {
  const school = project?.school_data;

  if (Array.isArray(school)) {
    return school[0]?.school_name ?? "SCHOOL NAME";
  }

  return (
    school?.school_name ??
    project?.school_name ??
    "SCHOOL NAME"
  );
}

export function getSchoolLogo(project: DataRecord): string {
  const school = Array.isArray(project?.school_data)
    ? project.school_data[0]
    : project?.school_data;

  return (
    school?.logo_image ??
    school?.logo ??
    project?.logo_image ??
    ""
  );
}

export function getProjectTitle(project: DataRecord): string {
  return (
    project?.header ??
    project?.title ??
    project?.name ??
    "Terminal Report"
  );
}

export function getPassMark(project: DataRecord): number {
  const value = extractNumber(
    project?.passMark ??
    project?.pass_mark ??
    project?.passmark ??
    project?.pass_mark_score
  );

  return value ?? 0;
}

export function getUniqueStudents(
  students: DataRecord[]
): DataRecord[] {
  const seen = new Set<string>();

  return students.filter((student, index) => {
    const identity = String(
      student?.id ??
      student?.student_id ??
      student?.admission_number ??
      student?.full_name ??
      student?.name ??
      `student-${index}`
    );

    if (seen.has(identity)) return false;

    seen.add(identity);
    return true;
  });
}

function getMaximum(record: DataRecord): number {
  const maximum = extractNumber(
    record?.maximum ??
    record?.max_mark ??
    record?.max_marks ??
    record?.total_possible ??
    record?.full_mark ??
    record?.full_marks
  );

  return maximum && maximum > 0 ? maximum : 100;
}

function getSubjectMark(
  records: DataRecord[],
  config: SubjectConfig
): number {
  for (const record of records) {
    const mark = findMatchingValue(record, config);

    if (mark !== null && mark !== undefined) {
      const keys = Object.keys(record ?? {});
      const hasSubject = keys.some((key) =>
        [
          config.key,
          config.label,
          ...config.aliases,
        ].map(normalizeKey).includes(normalizeKey(key))
      );

      if (hasSubject) return mark;

      const nestedName = normalizeKey(
        record?.subject_name ??
        record?.subject ??
        record?.name
      );

      const accepted = [
        config.key,
        config.label,
        ...config.aliases,
      ].map(normalizeKey);

      if (accepted.includes(nestedName)) return mark;
    }
  }

  return 0;
}

export function buildReports(
  projects: DataRecord[]
): TerminalReport[] {
  const allReports: TerminalReport[] = [];

  for (const project of projects) {
    const method = getProjectMethod(project);
    const subjectConfig = SUBJECT_CONFIG[method];
    const students = getUniqueStudents(
      Array.isArray(project?.students) ? project.students : []
    );

    const passMark = getPassMark(project);
    const school = Array.isArray(project?.school_data)
      ? project.school_data[0] ?? {}
      : project?.school_data ?? {};

    const projectReports: TerminalReport[] = students.map(
      (student) => {
        const studentInfo = getStudentInfo(student);
        const subjectRecords = getStudentSubjects(student, method);

        const subjects: ReportSubject[] = subjectConfig.map(
          (config) => {
            let mark = getSubjectMark(subjectRecords, config);

            if (!Number.isFinite(mark)) mark = 0;

            const maximum = getMaximum(
              subjectRecords.find((record) =>
                Object.keys(record ?? {}).some((key) =>
                  [
                    config.key,
                    config.label,
                    ...config.aliases,
                  ].map(normalizeKey).includes(normalizeKey(key))
                )
              ) ?? {}
            );

            const result = getGrade(mark);

            return {
              key: config.key,
              name: config.label,
              mark,
              maximum,
              grade: result.grade,
              remark: result.remark,
              position: 0,
            };
          }
        );

        const total = subjects.reduce(
          (sum, subject) => sum + subject.mark,
          0
        );

        const maximum = subjects.reduce(
          (sum, subject) => sum + subject.maximum,
          0
        );

        const average = subjects.length
          ? total / subjects.length
          : 0;

        const overall = getGrade(average);

        return {
          id: String(student?.id ?? student?.student_id ?? ""),
          project,
          student,
          studentInfo,
          school,
          method,
          subjects,
          total,
          maximum,
          average,
          overallGrade: overall.grade,
          overallRemark: overall.remark,
          overallPosition: 0,
          projectStudentCount: students.length,
          passMark,
          qualified: total >= passMark && total > 0,
        };
      }
    );

    // Subject positions use competition ranking: 1, 1, 3.
    for (const config of subjectConfig) {
      const sorted = [...projectReports].sort((a, b) => {
        const aMark =
          a.subjects.find((subject) => subject.key === config.key)?.mark ?? 0;
        const bMark =
          b.subjects.find((subject) => subject.key === config.key)?.mark ?? 0;

        return bMark - aMark;
      });

      let previousMark: number | null = null;
      let position = 0;

      sorted.forEach((report, index) => {
        const subject = report.subjects.find(
          (item) => item.key === config.key
        );

        if (!subject) return;

        if (previousMark !== subject.mark) {
          position = index + 1;
          previousMark = subject.mark;
        }

        subject.position = position;
      });
    }

    // Overall positions also use competition ranking.
    const ranked = [...projectReports].sort(
      (a, b) => b.total - a.total
    );

    let previousTotal: number | null = null;
    let overallPosition = 0;

    ranked.forEach((report, index) => {
      if (previousTotal !== report.total) {
        overallPosition = index + 1;
        previousTotal = report.total;
      }

      report.overallPosition = overallPosition;
    });

    allReports.push(...projectReports);
  }

  return allReports;
}

export function splitIntoPages<T>(
  items: T[],
  pageSize: number
): T[][] {
  const pages: T[][] = [];

  for (let index = 0; index < items.length; index += pageSize) {
    pages.push(items.slice(index, index + pageSize));
  }

  return pages;
}