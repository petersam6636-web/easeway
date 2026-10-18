import type { Metadata } from "next";
import Sidebar from "./Sidebar";

export const metadata: Metadata = {
    title: 'Easeway',
    description: 'Make report card ease'
}


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="w-full h-full flex ">
        <Sidebar />
     <main className="flex-1 grow w-full  ">
        {children}
        </main>
    </div>
  );
}
