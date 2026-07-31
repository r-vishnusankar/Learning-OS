"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  Download,
  ExternalLink,
  Lock,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CertificateQr } from "@/components/certificates/qr-code";
import { APP_NAME, DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { useLearnerCertificates } from "@/hooks/use-certification";
import { useCurrentUser } from "@/hooks/use-me";
import { openCertificatePrintWindow } from "@/lib/certificate-pdf";
import type { Certificate, CertificateStatus } from "@/types";
import { cn } from "@/lib/utils";

function CertificateSeal({ status }: { status: CertificateStatus }) {
  return (
    <div
      className={cn(
        "absolute -right-3 -top-3 flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-md",
        status === "earned"
          ? "border-warning/30 bg-linear-to-br from-warning/20 to-warning/5 text-warning"
          : status === "pending"
            ? "border-info/30 bg-linear-to-br from-info/20 to-info/5 text-info"
            : "border-border bg-muted text-muted-foreground"
      )}
    >
      {status === "locked" ? <Lock className="h-6 w-6" /> : <Award className="h-7 w-7" />}
    </div>
  );
}

function CertificatePreviewCard({
  cert,
  holderName,
}: {
  cert: Certificate;
  holderName: string;
}) {
  const isEarned = cert.status === "earned";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const verifyUrl = `${origin}/verify/${cert.credentialId}`;

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
    });
    if (ok) toast.success("Print dialog opened — save as PDF");
    else toast.error("Allow pop-ups to download the certificate PDF");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card
        className={cn(
          "group relative overflow-hidden transition hover:shadow-lg",
          isEarned
            ? "border-warning/25 bg-linear-to-br from-card via-card to-warning/5"
            : cert.status === "pending"
              ? "border-info/25 bg-linear-to-br from-card via-card to-info/5"
              : "opacity-90"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-3 rounded-lg border-2 border-dashed",
            isEarned ? "border-warning/20" : "border-border/60"
          )}
        />
        <CertificateSeal status={cert.status} />

        <CardContent className="relative p-6 pt-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {APP_NAME} Credential
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold leading-tight group-hover:text-primary">
                {cert.title}
              </h3>
            </div>
            {isEarned && cert.credentialId !== "PENDING" ? (
              <CertificateQr value={verifyUrl} size={64} className="shrink-0" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{DEPARTMENT_LABELS[cert.department]}</Badge>
              <Badge variant="secondary">{LEVEL_LABELS[cert.level]}</Badge>
              {cert.score != null && <Badge variant="success">Score: {cert.score}%</Badge>}
            </div>

            <div className="rounded-lg border border-border/80 bg-background/60 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Credential ID
              </p>
              <p className="mt-0.5 font-code text-xs">{cert.credentialId}</p>
            </div>

            {cert.issuedAt && (
              <p className="text-xs text-muted-foreground">Issued {cert.issuedAt}</p>
            )}

            {cert.status === "locked" && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Complete the learning path to unlock
              </p>
            )}

            {cert.status === "pending" && (
              <p className="flex items-center gap-1.5 text-xs text-info">
                <Sparkles className="h-3.5 w-3.5" />
                Assessment in review — certificate pending
              </p>
            )}

            <div className="flex flex-wrap gap-1">
              {cert.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2 border-t border-border/60 p-4">
          {isEarned ? (
            <>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href={`/verify/${cert.credentialId}`}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Verify
                </Link>
              </Button>
              <Button
                size="sm"
                variant="default"
                className="gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(verifyUrl);
                  toast.success("Share link copied");
                }}
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </Button>
            </>
          ) : (
            <Button asChild size="sm" variant="outline" className="w-full gap-1.5">
              <Link href={`/dashboard/certificates/${cert.id}`}>
                View details <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {isEarned && (
            <Button asChild size="sm" variant="ghost" className="ml-auto gap-1.5">
              <Link href={`/dashboard/certificates/${cert.id}`}>
                Full preview <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function CertificateGrid({
  items,
  emptyTitle,
  emptyDescription,
  holderName,
}: {
  items: Certificate[];
  emptyTitle: string;
  emptyDescription: string;
  holderName: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={<Award className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((cert) => (
        <CertificatePreviewCard key={cert.id} cert={cert} holderName={holderName} />
      ))}
    </div>
  );
}

export default function CertificatesPage() {
  const { data: certificates = [], isLoading, isError: certificatesError } = useLearnerCertificates();
  const { data: user } = useCurrentUser();
  const holderName = user?.name ?? "Learner";
  const earned = certificates.filter((c) => c.status === "earned");
  const locked = certificates.filter((c) => c.status === "locked");
  const pending = certificates.filter((c) => c.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        description="Your earned credentials, pending certifications, and unlockable achievements."
      >
        {!isLoading && !certificatesError && (
          <Badge variant="success" className="gap-1">
            <Award className="h-3.5 w-3.5" /> {earned.length} earned
          </Badge>
        )}
      </PageHeader>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : certificatesError ? (
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6 stroke-[1.75]" />}
          title="Couldn't load certificates"
          description="Certificates could not be loaded — this list may be incomplete."
          className="ring-1 ring-warning/25"
        />
      ) : (
        <Tabs defaultValue="earned">
          <TabsList>
            <TabsTrigger value="earned">Earned ({earned.length})</TabsTrigger>
            <TabsTrigger value="locked">Locked ({locked.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="earned">
            <CertificateGrid
              items={earned}
              holderName={holderName}
              emptyTitle="No certificates earned yet"
              emptyDescription="Pass an assessment or complete a learning path to earn a credential."
            />
          </TabsContent>

          <TabsContent value="locked">
            <CertificateGrid
              items={locked}
              holderName={holderName}
              emptyTitle="No locked certificates"
              emptyDescription="All available certificates are either earned or in progress."
            />
          </TabsContent>

          <TabsContent value="pending">
            <CertificateGrid
              items={pending}
              holderName={holderName}
              emptyTitle="No pending certificates"
              emptyDescription="Certificates awaiting review will appear here."
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
