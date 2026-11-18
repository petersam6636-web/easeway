
"use client";

import { useState } from "react";
import { appcontext } from "@/lib/appContext";

type FormStep = "school" | "date";

export default function ContextFile(props: any) {
  const [loginUserInfo, setLoginUserInfo] = useState<any>({
    id: "",
    email: "",
  });

  const [subjectSteps, setSubjectSteps] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [projectMethod, setProjectMethod] = useState<any>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [step, setStep] = useState<FormStep>("school");

  const [projectDetails, setProjectDetails] = useState<any>({
    header: "",
    description: "",
    method: "",
    passMark: 0,
    index: 0,
    user_id: "",
    deleted: "No",
  });

  const [page, setPage] = useState<any>("select");
  const [projectId, setProjectId] = useState<any>(0);

  const [schoolData_ui, setSchoolData_ui] = useState<any>({
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
      {props.children}
    </appcontext.Provider>
  );
}
