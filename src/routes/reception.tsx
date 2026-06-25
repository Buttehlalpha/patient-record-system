import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Search, Send, Clock } from "lucide-react";

export const Route = createFileRoute("/reception")({ component: ReceptionPage });

type Patient = {
  id: string; patient_code: string; full_name: string;
  date_of_birth: string | null; gender: string | null;
  phone: string | null; address: string | null;
};

function ReceptionPage() {
  return (
    <AppShell title="Reception Desk" requireRole="reception">
      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register"><UserPlus className="mr-1.5 h-4 w-4" />Register</TabsTrigger>
          <TabsTrigger value="retrieve"><Search className="mr-1.5 h-4 w-4" />Retrieve</TabsTrigger>
          <TabsTrigger value="queue"><Clock className="mr-1.5 h-4 w-4" />Today's Queue</TabsTrigger>
        </TabsList>
        <TabsContent value="register"><RegisterTab /></TabsContent>
        <TabsContent value="retrieve"><RetrieveTab /></TabsContent>
        <TabsContent value="queue"><QueueTab /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function RegisterTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Patient | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { data, error } = await supabase.from("patients").insert({
      full_name: String(f.get("full_name")),
      date_of_birth: (f.get("dob") as string) || null,
      gender: (f.get("gender") as string) || null,
      phone: (f.get("phone") as string) || null,
      address: (f.get("address") as string) || null,
      created_by: user?.id,
      patient_code: "",
    }).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    setCreated(data as Patient);
    (e.currentTarget as HTMLFormElement).reset();
    qc.invalidateQueries({ queryKey: ["queue"] });
    toast.success(`Patient registered: ${data.patient_code}`);
  };

  const forward = async () => {
    if (!created) return;
    const { error } = await supabase.from("waiting_queue").insert({
      patient_id: created.id, added_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Forwarded to doctor");
    qc.invalidateQueries({ queryKey: ["queue"] });
    setCreated(null);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Register New Patient</CardTitle>
          <CardDescription>Enter biodata. A unique ID will be generated.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div><Label>Full name</Label><Input name="full_name" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date of birth</Label><Input name="dob" type="date" /></div>
              <div>
                <Label>Gender</Label>
                <select name="gender" defaultValue="" className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">—</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            <div><Label>Phone</Label><Input name="phone" /></div>
            <div><Label>Address</Label><Input name="address" /></div>
            <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Register Patient"}</Button>
          </form>
        </CardContent>
      </Card>

      {created && (
        <Card className="border-success/50 bg-success/5">
          <CardHeader>
            <CardTitle>Patient Created</CardTitle>
            <CardDescription>Give this ID to the patient.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Patient ID</p>
              <p className="text-2xl font-bold tracking-wider text-primary">{created.patient_code}</p>
              <p className="mt-2 text-sm">{created.full_name}</p>
            </div>
            <Button onClick={forward} className="w-full"><Send className="mr-1.5 h-4 w-4" />Forward to Doctor</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RetrieveTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.from("patients")
      .select("*").eq("patient_code", code.trim().toUpperCase()).maybeSingle();
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data) { setPatient(null); return toast.error("No patient with that ID"); }
    setPatient(data as Patient);
  };

  const forward = async () => {
    if (!patient) return;
    const { error } = await supabase.from("waiting_queue").insert({
      patient_id: patient.id, added_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Forwarded to doctor");
    qc.invalidateQueries({ queryKey: ["queue"] });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Retrieve Patient</CardTitle>
          <CardDescription>Look up a returning patient by ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={search} className="flex gap-2">
            <Input placeholder="PT-001000" value={code} onChange={(e) => setCode(e.target.value)} required />
            <Button type="submit" disabled={busy}>Search</Button>
          </form>
        </CardContent>
      </Card>
      {patient && (
        <Card>
          <CardHeader>
            <CardTitle>{patient.full_name}</CardTitle>
            <CardDescription>{patient.patient_code}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">DOB:</span> {patient.date_of_birth ?? "—"}</p>
            <p><span className="text-muted-foreground">Gender:</span> {patient.gender ?? "—"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {patient.phone ?? "—"}</p>
            <p><span className="text-muted-foreground">Address:</span> {patient.address ?? "—"}</p>
            <Button onClick={forward} className="mt-3 w-full"><Send className="mr-1.5 h-4 w-4" />Forward to Doctor</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QueueTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waiting_queue")
        .select("id, status, added_at, patients(patient_code, full_name)")
        .order("added_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <Card>
      <CardHeader><CardTitle>Today's Queue</CardTitle></CardHeader>
      <CardContent>
        {!data?.length && <p className="text-sm text-muted-foreground">No patients yet.</p>}
        <ul className="divide-y">
          {data?.map((q: any) => (
            <li key={q.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{q.patients?.full_name}</p>
                <p className="text-xs text-muted-foreground">{q.patients?.patient_code}</p>
              </div>
              <Badge variant={q.status === "seen" ? "secondary" : "default"}>{q.status}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
