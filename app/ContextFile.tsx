
"use client";

import { useState, type ReactNode } from "react";
import { appcontext } from "@/lib/appContext";

type FormStep = "school" | "date";

interface ContextFileProps {
  children: ReactNode;
}

interface LoginUserInfo {
  id: string;
  email: string;
}

interface ProjectDetails {
  header: string;
  description: string;
  method: string;
  passMark: number;
  index: number;
  user_id: string;
  deleted: string;
}

interface SchoolData {
  school_name: string;
  logo_image: string;
  location: string;
  vacation_date: string;
  reopening_date: string;
  term: string;
}

export default function ContextFile({ children }: ContextFileProps) {
  const [loginUserInfo, setLoginUserInfo] = useState<LoginUserInfo>({
    id: "",
    email: "",
  });

  const [subjectSteps, setSubjectSteps] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [projectMethod, setProjectMethod] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // School information
  const [step, setStep] = useState<FormStep>("school");

  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    header: "",
    description: "",
    method: "",
    passMark: 0,
    index: 0,
    user_id: "",
    deleted: "No",
  });

  const [page, setPage] = useState("select");
  const [projectId, setProjectId] = useState(0);

  const [schoolData_ui, setSchoolData_ui] = useState<SchoolData>({
    school_name: "",
    logo_image: "",
    location: "",
    vacation_date: "",
    reopening_date: "",
    term: "",
  });

  const [studentsSubject, setStudentsSubject] = useState<any[]>([]);

  return (
    <appcontext.Provider
      value={{
        loginUserInfo,
        setLoginUserInfo,
        subjectSteps,
        setSubjectSteps,
        projectId,
        setProjectId,
        projects,
        setProjects,
        page,
        setPage,
        allStudents,
        setAllStudents,
        studentsSubject,
        setStudentsSubject,
        projectMethod,
        setProjectMethod,
        projectDetails,
        setProjectDetails,
        schoolData_ui,
        setSchoolData_ui,
        searching,
        setSearching,
        step,
        setStep,
      }}
    >
      {children}
    </appcontext.Provider>
  );
}
