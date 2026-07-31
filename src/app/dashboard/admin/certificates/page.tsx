"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminCertificates,
  useReissueCertificate,
  useRevokeCertificate,
} from "@/hooks/use-certification";

export default function AdminCertificatesPage() {
  const { data = [], isLoading } = useAdminCertificates();
  const revoke = useRevokeCertificate();
  const reissue = useReissueCertificate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        description="Revoke or reissue issued credentials. New certs mint when learners pass assessments or complete paths."
      />

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-3">
          {data.map((cert) => (
            <Card key={cert.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{cert.title}</p>
                  <p className="font-code text-xs text-muted-foreground">{cert.credentialId}</p>
                  <p className="text-xs text-muted-foreground">
                    Score {cert.score ?? "—"} · issued{" "}
                    {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {cert.status}
                  </Badge>
                  {cert.status === "earned" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const reason = window.prompt("Revoke reason?");
                          if (!reason) return;
                          await revoke.mutateAsync({ certificateId: cert.id, reason });
                          toast.success("Revoked");
                        }}
                      >
                        Revoke
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          await reissue.mutateAsync({ certificateId: cert.id });
                          toast.success("Reissued with new credential ID");
                        }}
                      >
                        Reissue
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
