import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  Users,
  Lock,
  ArrowRight,
  CheckCircle2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-doctor-patient.jpg";
import receptionImage from "@/assets/feature-reception.jpg";
import doctorImage from "@/assets/feature-doctor.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "MedRecord — Secure Hospital Patient Record System" },
      {
        name: "description",
        content:
          "Streamlined patient registration, queue management, and clinical records for reception and doctors.",
      },
      {
        property: "og:title",
        content: "MedRecord — Secure Hospital Patient Record System",
      },
      {
        property: "og:description",
        content:
          "From the front desk to the consulting room. One secure record for every patient.",
      },
    ],
  }),
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const slides = [
    {
      image: heroImage,
      alt: "Doctor consulting with a patient at a modern hospital",
    },
    {
      image: receptionImage,
      alt: "Hospital receptionist welcoming a patient",
    },
    {
      image: doctorImage,
      alt: "Doctor reviewing patient records on a tablet",
    },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (loading || !user) return;
    navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Activity className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" />
            <span className="font-semibold tracking-tight">MedRecord</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-sm">
                Sign in
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="text-sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — full‑width image slider with centered overlay */}
      <section className="relative h-[100vh] min-h-[500px] w-full overflow-hidden md:min-h-[600px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>
        ))}

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <div className="max-w-3xl">
            {/* <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-sm">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Role-based access · Private by design
            </div> */}
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Hospital patient records,{" "}
              <span className="text-primary-foreground/90"></span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-sm text-white/80 sm:text-base md:text-lg">
              From the front desk to the consulting room. Reception registers
              and queues patients. Doctors review history and record diagnoses —
              securely, in one place.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row justify-center">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button className="w-full bg-white text-primary hover:bg-white/90">
                  Open staff portal <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full bg-blue-300 border-white/40 text-white hover:bg-white/40 hover:text-white"
                >
                  How it works
                </Button>
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-white/80 sm:gap-x-6 sm:text-sm">
              {[
                "Unique patient IDs",
                "Live waiting queue",
                "Encrypted records",
                "Audit-ready trails",
              ].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white/60" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 w-2 rounded-full transition-all sm:h-2.5 sm:w-2.5 ${
                i === currentSlide
                  ? "bg-white w-6 sm:w-8"
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Two-up role highlight */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <img
              src={receptionImage}
              alt="Hospital receptionist welcoming a patient"
              loading="lazy"
              width={1024}
              height={768}
              className="h-48 w-full object-cover"
            />
            <div className="p-5 sm:p-6">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <ClipboardList className="h-3.5 w-3.5" /> Reception
              </div>
              <h3 className="text-base font-semibold sm:text-lg">Register & route patients fast</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Capture biodata, auto-generate a patient ID, and send the patient
                to a doctor's queue in seconds.
              </p>
            </div>
          </article>
          <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <img
              src={doctorImage}
              alt="Doctor reviewing patient records on a tablet"
              loading="lazy"
              width={1024}
              height={768}
              className="h-48 w-full object-cover"
            />
            <div className="p-5 sm:p-6">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Stethoscope className="h-3.5 w-3.5" /> Doctor
              </div>
              <h3 className="text-base font-semibold sm:text-lg">Full history, one screen</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Review every prior diagnosis and treatment, then save new clinical
                notes — all linked to the patient.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
              Built for clinical workflows
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Everything reception and doctors need — nothing they don't.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ClipboardList,
                title: "Patient registration",
                desc: "Capture biodata and generate a unique patient ID instantly.",
              },
              {
                icon: Users,
                title: "Smart waiting queue",
                desc: "Reception forwards patients to doctors with one click.",
              },
              {
                icon: Stethoscope,
                title: "Clinical history",
                desc: "Doctors review every previous diagnosis before examining.",
              },
              {
                icon: Lock,
                title: "Role-based access",
                desc: "Reception cannot view diagnoses. Doctors own clinical records.",
              },
              {
                icon: ShieldCheck,
                title: "Audit-ready",
                desc: "Every record is timestamped and tied to the staff member.",
              },
              {
                icon: Activity,
                title: "Real-time updates",
                desc: "Queue and records stay in sync across all devices.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-sm font-medium sm:text-base">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            A simple flow from arrival to consultation.
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Patient arrives",
              d: "Reception registers a new patient or retrieves an existing one by ID.",
            },
            {
              n: "02",
              t: "Sent to doctor",
              d: "The patient is added to the doctor's waiting queue automatically.",
            },
            {
              n: "03",
              t: "Consultation",
              d: "Doctor reviews previous records and saves new diagnosis & treatment notes.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="relative rounded-xl border bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="font-mono text-xs text-primary">{s.n}</div>
              <div className="mt-2 text-base font-medium">{s.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Create your staff account and start managing patients in minutes.
          </p>
          <div className="mt-6">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Create staff account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER — primary color background (matching the button) */}
      <footer className="border-t border-primary/40 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 sm:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <Link to="/" className="flex items-center gap-2 text-primary-foreground">
                <Activity className="h-5 w-5" />
                <span className="font-semibold tracking-tight">MedRecord</span>
              </Link>
              <p className="mt-2 text-xs text-primary-foreground/80 sm:text-sm">
                Secure hospital patient records, from reception to consultation.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/90 sm:text-sm">
                Product
              </h3>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    to="/auth"
                    className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors sm:text-sm"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors sm:text-sm"
                  >
                    Patient Queue
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors sm:text-sm"
                  >
                    Clinical Records
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/90 sm:text-sm">
                Company
              </h3>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    to="/about"
                    className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors sm:text-sm"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors sm:text-sm"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors sm:text-sm"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Social */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/90 sm:text-sm">
                Legal
              </h3>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    to="/privacy"
                    className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors sm:text-sm"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors sm:text-sm"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
              <div className="mt-4 flex gap-3">
                <a
                  href="#"
                  className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
                <a
                  href="#"
                  className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
                <a
                  href="#"
                  className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
                <a
                  href="#"
                  className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-primary-foreground/15 pt-6 text-center text-xs text-primary-foreground/60">
            &copy; {new Date().getFullYear()} MedRecord. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}