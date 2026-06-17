import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Per-user rate limit, backed by the Postgres `check_rate_limit` SECURITY
 * DEFINER function (migration 20260617000015). Returns `true` if the caller is
 * allowed (under the cap for `action` within `window`) and records the event;
 * `false` if they've hit the cap or aren't signed in.
 *
 * `window` is a Postgres interval literal, e.g. "1 minute", "24 hours".
 * Fails open on infra error so a transient DB hiccup never blocks legit users.
 */
export async function checkRateLimit(
  action: string,
  max: number,
  window: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_action: action,
    p_max: max,
    p_window: window,
  });
  if (error) return true;
  return data === true;
}
