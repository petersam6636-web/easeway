
"use client";

import {
  createContext,
  type Dispatch,
  type SetStateAction,
} from "react";

type PageType = "select" | "entryMethod" | "details";
type FormStep = "school" | "date";

type ContextType = {
  authInitialized: boolean;
  setAuthInitialized: Dispatch<SetStateAction<boolean>>;

  anotherOne: {
    id: string;
    email: string;
  };
  setanotherOne: Dispatch<
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

  projectDetails: ProjectDetailsType;
  setProjectDetails: Dispatch<SetStateAction<ProjectDetailsType>>;

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
