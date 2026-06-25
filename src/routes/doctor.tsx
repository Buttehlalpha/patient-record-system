import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Stethoscope, ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/doctor")({ component: DoctorPage });

function DoctorPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <AppShell title="Doctor's Console" requireRole="doctor">
      {selectedId
        ? <PatientView patientId={selectedId} onBack={() => setSelectedId(null)} />
        : <Queue onSelect={setSelectedId} />}
    </AppShell>
  );
}

function Queue({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["doctor-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waiting_queue")
        .select("id, status, added_at, patient_id, patients(patient_code, full_name, date_of_birth, gender)")
        .eq("status", "waiting")
        .order("added_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waiting Patients</CardTitle>
        <CardDescription>Select a patient to begin consultation.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && !data?.length && <p className="text-sm text-muted-foreground">No patients in queue.</p>}
        <ul className="divide-y">
          {data?.map((q: any) => (
            <li key={q.id}>
              <button onClick={() => onSelect(q.patient_id)} className="flex w-full items-center justify-between py-3 text-left hover:bg-muted/50 rounded px-2">
                <div>
                  <p className="font-medium">{q.patients?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{q.patients?.patient_code} · {q.patients?.gender ?? "—"}</p>
                </div>
                <Badge><Stethoscope className="mr-1 h-3 w-3" />See</Badge>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PatientView({ patientId, onBack }: { patientId: string; onBack: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", patientId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: records } = useQuery({
    queryKey: ["records", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("medical_records")
        .select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.from("medical_records").insert({
      patient_id: patientId,
      doctor_id: user!.id,
      diagnosis: String(f.get("diagnosis")),
      treatment: String(f.get("treatment")),
      notes: (f.get("notes") as string) || null,
    });
    if (!error) {
      await supabase.from("waiting_queue").update({ status: "seen", seen_at: new Date().toISOString() })
        .eq("patient_id", patientId).eq("status", "waiting");
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Record saved");
    (e.currentTarget as HTMLFormElement).reset();
    qc.invalidateQueries({ queryKey: ["records", patientId] });
    qc.invalidateQueries({ queryKey: ["doctor-queue"] });
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to queue</Button>

      {patient && (
        <Card>
          <CardHeader>
            <CardTitle>{patient.full_name}</CardTitle>
            <CardDescription>{patient.patient_code} · {patient.gender ?? "—"} · DOB {patient.date_of_birth ?? "—"}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Phone: {patient.phone ?? "—"} · Address: {patient.address ?? "—"}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Previous Records</CardTitle>
          </CardHeader>
          <CardContent>
            {!records?.length && <p className="text-sm text-muted-foreground">No prior records.</p>}
            <ul className="space-y-3">
              {records?.map((r: any) => (
                <li key={r.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  <p className="mt-1"><span className="font-medium">Diagnosis:</span> {r.diagnosis}</p>
                  <p><span className="font-medium">Treatment:</span> {r.treatment}</p>
                  {r.notes && <p className="text-muted-foreground"><span className="font-medium text-foreground">Notes:</span> {r.notes}</p>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>New Consultation</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Diagnosis</Label><Input name="diagnosis" required /></div>
              <div><Label>Treatment</Label><Textarea name="treatment" required rows={3} /></div>
              <div><Label>Notes (optional)</Label><Textarea name="notes" rows={2} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save Record"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
