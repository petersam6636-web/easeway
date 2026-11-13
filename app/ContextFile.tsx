'use client'
import type { ReactNode } from "react";
import { useState } from "react";
import { appcontext } from "@/lib/appContext";
export default function ContextFile({children}:{children: ReactNode}){
  const [loginUserInfo, setLoginUserInfo] = useState({id: '', email: ''})
  const [subjectSteps, setSubjectSteps] = useState<ProjectType[]>([])
  const [studentsSubject, setStudentsSubject] = useState<SubjectType[]>([
  ])
    return (
        <div>
            <appcontext.Provider value={{loginUserInfo, setLoginUserInfo, subjectSteps, setSubjectSteps, studentsSubject, setStudentsSubject}}>
                {children}
            </appcontext.Provider>
        </div>
    )
}