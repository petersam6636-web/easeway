
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
    ClipboardCheck,
    ArrowRight
} from "lucide-react"

type Feedback = {
    type: "success" | "error"
    message: string
} | null

type CopyNotice = {
    type: "success" | "error"
    message: string
} | null

type SubjectStudentRecord = {
    student_id: string
    [key: string]: unknown
}

function evaluateMarksExpression(value: string): number | null {
    const expression = value.trim().replace(/÷/g, "/").replace(/×/g, "*")

    if (!expression || !/^[\d\s.+*/()-]+$/.test(expression)) {
        return null
    }

    try {
        const result: unknown = eval(expression)
        return typeof result === "number" && Number.isFinite(result)
            ? result
            : null
    } catch (error) {
        if (error instanceof SyntaxError) {
            return null
        }

        throw error
    }
}

export default function SubjectScores() {
    const router = useRouter()

    const {
        allStudents,
        setAllStudents,
        projectMethod,
        subjectSteps,
        projectId
    } = useApp()

    // Identify database metadata columns.
    const isMetadataSubject = useCallback((subject: unknown) => {
        const normalized = String(subject ?? "")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_")

        return (
            normalized === "created_at" ||
            normalized === "create_at"
        )
    }, [])

    // Remove metadata columns. Only actual subjects remain.
    const validSubjectSteps = useMemo(() => {
        return subjectSteps.filter(
            (subject) => !isMetadataSubject(subject)
        )
    }, [subjectSteps, isMetadataSubject])

    const [positionCounter, setPositionCounter] = useState(0)
    const [entryMethod, setEntryMethod] = useState("automatic")
    const [manualSubject, setManualSubject] = useState<string | null>(null)
    const [completedManualSubjects, setCompletedManualSubjects] = useState<string[]>([])
    const [savedSubjectRecords, setSavedSubjectRecords] = useState<SubjectStudentRecord[]>([])

    const isManualEntry = entryMethod.trim().toLowerCase() === "manual"

    const currentSubject = String(
        isManualEntry
            ? manualSubject ?? ""
            : validSubjectSteps[positionCounter] ?? ""
    ).trim()

    const manualSubjectsToEnter = useMemo(() => {
        return validSubjectSteps.filter(
            (subject) =>
                !completedManualSubjects.some(
                    (completedSubject) =>
                        completedSubject.toLowerCase() ===
                        String(subject).trim().toLowerCase()
                )
        )
    }, [validSubjectSteps, completedManualSubjects])

    const [originalStudents] = useState(() => [...allStudents])
    const [totalStudents] = useState(() => allStudents.length)

    const [studentName, setStudentName] = useState("")
    const [marks, setMarks] = useState("")

    const [loading, setLoading] = useState(false)
    const [isRestoringProgress, setIsRestoringProgress] = useState(true)
    const [feedback, setFeedback] = useState<Feedback>(null)
    const [showArithmeticHint, setShowArithmeticHint] = useState(false)

    const [showStudents, setShowStudents] = useState(false)
    const [copyNotice, setCopyNotice] = useState<CopyNotice>(null)

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const arithmeticHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const arithmeticHintShownRef = useRef(false)

    // Prevent duplicate transitions and repeated final-page navigation.
    const movingRef = useRef(false)
    const finishedRef = useRef(false)

    const studentsLeft = allStudents.length

    const studentsAdded = Math.max(
        0,
        totalStudents - studentsLeft
    )

    const progressPercentage = totalStudents > 0
        ? (studentsAdded / totalStudents) * 100
        : 0

    // Select the correct subject table.
    const getSubjectTable = useCallback(() => {
        const method = String(projectMethod).trim().toLowerCase()

        if (method === "jhs") {
            return "jhs_subjects" as const
        }

        if (method === "primary") {
            return "primary_subjects" as const
        }

        return null
    }, [projectMethod])

    /*
     * Move to the next subject.
     *
     * Returns true when the project has reached the final page.
     * Returns false when another subject is available or an error occurs.
     */
    const moveToNextSubject = useCallback(async (
        currentPosition: number
    ): Promise<boolean> => {
        if (movingRef.current || finishedRef.current) {
            return finishedRef.current
        }

        movingRef.current = true
        setLoading(true)

        try {
            if (!projectId) {
                throw new Error("Project ID is missing.")
            }

            const table = getSubjectTable()

            if (!table) {
                throw new Error(
                    `Invalid project method: "${String(projectMethod)}". Expected JHS or Primary.`
                )
            }

            const nextPosition = currentPosition + 1

            // All real subjects have been completed.
            if (nextPosition >= validSubjectSteps.length) {
                const { error } = await supabase
                    .from("projects")
                    .update({
                        index: validSubjectSteps.length
                    })
                    .eq("id", projectId)

                if (error) {
                    throw error
                }

                finishedRef.current = true
                router.replace("/home/project/final")

                return true
            }

            const nextSubject = String(
                validSubjectSteps[nextPosition] ?? ""
            ).trim()

            // Never move to a metadata column.
            if (
                !nextSubject ||
                isMetadataSubject(nextSubject)
            ) {
                throw new Error(
                    "The next subject is invalid. Please check your subject configuration."
                )
            }

            // Fetch records from the method-selected subject table only.
            const { data, error } = await supabase
                .from(table)
                .select("*")

            if (error) {
                throw error
            }

            const records = (data ?? []) as unknown as SubjectStudentRecord[]

            const savedStudentIds = new Set(
                records.map((record) => String(record.student_id))
            )

            const nextStudents = originalStudents.filter(
                (student) => savedStudentIds.has(String(student.id))
            )

            if (
                originalStudents.length > 0 &&
                nextStudents.length === 0
            ) {
                throw new Error(
                    "No matching student records were found in the subject table. Please check the saved student records."
                )
            }

            // Save the next subject position.
            const { error: updateError } = await supabase
                .from("projects")
                .update({
                    index: nextPosition
                })
                .eq("id", projectId)

            if (updateError) {
                throw updateError
            }

            setAllStudents(nextStudents)
            setPositionCounter(nextPosition)

            setStudentName("")
            setMarks("")
            setFeedback(null)
            setShowStudents(false)

            return false

        } catch (error) {
            console.error("ERROR MOVING TO NEXT SUBJECT:", error)

            const actualError = error instanceof Error
                ? error.message
                : "Could not move to the next subject."

            setFeedback({
                type: "error",
                message: actualError
            })

            return false

        } finally {
            movingRef.current = false

            if (!finishedRef.current) {
                setLoading(false)
            }
        }
    }, [
        projectId,
        projectMethod,
        validSubjectSteps,
        originalStudents,
        getSubjectTable,
        isMetadataSubject,
        setAllStudents,
        router
    ])

    // Restore saved project progress.
    useEffect(() => {
        let cancelled = false
        let redirecting = false

        const restoreProgress = async () => {
            if (!projectId) {
                setIsRestoringProgress(false)
                return
            }

            if (subjectSteps.length === 0) {
                setIsRestoringProgress(false)
                return
            }

            // No actual subjects exist.
            if (validSubjectSteps.length === 0) {
                finishedRef.current = true
                redirecting = true
                router.replace("/home/project/final")
                return
            }

            const table = getSubjectTable()

            if (!table) {
                setFeedback({
                    type: "error",
                    message: `Invalid project method: "${String(projectMethod)}". Expected JHS or Primary.`
                })

                setIsRestoringProgress(false)
                return
            }

            try {
                // Fetch the saved project index.
                const { data: project, error: projectError } = await supabase
                    .from("projects")
                    .select("index, entryMethod")
                    .eq("id", projectId)
                    .maybeSingle()

                if (projectError) {
                    throw projectError
                }

                const savedEntryMethod = String(
                    project?.entryMethod ?? "automatic"
                ).trim().toLowerCase()

                setEntryMethod(savedEntryMethod)

                if (savedEntryMethod === "manual") {
                    const { data, error } = await supabase
                        .from(table)
                        .select("*")

                    if (error) {
                        throw error
                    }

                    if (cancelled) return

                    const records = (data ?? []) as unknown as SubjectStudentRecord[]
                    setSavedSubjectRecords(records)

                    const completedSubjects = validSubjectSteps.filter(
                        (subject) => {
                            if (originalStudents.length === 0) return false

                            const subjectColumn = String(subject)
                                .trim()
                                .toLowerCase()

                            return originalStudents.every((student) => {
                                const record = records.find(
                                    (item) =>
                                        String(item.student_id) ===
                                        String(student.id)
                                )

                                return record?.[subjectColumn] != null
                            })
                        }
                    )

                    setCompletedManualSubjects(
                        completedSubjects.map((subject) =>
                            String(subject).trim().toLowerCase()
                        )
                    )
                    setManualSubject(null)
                    setPositionCounter(0)
                    setAllStudents(originalStudents)

                    if (
                        originalStudents.length > 0 &&
                        completedSubjects.length === validSubjectSteps.length
                    ) {
                        const { error: completeError } = await supabase
                            .from("projects")
                            .update({ index: validSubjectSteps.length })
                            .eq("id", projectId)

                        if (completeError) {
                            throw completeError
                        }

                        finishedRef.current = true
                        redirecting = true
                        router.replace("/home/project/final")
                    }

                    return
                }

                const rawSavedIndex = Number(project?.index ?? 0)

                const savedIndex = Number.isFinite(rawSavedIndex)
                    ? Math.max(0, Math.floor(rawSavedIndex))
                    : 0

                /*
                 * CHECK THE ORIGINAL SUBJECT POSITION FIRST.
                 *
                 * This is where your requested created_at condition belongs.
                 * Checking currentSubject before fetching the saved index
                 * would only check the initial subject at position zero.
                 */

                const savedSubject = subjectSteps[savedIndex]

                if (
                    savedSubject &&
                    isMetadataSubject(savedSubject)
                ) {
                    finishedRef.current = true
                    redirecting = true
                    router.replace("/home/project/final")
                    return
                }

                /*
                 * Convert the saved original position into a position
                 * that counts actual subjects only.
                 */
                const restoredPosition = subjectSteps
                    .slice(0, savedIndex)
                    .filter((subject) => !isMetadataSubject(subject))
                    .length

                // Position has reached or passed the real subject count.
                if (
                    restoredPosition >= validSubjectSteps.length ||
                    savedIndex >= subjectSteps.length
                ) {
                    finishedRef.current = true
                    redirecting = true
                    router.replace("/home/project/final")
                    return
                }

                const restoredSubject = String(
                    validSubjectSteps[restoredPosition] ?? ""
                ).trim()

                /*
                 * Your requested condition, applied to the restored subject.
                 * The case-insensitive metadata helper also handles
                 * created_at, Created_at, CREATE_AT, and similar variants.
                 */
                if (
                    restoredSubject.toLowerCase() === "created_at" ||
                    restoredSubject.toLowerCase() === "create_at"
                ) {
                    finishedRef.current = true
                    redirecting = true
                    router.replace("/home/project/final")
                    return
                }

                if (
                    !restoredSubject ||
                    isMetadataSubject(restoredSubject)
                ) {
                    finishedRef.current = true
                    redirecting = true
                    router.replace("/home/project/final")
                    return
                }

                // Fetch subject records from the selected table.
                const { data, error } = await supabase
                    .from(table)
                    .select("*")

                if (error) {
                    throw error
                }

                if (cancelled) return

                const records = (data ?? []) as unknown as SubjectStudentRecord[]

                // Find students who already have marks for this subject.
                const completedStudentIds = new Set(
                    records
                        .filter((record) => {
                            return record[restoredSubject.toLowerCase()] != null
                        })
                        .map((record) => String(record.student_id))
                )

                // Keep only students who still need marks.
                const remainingStudents = originalStudents.filter(
                    (student) =>
                        !completedStudentIds.has(String(student.id))
                )

                if (cancelled) return

                setPositionCounter(restoredPosition)
                setAllStudents(remainingStudents)

                /*
                 * IMPORTANT:
                 *
                 * If some students still need marks, stay on this subject.
                 *
                 * If no students remain, this subject was already completed.
                 * Automatically move to the next subject or final page.
                 */
                if (remainingStudents.length === 0) {
                    const reachedFinal = await moveToNextSubject(
                        restoredPosition
                    )

                    if (reachedFinal) {
                        redirecting = true
                        return
                    }
                }

            } catch (error) {
                console.error("RESTORE PROJECT PROGRESS ERROR:", error)

                const actualError = error instanceof Error
                    ? error.message
                    : "Could not restore your previous progress."

                if (!cancelled) {
                    setFeedback({
                        type: "error",
                        message: actualError
                    })
                }

            } finally {
                if (!cancelled && !redirecting) {
                    setIsRestoringProgress(false)
                }
            }
        }

        void restoreProgress()

        return () => {
            cancelled = true
        }
    }, [
        projectId,
        projectMethod,
        subjectSteps,
        validSubjectSteps,
        originalStudents,
        setAllStudents,
        router,
        getSubjectTable,
        isMetadataSubject,
        moveToNextSubject
    ])

    const handleManualSubjectSelect = (subject: string) => {
        const subjectIndex = validSubjectSteps.findIndex(
            (item) =>
                String(item).trim().toLowerCase() ===
                subject.trim().toLowerCase()
        )

        if (subjectIndex < 0) {
            setFeedback({
                type: "error",
                message: "That subject is not available for this project."
            })
            return
        }

        const subjectColumn = subject.trim().toLowerCase()
        const completedStudentIds = new Set(
            savedSubjectRecords
                .filter((record) => record[subjectColumn] != null)
                .map((record) => String(record.student_id))
        )
        const remainingStudents = originalStudents.filter(
            (student) =>
                !completedStudentIds.has(String(student.id))
        )

        if (
            originalStudents.length > 0 &&
            remainingStudents.length === 0
        ) {
            setCompletedManualSubjects((previous) =>
                previous.some(
                    (item) => item.toLowerCase() === subjectColumn
                )
                    ? previous
                    : [...previous, subjectColumn]
            )
            return
        }

        setManualSubject(String(validSubjectSteps[subjectIndex]))
        setPositionCounter(subjectIndex)
        setAllStudents(remainingStudents)
        setStudentName("")
        setMarks("")
        setFeedback(null)
    }

    // Clear timers when the component unmounts.
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current)
            }

            if (arithmeticHintTimeoutRef.current) {
                clearTimeout(arithmeticHintTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (
            isRestoringProgress ||
            !currentSubject ||
            studentsLeft === 0 ||
            arithmeticHintShownRef.current
        ) {
            return
        }

        arithmeticHintShownRef.current = true
        setShowArithmeticHint(true)
        arithmeticHintTimeoutRef.current = setTimeout(() => {
            setShowArithmeticHint(false)
            arithmeticHintTimeoutRef.current = null
        }, 8000)
    }, [isRestoringProgress, currentSubject, studentsLeft])

    // Copy a student's full name.
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

    // Add marks for a student.
    const handleAddStudent = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault()

        if (
            loading ||
            isRestoringProgress ||
            movingRef.current ||
            finishedRef.current
        ) {
            return
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }

        setFeedback(null)

        const fullName = studentName.trim()
        const numericMarks = evaluateMarksExpression(marks)

        if (!fullName) {
            setFeedback({
                type: "error",
                message: "Please enter the student's full name."
            })
            return
        }

        if (
            numericMarks === null ||
            numericMarks < 0 ||
            numericMarks > 100
        ) {
            setFeedback({
                type: "error",
                message:
                    numericMarks !== null && numericMarks > 100
                        ? "Marks cannot be more than 100%."
                        : "Please enter a valid mark or arithmetic expression symbols."
            })
            return
        }

        if (
            !currentSubject ||
            isMetadataSubject(currentSubject)
        ) {
            setFeedback({
                type: "error",
                message: "No valid subject is currently available."
            })
            return
        }

        const subjectColumn = currentSubject.toLowerCase()

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
            if (isManualEntry) {
                const { data: existingRecord, error: findError } =
                    await supabase
                        .from(table)
                        .select("id")
                        .eq("student_id", matchedStudent.id)
                        .maybeSingle()

                if (findError) {
                    throw findError
                }

                if (existingRecord) {
                    const { error } = await supabase
                        .from(table)
                        .update({
                            [subjectColumn]: numericMarks
                        })
                        .eq("student_id", matchedStudent.id)

                    if (error) throw error
                } else {
                    const { error } = await supabase
                        .from(table)
                        .insert({
                            student_id: matchedStudent.id,
                            [subjectColumn]: numericMarks
                        })

                    if (error) throw error
                }
            } else if (positionCounter === 0) {
                // First subject: create the student's subject record.
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
                        ].filter(Boolean).join("\n")
                    )
                }

            } else {
                // Later subjects: update the existing student record.
                const { data, error } = await supabase
                    .from(table)
                    .update({
                        [subjectColumn]: numericMarks
                    })
                    .eq("student_id", matchedStudent.id)
                    .select("*")
                    .maybeSingle()

                if (error) {
                    console.error("SUPABASE UPDATE ERROR:", {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code,
                        table,
                        studentId: matchedStudent.id
                    })

                    throw new Error(
                        [
                            `Database error: ${error.message}`,
                            error.details ? `Details: ${error.details}` : "",
                            error.hint ? `Hint: ${error.hint}` : "",
                            error.code ? `Code: ${error.code}` : ""
                        ].filter(Boolean).join("\n")
                    )
                }

                if (!data) {
                    throw new Error(
                        `No existing subject record was found for ${matchedStudent.full_name}. Please check the previous subject's saved record.`
                    )
                }
            }

            const remainingStudents = allStudents.filter(
                (student) => student.id !== matchedStudent.id
            )

            setAllStudents(remainingStudents)
            setStudentName("")
            setMarks("")

            const subjectCompleted = remainingStudents.length === 0

            setFeedback({
                type: "success",
                message: `${matchedStudent.full_name}'s ${currentSubject} mark was successfully saved!`
            })

            if (isManualEntry) {
                setSavedSubjectRecords((previousRecords) => {
                    const existingIndex = previousRecords.findIndex(
                        (record) =>
                            String(record.student_id) ===
                            String(matchedStudent.id)
                    )

                    if (existingIndex < 0) {
                        return [
                            ...previousRecords,
                            {
                                student_id: String(matchedStudent.id),
                                [subjectColumn]: numericMarks
                            }
                        ]
                    }

                    return previousRecords.map((record, index) =>
                        index === existingIndex
                            ? { ...record, [subjectColumn]: numericMarks }
                            : record
                    )
                })

                if (subjectCompleted) {
                    const normalizedSubject = currentSubject.toLowerCase()

                    setCompletedManualSubjects((previous) =>
                        previous.some(
                            (subject) =>
                                subject.toLowerCase() === normalizedSubject
                        )
                            ? previous
                            : [...previous, normalizedSubject]
                    )
                    setManualSubject(null)

                    const allSubjectsCompleted = validSubjectSteps.every(
                        (subject) =>
                            String(subject).trim().toLowerCase() ===
                                normalizedSubject ||
                            completedManualSubjects.some(
                                (completedSubject) =>
                                    completedSubject.toLowerCase() ===
                                    String(subject).trim().toLowerCase()
                            )
                    )

                    if (allSubjectsCompleted) {
                        const { error: completeError } = await supabase
                            .from("projects")
                            .update({ index: validSubjectSteps.length })
                            .eq("id", projectId)

                        if (completeError) {
                            throw new Error(
                                `Marks were saved, but project progress could not be finalized: ${completeError.message}`
                            )
                        }

                        finishedRef.current = true
                        router.replace("/home/project/final")
                    } else {
                        setFeedback({
                            type: "success",
                            message: `${currentSubject} is complete. Choose another subject.`
                        })
                    }
                }

                return
            }

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                setFeedback(null)
                timeoutRef.current = null

                if (subjectCompleted) {
                    void moveToNextSubject(positionCounter)
                }
            }, 400)

        } catch (error) {
            console.error("ERROR SAVING STUDENT MARKS:", error)

            const actualError = error instanceof Error
                ? error.message
                : typeof error === "string"
                    ? error
                    : "An unknown error occurred."

            setFeedback({
                type: "error",
                message: actualError
            })

        } finally {
            setLoading(false)
        }
    }

    // Loading screen while restoring saved progress.
    if (isRestoringProgress) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center">
                    <Loader2
                        size={32}
                        className="mx-auto text-blue-700 animate-spin mb-3"
                    />

                    <p className="text-sm font-medium text-slate-600">
                        Restoring your project progress...
                    </p>
                </div>
            </div>
        )
    }

    if (isManualEntry && !manualSubject) {
        return (
            <div className="min-h-[65vh] flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-4xl">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                Manual subject entry
                            </p>
                            <h2 className="mt-1 text-2xl font-bold text-slate-900">
                                Choose a subject
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Select a subject to enter marks for every student.
                            </p>
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            {completedManualSubjects.length} of {validSubjectSteps.length} subjects completed
                        </p>
                    </div>

                    {feedback && (
                        <div
                            role="status"
                            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                                feedback.type === "success"
                                    ? "border-green-100 bg-green-50 text-green-800"
                                    : "border-red-100 bg-red-50 text-red-800"
                            }`}
                        >
                            {feedback.message}
                        </div>
                    )}

                    {manualSubjectsToEnter.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {manualSubjectsToEnter.map((subject) => {
                                const subjectColumn = String(subject)
                                    .trim()
                                    .toLowerCase()
                                const completedStudentIds = new Set(
                                    savedSubjectRecords
                                        .filter((record) => record[subjectColumn] != null)
                                        .map((record) => String(record.student_id))
                                )
                                const studentsRemaining = originalStudents.filter(
                                    (student) =>
                                        !completedStudentIds.has(String(student.id))
                                ).length

                                return (
                                    <button
                                        key={String(subject)}
                                        type="button"
                                        disabled={studentsRemaining === 0}
                                        onClick={() =>
                                            handleManualSubjectSelect(String(subject))
                                        }
                                        className="group flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                            <BookOpen size={21} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-semibold capitalize text-slate-800">
                                                {String(subject).replace(/[_-]+/g, " ")}
                                            </span>
                                            <span className="mt-1 block text-xs text-slate-500">
                                                {studentsRemaining} students left
                                            </span>
                                        </span>
                                        <ArrowRight
                                            size={17}
                                            className="shrink-0 text-blue-600 transition-transform group-hover:translate-x-0.5"
                                        />
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-green-100 bg-green-50 p-6 text-center">
                            <CheckCircle2 size={26} className="mx-auto text-green-600" />
                            <p className="mt-2 font-semibold text-green-800">
                                All subjects are complete
                            </p>
                            <p className="mt-1 text-sm text-green-700">
                                Every student has marks for each subject.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Never display a metadata column as a subject.
    if (
        !currentSubject ||
        isMetadataSubject(currentSubject)
    ) {
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
            {showArithmeticHint && (
                <div className="fixed top-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white p-4 text-blue-900 shadow-xl">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">Quick marks tip</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                You can enter a calculation, such as 98/2 + 60/2.
                                We&apos;ll calculate and save the result.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (arithmeticHintTimeoutRef.current) {
                                    clearTimeout(arithmeticHintTimeoutRef.current)
                                    arithmeticHintTimeoutRef.current = null
                                }
                                setShowArithmeticHint(false)
                            }}
                            className="shrink-0 text-slate-400 transition hover:text-slate-600"
                            aria-label="Dismiss arithmetic tip"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

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
                <div className="w-full max-w-lg">

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
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 sm:p-6">

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
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-red-600 tabular-nums">
                                        {studentsLeft}
                                    </p>

                                    <p className="text-xs font-medium text-red-600 mt-1">
                                        Students Left
                                    </p>
                                </div>

                                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-green-600 tabular-nums">
                                        {studentsAdded}
                                    </p>

                                    <p className="text-xs font-medium text-green-600 mt-1">
                                        Students Added
                                    </p>
                                </div>
                            </div>

                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progressPercentage}%`
                                    }}
                                />
                            </div>

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

                        {/* Current Subject */}
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
                                        type="text"
                                        value={marks}
                                        onChange={(e) => {
                                            setMarks(e.target.value.replace(/÷/g, "/").replace(/×/g, "*"))
                                            setFeedback(null)
                                        }}
                                        onBlur={() => {
                                            const result = evaluateMarksExpression(marks)

                                            if (result === null) return
                                            if (result > 100) {
                                                setFeedback({
                                                    type: "error",
                                                    message: "Marks cannot be more than 100%."
                                                })
                                                return
                                            }
                                            if (result < 0) {
                                                setFeedback({
                                                    type: "error",
                                                    message: "Please enter a valid mark or arithmetic expression between 0 and 100."
                                                })
                                                return
                                            }

                                            setMarks(String(result))
                                        }}
                                        placeholder="Enter marks or a calculation"
                                        disabled={loading}
                                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition disabled:opacity-60"
                                    />
                                </div>
                            </div>

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

                    <p className="text-center text-xs text-slate-400 mt-5">
                        Enter one student's marks at a time.
                    </p>
                </div>
            </div>

            {/* Students Left Popup */}
            {showStudents && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3 py-5">
                    <div className="w-full max-w-md max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">

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

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {allStudents.length > 0 ? (
                                allStudents.map((student, index) => (
                                    <button
                                        key={student.id}
                                        type="button"
                                        onClick={() =>
                                            handleCopyStudentName(student.full_name)
                                        }
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
