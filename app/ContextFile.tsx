'use client'
import type { ReactNode } from "react";
import { useState } from "react";
import { appcontext } from "@/lib/appContext";
type PageType = "select" | "details";
export default function ContextFile({children}:{children: ReactNode}){
  const [loginUserInfo, setLoginUserInfo] = useState({id: '', email: ''})
  const [subjectSteps, setSubjectSteps] = useState<ProjectType[]>([])
  const [allStudents, setAllStudents] = useState([])
  const [projectMethod, setProjectMethod] = useState<string>('')
  const [projects, setProjects] = useState([])
  const [projectDetails, setProjectDetails] = useState<ProjectDetailsType>({
    header: '',
    description: '',
    method: '',
    passMark: 0,
    index: 0,
    user_id: '',
    deleted: 'No'
  });
    const [page, setPage] = useState<PageType>("select");
  const [projectId, setProjectId] = useState<number>(0)
const [schoolData_ui, setSchoolData_ui] = useState({
  school_name: "",
  logo_image: "",
  location: "",
  vacation_date: "",
  reopening_date: "",
  term: "",
});
  const [studentsSubject, setStudentsSubject] = useState([
  ])
    return (
        <div>
            <appcontext.Provider value={{loginUserInfo,
             setLoginUserInfo, subjectSteps, setSubjectSteps,
             projectId, setProjectId,
             projects, setProjects,
             page, setPage,
             allStudents, setAllStudents,
              studentsSubject, setStudentsSubject,
              projectMethod, setProjectMethod,
              projectDetails, setProjectDetails,
              schoolData_ui, setSchoolData_ui}}>,
              
                {children}
            </appcontext.Provider>
        </div>
    )
}