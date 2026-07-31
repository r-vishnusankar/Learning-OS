"use client";

import * as React from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { CertificateQr } from "@/components/certificates/qr-code";
import { APP_NAME, DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { useCertificateDetail } from "@/hooks/use-certification";
import { useCurrentUser } from "@/hooks/use-me";
import { openCertificatePrintWindow } from "@/lib/certificate-pdf";
import { cn } from "@/lib/utils";

export default function CertificateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = useCertificateDetail(id);
  const { data: user } = useCurrentUser();
  const [qrDataUrl, setQrDataUrl] = React.useState<string>();

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Certificate not found"
          description="This credential may have been revoked or archived."
        />
        <Button asChild variant="outline">
          <Link href="/dashboard/certificates">
            <ArrowLeft className="h-4 w-4" /> Back to certificates
          </Link>
        </Button>
      </div>
    );
  }

  const cert = data.certificate;
  const isEarned = cert.status === "earned";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const verifyUrl = data.verifyUrl
    ? `${origin}${data.verifyUrl}`
    : `${origin}/verify/${cert.credentialId}`;
  const holderName = user?.name ?? data.holderName ?? "Learner";

  const handleDownload = () => {
    const ok = openCertificatePrintWindow({
      title: cert.title,
      holderName,
      credentialId: cert.credentialId,
      department: DEPARTMENT_LABELS[cert.department] ?? cert.department,
      level: LEVEL_LABELS[cert.level] ?? cert.level,
      score: cert.score,
      issuedAt: cert.issuedAt,
      verifyUrl,
      qrDataUrl,
    });
    if (ok) toast.success("Print dialog opened — save as PDF");
    else toast.error("Allow pop-ups to download the certificate PDF");
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
        <Link href="/dashboard/certificates">
          <ArrowLeft className="h-4 w-4" /> Certificates
        </Link>
      </Button>

      <PageHeader
        title={cert.title}
        description={`${DEPARTMENT_LABELS[cert.department]} · ${LEVEL_LABELS[cert.level]}`}
      >
        {isEarned && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                navigator.clipboard.writeText(verifyUrl);
                toast.success("Share link copied");
              }}
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href={`/verify/${cert.credentialId}`}>
                <ExternalLink className="h-3.5 w-3.5" /> Verify
              </Link>
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
            <CardContent className="relative px-8 pb-10 pt-16 text-center">
              <Award className="mx-auto h-10 w-10 text-warning" />
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Certificate of Achievement
              </p>
              <p className="mt-2 text-sm text-muted-foreground">This certifies that</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{holderName}</h2>
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
                {isEarned && cert.credentialId !== "PENDING" ? (
                  <div className="rounded-lg border border-border bg-card p-2">
                    <CertificateQr value={verifyUrl} size={112} onReady={setQrDataUrl} />
                  </div>
                ) : null}
              </div>

              {!isEarned && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                  <div className="rounded-xl border border-border bg-card px-6 py-4 text-center shadow-lg">
                    {cert.status === "locked" ? (
                      <>
                        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 font-semibold">Certificate Locked</p>
                        <p className="text-sm text-muted-foreground">Complete the path to unlock</p>
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
                  <p className="font-code text-sm">{cert.credentialId}</p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(cert.credentialId);
                      toast.success("Credential ID copied");
                    }}
                  >
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
                  <span className="font-medium">{APP_NAME}</span>
                </div>
              </div>

              {isEarned && (
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link href={`/verify/${cert.credentialId}`}>
                    <ShieldCheck className="h-4 w-4" /> Open public verify page
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills Validated</CardTitle>
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

          {isEarned && (
            <Card>
              <CardHeader>
                <CardTitle>Completion History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 py-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Certificate issued</p>
                    <p className="text-xs text-muted-foreground">{cert.credentialId}</p>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">{cert.issuedAt}</span>
                </div>
                <Separator />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
