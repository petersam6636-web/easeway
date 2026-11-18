
"use client";

import {
  createContext,
  type Dispatch,
  type SetStateAction,
} from "react";

type PageType = "select" | "details";
type FormStep = "school" | "date";

type ContextType = {
  loginUserInfo: {
    id: string;
    email: string;
  };
  setLoginUserInfo: Dispatch<
    SetStateAction<{ id: string; email: string }>
  >;

  subjectSteps: any[];
  setSubjectSteps: Dispatch<SetStateAction<any[]>>;

  allStudents: any[];
  setAllStudents: Dispatch<SetStateAction<any[]>>;

  studentsSubject: any[];
  setStudentsSubject: Dispatch<SetStateAction<any[]>>;

  projects: any[];
  setProjects: Dispatch<SetStateAction<any[]>>;

  schoolData_ui: {
    school_name: string;
    logo_image: string;
    location: string;
    vacation_date: string;
    reopening_date: string;
    term: string;
  };
  setSchoolData_ui: Dispatch<SetStateAction<any>>;

  projectDetails: {
    header: string;
    description: string;
    method: string;
    passMark: number;
    index: number;
    user_id: string;
    deleted: string;
  };
  setProjectDetails: Dispatch<SetStateAction<any>>;

  projectId: any;
  setProjectId: Dispatch<SetStateAction<any>>;

  projectMethod: string;
  setProjectMethod: Dispatch<SetStateAction<string>>;

  page: PageType;
  setPage: Dispatch<SetStateAction<PageType>>;

  searching: boolean;
  setSearching: Dispatch<SetStateAction<boolean>>;

  step: FormStep;
  setStep: Dispatch<SetStateAction<FormStep>>;

  studentsSubjectLoading: boolean;
   setStudentsSubjectLoading: (value: boolean) => void
};

export const appcontext = createContext<ContextType | null>(null);
