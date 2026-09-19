import "server-only";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

interface CreateMentorRequest {
  name: string;
  email: string;
  password: string;
  designation: string;
  expertise: string[];
  maxMentees: number;
}

export async function POST(request: Request) {
  let createdAuthUserId: string | null = null;

  try {
    // ---------------------------------------------------------
    // 1. Verify HR authentication
    // ---------------------------------------------------------

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication token is required." },
        { status: 401 },
      );
    }

    const idToken = authorization.substring("Bearer ".length).trim();

    if (!idToken) {
      return NextResponse.json(
        { error: "Authentication token is missing." },
        { status: 401 },
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const hrUid = decodedToken.uid;

    // ---------------------------------------------------------
    // 2. Get HR Firestore profile
    // ---------------------------------------------------------

    const hrRef = adminDb.collection("users").doc(hrUid);
    const hrSnapshot = await hrRef.get();

    if (!hrSnapshot.exists) {
      return NextResponse.json(
        { error: "HR profile was not found." },
        { status: 404 },
      );
    }

    const hrData = hrSnapshot.data();

    if (hrData?.role !== "hr") {
      return NextResponse.json(
        { error: "Only HR users can create industrial mentors." },
        { status: 403 },
      );
    }

    // ---------------------------------------------------------
    // 3. Get companyId from HR profile
    // ---------------------------------------------------------

    const companyId = hrData.companyId;

    if (!companyId || typeof companyId !== "string") {
      return NextResponse.json(
        {
          error:
            "Your HR account is not linked to a company. Please complete your company profile first.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 4. Verify that the company exists
    // ---------------------------------------------------------

    const companyRef = adminDb.collection("companies").doc(companyId);
    const companySnapshot = await companyRef.get();

    if (!companySnapshot.exists) {
      return NextResponse.json(
        {
          error: "The company linked to your HR account could not be found.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 5. Read and validate request
    // ---------------------------------------------------------

    const body = (await request.json()) as Partial<CreateMentorRequest>;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const designation =
      typeof body.designation === "string" ? body.designation.trim() : "";

    const expertise = Array.isArray(body.expertise)
      ? body.expertise
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const maxMentees =
      typeof body.maxMentees === "number"
        ? body.maxMentees
        : Number(body.maxMentees);

    if (!name) {
      return NextResponse.json(
        { error: "Mentor name is required." },
        { status: 400 },
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Mentor email is required." },
        { status: 400 },
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must contain at least 6 characters." },
        { status: 400 },
      );
    }

    if (!designation) {
      return NextResponse.json(
        { error: "Mentor designation is required." },
        { status: 400 },
      );
    }

    if (expertise.length === 0) {
      return NextResponse.json(
        { error: "At least one area of expertise is required." },
        { status: 400 },
      );
    }

    if (!Number.isInteger(maxMentees) || maxMentees <= 0) {
      return NextResponse.json(
        { error: "Maximum mentees must be a positive integer." },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 6. Create Firebase Authentication account
    // ---------------------------------------------------------

    const authUser = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    createdAuthUserId = authUser.uid;

    // ---------------------------------------------------------
    // 7. Create permanent mentor Firestore profile
    // ---------------------------------------------------------

    const mentorRef = adminDb.collection("users").doc(authUser.uid);

    await mentorRef.set({
      name,
      email,
      role: "mentor",

      // IMPORTANT:
      // This companyId comes from the authenticated HR.
      // The client cannot choose another company.
      companyId,

      designation,
      expertise,

      maxMentees,
      currentWorkload: 0,

      createdBy: hrUid,

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // ---------------------------------------------------------
    // 8. Return success
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        mentor: {
          id: authUser.uid,
          name,
          email,
          role: "mentor",
          companyId,
          designation,
          expertise,
          maxMentees,
          currentWorkload: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("HR mentor creation failed:", error);

    // ---------------------------------------------------------
    // Cleanup:
    // If Auth account was created but Firestore failed,
    // remove the Auth account so we don't leave an orphan user.
    // ---------------------------------------------------------

    if (createdAuthUserId) {
      try {
        await adminAuth.deleteUser(createdAuthUserId);
      } catch (cleanupError) {
        console.error("Failed to clean up mentor Auth account:", cleanupError);
      }
    }

    // Firebase duplicate email
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "auth/email-already-exists"
    ) {
      return NextResponse.json(
        {
          error: "A Firebase account already exists with this email address.",
        },
        { status: 409 },
      );
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "auth/invalid-email"
    ) {
      return NextResponse.json(
        { error: "The mentor email address is invalid." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create industrial mentor.",
      },
      { status: 500 },
    );
  }
}
