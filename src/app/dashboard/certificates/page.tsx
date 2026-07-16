"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
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
import { certificates } from "@/data/mock";
import { APP_NAME, DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import type { Certificate, CertificateStatus } from "@/types";
import { cn } from "@/lib/utils";

function QrPlaceholder({ className }: { className?: string }) {
  const pattern = [
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 1, 0, 1, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 1, 0, 1],
    [0, 1, 1, 0, 1, 1, 0, 1, 0],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 1],
  ];

  return (
    <svg viewBox="0 0 90 90" className={cn("h-16 w-16 shrink-0", className)} aria-hidden>
      {pattern.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect key={`${x}-${y}`} x={x * 10} y={y * 10} width={10} height={10} fill="currentColor" />
          ) : null
        )
      )}
    </svg>
  );
}

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

function CertificatePreviewCard({ cert }: { cert: Certificate }) {
  const isEarned = cert.status === "earned";

  const handleDownload = () => {
    toast.success("Certificate PDF downloaded", {
      description: `${cert.title} · ${cert.credentialId}`,
    });
  };

  const handleVerify = () => {
    toast.info("Verification initiated", {
      description: `Checking credential ${cert.credentialId} on Nexus registry…`,
    });
  };

  const handleShare = () => {
    toast.success("LinkedIn share opened", {
      description: "Your certificate is ready to post to your profile.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
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
            <QrPlaceholder className="text-foreground/80" />
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
              <p className="mt-0.5 font-mono text-xs font-medium">{cert.credentialId}</p>
            </div>

            {cert.issuedAt && (
              <p className="text-xs text-muted-foreground">Issued {cert.issuedAt}</p>
            )}

            {cert.status === "locked" && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Complete prerequisites to unlock
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
                <Badge key={skill} variant="outline" className="text-[10px]">
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
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleVerify}>
                <ShieldCheck className="h-3.5 w-3.5" /> Verify
              </Button>
              <Button size="sm" variant="default" className="gap-1.5" onClick={handleShare}>
                <Share2 className="h-3.5 w-3.5" /> LinkedIn
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

function CertificateGrid({ items, emptyTitle, emptyDescription }: {
  items: Certificate[];
  emptyTitle: string;
  emptyDescription: string;
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
        <CertificatePreviewCard key={cert.id} cert={cert} />
      ))}
    </div>
  );
}

export default function CertificatesPage() {
  const earned = certificates.filter((c) => c.status === "earned");
  const locked = certificates.filter((c) => c.status === "locked");
  const pending = certificates.filter((c) => c.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        description="Your earned credentials, pending certifications, and unlockable achievements."
      >
        <Badge variant="success" className="gap-1">
          <Award className="h-3.5 w-3.5" /> {earned.length} earned
        </Badge>
      </PageHeader>

      <Tabs defaultValue="earned">
        <TabsList>
          <TabsTrigger value="earned">
            Earned ({earned.length})
          </TabsTrigger>
          <TabsTrigger value="locked">
            Locked ({locked.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pending.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned">
          <CertificateGrid
            items={earned}
            emptyTitle="No certificates earned yet"
            emptyDescription="Complete assessments and learning paths to earn your first credential."
          />
        </TabsContent>

        <TabsContent value="locked">
          <CertificateGrid
            items={locked}
            emptyTitle="No locked certificates"
            emptyDescription="All available certificates are either earned or in progress."
          />
        </TabsContent>

        <TabsContent value="pending">
          <CertificateGrid
            items={pending}
            emptyTitle="No pending certificates"
            emptyDescription="Certificates awaiting review will appear here."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
