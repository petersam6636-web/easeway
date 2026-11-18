
"use client";

import { useState } from "react";
import { appcontext } from "@/lib/appContext";

type FormStep = "school" | "date";
type PageType = "select" | "details";

export default function ContextFile(props: any) {
  const [anotherOne, setanotherOne] = useState<{email: string, id: string}>({
    id: "",
    email: "",
  });
const [studentsSubjectLoading, setStudentsSubjectLoading] =
    useState(true);
  const [subjectSteps, setSubjectSteps] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [studentsSubject, setStudentsSubject] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [projectMethod, setProjectMethod] = useState("");
  const [searching, setSearching] = useState(false);
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

  const [page, setPage] = useState<PageType>("select");
  const [projectId, setProjectId] = useState(0);

  const [schoolData_ui, setSchoolData_ui] = useState({
    school_name: "",
    logo_image: "",
    location: "",
    vacation_date: "",
    reopening_date: "",
    term: "",
  });

  return (
    <appcontext.Provider
      value={{
        anotherOne,
        setanotherOne,

        subjectSteps,
        setSubjectSteps,

        allStudents,
        setAllStudents,

        studentsSubject,
        setStudentsSubject,

studentsSubjectLoading, setStudentsSubjectLoading,

        projects,
        setProjects,

        projectMethod,
        setProjectMethod,

        projectDetails,
        setProjectDetails,

        schoolData_ui,
        setSchoolData_ui,

        projectId,
        setProjectId,

        page,
        setPage,

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
