"use client";

import React, { useEffect, useState } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  increment,
  updateDoc,
} from "firebase/firestore";

interface Internship {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  location: string;
  mode: string;
  duration: number;
  stipend: number;
  openings: number;
  skills: string[];
  description: string;
  requirements: string[];
  status: string;
}

interface StudentData {
  displayName?: string;
  name?: string;
  email?: string;
  resumeURL?: string;
  currentInternshipId?: string;
}
interface StudentApplication {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  internshipId: string;
  internshipTitle?: string;
  companyId?: string;
  companyName?: string;
  resumeURL?: string;
  status: string;
}

export default function BrowseInternshipsPage() {
  const [queryText, setQueryText] = useState("");

  const [internships, setInternships] = useState<Internship[]>([]);

  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  const [selectedInternship, setSelectedInternship] =
    useState<Internship | null>(null);

  const [student, setStudent] = useState<StudentData | null>(null);

  const [hasActiveInternship, setHasActiveInternship] = useState(false);

  const [activeInternshipTitle, setActiveInternshipTitle] = useState("");

  const [activeCompanyName, setActiveCompanyName] = useState("");

  const [loading, setLoading] = useState(true);

  const [applyingId, setApplyingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Load internships + student's existing applications
  // ---------------------------------------------------------

  const loadData = async (uid: string) => {
    try {
      setLoading(true);
      setError("");

      const db = getFirebaseDb();

      // -----------------------------------------------------
      // 1. Load current student profile
      // -----------------------------------------------------

      const studentSnapshot = await getDoc(doc(db, "users", uid));

      if (!studentSnapshot.exists()) {
        throw new Error("Student profile was not found.");
      }

      const studentData = studentSnapshot.data() as StudentData;

      setStudent(studentData);

      // -----------------------------------------------------
      // 2. Load active internships
      // -----------------------------------------------------

      const internshipSnapshot = await getDocs(collection(db, "internships"));

      const activeInternships = internshipSnapshot.docs.filter((docSnap) => {
        const data = docSnap.data();

        return data.status === "active";
      });

      // -----------------------------------------------------
      // 3. Load company names
      // -----------------------------------------------------

      const companyCache = new Map<string, string>();

      const companyIds = Array.from(
        new Set(
          activeInternships
            .map((docSnap) => docSnap.data().companyId)
            .filter(Boolean),
        ),
      );

      await Promise.all(
        companyIds.map(async (companyId) => {
          try {
            const companySnap = await getDoc(doc(db, "companies", companyId));

            if (companySnap.exists()) {
              const companyData = companySnap.data();

              companyCache.set(
                companyId,
                companyData.name ?? companyData.companyName ?? "Company",
              );
            }
          } catch (companyError) {
            console.error("Failed to load company:", companyId, companyError);
          }
        }),
      );

      // -----------------------------------------------------
      // 4. Convert Firestore internships
      // -----------------------------------------------------

      const loadedInternships: Internship[] = activeInternships.map(
        (docSnap) => {
          const data = docSnap.data();

          const companyId = data.companyId || "";

          return {
            id: docSnap.id,

            title: data.title || "Untitled Internship",

            company:
              data.companyName || companyCache.get(companyId) || "Company",

            companyId,

            location: data.location || "Not specified",

            mode: data.mode || "Not specified",

            duration: Number(data.duration || 0),

            stipend: Number(data.stipend || 0),

            openings: Number(data.openings || 0),

            skills: Array.isArray(data.skills) ? data.skills : [],

            description: data.description || "",

            requirements: Array.isArray(data.requirements)
              ? data.requirements
              : [],

            status: data.status || "active",
          };
        },
      );

      setInternships(loadedInternships);

      // -----------------------------------------------------
      // 5. Load student's applications
      // -----------------------------------------------------

      const applicationQuery = query(
        collection(db, "applications"),
        where("studentId", "==", uid),
      );

      const applicationSnapshot = await getDocs(applicationQuery);

     const studentApplications: StudentApplication[] =
       applicationSnapshot.docs.map((applicationDoc) => {
         const data = applicationDoc.data();

         return {
           id: applicationDoc.id,
           studentId: String(data.studentId ?? ""),
           studentName: data.studentName,
           studentEmail: data.studentEmail,
           internshipId: String(data.internshipId ?? ""),
           internshipTitle: data.internshipTitle,
           companyId: data.companyId,
           companyName: data.companyName,
           resumeURL: data.resumeURL,
           status: String(data.status ?? "pending"),
         };
       });

      // -----------------------------------------------------
      // 6. Existing applications
      // -----------------------------------------------------

      const existingApplicationIds = studentApplications
        .map((application) => application.internshipId)
        .filter(Boolean);

      setAppliedIds(existingApplicationIds);

      // -----------------------------------------------------
      // 7. Determine active internship
      //
      // An application is considered active when it has
      // progressed beyond simple application/rejection/withdrawal
      // and the student has not completed the internship.
      // -----------------------------------------------------

      const activeApplication = studentApplications.find((application) =>
        ["hr_shortlisted", "mentor_assigned", "accepted"].includes(
          application.status,
        ),
      );

      if (activeApplication) {
        setHasActiveInternship(true);

        setActiveInternshipTitle(
          activeApplication.internshipTitle || "Current internship",
        );

        setActiveCompanyName(activeApplication.companyName || "Company");
      } else {
        setHasActiveInternship(false);
        setActiveInternshipTitle("");
        setActiveCompanyName("");
      }
    } catch (err) {
      console.error("Failed to load internships:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load internships.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Authenticate student and load data
  // ---------------------------------------------------------

  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        setError("Please log in to browse internships.");
        return;
      }

      await loadData(user.uid);
    });

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // Apply for internship
  // ---------------------------------------------------------

  const handleApply = async (internship: Internship) => {
    try {
      setApplyingId(internship.id);

      setError("");

      const auth = getFirebaseAuth();

      const db = getFirebaseDb();

      const user = auth.currentUser;

      if (!user) {
        setError("Please log in before applying.");
        return;
      }

      // -----------------------------------------------------
      // Prevent applying while another internship is active
      // -----------------------------------------------------

      if (hasActiveInternship) {
        setError(
          `You already have an active internship (${activeInternshipTitle} at ${activeCompanyName}). Complete the current internship before applying for another one.`,
        );
        return;
      }

      // -----------------------------------------------------
      // Prevent duplicate application
      // -----------------------------------------------------

      if (appliedIds.includes(internship.id)) {
        return;
      }

      // -----------------------------------------------------
      // Create application
      // -----------------------------------------------------

      const applicationData = {
        studentId: user.uid,

        studentName:
          student?.displayName ??
          student?.name ??
          user.displayName ??
          "Student",

        studentEmail: student?.email ?? user.email ?? "",

        internshipId: internship.id,

        internshipTitle: internship.title,

        companyId: internship.companyId ?? "",

        companyName: internship.company,

        resumeURL: student?.resumeURL ?? "",

        status: "pending",

        /*
         * Candidate matching is intentionally not
         * fabricated here.
         *
         * HR can run the real Gemini candidate-matching
         * workflow after the application exists.
         */
        candidateMatch: null,

        matchScore: null,

        matchedSkills: [],

        missingSkills: [],

        matchReasoning: "",

        appliedAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      };

      const applicationRef = await addDoc(
        collection(db, "applications"),
        applicationData,
      );

      console.log("Application created successfully:", applicationRef.id);

      // -----------------------------------------------------
      // Increase applicant count
      // -----------------------------------------------------

      try {
        await updateDoc(doc(db, "internships", internship.id), {
          applicantsCount: increment(1),

          updatedAt: serverTimestamp(),
        });
      } catch (countError) {
        /*
         * The application already exists.
         * Do not tell the student that the application failed
         * just because the counter update failed.
         */
        console.error(
          "Application created, but applicant count could not be updated:",
          countError,
        );
      }

      // -----------------------------------------------------
      // Update UI
      // -----------------------------------------------------

      setAppliedIds((previous) => [...previous, internship.id]);

      setSelectedInternship(null);
    } catch (err) {
      console.error("Failed to apply:", err);

      setError(
        err instanceof Error ? err.message : "Failed to submit application.",
      );
    } finally {
      setApplyingId(null);
    }
  };

  // ---------------------------------------------------------
  // Search
  // ---------------------------------------------------------

  const filteredInternships = internships.filter((item) => {
    const search = queryText.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      item.title.toLowerCase().includes(search) ||
      item.company.toLowerCase().includes(search) ||
      item.skills.some((skill) => skill.toLowerCase().includes(search))
    );
  });

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Active Internship Warning */}
      {hasActiveInternship && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div className="space-y-0.5">
            <p className="text-sm font-bold text-amber-950">
              Active Internship in Progress
            </p>

            <p className="leading-relaxed text-amber-800">
              You already have an active internship ({activeInternshipTitle} at{" "}
              {activeCompanyName}). You can apply for another internship after
              completing the current internship.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Browse Internships
          </h1>

          <p className="text-xs text-slate-500">
            Explore open internship postings
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search role, company or skill..."
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading / Empty / Internship list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />

          <span className="text-sm text-slate-600">Loading internships...</span>
        </div>
      ) : filteredInternships.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-slate-500">
              No active internships found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredInternships.map((item) => {
            const isApplied = appliedIds.includes(item.id);

            const isApplying = applyingId === item.id;

            return (
              <Card
                key={item.id}
                className="flex flex-col justify-between transition-all hover:border-blue-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge
                        variant="outline"
                        className="mb-2 text-[11px] font-semibold"
                      >
                        Open Internship
                      </Badge>

                      <CardTitle className="text-base font-bold leading-snug text-slate-900">
                        {item.title}
                      </CardTitle>

                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {item.company}
                      </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600">
                      {item.company.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-3 pt-0 text-xs text-slate-600">
                  <p className="line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />

                      {item.location}
                    </span>

                    {item.duration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {item.duration} weeks
                      </span>
                    )}

                    {item.stipend > 0 && (
                      <span className="font-semibold text-slate-900">
                        ₹{item.stipend.toLocaleString()}
                        /mo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-slate-100 text-[11px] text-slate-700"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 p-6 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInternship(item)}
                  >
                    View Details
                  </Button>

                  <Button
                    size="sm"
                    disabled={isApplied || isApplying || hasActiveInternship}
                    onClick={() => handleApply(item)}
                    title={
                      hasActiveInternship
                        ? "You already have an active internship."
                        : undefined
                    }
                    className={
                      isApplied
                        ? "bg-green-600 hover:bg-green-600"
                        : hasActiveInternship
                          ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-100"
                          : ""
                    }
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        Applying...
                      </>
                    ) : isApplied ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Applied
                      </>
                    ) : hasActiveInternship ? (
                      "Apply Disabled"
                    ) : (
                      "Apply Now"
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Internship Details Dialog */}
      {selectedInternship && (
        <Dialog
          open={!!selectedInternship}
          onOpenChange={() => setSelectedInternship(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {selectedInternship.mode}
                </Badge>

                {selectedInternship.duration > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedInternship.duration} weeks
                  </Badge>
                )}

                {selectedInternship.stipend > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    ₹{selectedInternship.stipend.toLocaleString()}
                    /month
                  </Badge>
                )}
              </div>

              <DialogTitle className="text-lg font-bold text-slate-900">
                {selectedInternship.title}
              </DialogTitle>

              <DialogDescription>
                {selectedInternship.company} · {selectedInternship.location}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Description */}
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Description
                </h4>

                <p className="text-sm leading-relaxed text-slate-600">
                  {selectedInternship.description}
                </p>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Requirements
                </h4>

                {selectedInternship.requirements.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {selectedInternship.requirements.map(
                      (requirement, index) => (
                        <li
                          key={`${requirement}-${index}`}
                          className="text-sm text-slate-600"
                        >
                          {requirement}
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No specific requirements provided.
                  </p>
                )}
              </div>

              {/* Skills */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Required Skills
                </h4>

                <div className="flex flex-wrap gap-2">
                  {selectedInternship.skills.length > 0 ? (
                    selectedInternship.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      No specific skills listed.
                    </span>
                  )}
                </div>
              </div>

              {/* AI workflow notice */}
              <Card className="border-slate-200 bg-slate-50">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    AI Candidate Matching
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    After you apply, the HR team can run the AI
                    candidate-matching analysis using your resume information
                    and this internship's requirements.
                  </p>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedInternship(null)}
              >
                Close
              </Button>

              <Button
                onClick={() => handleApply(selectedInternship)}
                disabled={
                  appliedIds.includes(selectedInternship.id) ||
                  applyingId === selectedInternship.id ||
                  hasActiveInternship
                }
              >
                {appliedIds.includes(selectedInternship.id)
                  ? "Already Applied"
                  : hasActiveInternship
                    ? "Active Internship in Progress"
                    : applyingId === selectedInternship.id
                      ? "Applying..."
                      : "Confirm Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
