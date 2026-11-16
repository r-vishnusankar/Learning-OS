import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdminOrInstructor } from "@/lib/auth-utils";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function POST(req: Request) {
  try {
    await requireAdminOrInstructor();
  } catch {
    return NextResponse.json({
      ok: false as const,
      code: "FORBIDDEN",
      message: "You do not have permission to upload course thumbnails.",
    });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({
      ok: false as const,
      code: "CONFIG",
      message: "Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel.",
    });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({
      ok: false as const,
      code: "VALIDATION",
      message: "Invalid upload request.",
    });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({
      ok: false as const,
      code: "VALIDATION",
      message: "No file provided.",
    });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({
      ok: false as const,
      code: "VALIDATION",
      message: "Only PNG, JPEG, and WebP images are allowed.",
    });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({
      ok: false as const,
      code: "VALIDATION",
      message: "Image must be 4 MB or smaller.",
    });
  }

  const ext = extForMime(file.type);
  const name = `course-thumbnails/${crypto.randomUUID()}.${ext}`;

  try {
    const blob = await put(name, file, { access: "public" });
    return NextResponse.json({ ok: true as const, url: blob.url });
  } catch {
    return NextResponse.json({
      ok: false as const,
      code: "UPLOAD_FAILED",
      message: "Could not upload image. Try again.",
    });
  }
}
