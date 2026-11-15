
'use client'

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import useApp from "@/lib/useApp"
import {
    UserRound,
    BookOpen,
    Plus,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Award,
    Users,
    ArrowLeft,
    X,
    Search
} from "lucide-react"

type Feedback = {
    type: "success" | "error"
    message: string
} | null

export default function SubjectScores() {
    const { allStudents, setAllStudents, projectMethod, subjectSteps } = useApp()

    const [positionCounter, setPositionCounter] = useState<number>(0)
    const [currentSubject, setCurrentSubject] = useState<string>("english")

    const [studentName, setStudentName] = useState("")
    const [marks, setMarks] = useState("")

    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState<Feedback>(null)

    const [showStudents, setShowStudents] = useState(false)
    const [searchStudent, setSearchStudent] = useState("")

    // Track the initial number of students
    const [totalStudents] = useState<number>(allStudents.length)

    // Calculate progress
    const studentsLeft = allStudents.length
    const studentsAdded = totalStudents - studentsLeft

    const progressPercentage =
        totalStudents > 0
            ? (studentsAdded / totalStudents) * 100
            : 0

    // Filter students in popup
    const filteredStudents = allStudents.filter((student) =>
        student.full_name.toLowerCase().includes(searchStudent.toLowerCase())
    )

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Clear timeout when component unmounts
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const handleAddStudent = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault()

        if (loading) return

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }

        setFeedback(null)

        const fullName = studentName.trim()
        const numericMarks = Number(marks)

        // Validate student name
        if (!fullName) {
            setFeedback({
                type: "error",
                message: "Please enter the student's full name."
            })
            return
        }

        // Validate marks
        if (
            marks.trim() === "" ||
            !Number.isFinite(numericMarks) ||
            numericMarks < 0
        ) {
            setFeedback({
                type: "error",
                message: "Please enter a valid mark."
            })
            return
        }

        // Validate current subject
        if (!currentSubject) {
            setFeedback({
                type: "error",
                message: "No subject is currently available."
            })
            return
        }

        // Convert subject to lowercase for database column
        const subjectColumn = currentSubject.trim().toLowerCase()

        // Find student by full name
        const matchedStudent = allStudents.find(
            (student) =>
                student.full_name.trim().toLowerCase() ===
                fullName.toLowerCase()
        )

        if (!matchedStudent) {
            setFeedback({
                type: "error",
                message: `Student "${fullName}" does not exist in this project.`
            })
            return
        }

        // Select table according to project method
        const method = String(projectMethod).toLowerCase()

        const table =
            method === "jhs"
                ? "jhs_subjects"
                : method === "primary"
                    ? "primary_subjects"
                    : null

        if (!table) {
            setFeedback({
                type: "error",
                message: `Invalid project method: "${String(projectMethod)}". Expected JHS or Primary.`
            })
            return
        }

        setLoading(true)

        try {
            // Insert using lowercase subject column
            const insertData = {
                student_id: matchedStudent.id,
                [subjectColumn]: numericMarks
            }

            const { error } = await supabase
                .from(table)
                .insert(insertData)

            if (error) {
                console.error("SUPABASE INSERT ERROR:", {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    table,
                    insertData
                })

                throw new Error(
                    [
                        `Database error: ${error.message}`,
                        error.details ? `Details: ${error.details}` : "",
                        error.hint ? `Hint: ${error.hint}` : "",
                        error.code ? `Code: ${error.code}` : ""
                    ]
                        .filter(Boolean)
                        .join("\n")
                )
            }

            // Remove successfully added student from shared student list
            setAllStudents((previousStudents) =>
                previousStudents.filter(
                    (student) => student.id !== matchedStudent.id
                )
            )

            // Reset inputs after successful insertion
            setStudentName("")
            setMarks("")

            setFeedback({
                type: "success",
                message: `${matchedStudent.full_name}'s ${currentSubject} mark was successfully saved!`
            })

            // Remove success feedback after 400ms
            timeoutRef.current = setTimeout(() => {
                setFeedback(null)
                timeoutRef.current = null
            }, 400)

        } catch (error) {
            console.error("ERROR SAVING STUDENT MARKS:", error)

            const actualError =
                error instanceof Error
                    ? error.message
                    : typeof error === "string"
                        ? error
                        : JSON.stringify(error, null, 2)

            setFeedback({
                type: "error",
                message: actualError || "An unknown error occurred."
            })

        } finally {
            setLoading(false)
        }
    }

    const content =
        positionCounter === 0 ? (
            <div className="min-h-[70vh] flex items-center justify-center px-2 py-2">

                <div className="w-full max-w-md">

                    {/* Heading */}
                    <div className="text-center mb-7">
                        <h2 className="text-2xl font-bold text-slate-800">
                            Enter Student Marks
                        </h2>

                        <p className="text-sm text-slate-500 mt-2">
                            Record each student's marks for the selected subject.
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-7">

                        {/* Student Progress */}
                        <div className="mb-6">

                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-blue-700" />
                                    <p className="text-sm font-semibold text-slate-700">
                                        Student Progress
                                    </p>
                                </div>

                                <span className="text-xs font-semibold text-blue-700">
                                    {Math.round(progressPercentage)}% completed
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">

                                {/* Students Left */}
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-red-600 tabular-nums">
                                        {studentsLeft}
                                    </p>

                                    <p className="text-xs font-medium text-red-600 mt-1">
                                        Students Left
                                    </p>
                                </div>

                                {/* Students Added */}
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-green-600 tabular-nums">
                                        {studentsAdded}
                                    </p>

                                    <p className="text-xs font-medium text-green-600 mt-1">
                                        Students Added
                                    </p>
                                </div>

                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progressPercentage}%`
                                    }}
                                />
                            </div>

                            {/* View Students Left Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchStudent("")
                                    setShowStudents(true)
                                }}
                                disabled={studentsLeft === 0}
                                className="mt-3 w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Users size={16} />
                                View Students Left 
                            </button>

                        </div>

                        {/* Dynamic Current Subject */}
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-center gap-3">

                            <div className="w-11 h-11 shrink-0 rounded-xl bg-white flex items-center justify-center text-blue-700">
                                <BookOpen size={22} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-medium text-blue-600">
                                    Current Subject
                                </p>

                                <h3 className="text-lg font-bold text-blue-950 capitalize truncate">
                                    {currentSubject || "Loading subject..."}
                                </h3>
                            </div>

                            <div className="ml-auto text-blue-600">
                                <Award size={22} />
                            </div>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleAddStudent}
                            className="space-y-5"
                        >

                            {/* Student Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Student Full Name
                                </label>

                                <div className="relative">
                                    <UserRound
                                        size={19}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="text"
                                        value={studentName}
                                        onChange={(e) => {
                                            setStudentName(e.target.value)
                                            setFeedback(null)
                                        }}
                                        placeholder="Enter student's full name"
                                        disabled={loading}
                                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Subject Marks */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 capitalize">
                                    {currentSubject || "Subject"} Marks
                                </label>

                                <div className="relative">
                                    <Award
                                        size={19}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={marks}
                                        onChange={(e) => {
                                            setMarks(e.target.value)
                                            setFeedback(null)
                                        }}
                                        placeholder="Enter marks obtained"
                                        disabled={loading || !currentSubject}
                                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            {/* Feedback */}
                            {feedback && (
                                <div
                                    className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                                        feedback.type === "success"
                                            ? "bg-green-50 text-green-700 border border-green-100"
                                            : "bg-red-50 text-red-700 border border-red-200"
                                    }`}
                                >
                                    {feedback.type === "success" ? (
                                        <CheckCircle2
                                            size={19}
                                            className="shrink-0 mt-0.5"
                                        />
                                    ) : (
                                        <AlertCircle
                                            size={19}
                                            className="shrink-0 mt-0.5"
                                        />
                                    )}

                                    <p className="whitespace-pre-wrap break-words min-w-0">
                                        {feedback.message}
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !currentSubject || studentsLeft === 0}
                                className="w-full h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2
                                            size={19}
                                            className="animate-spin"
                                        />
                                        Saving Marks...
                                    </>
                                ) : studentsLeft === 0 ? (
                                    <>
                                        <CheckCircle2 size={19} />
                                        All Students Completed
                                    </>
                                ) : (
                                    <>
                                        <Plus size={19} />
                                        Add Student Marks
                                    </>
                                )}
                            </button>

                        </form>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-slate-400 mt-5">
                        Enter one student's marks at a time.
                    </p>

                </div>
            </div>
        ) : positionCounter === subjectSteps.length ? (
            <div></div>
        ) : positionCounter > 0 ? (
            <div></div>
        ) : (
            <div></div>
        )

    return (
        <>
            {content}

            {/* Students Left Popup */}
            {showStudents && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3 py-5">

                    <div className="w-full max-w-md max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">

                        {/* Popup Header */}
                        <div className="p-5 border-b border-slate-100">

                            <div className="flex items-center justify-between mb-4">

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                                        <Users size={20} />
                                    </div>

                                    <div>
                                        <h2 className="font-bold text-slate-800">
                                            Students Left
                                        </h2>

                                        <p className="text-xs text-slate-500">
                                            {studentsLeft} students remaining
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowStudents(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                                    aria-label="Close students list"
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search
                                    size={17}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={searchStudent}
                                    onChange={(e) => setSearchStudent(e.target.value)}
                                    placeholder="Search student name..."
                                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                        </div>

                        {/* Student List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">

                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student, index) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                                    >
                                        <div className="w-9 h-9 shrink-0 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                                            {student.full_name.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                {student.full_name}
                                            </p>

                                            <p className="text-xs text-slate-400">
                                                Student #{index + 1}
                                            </p>
                                        </div>

                                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center">
                                    <Users
                                        size={32}
                                        className="mx-auto text-slate-300 mb-3"
                                    />

                                    <p className="text-sm font-semibold text-slate-600">
                                        No students found
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1">
                                        Try another search.
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Popup Footer */}
                        <div className="p-4 border-t border-slate-100">

                            <button
                                type="button"
                                onClick={() => {
                                    setShowStudents(false)
                                    setSearchStudent("")
                                }}
                                className="w-full h-11 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                                <ArrowLeft size={17} />
                                Back to Enter Marks
                            </button>

                        </div>

                    </div>
                </div>
            )}
        </>
    )
}