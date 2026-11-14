
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

    async function fetchSubjects() {
      if (!loginUserInfo?.id) {
        setStudentsSubject([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          school_data (*),
          jhs_students (
            *,
            jhs_subjects (
              *,
              jhs_student_data (*)
            )
          )
        `)
        .eq("user_id", loginUserInfo.id);

      if (!isMounted) return;

      if (error) {
        console.error("Error fetching project data:", error.message);
        setStudentsSubject([]);
      } else {
        setStudentsSubject(data ?? []);
      }

      setLoading(false);
    }

    fetchSubjects();

    return () => {
      isMounted = false;
    };
  }, [loginUserInfo?.id, setStudentsSubject]);

  if (loading) {
    return <ProjectLoading />;
  }

  if (studentsSubject.length > 0) {
    return <Project />;
  }

  return <NotProject />;
}
