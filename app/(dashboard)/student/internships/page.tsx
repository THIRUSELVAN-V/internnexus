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
import { Search, MapPin, Clock, CheckCircle2, Loader2 } from "lucide-react";

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

export default function BrowseInternshipsPage() {
  const [queryText, setQueryText] = useState("");

  const [internships, setInternships] = useState<Internship[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  const [selectedInternship, setSelectedInternship] =
    useState<Internship | null>(null);

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
      // 1. Load active internships
      // -----------------------------------------------------

      const internshipSnapshot = await getDocs(collection(db, "internships"));

      const activeInternships = internshipSnapshot.docs.filter((docSnap) => {
        const data = docSnap.data();

        return data.status === "active";
      });

      // -----------------------------------------------------
      // 2. Load company names
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

              companyCache.set(companyId, companyData.companyName || "Company");
            }
          } catch (companyError) {
            console.error("Failed to load company:", companyId, companyError);
          }
        }),
      );

      // -----------------------------------------------------
      // 3. Convert Firestore internships into UI objects
      // -----------------------------------------------------

      const loadedInternships: Internship[] = activeInternships.map(
        (docSnap) => {
          const data = docSnap.data();

          const companyId = data.companyId || "";

          return {
            id: docSnap.id,
            title: data.title || "Untitled Internship",
            company: companyCache.get(companyId) || "Company",
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
      // 4. Load applications belonging to current student
      // -----------------------------------------------------

      const applicationQuery = query(
        collection(db, "applications"),
        where("studentId", "==", uid),
      );

      const applicationSnapshot = await getDocs(applicationQuery);

      const existingApplicationIds = applicationSnapshot.docs
        .map((applicationDoc) => {
          const data = applicationDoc.data();
          return data.internshipId;
        })
        .filter(Boolean);

      setAppliedIds(existingApplicationIds);
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

      // Prevent duplicate application
      if (appliedIds.includes(internship.id)) {
        return;
      }

      // -----------------------------------------------------
      // Create application
      // -----------------------------------------------------

      const applicationData = {
        studentId: user.uid,
        internshipId: internship.id,
        companyId: internship.companyId || "",
        status: "applied",

        // AI matching will be added/updated by the HR workflow.
        candidateMatch: null,
        matchScore: null,
        matchedSkills: [],
        missingSkills: [],
        matchReasoning: "",

        createdAt: serverTimestamp(),
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
        // Application was already created, so don't show
        // the student a failed application message.
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
    const search = queryText.toLowerCase();

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            onChange={(e) => setQueryText(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />

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
        /* Internship Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInternships.map((item) => {
            const isApplied = appliedIds.includes(item.id);
            const isApplying = applyingId === item.id;

            return (
              <Card
                key={item.id}
                className="flex flex-col justify-between hover:border-blue-300 transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge
                        variant="outline"
                        className="text-[11px] font-semibold mb-2"
                      >
                        Open Internship
                      </Badge>

                      <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                        {item.title}
                      </CardTitle>

                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {item.company}
                      </p>
                    </div>

                    <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {item.company.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs text-slate-600 flex-1">
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
                        ₹{item.stipend.toLocaleString()}/mo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-[11px] bg-slate-100 text-slate-700"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <div className="p-6 pt-0 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInternship(item)}
                  >
                    View Details
                  </Button>

                  <Button
                    size="sm"
                    disabled={isApplied || isApplying}
                    onClick={() => handleApply(item)}
                    className={
                      isApplied ? "bg-green-600 hover:bg-green-600" : ""
                    }
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Applying...
                      </>
                    ) : isApplied ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Applied
                      </>
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

      {/* Details Dialog */}
      {selectedInternship && (
        <Dialog
          open={!!selectedInternship}
          onOpenChange={() => setSelectedInternship(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {selectedInternship.title}
              </DialogTitle>

              <DialogDescription>
                {selectedInternship.company}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </h4>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedInternship.description}
                </p>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Requirements
                </h4>

                {selectedInternship.requirements.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
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
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
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

              {/* AI notice */}
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    AI Candidate Matching
                  </p>

                  <p className="text-xs text-slate-600 mt-1">
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
                disabled={appliedIds.includes(selectedInternship.id)}
              >
                {appliedIds.includes(selectedInternship.id)
                  ? "Already Applied"
                  : "Confirm Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
