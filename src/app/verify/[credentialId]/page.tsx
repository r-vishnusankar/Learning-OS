"use client";

import { useParams } from "next/navigation";
import { Award, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CertificateQr } from "@/components/certificates/qr-code";
import { APP_NAME, DEPARTMENT_LABELS, LEVEL_LABELS } from "@/constants/navigation";
import { useVerifyCredential } from "@/hooks/use-certification";

export default function VerifyCredentialPage() {
  const params = useParams();
  const credentialId = decodeURIComponent(params.credentialId as string);
  const { data, isLoading } = useVerifyCredential(credentialId);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const verifyUrl = `${origin}/verify/${credentialId}`;

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/40 px-4 py-16">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {APP_NAME} Credential Registry
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Verify certificate</h1>
          <p className="mt-2 font-code text-sm text-muted-foreground">{credentialId}</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !data ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Unable to load verification result.
            </CardContent>
          </Card>
        ) : data.valid ? (
          <Card className="border-success/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <ShieldCheck className="h-5 w-5" /> Valid credential
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-display text-xl font-semibold">
                    <Award className="h-5 w-5 text-warning" />
                    {data.certificate.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Issued to {data.holderName}
                  </p>
                </div>
                <CertificateQr value={verifyUrl} size={96} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {DEPARTMENT_LABELS[data.certificate.department]}
                </Badge>
                <Badge variant="secondary">{LEVEL_LABELS[data.certificate.level]}</Badge>
                {data.certificate.score != null && (
                  <Badge variant="success">Score {data.certificate.score}%</Badge>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Issued</dt>
                  <dd className="font-medium">{data.certificate.issuedAt ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Expires</dt>
                  <dd className="font-medium">{data.certificate.expiresAt ?? "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" /> Not valid
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {data.reason}
              {data.certificate && (
                <p className="mt-2 font-medium text-foreground">{data.certificate.title}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
