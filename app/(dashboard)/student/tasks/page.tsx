"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Clock,
  CheckSquare,
  Upload,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  FileText,
  X,
} from "lucide-react";

import FileUpload from "@/components/shared/FileUpload";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getDocuments,
  createDocument,
  updateDocument,
} from "@/lib/firebase/firestore";
import {
  Task,
  Submission,
  Application,
} from "@/lib/types";
import { createNotification } from "@/lib/firebase/notifications";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".zip",
  ".pdf",
  ".docx",
];

export default function StudentTasksPage() {
  const { profile } = useAuthContext();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasInternship, setHasInternship] =
    useState(false);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // Submission modal state
  // ---------------------------------------------------------

  const [selectedTask, setSelectedTask] =
    useState<Task | null>(null);

  const [submissionNotes, setSubmissionNotes] =
    useState("");

  const [submissionLink, setSubmissionLink] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitSuccess, setSubmitSuccess] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  // ---------------------------------------------------------
  // Fetch student's tasks
  // ---------------------------------------------------------

  const fetchTasks = async () => {
    setLoading(true);

    try {
      const [taskDocs, appDocs] =
        await Promise.all([
          getDocuments<Task>("tasks"),
          getDocuments<Application>("applications"),
        ]);

      const myApps = profile?.uid
        ? appDocs.filter(
            (application) =>
              application.studentId ===
                profile.uid &&
              application.status !== "withdrawn",
          )
        : [];

      const currentInternshipId =
        (
          profile as
            | (typeof profile & {
                currentInternshipId?: string;
              })
            | null
        )?.currentInternshipId;

      setHasInternship(
        Boolean(
          myApps.length > 0 ||
            currentInternshipId,
        ),
      );

      const myTasks = profile?.uid
        ? taskDocs.filter(
            (task) =>
              task.studentId === profile.uid,
          )
        : [];

      setTasks(myTasks);
    } catch (err) {
      console.error(
        "Error fetching student tasks:",
        err,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [profile]);

  // ---------------------------------------------------------
  // Open submission modal
  // ---------------------------------------------------------

  const openSubmissionModal = (
    task: Task,
  ) => {
    setSelectedTask(task);
    setSubmissionNotes("");
    setSubmissionLink("");
    setSelectedFile(null);
    setSubmitSuccess(false);
    setSubmitError("");
  };

  // ---------------------------------------------------------
  // Close submission modal
  // ---------------------------------------------------------

  const closeSubmissionModal = () => {
    if (submitting) {
      return;
    }

    setSelectedTask(null);
    setSubmissionNotes("");
    setSubmissionLink("");
    setSelectedFile(null);
    setSubmitSuccess(false);
    setSubmitError("");
  };

  // ---------------------------------------------------------
  // Validate selected file
  // ---------------------------------------------------------

  const validateFile = (
    file: File,
  ): string | null => {
    const lowerName =
      file.name.toLowerCase();

    const isAllowedExtension =
      ALLOWED_EXTENSIONS.some((extension) =>
        lowerName.endsWith(extension),
      );

    if (!isAllowedExtension) {
      return "Please select a ZIP, PDF, or DOCX file.";
    }

    if (file.size === 0) {
      return "The selected file is empty.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "The submission file must be 10MB or smaller.";
    }

    return null;
  };

  // ---------------------------------------------------------
  // Handle file selection
  // ---------------------------------------------------------

  const handleFileSelect = (
    file: File,
  ) => {
    setSubmitError("");

    const validationError =
      validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setSubmitError(validationError);
      return;
    }

    setSelectedFile(file);
  };

  // ---------------------------------------------------------
  // File helpers
  // ---------------------------------------------------------

  const getFileType = (
    file: File,
  ): string => {
    const lowerName =
      file.name.toLowerCase();

    if (lowerName.endsWith(".zip")) {
      return "zip";
    }

    if (lowerName.endsWith(".pdf")) {
      return "pdf";
    }

    if (lowerName.endsWith(".docx")) {
      return "docx";
    }

    return "file";
  };

  const formatFileSize = (
    size: number,
  ): string => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  };

  // ---------------------------------------------------------
  // Submit work
  // ---------------------------------------------------------

  const handleSubmitWork = async () => {
    if (!selectedTask) {
      setSubmitError(
        "No task is selected.",
      );
      return;
    }

    if (!profile?.uid) {
      setSubmitError(
        "You must be logged in as a student to submit work.",
      );
      return;
    }

    const hasFile = Boolean(selectedFile);
    const hasLink =
      submissionLink.trim().length > 0;
    const hasNotes =
      submissionNotes.trim().length > 0;

    if (!hasFile && !hasLink && !hasNotes) {
      setSubmitError(
        "Please provide a deliverable file, submission link, or submission notes.",
      );
      return;
    }

    if (selectedFile) {
      const validationError =
        validateFile(selectedFile);

      if (validationError) {
        setSubmitError(validationError);
        return;
      }
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      // -------------------------------------------------------
      // Security check
      // -------------------------------------------------------

      if (
        selectedTask.studentId !==
        profile.uid
      ) {
        throw new Error(
          "You are not authorized to submit work for this task.",
        );
      }

      if (!selectedTask.id) {
        throw new Error(
          "This task does not have a valid task ID.",
        );
      }

      if (!selectedTask.mentorId) {
        throw new Error(
          "This task does not have an assigned mentor.",
        );
      }

      // -------------------------------------------------------
      // Get existing submissions
      // -------------------------------------------------------

      const existingSubmissions =
        await getDocuments<Submission>(
          "submissions",
        );

      const existingSubmission =
        existingSubmissions.find(
          (submission) =>
            submission.taskId ===
              selectedTask.id &&
            submission.studentId ===
              profile.uid,
        );

      const now =
        new Date().toISOString();

      // -------------------------------------------------------
      // Build file metadata
      // -------------------------------------------------------

      const fileName =
        selectedFile?.name || "";

      const fileType = selectedFile
        ? getFileType(selectedFile)
        : "";

      /*
       * Important:
       *
       * Firebase Storage is not being used here.
       * Therefore the filename is stored as submission
       * metadata only. The actual binary file is NOT
       * placed inside Firestore.
       *
       * The actual file-upload API will be added separately.
       */

      const newSubmission: Omit<
  Submission,
  "id"
> = {
  taskId: selectedTask.id,
  taskTitle: selectedTask.title,
  internshipId:
    selectedTask.internshipId,
  studentId: profile.uid,
  studentName:
    profile.displayName ||
    "Student",
  mentorId:
    selectedTask.mentorId,

  fileURLs: fileName
    ? [fileName]
    : [],

  fileTypes: fileType
    ? [fileType]
    : [],

  description:
    submissionNotes.trim() ||
    "Task deliverable submitted.",

  status: "submitted",

  submittedAt:
    existingSubmission?.submittedAt ||
    now,

  updatedAt: now,
};

const cleanSubmission = {
  ...newSubmission,
  ...(submissionLink.trim()
    ? {
        submissionLink:
          submissionLink.trim(),
      }
    : {}),
};

      // -------------------------------------------------------
      // Create or update submission
      // -------------------------------------------------------

      if (existingSubmission?.id) {
      await updateDocument("submissions", existingSubmission.id, {
        ...cleanSubmission,
        status: "submitted",
        updatedAt: now,
      });
      } else {
        await createDocument("submissions", cleanSubmission);
      }

      // -------------------------------------------------------
      // Update task status
      // -------------------------------------------------------

      await updateDocument(
        "tasks",
        selectedTask.id,
        {
          status: "submitted",
          updatedAt: now,
        },
      );

      // -------------------------------------------------------
      // Notify mentor
      // -------------------------------------------------------

      try {
        await createNotification({
          recipientUserId:
            selectedTask.mentorId,
          recipientRole: "mentor",
          title: "Task Submitted",
          message: `${
            profile.displayName ||
            "A student"
          } submitted the task "${selectedTask.title}".`,
          type: "info",
          category: "task",
          link: "/mentor/submissions",
          relatedId: selectedTask.id,
          relatedType: "task",
        });
      } catch (notificationError) {
        console.error(
          "Submission saved, but mentor notification failed:",
          notificationError,
        );
      }

      // -------------------------------------------------------
      // Update UI
      // -------------------------------------------------------

      setSubmitSuccess(true);

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === selectedTask.id
            ? {
                ...task,
                status: "submitted",
              }
            : task,
        ),
      );

      setTimeout(() => {
        closeSubmissionModal();
      }, 1800);
    } catch (err) {
      console.error(
        "Error submitting work:",
        err,
      );

      setSubmitError(
        err instanceof Error
          ? err.message
          : "Unable to submit your work. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // Page
  // ---------------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Assigned Tasks & Deliverables
        </h1>

        <p className="text-xs text-slate-500">
          Weekly internship assignments
          published by your industrial
          mentor
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

          <span className="ml-3 text-sm text-slate-500 font-medium">
            Loading assigned tasks...
          </span>
        </div>
      ) : !hasInternship ? (
        <Card className="border-slate-200">
          <CardContent className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Briefcase className="h-6 w-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              No Internship Selected
            </h3>

            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Select an internship to view
              your assigned tasks and submit
              reports.
            </p>

            <div className="pt-2">
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
              >
                <Link href="/student/internships">
                  Browse Internships
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <CheckSquare className="h-6 w-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              No Tasks Assigned
            </h3>

            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your mentor has not assigned
              any tasks yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isApproved =
              task.status === "approved";

            const isInProgress =
              task.status === "in_progress";

            const isSubmitted =
              task.status === "submitted";

            return (
              <Card
                key={task.id}
                className={
                  isInProgress
                    ? "border-blue-300 shadow-sm"
                    : ""
                }
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold"
                      >
                        Week {task.week}
                      </Badge>

                      <Badge
                        variant={
                          isApproved
                            ? "success"
                            : isSubmitted
                              ? "purple"
                              : isInProgress
                                ? "default"
                                : "secondary"
                        }
                        className="text-xs capitalize font-semibold"
                      >
                        {task.status.replace(
                          "_",
                          " ",
                        )}
                      </Badge>

                      {task.aiGenerated && (
                        <Badge
                          variant="purple"
                          className="text-[10px]"
                        >
                          AI Generated Task
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {task.title}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Due {task.dueDate}
                    </span>

                    <Button
                      size="sm"
                      variant={
                        isApproved
                          ? "outline"
                          : "default"
                      }
                      onClick={() =>
                        openSubmissionModal(
                          task,
                        )
                      }
                      className={
                        isApproved
                          ? ""
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }
                    >
                      {isApproved
                        ? "View Submission"
                        : isSubmitted
                          ? "Update Submission"
                          : "Submit Work"}

                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* =====================================================
          Task Submission Modal
          ===================================================== */}

      {selectedTask && (
        <Dialog
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) {
              closeSubmissionModal();
            }
          }}
        >
          <DialogContent
            className="
              w-[calc(100vw-2rem)]
              max-w-lg
              max-h-[90vh]
              overflow-hidden
              p-0
              flex
              flex-col
            "
          >
            {/* -------------------------------------------------
                Fixed header
                ------------------------------------------------- */}

            <DialogHeader className="shrink-0 px-5 pt-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  Week {selectedTask.week}
                </Badge>

                <Badge
                  variant={
                    selectedTask.status ===
                    "submitted"
                      ? "purple"
                      : "default"
                  }
                  className="text-xs capitalize"
                >
                  {selectedTask.status.replace(
                    "_",
                    " ",
                  )}
                </Badge>
              </div>

              <DialogTitle className="text-base font-bold text-slate-900 pr-6">
                {selectedTask.title}
              </DialogTitle>

              <DialogDescription className="text-xs leading-relaxed">
                {selectedTask.description}
              </DialogDescription>
            </DialogHeader>

            {/* -------------------------------------------------
                Scrollable content
                ------------------------------------------------- */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
              <div className="space-y-4 py-4 text-xs">
                {submitSuccess ? (
                  <div className="p-5 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center space-y-2">
                    <CheckCircle2 className="h-7 w-7 text-green-600 mx-auto" />

                    <p className="font-bold">
                      Task Deliverable Submitted
                      Successfully!
                    </p>

                    <p className="text-[11px] text-green-700">
                      Your submission has been
                      recorded and your
                      industrial mentor has been
                      notified.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Error */}

                    {submitError && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />

                        <p className="text-xs leading-relaxed">
                          {submitError}
                        </p>
                      </div>
                    )}

                    {/* Task instructions */}

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <span className="font-bold text-slate-700 block">
                        Task Instructions:
                      </span>

                      <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                        {selectedTask.instructions ||
                          "Complete the assigned task and submit your work for mentor review."}
                      </p>
                    </div>

                    {/* File upload */}

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Upload Code /
                        Deliverable File
                      </label>

                      <FileUpload
                        label="Select ZIP / PDF / DOCX File"
                        description="Upload code archive or report file"
                        onFileSelect={
                          handleFileSelect
                        }
                        disabled={
                          submitting
                        }
                      />

                      {selectedFile && (
                        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            {getFileType(
                              selectedFile,
                            ) === "zip" ? (
                              <FileArchive className="h-4 w-4 shrink-0 text-blue-600" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                            )}

                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-blue-800">
                                {
                                  selectedFile.name
                                }
                              </p>

                              <p className="text-[10px] text-blue-600">
                                {
                                  getFileType(
                                    selectedFile,
                                  )
                                }{" "}
                                •{" "}
                                {formatFileSize(
                                  selectedFile.size,
                                )}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setSelectedFile(
                                null,
                              )
                            }
                            disabled={
                              submitting
                            }
                            className="h-7 w-7 shrink-0 text-slate-500 hover:text-red-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      <p className="mt-1 text-[10px] text-slate-400">
                        ZIP, PDF or DOCX •
                        Maximum 10MB
                      </p>
                    </div>

                    {/* Submission link */}

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Report / Submission
                        Link
                      </label>

                      <Input
                        placeholder="e.g. https://github.com/org/repo or https://drive.google.com/..."
                        value={
                          submissionLink
                        }
                        onChange={(e) =>
                          setSubmissionLink(
                            e.target.value,
                          )
                        }
                        disabled={
                          submitting
                        }
                      />
                    </div>

                    {/* Notes */}

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Submission Notes &
                        Report Text
                      </label>

                      <Textarea
                        placeholder="Enter submission report details, findings, or notes for your mentor..."
                        value={
                          submissionNotes
                        }
                        onChange={(e) =>
                          setSubmissionNotes(
                            e.target.value,
                          )
                        }
                        disabled={
                          submitting
                        }
                        className="min-h-[100px] resize-y"
                      />
                    </div>

                    {/* Important file-storage note */}

                    {selectedFile && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-800">
                        <strong>
                          File handling:
                        </strong>{" "}
                        The submission record
                        stores the selected
                        file name and type.
                        The actual ZIP/PDF/DOCX
                        file is not stored in
                        Firebase Storage yet.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* -------------------------------------------------
                Fixed footer
                ------------------------------------------------- */}

            {!submitSuccess && (
              <DialogFooter className="shrink-0 border-t border-slate-100 bg-white px-5 py-3">
                <Button
                  variant="outline"
                  onClick={
                    closeSubmissionModal
                  }
                  disabled={submitting}
                >
                  Cancel
                </Button>

                <Button
                  onClick={
                    handleSubmitWork
                  }
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1.5" />
                  )}

                  {submitting
                    ? "Submitting..."
                    : "Submit to Mentor"}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}