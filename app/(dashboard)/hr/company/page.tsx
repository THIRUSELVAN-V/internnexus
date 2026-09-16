"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, CheckCircle2, Save, Loader2 } from "lucide-react";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";

import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function HRCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [companyId, setCompanyId] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // ---------------------------------------------------------
  // Load HR company profile
  // ---------------------------------------------------------

  const loadCompanyProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      const user = auth.currentUser;

      if (!user) {
        setError("Please log in to view your company profile.");
        return;
      }

      // Get HR user document
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        setError("User profile not found.");
        return;
      }

      const userData = userSnapshot.data();

      if (userData.role !== "hr" && userData.role !== "admin") {
        setError("You are not authorized to manage a company profile.");
        return;
      }

      // -----------------------------------------------------
      // If HR already has a companyId, load that company
      // -----------------------------------------------------

      if (userData.companyId) {
        const existingCompanyId = userData.companyId;

        const companyRef = doc(db, "companies", existingCompanyId);

        const companySnapshot = await getDoc(companyRef);

        if (companySnapshot.exists()) {
          const companyData = companySnapshot.data();

          setCompanyId(existingCompanyId);

          setCompanyName(companyData.name || "");
          setIndustry(companyData.industry || "");
          setWebsite(companyData.website || "");
          setLocation(companyData.location || "");
          setDescription(companyData.description || "");

          return;
        }
      }

      // -----------------------------------------------------
      // No company exists yet
      // -----------------------------------------------------

      setCompanyId(null);

      // We intentionally do not create a company automatically.
      // The HR must click "Save Company Profile".
    } catch (err) {
      console.error("Failed to load company profile:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load company profile.",
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
        await loadCompanyProfile();
      } else {
        setLoading(false);
        setError("Please log in to manage your company profile.");
      }
    });

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // Save company profile
  // ---------------------------------------------------------

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Basic validation
      if (!companyName.trim()) {
        setError("Company name is required.");
        return;
      }

      if (!industry.trim()) {
        setError("Industry sector is required.");
        return;
      }

      if (!location.trim()) {
        setError("Headquarters location is required.");
        return;
      }

      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      const user = auth.currentUser;

      if (!user) {
        setError("Please log in to save the company profile.");
        return;
      }

      const userRef = doc(db, "users", user.uid);

      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        setError("User profile not found.");
        return;
      }

      const userData = userSnapshot.data();

      if (userData.role !== "hr" && userData.role !== "admin") {
        setError("You are not authorized to create a company.");
        return;
      }

      // -----------------------------------------------------
      // UPDATE EXISTING COMPANY
      // -----------------------------------------------------

      if (companyId) {
        const companyRef = doc(db, "companies", companyId);

        await updateDoc(companyRef, {
          name: companyName.trim(),
          industry: industry.trim(),
          website: website.trim(),
          location: location.trim(),
          description: description.trim(),
          updatedAt: serverTimestamp(),
        });

        setSuccess("Company profile updated successfully.");

        return;
      }

      // -----------------------------------------------------
      // CREATE NEW COMPANY
      // -----------------------------------------------------

      const companyData = {
        name: companyName.trim(),
        industry: industry.trim(),
        website: website.trim(),
        location: location.trim(),
        description: description.trim(),

        createdBy: user.uid,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const companyRef = await addDoc(collection(db, "companies"), companyData);

      // -----------------------------------------------------
      // Connect HR user to company
      // -----------------------------------------------------

      await updateDoc(userRef, {
        companyId: companyRef.id,
      });

      setCompanyId(companyRef.id);

      setSuccess("Company profile created and linked to your HR account.");
    } catch (err) {
      console.error("Failed to save company profile:", err);

      setError(
        err instanceof Error ? err.message : "Failed to save company profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />

        <span className="text-sm text-slate-600">
          Loading company profile...
        </span>
      </div>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Company Profile</h1>

          <p className="text-xs text-slate-500">
            Manage registered company details, size, and admin approval status
          </p>
        </div>

        {companyId && (
          <Badge variant="success" className="text-xs font-semibold px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Company Registered
          </Badge>
        )}
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">
            {companyName || "Company Profile"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cname" required>
                Company Name
              </Label>

              <Input
                id="cname"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. TechCorp India Pvt Ltd"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="industry" required>
                Industry Sector
              </Label>

              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Software & IT Services"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website URL</Label>

              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                leftIcon={<Globe className="h-4 w-4" />}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="location" required>
                Headquarters Location
              </Label>

              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bangalore, Karnataka, India"
                leftIcon={<MapPin className="h-4 w-4" />}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cdesc">Company Overview</Label>

            <Textarea
              id="cdesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your company..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Company Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
