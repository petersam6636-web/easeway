'use client'
import type { ReactNode } from "react";
import { useState } from "react";
import { appcontext } from "@/lib/appContext";
export default function ContextFile({children}:{children: ReactNode}){
  const [loginUserInfo, setLoginUserInfo] = useState({id: '', email: ''})
  const [subjectSteps, setSubjectSteps] = useState<ProjectType[]>([])
  const [schoolData_ui, setSchoolData_ui] = useState<SchoolData>({
  school_name: '',
  logo_image: '',
  location: ''
  })
  const [studentsSubject, setStudentsSubject] = useState<SubjectType[]>([
  ])
    return (
        <div>
            <appcontext.Provider value={{loginUserInfo,
             setLoginUserInfo, subjectSteps, setSubjectSteps,
              studentsSubject, setStudentsSubject,
              schoolData_ui, setSchoolData_ui}}>
                {children}
            </appcontext.Provider>
        </div>
    )
}