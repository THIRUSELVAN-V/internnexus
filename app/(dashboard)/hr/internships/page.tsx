"use client";

import React, { useEffect, useState } from "react";

import DataTable, { Column } from "@/components/shared/DataTable";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Plus, Edit, Trash2, Loader2 } from "lucide-react";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import type { Internship } from "@/lib/types";
import { notifyAllStudents } from "@/lib/firebase/notifications";

import { INTERNSHIP_DOMAINS } from "@/lib/utils/constants";

interface InternshipPosting {
  id: string;
  title: string;
  domain: string;
  stipend: number;
  openings: number;
  applicantsCount: number;

  status: "active" | "closed" | "draft";

  deadline: string;
  applicationDeadline?: string;
  startDate?: string;

  duration?: number;
  mode?: "remote" | "onsite" | "hybrid";
  location?: string;

  companyId?: string;
  companyName?: string;
  createdBy?: string;

  description?: string;
  requirements?: string[];
  skills?: string[];
}

export default function HRInternshipsPage() {
  const [listings, setListings] = useState<InternshipPosting[]>([]);

  const [openModal, setOpenModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Form state
  // ---------------------------------------------------------

  const [title, setTitle] = useState("");

  const [domain, setDomain] = useState(INTERNSHIP_DOMAINS[0] || "");

  const [stipend, setStipend] = useState("");
  const [openings, setOpenings] = useState("1");

  const [duration, setDuration] = useState("8");

  const [mode, setMode] = useState<"remote" | "onsite" | "hybrid">("remote");

  const [location, setLocation] = useState("");

  const [deadline, setDeadline] = useState("");

  const [description, setDescription] = useState("");

  const [skills, setSkills] = useState("");

  // ---------------------------------------------------------
  // Load HR's internships
  // ---------------------------------------------------------

  const loadInternships = async () => {
    try {
      setLoading(true);
      setError("");

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      const user = auth.currentUser;

      if (!user) {
        setError("Please log in to manage internships.");
        return;
      }

      // -----------------------------------------------------
      // Get current user profile
      // -----------------------------------------------------

      const userSnapshot = await getDoc(doc(db, "users", user.uid));

      if (!userSnapshot.exists()) {
        setError("HR profile not found.");
        return;
      }

      const userData = userSnapshot.data();

      if (userData.role !== "hr" && userData.role !== "admin") {
        setError("You are not authorized to manage internships.");
        return;
      }

      // -----------------------------------------------------
      // Load internships
      // -----------------------------------------------------

      const internshipSnapshot = await getDocs(collection(db, "internships"));

      // -----------------------------------------------------
      // Load applications once so applicant counts are real
      // -----------------------------------------------------

      const applicationSnapshot = await getDocs(collection(db, "applications"));

      const applicantCounts: Record<string, number> = {};

      applicationSnapshot.docs.forEach((applicationDoc) => {
        const application = applicationDoc.data();

        const internshipId = application.internshipId;

        if (!internshipId) {
          return;
        }

        applicantCounts[internshipId] =
          (applicantCounts[internshipId] || 0) + 1;
      });

      // -----------------------------------------------------
      // Convert Firestore data
      // -----------------------------------------------------

      const loadedListings: InternshipPosting[] = [];

      internshipSnapshot.docs.forEach((internshipDoc) => {
        const data = internshipDoc.data();

        // HR can only see internships belonging
        // to their own company.
        if (userData.role === "hr" && data.companyId !== userData.companyId) {
          return;
        }

        loadedListings.push({
          id: internshipDoc.id,

          title: data.title || "Untitled Internship",

          domain: data.domain || "Not specified",

          stipend: Number(data.stipend || 0),

          openings: Number(data.openings || 0),

          applicantsCount:
            applicantCounts[internshipDoc.id] ??
            Number(data.applicantsCount || 0),

          status: data.status || "draft",

          deadline: data.deadline || data.applicationDeadline || "",

          applicationDeadline: data.applicationDeadline || data.deadline || "",

          startDate: data.startDate || "",

          duration: Number(data.duration || 0),

          mode: data.mode || "remote",

          location: data.location || "",

          companyId: data.companyId,

          companyName: data.companyName,

          createdBy: data.createdBy || data.hrId,

          description: data.description || "",

          requirements: Array.isArray(data.requirements)
            ? data.requirements
            : [],

          skills: Array.isArray(data.skills) ? data.skills : [],
        });
      });

      loadedListings.sort((a, b) => b.title.localeCompare(a.title));

      setListings(loadedListings);
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
  // Load when page opens
  // ---------------------------------------------------------

  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await loadInternships();
      } else {
        setLoading(false);
        setError("Please log in to manage internships.");
      }
    });

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // Reset form
  // ---------------------------------------------------------

  const resetForm = () => {
    setTitle("");
    setDomain(INTERNSHIP_DOMAINS[0] || "");
    setStipend("");
    setOpenings("1");
    setDuration("8");
    setMode("remote");
    setLocation("");
    setDeadline("");
    setDescription("");
    setSkills("");
  };

  // ---------------------------------------------------------
  // Publish internship
  // ---------------------------------------------------------

  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError("");

      // -----------------------------------------------------
      // Validation
      // -----------------------------------------------------

      if (!title.trim()) {
        setError("Internship title is required.");
        return;
      }

      if (!domain.trim()) {
        setError("Internship domain is required.");
        return;
      }

      if (!stipend || Number(stipend) < 0) {
        setError("Please enter a valid stipend.");
        return;
      }

      if (!openings || Number(openings) <= 0) {
        setError("Please enter a valid number of openings.");
        return;
      }

      if (!duration || Number(duration) <= 0) {
        setError("Please enter a valid internship duration.");
        return;
      }

      if (!description.trim()) {
        setError("Description and requirements are required.");
        return;
      }

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      const user = auth.currentUser;

      if (!user) {
        setError("Please log in to publish an internship.");
        return;
      }

      // -----------------------------------------------------
      // Get HR profile
      // -----------------------------------------------------

      const userSnapshot = await getDoc(doc(db, "users", user.uid));

      if (!userSnapshot.exists()) {
        setError("HR profile not found.");
        return;
      }

      const userData = userSnapshot.data();

      if (userData.role !== "hr" && userData.role !== "admin") {
        setError("You are not authorized to publish internships.");
        return;
      }

      // -----------------------------------------------------
      // HR must have a company
      // -----------------------------------------------------

      if (userData.role === "hr" && !userData.companyId) {
        setError("Your HR account is not associated with a company.");
        return;
      }

      // -----------------------------------------------------
      // Check company approval
      // -----------------------------------------------------

      if (userData.role === "hr" && userData.companyId) {
        const companySnapshot = await getDoc(
          doc(db, "companies", userData.companyId),
        );

        if (!companySnapshot.exists()) {
          setError("Your company profile was not found.");
          return;
        }

        const companyData = companySnapshot.data();

        if (companyData.status !== "approved") {
          setError(
            "Your company must be approved by an Admin before publishing internship postings.",
          );
          return;
        }
      }

      // -----------------------------------------------------
      // Convert comma-separated skills
      // -----------------------------------------------------

      const skillList = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      // -----------------------------------------------------
      // Convert each non-empty description line
      // into a requirement
      // -----------------------------------------------------

      const requirementList = description
        .split("\n")
        .map((requirement) => requirement.trim())
        .filter(Boolean);

      // -----------------------------------------------------
      // Calculate dates
      // -----------------------------------------------------

      const today = new Date();

      const applicationDeadline =
        deadline ||
        new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

      const startDate = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      // -----------------------------------------------------
      // Company information
      // -----------------------------------------------------

      let companyName = userData.companyName || "";

      if (!companyName && userData.companyId) {
        const companySnapshot = await getDoc(
          doc(db, "companies", userData.companyId),
        );

        if (companySnapshot.exists()) {
          companyName = companySnapshot.data().name || "";
        }
      }

      // -----------------------------------------------------
      // Internship document
      // -----------------------------------------------------

      const internshipData = {
        companyId: userData.companyId || "",

        companyName,

        title: title.trim(),

        domain: domain.trim(),

        description: description.trim(),

        requirements:
          requirementList.length > 0 ? requirementList : [description.trim()],

        skills: skillList,

        duration: Number(duration),

        stipend: Number(stipend),

        location: location.trim() || (mode === "remote" ? "Remote" : "On-site"),

        mode,

        openings: Number(openings),

        applicationDeadline,

        // Keep legacy deadline field
        // for compatibility.
        deadline: applicationDeadline,

        startDate,

        applicantsCount: 0,

        status: "active",

        hrId: user.uid,

        createdBy: user.uid,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      };

      // -----------------------------------------------------
      // Save to Firestore
      // -----------------------------------------------------

      const internshipRef = await addDoc(
        collection(db, "internships"),
        internshipData,
      );

      console.log("Internship published successfully:", internshipRef.id);

      notifyAllStudents({
        title: "New Internship Available",
        message: `A new internship "${internshipData.title}" has been posted by ${internshipData.companyName || "a company"}.`,
        type: "info",
        category: "internship",
        link: "/student/internships",
        relatedId: internshipRef.id,
        relatedType: "internship",
      }).catch((notifyErr) => console.error("Failed to notify students:", notifyErr));

      // -----------------------------------------------------
      // Update UI immediately
      // -----------------------------------------------------

      const newInternship: InternshipPosting = {
        id: internshipRef.id,

        title: internshipData.title,

        domain: internshipData.domain,

        stipend: internshipData.stipend,

        openings: internshipData.openings,

        applicantsCount: 0,

        status: "active",

        deadline: internshipData.deadline,

        applicationDeadline: internshipData.applicationDeadline,

        startDate: internshipData.startDate,

        duration: internshipData.duration,

        mode: internshipData.mode,

        location: internshipData.location,

        companyId: internshipData.companyId,

        companyName: internshipData.companyName,

        createdBy: internshipData.createdBy,

        description: internshipData.description,

        requirements: internshipData.requirements,

        skills: internshipData.skills,
      };

      setListings((current) => [newInternship, ...current]);

      resetForm();
      setOpenModal(false);
    } catch (err) {
      console.error("Failed to publish internship:", err);

      setError(
        err instanceof Error ? err.message : "Failed to publish internship.",
      );
    } finally {
      setPublishing(false);
    }
  };

  // ---------------------------------------------------------
  // Delete internship
  // ---------------------------------------------------------

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this internship?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      const user = auth.currentUser;

      if (!user) {
        setError("Please log in to delete this internship.");
        return;
      }

      // -----------------------------------------------------
      // Verify current user's company ownership
      // -----------------------------------------------------

      const userSnapshot = await getDoc(doc(db, "users", user.uid));

      if (!userSnapshot.exists()) {
        setError("HR profile not found.");
        return;
      }

      const userData = userSnapshot.data();

      if (userData.role !== "hr" && userData.role !== "admin") {
        setError("You are not authorized to delete internships.");
        return;
      }

      const internshipSnapshot = await getDoc(doc(db, "internships", id));

      if (!internshipSnapshot.exists()) {
        setError("Internship posting not found.");
        return;
      }

      const internshipData = internshipSnapshot.data();

      if (
        userData.role === "hr" &&
        internshipData.companyId !== userData.companyId
      ) {
        setError("You are not authorized to delete this internship.");
        return;
      }

      await deleteDoc(doc(db, "internships", id));

      setListings((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete internship:", err);

      setError(
        err instanceof Error ? err.message : "Failed to delete internship.",
      );
    }
  };

  // ---------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------

  const columns: Column<InternshipPosting>[] = [
    {
      key: "title",
      header: "Internship Title",

      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.title}</p>

          <p className="text-xs text-slate-500">
            {item.domain}
            {item.mode ? ` · ${item.mode}` : ""}
          </p>
        </div>
      ),
    },

    {
      key: "stipend",
      header: "Stipend",

      render: (item) => (
        <span className="font-semibold text-slate-800">
          ₹{item.stipend.toLocaleString()}
          /mo
        </span>
      ),
    },

    {
      key: "openings",
      header: "Openings",

      render: (item) => (
        <span className="text-xs font-mono text-slate-700">
          {item.openings} positions
        </span>
      ),
    },

    {
      key: "applicantsCount",
      header: "Total Applicants",

      render: (item) => (
        <Badge variant="purple" className="text-xs font-bold">
          {item.applicantsCount} Applicants
        </Badge>
      ),
    },

    {
      key: "status",
      header: "Status",

      render: (item) => (
        <Badge
          variant={item.status === "active" ? "success" : "secondary"}
          className="capitalize text-xs font-semibold"
        >
          {item.status}
        </Badge>
      ),
    },

    {
      key: "actions",
      header: "Actions",

      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled
            title="Edit will be added later"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(item.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete internship"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Internship Postings & Listings
          </h1>

          <p className="text-xs text-slate-500">
            Publish open positions and monitor candidate application volume
          </p>
        </div>

        <Button
          onClick={() => {
            setError("");
            resetForm();
            setOpenModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Post New Internship
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Listings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Internship Postings</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />

              <span className="text-sm text-slate-600">
                Loading internships...
              </span>
            </div>
          ) : (
            <DataTable
              data={listings}
              columns={columns}
              searchKey="title"
              searchPlaceholder="Search postings..."
              emptyMessage="No internships created yet."
            />
          )}
        </CardContent>
      </Card>

      {/* Create Internship Modal */}
      {openModal && (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Publish New Internship Listing
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Title */}
              <div>
                <Label htmlFor="post-title" required>
                  Internship Title
                </Label>

                <Input
                  id="post-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full Stack Web Development Intern"
                  className="mt-1"
                />
              </div>

              {/* Domain + Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="post-domain" required>
                    Domain Sector
                  </Label>

                  <Input
                    id="post-domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. Web Development"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="post-mode">Work Mode</Label>

                  <select
                    id="post-mode"
                    value={mode}
                    onChange={(e) =>
                      setMode(e.target.value as "remote" | "onsite" | "hybrid")
                    }
                    className="mt-1 w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="remote">Remote</option>

                    <option value="onsite">On-site</option>

                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* Stipend + Openings + Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="post-stipend" required>
                    Stipend (INR/mo)
                  </Label>

                  <Input
                    id="post-stipend"
                    type="number"
                    min="0"
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    placeholder="25000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="post-openings" required>
                    Openings
                  </Label>

                  <Input
                    id="post-openings"
                    type="number"
                    min="1"
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    placeholder="5"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="post-duration" required>
                    Duration (Weeks)
                  </Label>

                  <Input
                    id="post-duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="8"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="post-location">Work Location</Label>

                <Input
                  id="post-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Chennai, Tamil Nadu"
                  className="mt-1"
                />
              </div>

              {/* Deadline */}
              <div>
                <Label htmlFor="post-deadline">Application Deadline</Label>

                <Input
                  id="post-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1"
                />

                <p className="text-xs text-slate-500 mt-1">
                  If left empty, a 30-day application period will be used.
                </p>
              </div>

              {/* Skills */}
              <div>
                <Label htmlFor="post-skills">Required Skills</Label>

                <Input
                  id="post-skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js, MongoDB"
                  className="mt-1"
                />

                <p className="text-xs text-slate-500 mt-1">
                  Separate skills using commas.
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="post-desc" required>
                  Description & Requirements
                </Label>

                <Textarea
                  id="post-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    "Enter key responsibilities and required skills...\nBuild responsive web applications\nWork with REST APIs\nCollaborate with developers"
                  }
                  className="mt-1 min-h-[110px]"
                />

                <p className="text-xs text-slate-500 mt-1">
                  You can put each requirement on a new line.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpenModal(false);
                }}
                disabled={publishing}
              >
                Cancel
              </Button>

              <Button
                onClick={handlePublish}
                disabled={publishing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Posting"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
