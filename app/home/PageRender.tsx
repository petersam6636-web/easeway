
"use client";

import { useEffect, useState } from "react";

import Project from "./Project";
import NotProject from "./NotProject";
import ProjectLoading from "@/component/Loading";

import useApp from "@/lib/useApp";
import { supabase } from "@/lib/supabase-client";

// ==========================================
// 1. YOUR DATABASE TYPES
// ==========================================

type StudentOtherInfo = {
  id: number;
  student_id: number;
  attendance: string;
  attitude: string;
  interest: string;
  created_at: string;
};

type PrimarySubject = {
  english: number | undefined;
  science: number | undefined;
  mathematics: number | undefined;
  computing: number | undefined;
  creative_arts: number | undefined;
  career_technology: number | undefined;
  rme: number | undefined;
  "fante/twi": number | undefined;
  student_id: number;
  jhs_student_data: StudentOtherInfo;
  id: number;
  created_at: string;
};

type JHSJuniorSubject = {
  jhs_student_data: StudentOtherInfo;
  english: number | undefined;
  science: number | undefined;
  mathematics: number | undefined;
  history: number | undefined;
  computing: number | undefined;
  creative_arts: number | undefined;
  career_technology: number | undefined;
  rme: number | undefined;
  "fante/twi": number | undefined;
  student_id: number;
  id: number;
  created_at: string;
};

type JHSStudent = {
  id: number;
  full_name: string;
  user_id: string;
  created_at: string;
  jhs_subjects: JHSJuniorSubject[];
};

type PrimaryStudent = {
  id: number;
  full_name: string;
  user_id: string;
  created_at: string;
  primary_subjects: PrimarySubject[];
};

type SchoolsData = {
  school_name: string;
  logo_image: string;
  id: number;
  location: string;
  project_id: number;
  created_at: string;
};

type SubjectType = {
  id: number;
  header: string;
  description: string;
  user_id: string;
  method: string;
  passMark: number;
  index: number;
  created_at: string;
};

type CombinedStudent =
  | (JHSStudent & { academic_level: "JHS" })
  | (PrimaryStudent & { academic_level: "Primary" });

type ProjectWithStudents = SubjectType & {
  school_data: SchoolsData | null;
  students: CombinedStudent[];
};

// ==========================================
// 2. PROJECT DATABASE RESPONSE TYPE
// ==========================================

type ProjectDatabaseResponse = SubjectType & {
  jhs_students: JHSStudent[] | null;
  primary_students: PrimaryStudent[] | null;
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

export default function PageRender() {
  const {
    loginUserInfo,
    projectId,
    studentsSubject,
    setStudentsSubject,
  } = useApp();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchProjectData() {
      if (!loginUserInfo?.id) {
        setStudentsSubject([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // ==================================
        // STEP 1: FETCH PROJECTS AND STUDENTS
        // ==================================

        const { data: projects, error: projectError } =
          await supabase
            .from("projects")
            .select(`
              *,
              jhs_students (
                *,
                jhs_subjects (
                  *,
                  jhs_student_data (*)
                )
              ),
              primary_students (
                *,
                primary_subjects (
                  *,
                  jhs_student_data (*)
                )
              )
            `)
            .eq("user_id", loginUserInfo.id);

        if (projectError) {
          throw projectError;
        }

        if (!isMounted) return;

        const projectRows =
          (projects ?? []) as unknown as ProjectDatabaseResponse[];

        // ==================================
        // STEP 2: FETCH SCHOOL DATA
        // ==================================

        let schoolData: SchoolsData | null = null;

        if (projectId) {
          const { data, error: schoolError } = await supabase
            .from("school_data")
            .select("*")
            .eq("project_id", projectId)
            .maybeSingle();

          if (schoolError) {
            throw schoolError;
          }

          schoolData = data as SchoolsData | null;
        }

        if (!isMounted) return;

        // ==================================
        // STEP 3: COMBINE STUDENTS
        // ==================================

        const combinedData: ProjectWithStudents[] =
          projectRows.map((project): ProjectWithStudents => {

            // JHS students
            const jhsStudents: CombinedStudent[] = (
              project.jhs_students ?? []
            ).map((student): CombinedStudent => ({
              ...student,
              academic_level: "JHS",
            }));

            // Primary students
            const primaryStudents: CombinedStudent[] = (
              project.primary_students ?? []
            ).map((student): CombinedStudent => ({
              ...student,
              academic_level: "Primary",
            }));

            // Combine both student types
            const students: CombinedStudent[] = [
              ...jhsStudents,
              ...primaryStudents,
            ];

            // ==================================
            // STEP 4: MATCH SCHOOL DATA
            // ==================================

            const matchingSchool =
              schoolData?.project_id === project.id
                ? schoolData
                : null;

            // Remove separate student properties
            const {
              jhs_students,
              primary_students,
              ...projectInfo
            } = project;

            return {
              ...projectInfo,
              school_data: matchingSchool,
              students,
            };
          });

        if (!isMounted) return;

        // ==================================
        // STEP 5: UPDATE GLOBAL STATE
        // ==================================

        setStudentsSubject(combinedData);

      } catch (error) {
        console.error("Error fetching project data:", error);

        if (isMounted) {
          setStudentsSubject([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProjectData();

    return () => {
      isMounted = false;
    };
  }, [
    loginUserInfo?.id,
    projectId,
    setStudentsSubject,
  ]);

  // ==================================
  // STEP 6: RENDER
  // ==================================

  if (loading) {
    return <ProjectLoading />;
  }

  if (studentsSubject.length > 0) {
    return <Project />;
  }

  return <NotProject />;
}
