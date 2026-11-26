import { isAdminRequest, unauthorized } from "@/lib/admin/auth";
import { ImageError, processPhoto, processScreenshot } from "@/lib/admin/images";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Processes a screenshot or profile photo and hands it back to the admin,
 * which holds it until Publish. Nothing is committed here.
 */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(422, "Send the picture as a file upload.");
  }

  const file = form.get("file");
  const kind = form.get("kind");
  const projectId = form.get("projectId");
  if (!(file instanceof Blob)) return fail(422, "Choose a picture to upload.");
  if (file.size > MAX_BYTES) return fail(413, "That picture is over 4 MB. Try a smaller one.");
  if (!TYPES.has(file.type)) return fail(415, "Use a JPG, PNG or WebP picture.");

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (kind === "photo") return Response.json(await processPhoto(bytes));
    if (kind === "project" && typeof projectId === "string" && /^[a-z0-9-]{1,80}$/.test(projectId)) {
      return Response.json(await processScreenshot(bytes, projectId));
    }
    return fail(422, "Say which project this screenshot is for.");
  } catch (error) {
    if (error instanceof ImageError) return fail(422, error.message);
    throw error;
  }
}
