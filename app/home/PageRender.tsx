
"use client";

import { useEffect, useState } from "react";

import Project from "./Project";
import NotProject from "./NotProject";
import ProjectLoading from "@/component/Loading";

import useApp from "@/lib/useApp";
import { supabase } from "@/lib/supabase-client";

// Import your shared types if you have them in a separate file.
// Otherwise, place the types from above in this component.

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
        // STEP 1: Fetch projects belonging to the logged-in user

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

        // STEP 2: Fetch school data using projectId

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

        // STEP 3: Transform and combine student records

        const combinedData: ProjectWithStudents[] = (
          projects ?? []
        ).map((project) => {
          const jhsStudents = (project.jhs_students ?? []).map(
            (student) => ({
              ...student,
            })
          );

          const primaryStudents = (
            project.primary_students ?? []
          ).map((student) => ({
            ...student,
          }));

          // Both student types are now in one array

          const students: CombinedStudent[] = [
            ...jhsStudents,
            ...primaryStudents,
          ];

          // STEP 4: Attach school data to matching project

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

        // STEP 5: Save combined data into global state

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

  if (loading) {
    return <ProjectLoading />;
  }

  if (studentsSubject.length > 0) {
    return <Project />;
  }

  return <NotProject />;
}
