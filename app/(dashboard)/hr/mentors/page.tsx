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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  UserCheck,
  Building2,
  CheckCircle2,
  Clock,
  Trash2,
  Loader2,
  AlertCircle,
  Mail,
  User,
} from "lucide-react";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import type { AuthorizedMentor } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils/formatters";

export default function HRMentorsPage() {
  const [mentors, setMentors] = useState<AuthorizedMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Company info for logged-in HR
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hrUserName, setHrUserName] = useState("");

  // Dialog state
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form fields
  const [mentorName, setMentorName] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");

  // ---------------------------------------------------------
  // Load HR Profile and Authorized Mentors
  // ---------------------------------------------------------
  const loadMentorsData = async () => {
    try {
      setLoading(true);
      setError("");

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      const user = auth.currentUser;

      if (!user) {
        setError("Please log in to manage company mentors.");
        return;
      }

      // Fetch HR profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        setError("HR profile was not found.");
        return;
      }

      const userData = userDoc.data();
      if (userData.role !== "hr" && userData.role !== "admin") {
        setError("You are not authorized to manage company mentors.");
        return;
      }

      if (userData.role === "hr" && !userData.companyId) {
        setError("Your HR account is not associated with any company.");
        return;
      }

      const cId = userData.companyId || "";
      setCompanyId(cId);
      setHrUserName(userData.displayName || userData.name || "HR Manager");

      // Fetch company name
      let cName = userData.companyName || "";
      if (cId) {
        try {
          const companySnap = await getDoc(doc(db, "companies", cId));
          if (companySnap.exists()) {
            const compData = companySnap.data();
            cName = compData.name || compData.companyName || cName;
          }
        } catch (compErr) {
          console.error("Failed to fetch company details:", compErr);
        }
      }
      setCompanyName(cName || "Your Company");

      if (!cId) {
        setMentors([]);
        return;
      }

      // Fetch authorized mentors from company subcollection
      const mentorsRef = collection(db, "companies", cId, "authorizedMentors");
      let mentorsSnap;
      try {
        const q = query(mentorsRef, orderBy("createdAt", "desc"));
        mentorsSnap = await getDocs(q);
      } catch {
        mentorsSnap = await getDocs(mentorsRef);
      }

      const loadedMentors: AuthorizedMentor[] = mentorsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "",
          email: data.email || "",
          companyId: data.companyId || cId,
          companyName: data.companyName || cName,
          addedByHR: data.addedByHR || user.uid,
          addedByHRName: data.addedByHRName || "",
          createdAt: data.createdAt || "",
          registered: Boolean(data.registered),
          registeredAt: data.registeredAt,
          mentorUserId: data.mentorUserId,
        };
      });

      // Sort newest first
      loadedMentors.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setMentors(loadedMentors);
    } catch (err) {
      console.error("Failed to load mentors:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load company mentors."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await loadMentorsData();
      } else {
        setLoading(false);
        setError("Please log in to manage company mentors.");
      }
    });

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // Handle Add Mentor Authorization
  // ---------------------------------------------------------
  const handleAddMentor = async () => {
    try {
      setFormError("");
      setSubmitting(true);

      const trimmedName = mentorName.trim();
      const trimmedEmail = mentorEmail.trim().toLowerCase();

      if (!trimmedName || trimmedName.length < 2) {
        setFormError("Please enter a valid mentor name (at least 2 characters).");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
        setFormError("Please enter a valid mentor email address.");
        return;
      }

      if (!companyId) {
        setFormError("Company association is missing. Please contact platform support.");
        return;
      }

      // Check if email already authorized in this company
      const duplicate = mentors.find(
        (m) => m.email.toLowerCase() === trimmedEmail
      );
      if (duplicate) {
        setFormError(
          `A mentor with email "${trimmedEmail}" is already authorized for ${companyName}.`
        );
        return;
      }

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      const user = auth.currentUser;

      if (!user) {
        setFormError("You must be logged in to authorize a mentor.");
        return;
      }

      const newRecord = {
        name: trimmedName,
        email: trimmedEmail,
        companyId,
        companyName,
        addedByHR: user.uid,
        addedByHRName: hrUserName,
        createdAt: new Date().toISOString(),
        registered: false,
      };

      const docRef = await addDoc(
        collection(db, "companies", companyId, "authorizedMentors"),
        newRecord
      );

      const createdMentor: AuthorizedMentor = {
        id: docRef.id,
        ...newRecord,
      };

      setMentors((prev) => [createdMentor, ...prev]);
      setSuccessMessage(
        `Mentor "${trimmedName}" (${trimmedEmail}) has been authorized for ${companyName}. They can now register on InternNexus.`
      );
      setMentorName("");
      setMentorEmail("");
      setOpenModal(false);

      setTimeout(() => {
        setSuccessMessage("");
      }, 6000);
    } catch (err) {
      console.error("Failed to add mentor:", err);
      setFormError(
        err instanceof Error ? err.message : "Failed to authorize mentor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // Handle Delete / Revoke Authorization
  // ---------------------------------------------------------
  const handleDeleteMentor = async (mentor: AuthorizedMentor) => {
    const confirmMsg = mentor.registered
      ? `Revoke authorization record for registered mentor "${mentor.name}"?`
      : `Revoke authorization for "${mentor.name}" (${mentor.email})? They will no longer be able to register under ${companyName}.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setError("");
      const db = getFirebaseDb();
      await deleteDoc(
        doc(db, "companies", companyId, "authorizedMentors", mentor.id)
      );

      setMentors((prev) => prev.filter((m) => m.id !== mentor.id));
      setSuccessMessage(`Authorization for "${mentor.name}" has been revoked.`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Failed to delete mentor authorization:", err);
      setError(
        err instanceof Error ? err.message : "Failed to revoke mentor authorization."
      );
    }
  };

  // ---------------------------------------------------------
  // Table Columns
  // ---------------------------------------------------------
  const columns: Column<AuthorizedMentor>[] = [
    {
      key: "name",
      header: "Mentor",
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Building2 className="h-3 w-3 text-slate-400" />
            {item.companyName || companyName}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (item) => (
        <span className="text-xs font-medium text-slate-700 break-all flex items-center gap-1">
          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
          {item.email}
        </span>
      ),
    },
    {
      key: "registered",
      header: "Status",
      render: (item) =>
        item.registered ? (
          <Badge variant="success" className="text-xs font-semibold gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Registered
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs font-semibold gap-1 bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3" />
            Not Registered
          </Badge>
        ),
    },
    {
      key: "createdAt",
      header: "Authorized On",
      render: (item) => (
        <span className="text-xs text-slate-500">
          {item.createdAt ? formatTimestamp(item.createdAt) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => handleDeleteMentor(item)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Revoke Authorization"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-600" />
            Company Mentors
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorize and manage industrial mentors for{" "}
            <strong className="text-slate-800">{companyName || "your company"}</strong>
          </p>
        </div>

        <Button
          onClick={() => {
            setFormError("");
            setMentorName("");
            setMentorEmail("");
            setOpenModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-10"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Mentor
        </Button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-medium text-green-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mentors Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Authorized Mentors
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Mentors listed below are verified to register using your company name.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium">
                {mentors.filter((m) => m.registered).length} Registered
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium">
                {mentors.filter((m) => !m.registered).length} Pending
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2 text-purple-600" />
              <span className="text-sm text-slate-600">Loading company mentors...</span>
            </div>
          ) : (
            <DataTable
              data={mentors}
              columns={columns}
              searchKey="name"
              searchPlaceholder="Search mentor by name..."
              emptyMessage="No mentors authorized yet. Click 'Add Mentor' to authorize mentors from your company."
            />
          )}
        </CardContent>
      </Card>

      {/* Add Mentor Modal */}
      {openModal && (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-600" />
                Authorize New Mentor
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                Add an industrial mentor belonging to your organization. They will be authorized to register on InternNexus by selecting your company.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Automatic Company Affiliation Display */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs">
                <div className="flex items-center gap-2 text-purple-900 font-semibold mb-1">
                  <Building2 className="h-3.5 w-3.5 text-purple-600" />
                  <span>Company (Automatically Associated)</span>
                </div>
                <p className="text-sm font-bold text-slate-900 ml-5.5">
                  {companyName}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 ml-5.5">
                  Obtained automatically from your verified HR account. Mentors must select this company during registration.
                </p>
              </div>

              {/* Mentor Name */}
              <div>
                <Label htmlFor="mentor-name" required>
                  Mentor Full Name
                </Label>
                <Input
                  id="mentor-name"
                  placeholder="e.g. John Doe"
                  value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)}
                  leftIcon={<User className="h-3.5 w-3.5 text-slate-400" />}
                  className="mt-1"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The mentor must enter this exact name when registering.
                </p>
              </div>

              {/* Mentor Email */}
              <div>
                <Label htmlFor="mentor-email" required>
                  Mentor Email Address
                </Label>
                <Input
                  id="mentor-email"
                  type="email"
                  placeholder="e.g. john@yourcompany.com"
                  value={mentorEmail}
                  onChange={(e) => setMentorEmail(e.target.value)}
                  leftIcon={<Mail className="h-3.5 w-3.5 text-slate-400" />}
                  className="mt-1"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The mentor must use this exact email address when registering.
                </p>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">{formError}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setOpenModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMentor}
                disabled={submitting}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  "Authorize Mentor"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
