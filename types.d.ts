type ProjectType = 'english' | 'mathematics' | 'science' | 'social_studies' | 'rme' | 'computing' | 'creative_arts' | 'career technology' | 'fante/twi' | 'history' | 'peh';
type ProjectSubject = {
  [key: string]: string | number | null | undefined | 'undefined';
};




type JHSBasicSubject = {
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
  created_at: string;
};

interface StudentOtherInfo {
  id: number;
  student_id: number;
  attendance: string;
  attitude: string;
  interest: string;
  created_at: string;
}

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
  created_at: string;
};

type JHSStudent = {
  id: number;
  full_name: string;
  user_id: string;
  created_at: string;
  jhs_subjects: (JHSBasicSubject | JHSJuniorSubject)[];
};

interface SchoolsData {
  school_name: string;
  logo_image: string;
  id: number;
  location: string;
  project_id: number;
  created_at: string;
}

type SubjectType = {
  id: number;
  header: string;
  description: string;
  user_id: string;
  method: string;
  passMark: number;
  index: number;
  created_at: string;
  school_data: SchoolsData;
  jhs_students: JHSStudent[];
};



interface SchoolData {
  school_name: string;
  logo_image: string;
  location: string;
}