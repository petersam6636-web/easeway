
'use client'

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
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
    Copy,
    ClipboardCheck
} from "lucide-react"

type Feedback = {
    type: "success" | "error"
    message: string
} | null

type CopyNotice = {
    type: "success" | "error"
    message: string
} | null

export default function SubjectScores() {
    const router = useRouter()

    const {
        allStudents,
        setAllStudents,
        projectMethod,
        subjectSteps
    } = useApp()

    // Subject navigation
    const [positionCounter, setPositionCounter] = useState<number>(0)

    // Current subject
    const currentSubject = String(
        subjectSteps[positionCounter] || ""
    )

    // Preserve original students for matching database records
    const [originalStudents] = useState(() => [...allStudents])

    // Form states
    const [studentName, setStudentName] = useState("")
    const [marks, setMarks] = useState("")

    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState<Feedback>(null)

    // Students popup
    const [showStudents, setShowStudents] = useState(false)

    // Copy notification
    const [copyNotice, setCopyNotice] = useState<CopyNotice>(null)

    // Initial number of students
    const [totalStudents] = useState<number>(originalStudents.length)

    // Student progress
    const studentsLeft = allStudents.length

    const studentsAdded = Math.max(
        0,
        totalStudents - studentsLeft
    )

    const progressPercentage =
        totalStudents > 0
            ? (studentsAdded / totalStudents) * 100
            : 0

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Select the correct subject table
    const getSubjectTable = () => {
        const method = String(projectMethod).toLowerCase()

        if (method === "jhs") {
            return "jhs_subjects" as const
        }

        if (method === "primary") {
            return "primary_subjects" as const
        }

        return null
    }

    // Clear timeouts when component unmounts
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current)
            }
        }
    }, [])

    // Copy student's full name
    const handleCopyStudentName = async (fullName: string) => {
        try {
            await navigator.clipboard.writeText(fullName)

            setShowStudents(false)

            setCopyNotice({
                type: "success",
                message: `${fullName} copied successfully!`
            })

            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current)
            }

            copyTimeoutRef.current = setTimeout(() => {
                setCopyNotice(null)
                copyTimeoutRef.current = null
            }, 1500)

        } catch (error) {
            console.error("COPY ERROR:", error)

            setCopyNotice({
                type: "error",
                message: "Could not copy the student's name. Please try again."
            })

            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current)
            }

            copyTimeoutRef.current = setTimeout(() => {
                setCopyNotice(null)
                copyTimeoutRef.current = null
            }, 2000)
        }
    }

    // Move to the next subject or final page
    const moveToNextSubject = async () => {

        // Check whether the current subject is the last subject
        if (positionCounter >= subjectSteps.length - 1) {
            router.push("/home/project/final")
            return
        }

        const table = getSubjectTable()

        if (!table) {
            setFeedback({
                type: "error",
                message: `Invalid project method: "${String(projectMethod)}". Expected JHS or Primary.`
            })
            return
        }

        setLoading(true)

        try {
            // Fetch student IDs from the selected subject table
            const { data, error } = await supabase
                .from(table)
                .select("student_id")

            if (error) {
                console.error("FETCH SUBJECT STUDENTS ERROR:", error)
                throw error
            }

            // Collect IDs from the fetched subject records
            const savedStudentIds = new Set(
                (data ?? []).map((record) => String(record.student_id))
            )

            // Match fetched IDs against the original student records
            const nextStudents = originalStudents.filter(
                (student) => savedStudentIds.has(String(student.id))
            )

            // Protect against moving forward with an empty result
            if (
                originalStudents.length > 0 &&
                nextStudents.length === 0
            ) {
                throw new Error(
                    "No matching student records were found in the subject table. Please check the saved student records."
                )
            }

            // Replace allStudents with the matched students
            setAllStudents(nextStudents)

            // Move to the next subject
            setPositionCounter((previous) => previous + 1)

            // Reset form
            setStudentName("")
            setMarks("")
            setFeedback(null)

            // Close popup
            setShowStudents(false)

        } catch (error) {
            console.error("ERROR FETCHING STUDENTS FOR NEXT SUBJECT:", error)

            const actualError =
                error instanceof Error
                    ? error.message
                    : "Could not fetch students for the next subject."

            setFeedback({
                type: "error",
                message: actualError
            })

        } finally {
            setLoading(false)
        }
    }

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
            numericMarks < 0 ||
            numericMarks > 100
        ) {
            setFeedback({
                type: "error",
                message: "Please enter a valid mark between 0 and 100."
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
        const table = getSubjectTable()

        if (!table) {
            setFeedback({
                type: "error",
                message: `Invalid project method: "${String(projectMethod)}". Expected JHS or Primary.`
            })
            return
        }

        setLoading(true)

        try {

            if (positionCounter === 0) {

                // FIRST SUBJECT:
                // Create the student's subject record with student_id
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
                        insertData,
                        positionCounter,
                        subjectColumn
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

            } else {

                // SECOND SUBJECT AND ABOVE:
                // Update the existing student record using student_id
                const { data, error } = await supabase
                    .from(table)
                    .update({
                        [subjectColumn]: numericMarks
                    })
                    .eq("student_id", matchedStudent.id)
                    .select("student_id")
                    .maybeSingle()

                if (error) {
                    console.error("SUPABASE UPDATE ERROR:", {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code,
                        table,
                        studentId: matchedStudent.id,
                        positionCounter,
                        subjectColumn
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

                // Make sure the existing record was actually updated
                if (!data) {
                    throw new Error(
                        `No existing subject record was found for ${matchedStudent.full_name}. Please check the previous subject's saved record.`
                    )
                }
            }

            // Remove successfully added student from current list
            const remainingStudents = allStudents.filter(
                (student) => student.id !== matchedStudent.id
            )

            setAllStudents(remainingStudents)

            // Reset inputs
            setStudentName("")
            setMarks("")

            // Calculate progress after this insertion/update
            const addedAfterInsert =
                totalStudents - remainingStudents.length

            const progressAfterInsert =
                totalStudents > 0
                    ? (addedAfterInsert / totalStudents) * 100
                    : 0

            const subjectCompleted =
                remainingStudents.length === 0 &&
                progressAfterInsert === 100

            // Show success feedback
            setFeedback({
                type: "success",
                message: `${matchedStudent.full_name}'s ${currentSubject} mark was successfully saved!`
            })

            // Clear previous timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            // Wait briefly before continuing
            timeoutRef.current = setTimeout(() => {
                setFeedback(null)
                timeoutRef.current = null

                // Move to next subject only when all students are completed
                if (subjectCompleted) {
                    void moveToNextSubject()
                }
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

    // No subject available
    if (!currentSubject) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center">
                    <AlertCircle
                        size={35}
                        className="mx-auto text-red-500 mb-3"
                    />

                    <h2 className="text-lg font-bold text-slate-800">
                        No Subject Available
                    </h2>

                    <p className="text-sm text-slate-500 mt-2">
                        Please check your project subject configuration.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Copy Notification */}
            {copyNotice && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm animate-in fade-in slide-in-from-top-3 duration-200">
                    <div
                        className={`flex items-center gap-3 p-4 rounded-2xl shadow-xl border ${
                            copyNotice.type === "success"
                                ? "bg-white border-green-100 text-green-700"
                                : "bg-white border-red-100 text-red-600"
                        }`}
                    >
                        {copyNotice.type === "success" ? (
                            <div className="w-9 h-9 shrink-0 rounded-full bg-green-50 flex items-center justify-center">
                                <ClipboardCheck size={20} />
                            </div>
                        ) : (
                            <div className="w-9 h-9 shrink-0 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertCircle size={20} />
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">
                                {copyNotice.type === "success"
                                    ? "Name Copied!"
                                    : "Copy Failed"}
                            </p>

                            <p className="text-xs mt-0.5 break-words">
                                {copyNotice.message}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setCopyNotice(null)}
                            className="shrink-0 text-slate-400 hover:text-slate-600 cursor-pointer"
                            aria-label="Close notification"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            <div className="min-h-[60vh] flex items-center justify-center px-2 py-2">

                <div className="w-full max-w-md">

                    {/* Heading */}
                    <div className="text-center mb-5">
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

                            {/* View Students Left */}
                            <button
                                type="button"
                                onClick={() => setShowStudents(true)}
                                disabled={studentsLeft === 0 || loading}
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
                                    {currentSubject}
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
                                    {currentSubject} Marks
                                </label>

                                <div className="relative">
                                    <Award
                                        size={19}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="any"
                                        value={marks}
                                        onChange={(e) => {
                                            setMarks(e.target.value)
                                            setFeedback(null)
                                        }}
                                        placeholder="Enter marks obtained"
                                        disabled={loading}
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
                                disabled={
                                    loading ||
                                    !currentSubject ||
                                    studentsLeft === 0
                                }
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

            {/* Students Left Popup */}
            {showStudents && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3 py-5">

                    <div className="w-full max-w-md max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">

                        {/* Popup Header */}
                        <div className="p-5 border-b border-slate-100">

                            <div className="flex items-center justify-between">

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

                            <p className="text-xs text-slate-400 mt-3">
                                Click a student's name to copy it.
                            </p>

                        </div>

                        {/* Student List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">

                            {allStudents.length > 0 ? (
                                allStudents.map((student, index) => (
                                    <button
                                        key={student.id}
                                        type="button"
                                        onClick={() => handleCopyStudentName(student.full_name)}
                                        className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition cursor-pointer group"
                                    >
                                        <div className="w-9 h-9 shrink-0 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm group-hover:bg-white">
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

                                        <div className="shrink-0 text-slate-400 group-hover:text-blue-700">
                                            <Copy size={17} />
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="py-10 text-center">
                                    <Users
                                        size={32}
                                        className="mx-auto text-slate-300 mb-3"
                                    />

                                    <p className="text-sm font-semibold text-slate-600">
                                        No students left
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1">
                                        All students have been completed.
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Popup Footer */}
                        <div className="p-4 border-t border-slate-100">

                            <button
                                type="button"
                                onClick={() => setShowStudents(false)}
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
