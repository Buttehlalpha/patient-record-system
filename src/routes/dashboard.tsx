import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Stethoscope, FileText, UserPlus, Search, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — MedRecord" }] }),
});

function DashboardPage() {
  const { role } = useAuth();
  return (
    <AppShell title="Dashboard">
      <Overview />
      <div className="mt-6">
        {role === "doctor" ? <DoctorQuick /> : <ReceptionQuick />}
      </div>
    </AppShell>
  );
}

function Overview() {
  const { role } = useAuth();

  const { data: patientCount } = useQuery({
    queryKey: ["stat-patients"],
    queryFn: async () => {
      const { count } = await supabase.from("patients").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: queueWaiting } = useQuery({
    queryKey: ["stat-queue-waiting"],
    queryFn: async () => {
      const { count } = await supabase.from("waiting_queue")
        .select("*", { count: "exact", head: true }).eq("status", "waiting");
      return count ?? 0;
    },
  });

  const { data: seenToday } = useQuery({
    queryKey: ["stat-seen-today"],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("waiting_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "seen").gte("seen_at", start.toISOString());
      return count ?? 0;
    },
  });

  const { data: recordsCount } = useQuery({
    queryKey: ["stat-records"],
    queryFn: async () => {
      const { count, error } = await supabase.from("medical_records")
        .select("*", { count: "exact", head: true });
      if (error) return null;
      return count ?? 0;
    },
    enabled: role === "doctor",
  });

  const cards = [
    { label: "Total patients", value: patientCount, icon: Users, hint: "Registered in system" },
    { label: "Waiting now", value: queueWaiting, icon: Clock, hint: "In the queue" },
    { label: "Seen today", value: seenToday, icon: Stethoscope, hint: "Completed consultations" },
    ...(role === "doctor"
      ? [{ label: "Medical records", value: recordsCount, icon: FileText, hint: "All-time records" }]
      : []),
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, hint }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{value ?? "—"}</div>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReceptionQuick() {
  const { data } = useQuery({
    queryKey: ["recent-patients"],
    queryFn: async () => {
      const { data } = await supabase.from("patients")
        .select("id, patient_code, full_name, created_at")
        .order("created_at", { ascending: false }).limit(6);
      return data ?? [];
    },
  });
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Jump back into reception tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/reception" className="block">
            <Button className="w-full justify-start" variant="outline">
              <UserPlus className="mr-2 h-4 w-4" /> Register new patient
            </Button>
          </Link>
          <Link to="/reception" className="block">
            <Button className="w-full justify-start" variant="outline">
              <Search className="mr-2 h-4 w-4" /> Retrieve patient
            </Button>
          </Link>
          <Link to="/reception" className="block">
            <Button className="w-full justify-start">
              Open Reception Desk <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recently registered</CardTitle>
          <CardDescription>Latest patient registrations.</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.length && <p className="text-sm text-muted-foreground">No patients yet.</p>}
          <ul className="divide-y">
            {data?.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.patient_code}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function DoctorQuick() {
  const { data } = useQuery({
    queryKey: ["dash-queue"],
    queryFn: async () => {
      const { data } = await supabase.from("waiting_queue")
        .select("id, added_at, patients(patient_code, full_name)")
        .eq("status", "waiting").order("added_at", { ascending: true }).limit(6);
      return data ?? [];
    },
  });
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Jump into consultations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/doctor" className="block">
            <Button className="w-full justify-start">
              <Stethoscope className="mr-2 h-4 w-4" /> Open Doctor's Console
            </Button>
          </Link>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Patients waiting</CardTitle>
          <CardDescription>Next in queue.</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.length && <p className="text-sm text-muted-foreground">Queue is empty.</p>}
          <ul className="divide-y">
            {data?.map((q: any) => (
              <li key={q.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-medium">{q.patients?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{q.patients?.patient_code}</p>
                </div>
                <Badge variant="secondary">
                  {new Date(q.added_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
