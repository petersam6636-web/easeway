'use client'
import { createContext, type Dispatch , type SetStateAction} from "react"
type ContextType = null | 
{
    loginUserInfo: {id: string, email: string}
    setLoginUserInfo: Dispatch<SetStateAction<{id: string, email: string}>>
    subjectSteps: ProjectType[];
    setSubjectSteps: Dispatch<SetStateAction<ProjectType[]>>;

}

export const appcontext =  createContext<ContextType>(null)

