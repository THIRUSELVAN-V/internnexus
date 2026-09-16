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

interface InternshipPosting {
  id: string;
  title: string;
  domain: string;
  stipend: number;
  openings: number;
  applicantsCount: number;
  status: "active" | "closed" | "draft";
  deadline: string;
  companyId?: string;
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

  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [stipend, setStipend] = useState("");
  const [openings, setOpenings] = useState("");
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

      const internshipSnapshot = await getDocs(collection(db, "internships"));

      const loadedListings: InternshipPosting[] = [];

      internshipSnapshot.docs.forEach((internshipDoc) => {
        const data = internshipDoc.data();

        // HR should only see internships belonging to their company.
        if (userData.role === "hr" && data.companyId !== userData.companyId) {
          return;
        }

        loadedListings.push({
          id: internshipDoc.id,
          title: data.title || "Untitled Internship",
          domain: data.domain || "Not specified",
          stipend: Number(data.stipend || 0),
          openings: Number(data.openings || 0),
          applicantsCount: Number(data.applicantsCount || 0),
          status: data.status || "draft",
          deadline: data.deadline || "",
          companyId: data.companyId,
          createdBy: data.createdBy,
          description: data.description || "",
          requirements: data.requirements || [],
          skills: data.skills || [],
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
    setDomain("");
    setStipend("");
    setOpenings("");
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

      if (userData.role === "hr" && !userData.companyId) {
        setError("Your HR account is not associated with a company.");
        return;
      }

      // Convert comma-separated skills into an array.
      const skillList = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      // Use each non-empty line as a requirement.
      const requirementList = description
        .split("\n")
        .map((requirement) => requirement.trim())
        .filter(Boolean);

      const internshipData = {
        title: title.trim(),
        domain: domain.trim(),
        stipend: Number(stipend),
        openings: Number(openings),

        applicantsCount: 0,

        status: "active",

        deadline: deadline || "",

        description: description.trim(),

        requirements:
          requirementList.length > 0 ? requirementList : [description.trim()],

        skills: skillList,

        companyId: userData.companyId || "",

        createdBy: user.uid,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      };

      const internshipRef = await addDoc(
        collection(db, "internships"),
        internshipData,
      );

      console.log("Internship published successfully:", internshipRef.id);

      // Add the new internship immediately to the UI.
      const newInternship: InternshipPosting = {
        id: internshipRef.id,
        title: internshipData.title,
        domain: internshipData.domain,
        stipend: internshipData.stipend,
        openings: internshipData.openings,
        applicantsCount: 0,
        status: "active",
        deadline: internshipData.deadline,
        companyId: internshipData.companyId,
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

      const db = getFirebaseDb();

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

          <p className="text-xs text-slate-500">{item.domain}</p>
        </div>
      ),
    },

    {
      key: "stipend",
      header: "Stipend",
      render: (item) => (
        <span className="font-semibold text-slate-800">
          ₹{item.stipend.toLocaleString()}/mo
        </span>
      ),
    },

    {
      key: "openings",
      header: "Openings",
      render: (item) => (
        <span className="text-xs font-mono">{item.openings} positions</span>
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
          className="capitalize text-xs"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Internship Listings
          </h1>

          <p className="text-xs text-slate-500">
            Create and manage active internship postings
          </p>
        </div>

        <Button
          onClick={() => {
            setError("");
            setOpenModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Post New Internship
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

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
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">
                No internship postings found.
              </p>
            </div>
          ) : (
            <DataTable
              data={listings}
              columns={columns}
              searchKey="title"
              searchPlaceholder="Search postings..."
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
                Create Internship Posting
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="post-title" required>
                  Title
                </Label>

                <Input
                  id="post-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full Stack Web Development Intern"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="post-domain" required>
                  Domain
                </Label>

                <Input
                  id="post-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. Web Development"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="post-stipend" required>
                    Stipend (INR/mo)
                  </Label>

                  <Input
                    id="post-stipend"
                    type="number"
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
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    placeholder="5"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="post-deadline">Application Deadline</Label>

                <Input
                  id="post-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="post-skills">Required Skills</Label>

                <Input
                  id="post-skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, JavaScript, Node.js, MongoDB"
                  className="mt-1"
                />

                <p className="text-xs text-slate-500 mt-1">
                  Separate skills using commas.
                </p>
              </div>

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
