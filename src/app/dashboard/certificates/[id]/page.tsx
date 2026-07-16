"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Lock,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { certificates, currentUser } from "@/data/mock";
import { APP_NAME, DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { cn } from "@/lib/utils";

function QrCodeLarge() {
  const pattern = [
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0],
    [1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1],
    [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
  ];

  return (
    <svg viewBox="0 0 190 190" className="h-28 w-28 text-foreground" aria-hidden>
      {pattern.map((row, y) =>
        row.map((cell, x) =>
          cell ? <rect key={`${x}-${y}`} x={x * 10} y={y * 10} width={10} height={10} fill="currentColor" /> : null
        )
      )}
    </svg>
  );
}

export default function CertificateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const cert = certificates.find((c) => c.id === id);

  if (!cert) {
    return (
      <div className="space-y-6">
        <PageHeader title="Certificate not found" description="This credential may have been revoked or archived." />
        <Button asChild variant="outline">
          <Link href="/dashboard/certificates">
            <ArrowLeft className="h-4 w-4" /> Back to certificates
          </Link>
        </Button>
      </div>
    );
  }

  const isEarned = cert.status === "earned";
  const verifyUrl = `https://verify.nexuscorp.com/credential/${cert.credentialId}`;

  const completionHistory = isEarned
    ? [
        { event: "Assessment completed", date: cert.issuedAt ?? "—", detail: `Score: ${cert.score}%` },
        { event: "Certificate issued", date: cert.issuedAt ?? "—", detail: cert.credentialId },
        { event: "Added to profile", date: cert.issuedAt ?? "—", detail: "Visible on Nexus learner profile" },
      ]
    : cert.status === "pending"
      ? [
          { event: "Assessment submitted", date: "2026-07-10", detail: "Awaiting final review" },
          { event: "Certificate queued", date: "2026-07-11", detail: "Estimated issue: 3–5 business days" },
        ]
      : [
          { event: "Prerequisite: Complete assessment", date: "—", detail: "System Design Certification Exam" },
          { event: "Prerequisite: Course completion", date: "—", detail: "System Design Mastery (64% complete)" },
        ];

  const copyCredentialId = () => {
    navigator.clipboard.writeText(cert.credentialId);
    toast.success("Credential ID copied");
  };

  const handleDownload = () => {
    toast.success("Certificate PDF downloaded", { description: cert.title });
  };

  const handleVerify = () => {
    toast.info("Credential verified", {
      description: `${cert.credentialId} is ${isEarned ? "valid and active" : "not yet issued"}.`,
    });
  };

  const handleShare = () => {
    toast.success("Share link copied", { description: "Paste on LinkedIn or email to showcase your credential." });
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
        <Link href="/dashboard/certificates">
          <ArrowLeft className="h-4 w-4" /> Certificates
        </Link>
      </Button>

      <PageHeader title={cert.title} description={`${DEPARTMENT_LABELS[cert.department]} · ${LEVEL_LABELS[cert.level]}`}>
        {isEarned && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleShare}>
              <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            className={cn(
              "relative overflow-hidden",
              isEarned
                ? "border-warning/30 bg-linear-to-br from-card via-warning/5 to-primary/5"
                : "border-border"
            )}
          >
            <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-dashed border-warning/25" />
            <div className="pointer-events-none absolute left-1/2 top-8 h-24 w-24 -translate-x-1/2 rounded-full border-4 border-warning/20 bg-warning/5" />
            <div className="pointer-events-none absolute left-1/2 top-12 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-warning/10">
              <Award className="h-8 w-8 text-warning" />
            </div>

            <CardContent className="relative px-8 pb-10 pt-28 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Certificate of Achievement
              </p>
              <p className="mt-2 text-sm text-muted-foreground">This certifies that</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{currentUser.name}</h2>
              <p className="mt-4 text-sm text-muted-foreground">has successfully demonstrated proficiency in</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-primary">{cert.title}</h3>

              <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-b border-border/60 py-6 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Department</p>
                  <p className="mt-1 font-medium">{DEPARTMENT_LABELS[cert.department]}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Level</p>
                  <p className="mt-1 font-medium">{LEVEL_LABELS[cert.level]}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Score</p>
                  <p className="mt-1 font-medium">{cert.score != null ? `${cert.score}%` : "—"}</p>
                </div>
              </div>

              <div className="mt-8 flex items-end justify-between gap-6">
                <div className="text-left">
                  <p className="font-display text-sm font-semibold">{APP_NAME}</p>
                  <p className="text-xs text-muted-foreground">Enterprise Learning Platform</p>
                  {cert.issuedAt && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> Issued {cert.issuedAt}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-card p-2">
                  <QrCodeLarge />
                </div>
              </div>

              {!isEarned && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                  <div className="rounded-xl border border-border bg-card px-6 py-4 text-center shadow-lg">
                    {cert.status === "locked" ? (
                      <>
                        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 font-semibold">Certificate Locked</p>
                        <p className="text-sm text-muted-foreground">Complete prerequisites to unlock</p>
                      </>
                    ) : (
                      <>
                        <Sparkles className="mx-auto h-8 w-8 text-info" />
                        <p className="mt-2 font-semibold">Pending Review</p>
                        <p className="text-sm text-muted-foreground">Your certificate will be issued shortly</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Verification
              </CardTitle>
              <CardDescription>Validate this credential on the Nexus registry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Credential ID
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-medium">{cert.credentialId}</p>
                  <Button variant="ghost" size="icon-sm" onClick={copyCredentialId}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={isEarned ? "success" : cert.status === "pending" ? "info" : "secondary"}
                    className="capitalize"
                  >
                    {cert.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issuer</span>
                  <span className="font-medium">{APP_NAME} Corp</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="shrink-0 text-muted-foreground">Verify URL</span>
                  <span className="truncate font-mono text-xs">{verifyUrl}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={handleVerify}>
                <ShieldCheck className="h-4 w-4" /> Verify on Nexus Registry
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills Validated</CardTitle>
              <CardDescription>Competencies covered by this credential</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cert.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completion History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {completionHistory.map((item, i) => (
                <div key={item.event}>
                  <div className="flex gap-3 py-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {isEarned && i === completionHistory.length - 1 ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-primary/60" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.event}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.date}</span>
                  </div>
                  {i < completionHistory.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
