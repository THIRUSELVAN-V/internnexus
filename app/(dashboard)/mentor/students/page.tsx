"use client";

import React, { useEffect, useState } from "react";
import DataTable, { Column } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Star, Loader2 } from "lucide-react";
import Link from "next/link";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

interface StudentRow {
  id: string;
  name: string;
  role: string;
  college: string;
  tasksDone: string;
  progress: number;
  rating: number;
}

interface ApplicationData {
  id: string;
  studentId: string;
  studentName?: string;
  internshipTitle?: string;
  mentorId?: string;
}

interface TaskData {
  id: string;
  studentId: string;
  mentorId: string;
  status?: string;
}

interface FeedbackData {
  studentId: string;
  mentorId: string;
  rating?: number;
}

interface StudentProfile {
  university?: string;
  college?: string;
}

export default function MentorStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAssignedStudents();
  }, []);

  const loadAssignedStudents = async () => {
    setLoading(true);
    setError("");

    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      const mentor = auth.currentUser;

      if (!mentor) {
        throw new Error("You must be logged in as a mentor.");
      }

      /*
       * 1. Get applications assigned to this mentor
       */
      const applicationsQuery = query(
        collection(db, "applications"),
        where("mentorId", "==", mentor.uid),
      );

      const applicationsSnapshot = await getDocs(
        collection(db, "applications"),
      );

      const applications: ApplicationData[] = applicationsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ApplicationData, "id">),
        }))
        .filter((application) => application.mentorId === mentor.uid);
      /*
       * Remove duplicate students.
       *
       * A mentor could theoretically have multiple applications
       * from the same student.
       */
      const uniqueApplications = new Map<string, ApplicationData>();

      applications.forEach((application) => {
        if (application.studentId) {
          uniqueApplications.set(application.studentId, application);
        }
      });

      /*
       * 2. Get tasks assigned to this mentor
       */
      const tasksQuery = query(
        collection(db, "tasks"),
        where("mentorId", "==", mentor.uid),
      );

      const tasksSnapshot = await getDocs(tasksQuery);

      const tasks: TaskData[] = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TaskData, "id">),
      }));

      /*
       * 3. Get feedback created by this mentor
       */
      const feedbackQuery = query(
        collection(db, "feedback"),
        where("mentorId", "==", mentor.uid),
      );

      const feedbackSnapshot = await getDocs(feedbackQuery);

      const feedback: FeedbackData[] = feedbackSnapshot.docs.map(
        (doc) => doc.data() as FeedbackData,
      );

      /*
       * 4. Build the student rows
       */
      const studentRows: StudentRow[] = [];

      for (const application of uniqueApplications.values()) {
        const studentId = application.studentId;

        /*
         * Student profile
         */
        let studentProfile: StudentProfile = {};

        try {
          const studentQuery = query(
            collection(db, "users"),
            where("__name__", "==", studentId),
          );

          const studentSnapshot = await getDocs(studentQuery);

          if (!studentSnapshot.empty) {
            studentProfile = studentSnapshot.docs[0].data() as StudentProfile;
          }
        } catch (studentError) {
          console.warn(
            `Unable to load student profile ${studentId}:`,
            studentError,
          );
        }

        /*
         * Tasks belonging to this student and mentor
         */
        const studentTasks = tasks.filter(
          (task) =>
            task.studentId === studentId && task.mentorId === mentor.uid,
        );

        const completedTasks = studentTasks.filter(
          (task) => task.status === "approved",
        ).length;

        const totalTasks = studentTasks.length;

        const progress =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        /*
         * Feedback ratings for this student
         */
        const studentFeedback = feedback.filter(
          (item) => item.studentId === studentId,
        );

        const ratings = studentFeedback
          .map((item) => item.rating)
          .filter(
            (rating): rating is number =>
              typeof rating === "number" && rating >= 1 && rating <= 5,
          );

        const rating =
          ratings.length > 0
            ? Number(
                (
                  ratings.reduce((sum, value) => sum + value, 0) /
                  ratings.length
                ).toFixed(1),
              )
            : 0;

        studentRows.push({
          id: studentId,
          name: application.studentName || "Unnamed Student",
          role: application.internshipTitle || "Internship",
          college:
            studentProfile.university ||
            studentProfile.college ||
            "Not provided",
          tasksDone: `${completedTasks} / ${totalTasks}`,
          progress,
          rating,
        });
      }

      setStudents(studentRows);
    } catch (err) {
      console.error("Failed to load assigned students:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load assigned students.",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<StudentRow>[] = [
    {
      key: "name",
      header: "Student Name",
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.college}</p>
        </div>
      ),
    },

    {
      key: "role",
      header: "Internship Role",
      render: (item) => (
        <span className="text-xs text-slate-700 font-medium">{item.role}</span>
      ),
    },

    {
      key: "tasksDone",
      header: "Task Progress",
      render: (item) => (
        <div className="w-32 space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span>{item.tasksDone}</span>
            <span>{item.progress}%</span>
          </div>

          <Progress value={item.progress} color="green" className="h-1.5" />
        </div>
      ),
    },

    {
      key: "rating",
      header: "Current Performance",
      render: (item) => (
        <div className="flex items-center gap-1 font-bold text-xs text-slate-800">
          <Star
            className={`h-3.5 w-3.5 ${
              item.rating > 0
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }`}
          />

          {item.rating > 0 ? `${item.rating} / 5` : "Not rated"}
        </div>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/mentor/feedback?studentId=${item.id}`}>
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Leave Feedback
            </Link>
          </Button>

          <Button
            style={{ color: "white" }}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            asChild
          >
            <Link href={`/mentor/evaluation?studentId=${item.id}`}>
              Final Evaluation
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading assigned students...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Assigned Students
          </h1>
          <p className="text-xs text-slate-500">
            Overview of active mentees assigned under your mentorship
          </p>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="text-center text-sm text-red-600">{error}</div>

            <div className="flex justify-center mt-4">
              <Button onClick={loadAssignedStudents}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assigned Students</h1>

        <p className="text-xs text-slate-500">
          Overview of active mentees assigned under your mentorship
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {students.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No students assigned yet
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Students assigned to you will appear here.
              </p>
            </div>
          ) : (
            <DataTable
              data={students}
              columns={columns}
              searchKey="name"
              searchPlaceholder="Search students..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
