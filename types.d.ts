
type StudentOtherInfo = {
  id: number;
  student_id: number;
  attendance: string;
  attitude: string;
  interest: string;
  created_at: string;
};

type PrimarySubject = {
  english: number | undefined;
  science: number | undefined;
  mathematics: number | undefined;
  computing: number | undefined;
  creative_arts: number | undefined;
  career_technology: number | undefined;
  rme: number | undefined;
  "fante/twi": number | undefined;
  student_id: number;
  jhs_student_data: StudentOtherInfo;
  id: number;
  user_id: string;
  created_at: string;
};

type JHSJuniorSubject = {
  jhs_student_data: StudentOtherInfo;
  english: number | undefined;
  science: number | undefined;
  mathematics: number | undefined;
  history: number | undefined;
  computing: number | undefined;
  creative_arts: number | undefined;
  career_technology: number | undefined;
  rme: number | undefined;
  "fante/twi": number | undefined;
  student_id: number;
  id: number;
  user_id: string;
  created_at: string;
};

type JHSStudent = {
  id: number;
  full_name: string;
  user_id: string;
  created_at: string;
  jhs_subjects: JHSJuniorSubject[];
};

type PrimaryStudent = {
  id: number;
  full_name: string;
  user_id: string;
  created_at: string;
  primary_subjects: PrimarySubject[];
};

type SchoolsData = {
  school_name: string;
  logo_image: string;
  id: number;
  vacation_date: string ;
  reopening_date: string ;
  term: string ;
  location: string;
  project_id: number;
  created_at: string;
};

type SubjectType = {
  id: number;
  header: string;
  description: string;
  user_id: string;
  method: string;
  passMark: number;
  index: number;
  deleted: string;
  created_at: string;
  user_id: string
};

type CombinedStudent =
  | (JHSStudent & { academic_level: "JHS" })
  | (PrimaryStudent & { academic_level: "Primary" });

type ProjectWithStudents = SubjectType & {
  school_data: SchoolsData | null;
  students: CombinedStudent[];
};
 type SchoolData = {
  school_name: string;
  location: string;
  logo_image: string
 }

 interface ProjectDetailsType {
  header: string;
  description: string;
  method: string;
  entryMethod: string;
  passMark: number;
  index: number;
  user_id: string;
  deleted: string;
 }

 type ProjectType =
  | "english"
  | "science"
  | "mathematics"
  | "computing"
  | "creative_arts"
  | "career_technology"
  | "rme"
  | "fante/twi"
  | "history"
  | "peh";