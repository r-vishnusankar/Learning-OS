import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";
import { accountMaySignIn, readAccountStatus } from "@/lib/account-status";

const f = createUploadthing();

async function requireActiveSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const status = await readAccountStatus(session.user.id, session.user.email);
  if (!accountMaySignIn(status)) throw new Error("Unauthorized");
  return { userId: session.user.id };
}

export const ourFileRouter = {
  courseThumbnail: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(requireActiveSession)
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl ?? file.url };
    }),
  lessonResource: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(requireActiveSession)
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl ?? file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
