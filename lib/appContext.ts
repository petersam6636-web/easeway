'use client'
import { createContext, type Dispatch , type SetStateAction} from "react"
type ContextType = null | 
{
    loginUserInfo: {id: string, email: string}
    setLoginUserInfo: Dispatch<SetStateAction<{id: string, email: string}>>
    subjectSteps: ProjectType[];
    setSubjectSteps: Dispatch<SetStateAction<ProjectType[]>>;
    studentsSubject: SubjectType[];
    setStudentsSubject: Dispatch<SetStateAction<SubjectType[]>>;
    schoolData_ui: SchoolData
    setSchoolData_ui: Dispatch<SetStateAction<SchoolData>>;
    projectDetails: ProjectDetailsType
    setProjectDetails: Dispatch<SetStateAction<ProjectDetailsType>>;
    projectId: number;
    setProjectId: (value: number) => void;
    projectMethod: string;
    setProjectMethod: (value: string) => void;
}

export const appcontext =  createContext(null)

