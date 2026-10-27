import type { CandidateMatch } from "@/lib/types";
import { getFirebaseAuth } from "@/lib/firebase/config";

export async function matchCandidateWithInternship(
  candidateSkills: string[],
  internshipRequirements: string[],
  applicationId: string = "app-1",
  internshipId: string = "int-1",
  studentId: string = "std-1",
): Promise<CandidateMatch> {
  // These parameters are kept for compatibility with existing callers.
  void candidateSkills;
  void internshipRequirements;
  void internshipId;
  void studentId;

  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in to perform candidate matching.");
  }

  const token = await user.getIdToken(true);

  let response: Response;

  try {
    response = await fetch("/api/ai/candidate-match", {
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
    console.error("Candidate matching API request failed:", error);

    throw new Error("Unable to connect to the AI candidate matching service.");
  }

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    match?: CandidateMatch;
    error?: string;
  };

  if (!response.ok) {
    console.error("Candidate matching API failed:", response.status, payload);

    throw new Error(
      payload.error ?? `Candidate matching failed (HTTP ${response.status}).`,
    );
  }

  if (!payload.match) {
    throw new Error("The AI did not return a candidate matching result.");
  }

  return payload.match;
}
