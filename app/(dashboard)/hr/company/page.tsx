"use client";

import React, { useEffect, useState } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Building2,
  Globe,
  MapPin,
  CheckCircle2,
  Save,
  Loader2,
  Check,
  Mail,
  Phone,
  Hash,
} from "lucide-react";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";

import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import type { Company } from "@/lib/types";
import { COMPANY_SIZES } from "@/lib/utils/constants";

export default function HRCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [companyId, setCompanyId] = useState<string | null>(null);

  // ---------------------------------------------------------
  // Company basic details
  // ---------------------------------------------------------

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  // ---------------------------------------------------------
  // Address details
  // ---------------------------------------------------------

  const [location, setLocation] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");

  // ---------------------------------------------------------
  // Contact details
  // ---------------------------------------------------------

  const [officialEmail, setOfficialEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  // ---------------------------------------------------------
  // Company information
  // ---------------------------------------------------------

  const [size, setSize] = useState<Company["size"]>("startup");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Company["status"]>("pending");

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
          setCompanyAddress(companyData.companyAddress || "");
          setCity(companyData.city || "");
          setState(companyData.state || "");
          setCountry(companyData.country || "India");
          setPincode(companyData.pincode || "");

          setOfficialEmail(companyData.officialEmail || "");
          setContactNumber(companyData.contactNumber || "");
          setRegistrationNumber(companyData.registrationNumber || "");

          setSize(companyData.size || "startup");
          setDescription(companyData.description || "");

          setStatus(companyData.status || "pending");

          return;
        }
      }

      // -----------------------------------------------------
      // No company exists yet
      // -----------------------------------------------------

      setCompanyId(null);

      // Start with a clean registration form.
      setCompanyName(userData.companyName || "");
      setIndustry("");
      setWebsite("");

      setLocation("");
      setCompanyAddress("");
      setCity("");
      setState("");
      setCountry("India");
      setPincode("");

      setOfficialEmail(user.email || "");
      setContactNumber("");
      setRegistrationNumber("");

      setSize("startup");
      setDescription("");

      // HR cannot automatically approve their own company.
      setStatus("pending");
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

      // -----------------------------------------------------
      // Validation
      // -----------------------------------------------------

      if (!companyName.trim()) {
        setError("Company name is required.");
        return;
      }

      if (!industry.trim()) {
        setError("Industry sector is required.");
        return;
      }

      if (!city.trim() && !location.trim()) {
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
        setError("You are not authorized to manage a company.");
        return;
      }

      // -----------------------------------------------------
      // Build complete location
      // -----------------------------------------------------

      const fullLocation =
        city.trim() && state.trim()
          ? `${city.trim()}, ${state.trim()}`
          : location.trim();

      // -----------------------------------------------------
      // Existing company status
      //
      // Important:
      // HR should not be able to promote a pending company
      // to approved by editing this page.
      // -----------------------------------------------------

      const existingStatus: Company["status"] =
        status === "suspended"
          ? "suspended"
          : status === "approved"
            ? "approved"
            : "pending";

      // -----------------------------------------------------
      // UPDATE EXISTING COMPANY
      // -----------------------------------------------------

      if (companyId) {
        const companyRef = doc(db, "companies", companyId);

        await updateDoc(companyRef, {
          name: companyName.trim(),
          industry: industry.trim(),
          website: website.trim(),

          location: fullLocation,
          companyAddress: companyAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          pincode: pincode.trim(),

          officialEmail: officialEmail.trim(),
          contactNumber: contactNumber.trim(),
          registrationNumber: registrationNumber.trim()
            ? registrationNumber.trim().toUpperCase()
            : "",

          size,
          description: description.trim(),

          updatedAt: serverTimestamp(),
        });

        // Keep HR profile company information synchronized.
        await updateDoc(userRef, {
          companyId,
          companyName: companyName.trim(),
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

        location: fullLocation,
        companyAddress: companyAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        pincode: pincode.trim(),

        officialEmail: officialEmail.trim(),
        contactNumber: contactNumber.trim(),
        registrationNumber: registrationNumber.trim()
          ? registrationNumber.trim().toUpperCase()
          : "",

        size,
        description: description.trim(),

        // HR ownership
        hrId: user.uid,
        hrName: userData.displayName || "HR Manager",

        // New companies start pending.
        status: "pending" as Company["status"],

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
        companyName: companyName.trim(),
      });

      setCompanyId(companyRef.id);
      setStatus("pending");

      setSuccess(
        "Company profile created and linked to your HR account. It is pending admin approval.",
      );
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Company Profile Management
          </h1>

          <p className="text-xs text-slate-500">
            Manage registered enterprise details, industry, headquarters,
            contact information, and approval status
          </p>
        </div>

        {companyId ? (
          <Badge
            variant={
              status === "approved"
                ? "success"
                : status === "suspended"
                  ? "destructive"
                  : "warning"
            }
            className="text-xs font-semibold px-3 py-1 capitalize"
          >
            {status === "approved" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Approved Enterprise
              </>
            ) : (
              status
            )}
          </Badge>
        ) : (
          <Badge variant="warning" className="text-xs font-semibold px-3 py-1">
            Pending Registration
          </Badge>
        )}
      </div>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-semibold flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          {success}
        </div>
      )}

      {/* Company form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">
            {companyName
              ? `${companyName} Details`
              : "Register Enterprise Details"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Basic information */}
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

          {/* Full address */}
          <div>
            <Label htmlFor="companyAddress">Full Company Address</Label>

            <Input
              id="companyAddress"
              placeholder="Street Address, Tech Park, Suite No."
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              leftIcon={<MapPin className="h-4 w-4" />}
              className="mt-1"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <Label htmlFor="city">City</Label>

              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Chennai"
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>

              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Tamil Nadu"
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>

              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="pincode">Pincode</Label>

              <Input
                id="pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="600001"
                className="mt-1 text-xs"
              />
            </div>
          </div>

          {/* Fallback location */}
          <div>
            <Label htmlFor="location">Headquarters Location</Label>

            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bangalore, Karnataka, India"
              className="mt-1"
            />

            <p className="text-[11px] text-slate-500 mt-1">
              If City and State are provided, they will be used automatically
              for the company location.
            </p>
          </div>

          {/* Official contact details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="officialEmail">Official Company Email</Label>

              <Input
                id="officialEmail"
                type="email"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                className="mt-1"
                placeholder="hr@company.com"
              />
            </div>

            <div>
              <Label htmlFor="contactNumber">Company Contact Number</Label>

              <Input
                id="contactNumber"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                leftIcon={<Phone className="h-4 w-4" />}
                className="mt-1"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          {/* Website and registration */}
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
              <Label htmlFor="regNo">Registration / GST / Udyam Number</Label>

              <Input
                id="regNo"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                leftIcon={<Hash className="h-4 w-4" />}
                className="mt-1 font-mono"
                placeholder="Registration number"
              />
            </div>
          </div>

          {/* Company size */}
          <div>
            <Label htmlFor="csize">Company Size</Label>

            <select
              id="csize"
              value={size}
              onChange={(e) => setSize(e.target.value as Company["size"])}
              className="mt-1 w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
            >
              {COMPANY_SIZES.map((companySize) => (
                <option key={companySize.value} value={companySize.value}>
                  {companySize.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="cdesc">Company Overview &amp; Mission</Label>

            <Textarea
              id="cdesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your company, products, services, and mission..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          {/* Save */}
          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
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
