
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
    studentsSubject,
    setStudentsSubject,
  } = useApp();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchProjectData() {
      if (!loginUserInfo?.id) {
        console.log("No logged-in user found.");

        setStudentsSubject([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        console.group("EASEWAY PROJECT FETCHING");

        // ==========================================
        // STEP 1: FETCH THE USER'S PROJECTS
        // ==========================================

        console.log("Fetching projects for:", loginUserInfo.id);

        const {
          data: projects,
          error: projectError,
        } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", loginUserInfo.id);

        if (projectError) {
          console.error("Projects error:", projectError);
          throw projectError;
        }

        if (!isMounted) return;

        const projectRows = projects ?? [];

        console.log("Fetched projects:", projectRows);
        console.log("Number of projects:", projectRows.length);

        if (projectRows.length === 0) {
          console.log("This user has no projects.");

          setStudentsSubject([]);
          return;
        }

        const projectIds = projectRows.map(
          (project) => project.id
        );

        console.log("Project IDs:", projectIds);

        // ==========================================
        // STEP 2: FETCH SCHOOL DATA AND STUDENTS
        // ==========================================

        const [
          { data: schoolData, error: schoolError },
          { data: jhsStudents, error: jhsStudentsError },
          { data: primaryStudents, error: primaryStudentsError },
        ] = await Promise.all([
          supabase
            .from("school_data")
            .select("*")
            .in("project_id", projectIds),

          supabase
            .from("jhs_students")
            .select("*")
            .in("project_id", projectIds),

          supabase
            .from("primary_students")
            .select("*")
            .in("project_id", projectIds),
        ]);

        if (schoolError) {
          console.error("School data error:", schoolError);
          throw schoolError;
        }

        if (jhsStudentsError) {
          console.error("JHS students error:", jhsStudentsError);
          throw jhsStudentsError;
        }

        if (primaryStudentsError) {
          console.error("Primary students error:", primaryStudentsError);
          throw primaryStudentsError;
        }

        if (!isMounted) return;

        const jhsStudentRows = jhsStudents ?? [];
        const primaryStudentRows = primaryStudents ?? [];

        console.log("School data:", schoolData);
        console.log("JHS students:", jhsStudentRows);
        console.log("Primary students:", primaryStudentRows);

        // ==========================================
        // STEP 3: COMBINE STUDENTS
        // ==========================================

        const allStudents = [
          ...jhsStudentRows,
          ...primaryStudentRows,
        ];

        const studentIds = allStudents.map(
          (student) => student.id
        );

        console.log("All student IDs:", studentIds);
        console.log("Total students:", allStudents.length);

        // ==========================================
        // STEP 4: FETCH STUDENT DATA AND SUBJECTS
        // ==========================================

        let jhsStudentData = [];
        let primaryStudentData = [];

        let jhsSubjects = [];
        let primarySubjects = [];

        if (studentIds.length > 0) {
          const [
            { data: jhsData, error: jhsDataError },
            { data: primaryData, error: primaryDataError },
            { data: jhsSubjectData, error: jhsSubjectError },
            { data: primarySubjectData, error: primarySubjectError },
          ] = await Promise.all([
            supabase
              .from("jhs_student_data")
              .select("*")
              .in("student_id", studentIds),

            supabase
              .from("primary_student_data")
              .select("*")
              .in("student_id", studentIds),

            // FIXED TABLE NAME: jhs_subjects
            supabase
              .from("jhs_subjects")
              .select("*")
              .in("student_id", studentIds),

            supabase
              .from("primary_subjects")
              .select("*")
              .in("student_id", studentIds),
          ]);

          if (jhsDataError) {
            console.error("JHS student data error:", jhsDataError);
            throw jhsDataError;
          }

          if (primaryDataError) {
            console.error("Primary student data error:", primaryDataError);
            throw primaryDataError;
          }

          if (jhsSubjectError) {
            console.error("JHS subjects error:", jhsSubjectError);
            throw jhsSubjectError;
          }

          if (primarySubjectError) {
            console.error("Primary subjects error:", primarySubjectError);
            throw primarySubjectError;
          }

          jhsStudentData = jhsData ?? [];
          primaryStudentData = primaryData ?? [];

          jhsSubjects = jhsSubjectData ?? [];
          primarySubjects = primarySubjectData ?? [];
        }

        if (!isMounted) return;

        console.log("JHS student data:", jhsStudentData);
        console.log("Primary student data:", primaryStudentData);
        console.log("JHS subjects:", jhsSubjects);
        console.log("Primary subjects:", primarySubjects);

        // ==========================================
        // STEP 5: ATTACH DATA TO EACH JHS STUDENT
        // ==========================================

        const updatedJhsStudents = jhsStudentRows.map(
          (student) => {
            const matchingStudentData =
              jhsStudentData.find(
                (item) => item.student_id === student.id
              ) ?? null;

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

        console.log("Updated JHS students:", updatedJhsStudents);

        // ==========================================
        // STEP 6: ATTACH DATA TO EACH PRIMARY STUDENT
        // ==========================================

        const updatedPrimaryStudents = primaryStudentRows.map(
          (student) => {
            const matchingStudentData =
              primaryStudentData.find(
                (item) => item.student_id === student.id
              ) ?? null;

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

        console.log("Updated Primary students:", updatedPrimaryStudents);

        // ==========================================
        // STEP 7: COMBINE THE UPDATED STUDENTS
        // ==========================================

        const combinedStudents = [
          ...updatedJhsStudents,
          ...updatedPrimaryStudents,
        ];

        console.log("Combined students:", combinedStudents);

        // ==========================================
        // STEP 8: ATTACH SCHOOL DATA AND STUDENTS
        // TO EACH PROJECT
        // ==========================================

        const combinedData = projectRows.map((project) => {
          const matchingSchool =
            schoolData?.find(
              (school) => school.project_id === project.id
            ) ?? null;

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

        console.log("FINAL PROJECT DATA:", combinedData);

        console.log(
          "FINAL PROJECT COUNT:",
          combinedData.length
        );

        console.log(
          "FINAL STUDENT COUNT:",
          combinedData.reduce(
            (total, project) => total + project.students.length,
            0
          )
        );

        setStudentsSubject(combinedData);

        console.log("Global project data updated successfully.");

        console.groupEnd();

      } catch (error) {
        console.error(
          "ERROR FETCHING EASEWAY PROJECT DATA:",
          error
        );

        if (error && typeof error === "object") {
          console.error("Error details:", {
            code: "code" in error ? error.code : undefined,
            message: "message" in error ? error.message : undefined,
            details: "details" in error ? error.details : undefined,
            hint: "hint" in error ? error.hint : undefined,
          });
        }

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

  if (studentsSubject?.length > 0) {
    return <Project />;
  }

  if (studentsSubject?.length === 0) {
    return <NotProject />;
  }

  return null;
}
