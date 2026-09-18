"use client";

import type { MentorRecommendation } from "@/lib/types";
import { getFirebaseAuth } from "@/lib/firebase/config";

export async function recommendMentors(
  domain: string,
  studentSkills: string[],
  applicationId?: string,
): Promise<MentorRecommendation[]> {
  // These parameters are kept for compatibility with the existing page.
  // The API will retrieve the authoritative student/internship data
  // from Firestore using applicationId.
  void domain;
  void studentSkills;

  if (!applicationId) {
    throw new Error(
      "Application ID is required to generate mentor recommendations.",
    );
  }

  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in to generate mentor recommendations.",
    );
  }

  const token = await user.getIdToken(true);

  let response: Response;

  try {
    response = await fetch("/api/ai/mentor-recommendation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        applicationId,
      }),
    });
  } catch (error) {
    console.error("Mentor recommendation API request failed:", error);

    throw new Error(
      "Unable to connect to the AI mentor recommendation service.",
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    recommendations?: MentorRecommendation[];
    error?: string;
  };

  if (!response.ok) {
    console.error(
      "Mentor recommendation API failed:",
      response.status,
      payload,
    );

    throw new Error(
      payload.error ??
        `Mentor recommendation failed (HTTP ${response.status}).`,
    );
  }

  if (!payload.recommendations || !Array.isArray(payload.recommendations)) {
    throw new Error("The AI did not return mentor recommendations.");
  }

  return payload.recommendations;
}
