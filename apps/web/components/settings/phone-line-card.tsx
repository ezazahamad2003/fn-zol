"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from "@/components/ui/primitives";
import { provisionPhoneLine } from "@/app/(dashboard)/settings/actions";

export function PhoneLineCard(props: {
  businessName: string;
  phoneNumber: string | null;
  assistantId: string | null;
  phoneId: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);
  const isProvisioned = Boolean(props.phoneNumber && props.assistantId && props.phoneId);

  async function provision() {
    setPending(true);
    setStatus(null);
    const res = await provisionPhoneLine();
    setPending(false);
    if (res.ok) {
      setStatus({ kind: "ok", msg: "Phone line provisioned." });
      router.refresh();
    } else {
      setStatus({ kind: "error", msg: res.error });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phone line</CardTitle>
        <CardDescription>Provisioned at onboarding. Callers reach your agent here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <KV k="Business"          v={props.businessName} />
          <KV k="Inbound number"    v={props.phoneNumber ?? "(not provisioned)"} />
          <KV k="VAPI assistant id" v={props.assistantId ?? "(not provisioned)"} />
          <KV k="VAPI phone id"     v={props.phoneId ?? "(not provisioned)"} />
        </div>

        {!isProvisioned && (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={provision} disabled={pending}>
              {pending ? "Provisioning..." : "Provision phone line"}
            </Button>
            {status && (
              <span className={status.kind === "ok" ? "text-xs text-emerald-700" : "text-xs text-red-600"}>
                {status.msg}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="font-mono text-xs break-all">{v}</div>
    </div>
  );
}
