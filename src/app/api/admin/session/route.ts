import { isAdminRequest } from "@/lib/admin/auth";
import { adminConfig } from "@/lib/admin/config";

/** Tells the admin screen whether to show setup steps, the login, or the editor. */
export async function GET(request: Request) {
  const signedIn = isAdminRequest(request); // reads the request first, so this is never prerendered
  return Response.json(
    { configured: adminConfig() !== null, signedIn },
    { headers: { "cache-control": "no-store" } },
  );
}
