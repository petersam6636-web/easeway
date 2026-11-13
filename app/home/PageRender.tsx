
"use client";

import { useEffect, useState } from "react";

import Project from "./Project";
import NotProject from "./NotProject";
import ProjectLoading from "@/component/Loading";

import useApp from "@/lib/useApp";
import { supabase } from "@/lib/supabase-client";



export default function PageRender() {
  const { loginUserInfo } = useApp();

  const [projects, setProjects] = useState<string[]>(['s', 's, ']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (!loginUserInfo?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", loginUserInfo.id);

      if (error) {
        console.error("Error fetching projects:", error.message);
        setProjects([]);
      } else {
        setProjects((data ?? []) as ProjectData[]);
      }

      setLoading(false);
    }

    fetchProjects();
  }, [loginUserInfo?.id]);

  if (loading) {
    return <ProjectLoading />;
  }

  if (projects.length > 0) {
    return <Project />;
  }

  return <NotProject />;
}
