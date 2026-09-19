"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  UserPlus,
  Users,
  Loader2,
  AlertCircle,
  Mail,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Mentor {
  id: string;
  name: string;
  email: string;
  designation: string;
  expertise: string[];
  maxMentees: number;
  currentWorkload: number;
}

export default function HRMentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState("");
  const [expertise, setExpertise] = useState("");
  const [maxMentees, setMaxMentees] = useState("5");

  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------
  // Load mentors belonging to the logged-in HR's company
  // ---------------------------------------------------------

  const loadMentors = async () => {
    try {
      setLoading(true);
      setError("");

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      const user = auth.currentUser;

      if (!user) {
        setError("Please log in to manage industrial mentors.");
        return;
      }

      // Get logged-in HR profile
      const userSnapshot = await getDocs(
        query(collection(db, "users"), where("__name__", "==", user.uid)),
      );

      if (userSnapshot.empty) {
        setError("HR profile not found.");
        return;
      }

      const hrData = userSnapshot.docs[0].data();

      if (hrData.role !== "hr") {
        setError("Only HR users can manage industrial mentors.");
        return;
      }

      const companyId = hrData.companyId;

      if (!companyId) {
        setError(
          "Your HR account is not linked to a company. Please complete your company profile first.",
        );
        return;
      }

      // Get mentors belonging to this company
      const mentorQuery = query(
        collection(db, "users"),
        where("role", "==", "mentor"),
        where("companyId", "==", companyId),
      );

      const mentorSnapshot = await getDocs(mentorQuery);

      const mentorRows: Mentor[] = mentorSnapshot.docs.map((mentorDoc) => {
        const data = mentorDoc.data();

        return {
          id: mentorDoc.id,
          name: data.name || "Unnamed Mentor",
          email: data.email || "",
          designation: data.designation || "Industrial Mentor",
          expertise: Array.isArray(data.expertise) ? data.expertise : [],
          maxMentees: typeof data.maxMentees === "number" ? data.maxMentees : 5,
          currentWorkload:
            typeof data.currentWorkload === "number" ? data.currentWorkload : 0,
        };
      });

      setMentors(mentorRows);
    } catch (err) {
      console.error("Failed to load mentors:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load industrial mentors.",
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

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        void loadMentors();
      } else {
        setLoading(false);
        setError("Please log in to manage industrial mentors.");
      }
    });

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // Add mentor
  // ---------------------------------------------------------

  const handleAddMentor = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!name.trim()) {
        setError("Mentor name is required.");
        return;
      }

      if (!email.trim()) {
        setError("Mentor email is required.");
        return;
      }

      if (!password.trim() || password.length < 6) {
        setError("Password must contain at least 6 characters.");
        return;
      }

      if (!designation.trim()) {
        setError("Designation is required.");
        return;
      }

      if (!expertise.trim()) {
        setError("Please enter at least one area of expertise.");
        return;
      }

      const parsedMaxMentees = Number(maxMentees);

      if (!Number.isInteger(parsedMaxMentees) || parsedMaxMentees <= 0) {
        setError("Maximum mentees must be a positive number.");
        return;
      }

      const auth = getFirebaseAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("Please log in again.");
        return;
      }

      /*
       * This calls the permanent HR mentor creation backend.
       *
       * The backend will:
       * 1. Verify the logged-in HR.
       * 2. Read the HR's companyId.
       * 3. Create the Firebase Authentication account.
       * 4. Create the mentor Firestore document.
       *
       * The companyId is intentionally NOT sent from the client.
       */

      const token = await user.getIdToken(true);

      const response = await fetch("/api/hr/create-mentor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          designation: designation.trim(),
          expertise: expertise
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          maxMentees: parsedMaxMentees,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Failed to create industrial mentor.");
      }

      setSuccess("Industrial mentor created successfully.");

      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setDesignation("");
      setExpertise("");
      setMaxMentees("5");
      setShowForm(false);

      // Reload real mentors
      await loadMentors();
    } catch (err) {
      console.error("Failed to create mentor:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create industrial mentor.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Mentor Management
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Create and manage industrial mentors belonging to your company.
          </p>
        </div>

        <Button
          onClick={() => {
            setShowForm((current) => !current);
            setError("");
            setSuccess("");
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          {showForm ? "Cancel" : "Add Industrial Mentor"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />

            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />

            <p className="text-sm text-green-700">{success}</p>
          </CardContent>
        </Card>
      )}

      {/* Add Mentor Form */}
      {showForm && (
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Add Industrial Mentor
            </CardTitle>

            <p className="text-xs text-slate-500">
              The mentor will automatically be associated with your company.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="mentor-name" required>
                  Full Name
                </Label>

                <Input
                  id="mentor-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arun Kumar"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="mentor-email" required>
                  Email
                </Label>

                <Input
                  id="mentor-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mentor@company.com"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="mentor-password" required>
                  Initial Password
                </Label>

                <Input
                  id="mentor-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="mentor-designation" required>
                  Designation
                </Label>

                <Input
                  id="mentor-designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="mentor-expertise" required>
                Areas of Expertise
              </Label>

              <Input
                id="mentor-expertise"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="React, Node.js, MongoDB, AWS"
                className="mt-1"
              />

              <p className="mt-1 text-xs text-slate-500">
                Separate multiple skills with commas.
              </p>
            </div>

            <div className="max-w-xs">
              <Label htmlFor="max-mentees" required>
                Maximum Mentees
              </Label>

              <Input
                id="max-mentees"
                type="number"
                min="1"
                value={maxMentees}
                onChange={(e) => setMaxMentees(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleAddMentor}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Creating Mentor...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Create Mentor
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Mentors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Industrial Mentors
              </CardTitle>

              <p className="mt-1 text-xs text-slate-500">
                Mentors registered under your company.
              </p>
            </div>

            <Badge variant="purple">
              {mentors.length} Mentor{mentors.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading mentors...
            </div>
          ) : mentors.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-3 text-sm font-semibold text-slate-700">
                No industrial mentors yet
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Add your first industrial mentor to enable AI mentor
                recommendations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className="border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900">
                          {mentor.name}
                        </h3>

                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Briefcase className="h-3 w-3" />
                          {mentor.designation}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {mentor.email}
                        </p>
                      </div>

                      <Badge
                        variant={
                          mentor.currentWorkload >= mentor.maxMentees
                            ? "destructive"
                            : "success"
                        }
                        className="shrink-0 text-xs"
                      >
                        {mentor.currentWorkload}/{mentor.maxMentees}
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold text-slate-600">
                        Expertise
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {mentor.expertise.length > 0 ? (
                          mentor.expertise.map((skill) => (
                            <Badge
                              key={skill}
                              variant="default"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">
                            No expertise added
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
