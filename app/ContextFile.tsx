'use client'
import type { ReactNode } from "react";
import { useState } from "react";
import { appcontext } from "@/lib/appContext";
export default function ContextFile({children}:{children: ReactNode}){
  const [loginUserInfo, setLoginUserInfo] = useState({id: '', email: ''})
  const [subjectSteps, setSubjectSteps] = useState<ProjectType[]>([])
    return (
        <div>
            <appcontext.Provider value={{loginUserInfo, setLoginUserInfo, subjectSteps, setSubjectSteps}}>
                {children}
            </appcontext.Provider>
        </div>
    )
}