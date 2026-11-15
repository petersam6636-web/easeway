
"use client";

import { useEffect, useState } from "react";

import Project from "./Project";
import NotProject from "./NotProject";
import ProjectLoading from "@/component/Loading";

import useApp from "@/lib/useApp";
import { supabase } from "@/lib/supabase-client";

export default function PageRender() {
  const {
    loginUserInfo,
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
        // ==========================================
        // STEP 1: FETCH THE USER'S PROJECTS
        // ==========================================

        const { data: projects, error: projectError } =
          await supabase
            .from("projects")
            .select("*")
            .eq("user_id", loginUserInfo.id);

        if (projectError) {
          throw projectError;
        }

        if (!isMounted) return;

        const projectRows = projects ?? [];

        // If the user has no projects, stop here.
        if (projectRows.length === 0) {
          setStudentsSubject([]);
          return;
        }

        // Get all project IDs.
        const projectIds = projectRows.map(
          (project) => project.id
        );

        // ==========================================
        // STEP 2: FETCH SCHOOL DATA AND STUDENTS
        // ==========================================

        const [
          { data: schoolData, error: schoolError },
          { data: jhsStudents, error: jhsStudentsError },
          { data: primaryStudents, error: primaryStudentsError },
        ] = await Promise.all([
          // Fetch school information belonging to these projects.
          supabase
            .from("school_data")
            .select("*")
            .in("project_id", projectIds),

          // Fetch JHS students belonging to these projects.
          supabase
            .from("jhs_students")
            .select("*")
            .in("project_id", projectIds),

          // Fetch Primary students belonging to these projects.
          supabase
            .from("primary_students")
            .select("*")
            .in("project_id", projectIds),
        ]);

        if (schoolError) throw schoolError;
        if (jhsStudentsError) throw jhsStudentsError;
        if (primaryStudentsError) throw primaryStudentsError;

        if (!isMounted) return;

        const jhsStudentRows = jhsStudents ?? [];
        const primaryStudentRows = primaryStudents ?? [];

        // ==========================================
        // STEP 3: COMBINE STUDENTS
        // ==========================================

        const allStudents = [
          ...jhsStudentRows,
          ...primaryStudentRows,
        ];

        // Get all student IDs.
        const studentIds = allStudents.map(
          (student) => student.id
        );

        // ==========================================
        // STEP 4: FETCH STUDENT DATA AND SUBJECTS
        // ==========================================

        let jhsStudentData = [];
        let primaryStudentData = [];

        let jhsSubjects = [];
        let primarySubjects = [];

        // Only fetch these records when students exist.
        if (studentIds.length > 0) {
          const [
            { data: jhsData, error: jhsDataError },
            { data: primaryData, error: primaryDataError },
            { data: jhsSubjectData, error: jhsSubjectError },
            { data: primarySubjectData, error: primarySubjectError },
          ] = await Promise.all([
            // Fetch additional information for JHS students.
            supabase
              .from("jhs_student_data")
              .select("*")
              .in("student_id", studentIds),

            // Fetch additional information for Primary students.
            supabase
              .from("primary_student_data")
              .select("*")
              .in("student_id", studentIds),

            // Fetch JHS subjects belonging to the students.
            supabase
              .from("jhs_subject")
              .select("*")
              .in("student_id", studentIds),

            // Fetch Primary subjects belonging to the students.
            supabase
              .from("primary_subjects")
              .select("*")
              .in("student_id", studentIds),
          ]);

          if (jhsDataError) throw jhsDataError;
          if (primaryDataError) throw primaryDataError;
          if (jhsSubjectError) throw jhsSubjectError;
          if (primarySubjectError) throw primarySubjectError;

          jhsStudentData = jhsData ?? [];
          primaryStudentData = primaryData ?? [];

          jhsSubjects = jhsSubjectData ?? [];
          primarySubjects = primarySubjectData ?? [];
        }

        if (!isMounted) return;

        // ==========================================
        // STEP 5: ATTACH DATA TO EACH JHS STUDENT
        // ==========================================

        const updatedJhsStudents = jhsStudentRows.map(
          (student) => {
            // Find this student's additional information.
            const matchingStudentData =
              jhsStudentData.find(
                (item) => item.student_id === student.id
              ) ?? null;

            // Find all subjects belonging to this student.
            const matchingSubjects = jhsSubjects.filter(
              (subject) => subject.student_id === student.id
            );

            return {
              ...student,
              jhs_student_data: matchingStudentData,
              jhs_subjects: matchingSubjects,
            };
          }
        );

        // ==========================================
        // STEP 6: ATTACH DATA TO EACH PRIMARY STUDENT
        // ==========================================

        const updatedPrimaryStudents = primaryStudentRows.map(
          (student) => {
            // Find this student's additional information.
            const matchingStudentData =
              primaryStudentData.find(
                (item) => item.student_id === student.id
              ) ?? null;

            // Find all subjects belonging to this student.
            const matchingSubjects = primarySubjects.filter(
              (subject) => subject.student_id === student.id
            );

            return {
              ...student,
              primary_student_data: matchingStudentData,
              primary_subjects: matchingSubjects,
            };
          }
        );

        // ==========================================
        // STEP 7: COMBINE THE UPDATED STUDENTS
        // ==========================================

        const combinedStudents = [
          ...updatedJhsStudents,
          ...updatedPrimaryStudents,
        ];

        // ==========================================
        // STEP 8: ATTACH SCHOOL DATA AND STUDENTS
        // TO EACH PROJECT
        // ==========================================

        const combinedData = projectRows.map((project) => {
          // Find school information belonging to this project.
          const matchingSchool =
            schoolData?.find(
              (school) => school.project_id === project.id
            ) ?? null;

          // Find students belonging to this project.
          const matchingStudents = combinedStudents.filter(
            (student) => student.project_id === project.id
          );

          return {
            ...project,
            school_data: matchingSchool,
            students: matchingStudents,
          };
        });

        if (!isMounted) return;

        // ==========================================
        // STEP 9: UPDATE GLOBAL STATE
        // ==========================================

        setStudentsSubject(combinedData);

      } catch (error) {
        console.error(
          "Error fetching project data:",
          error
        );

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
    setStudentsSubject,
  ]);

  // ==========================================
  // STEP 10: RENDER
  // ==========================================

  if (loading) {
    return <ProjectLoading />;
  }

  if (useApp && false) {
    return null;
  }

  // Check whether projects exist.
  // Students are not required for a project to exist.
  return <Project />;
}
