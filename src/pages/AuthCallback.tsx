import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BRAND } from "@/config/brand";
import { isDepartmentId } from "@/config/departments";
import { liveSso } from "@/config/platform";
import { claimFrom, completeSignIn } from "@/session/sso";
import { sessionActions } from "@/session/useSession";

type CallbackState =
  | { status: "working" }
  | { status: "failed"; detail: string }
  | { status: "entered"; departmentId: string };

/**
 * Where the identity provider returns the officer.
 *
 * It completes the exchange, reads the department the provider states, and opens
 * the workspace. It is reached only by the provider's redirect — nothing in the
 * platform links to it.
 *
 * ⚠️ The browser does not verify the token's signature, because it cannot. Before
 * production the exchange and this mapping must move to the server; see
 * docs/SERVER_CONTRACT.md §4. The screen states that plainly rather than hiding it.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>({ status: "working" });

  useEffect(() => {
    let active = true;

    const run = async () => {
      const config = liveSso();
      const result = await completeSignIn(window.location.search);
      if (!active) return;

      if (result.detail) {
        setState({ status: "failed", detail: result.detail });
        return;
      }

      const token = result.idToken;
      if (!result.ok || !token) {
        setState({
          status: "failed",
          detail: "The identity provider did not return an identity for this officer.",
        });
        return;
      }

      const claimed = config ? claimFrom(token, config.departmentClaim) : null;
      if (!claimed || !isDepartmentId(claimed)) {
        setState({
          status: "failed",
          detail:
            "The identity provider did not state a department this platform recognises, so no session was created.",
        });
        return;
      }

      const subject = claimFrom(token, "sub") ?? "unknown";
      sessionActions.signInWithSso(claimed, subject);
      setState({ status: "entered", departmentId: claimed });
      navigate("/app", { replace: true });
    };

    void run();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-lg border bg-card p-5">
        <h1 className="text-sm font-semibold tracking-tight text-foreground">Government sign-in</h1>

        {state.status === "working" && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Completing sign-in…</p>
        )}

        {state.status === "entered" && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Signed in for {state.departmentId}. Opening the workspace…
          </p>
        )}

        {state.status === "failed" && (
          <p className="mt-2 text-xs leading-relaxed text-destructive">
            Sign-in did not complete: {state.detail}
          </p>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
          This build cannot check the identity provider's signature in the browser. Before this
          platform is used for real, the exchange and the department mapping must be verified on the
          server. {BRAND.classification}.
        </p>

        <div className="mt-3 flex flex-wrap gap-3 text-[10px]">
          <Link to="/start" className="font-medium text-primary hover:underline">
            Choose your Department →
          </Link>
          <Link to="/" className="font-medium text-primary hover:underline">
            Overview →
          </Link>
        </div>
      </div>
    </div>
  );
}
