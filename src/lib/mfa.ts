import { supabase } from "@/integrations/supabase/client";

/**
 * Two-step verification (TOTP authenticator apps) for studio accounts, via
 * Supabase Auth MFA. A password sign-in gives an "aal1" session; entering a
 * code from the authenticator upgrades it to "aal2", which the server and the
 * database require for any studio access.
 */

export type Authenticator = { id: string; name: string; createdAt: string };

export type AssuranceState = {
  /** Has at least one verified authenticator. */
  enrolled: boolean;
  /** This session has passed two-step verification. */
  verified: boolean;
};

export async function getAssurance(): Promise<AssuranceState> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return { enrolled: data.nextLevel === "aal2", verified: data.currentLevel === "aal2" };
}

export async function listAuthenticators(): Promise<Authenticator[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.totp.map((f) => ({ id: f.id, name: f.friendly_name || "Authenticator app", createdAt: f.created_at }));
}

export type Enrollment = { factorId: string; qrCode: string; secret: string };

/** Supabase returns the QR code as "data:image/svg+xml;utf-8,<svg…>", which browsers
 * may refuse (raw "#" colours, non-standard parameter). Re-encode it properly. */
function svgDataUri(qr: string) {
  const comma = qr.indexOf(",");
  if (comma < 0 || /;base64/i.test(qr.slice(0, comma))) return qr;
  let svg = qr.slice(comma + 1);
  try {
    svg = decodeURIComponent(svg);
  } catch {
    // already raw SVG
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Starts adding an authenticator: returns the QR code to scan and the setup key. */
export async function startEnrollment(): Promise<Enrollment> {
  const { data: factors } = await supabase.auth.mfa.listFactors();
  // Clear half-finished setups (scanned but never confirmed) so they don't pile up.
  for (const f of factors?.all ?? []) {
    if (f.factor_type === "totp" && f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const count = factors?.totp.length ?? 0;
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "BXLACK Studio",
    friendlyName: count ? `Authenticator ${count + 1} · ${new Date().toLocaleDateString("en-IN")}` : "Authenticator app",
  });
  if (error) {
    if (/disabled|not enabled/i.test(error.message)) {
      throw new Error(
        "Authenticator apps are switched off for this project. In Supabase, open Authentication → Multi-Factor and enable TOTP, then try again.",
      );
    }
    throw error;
  }
  return { factorId: data.id, qrCode: svgDataUri(data.totp.qr_code), secret: data.totp.secret };
}

/** Checks a 6-digit code for an authenticator, finishing setup or upgrading the session. */
export async function verifyCode(factorId: string, code: string) {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, "") });
  if (error) {
    throw new Error(
      /invalid|expired|mismatch/i.test(error.message)
        ? "That code didn't work. Check the time on your phone is set automatically, then enter the newest code."
        : error.message,
    );
  }
}

/** Verifies the sign-in with the first authenticator that accepts the code. */
export async function verifySignIn(code: string) {
  const authenticators = await listAuthenticators();
  if (!authenticators.length) throw new Error("No authenticator is set up for this account.");
  let lastError: unknown = null;
  for (const a of authenticators) {
    try {
      await verifyCode(a.id, code);
      return;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function removeAuthenticator(factorId: string) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  // Removing a factor can change the session's level; pick up the new token.
  await supabase.auth.refreshSession();
}
