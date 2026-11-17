
"use client";

import { useState } from "react";
import { appcontext } from "@/lib/appContext";
type FormStep = "school" | "date";

export default function ContextFile({ children }) {
  const [loginUserInfo, setLoginUserInfo] = useState({
    id: "",
    email: "",
  });

  const [subjectSteps, setSubjectSteps] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [projectMethod, setProjectMethod] = useState("");
  const [projects, setProjects] = useState([]);
    const [searching, setSearching] = useState(false);
  // School information

  const [step, setStep] = useState<FormStep>("school");


  const [projectDetails, setProjectDetails] = useState({
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

  const [schoolData_ui, setSchoolData_ui] = useState({
    school_name: "",
    logo_image: "",
    location: "",
    vacation_date: "",
    reopening_date: "",
    term: "",
  });

  const [studentsSubject, setStudentsSubject] = useState([]);

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
        searching, setSearching,
        step, setStep
      }}
    >
      {children}
    </appcontext.Provider>
  );
}
