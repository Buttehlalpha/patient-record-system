
-- Roles enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('reception', 'doctor', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Patients table (biodata)
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  date_of_birth date,
  gender text,
  phone text,
  address text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'reception') OR public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Reception can insert patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'reception'));

CREATE POLICY "Reception can update patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'reception'));

-- Auto-generate patient code
CREATE SEQUENCE IF NOT EXISTS public.patient_code_seq START 1000;

CREATE OR REPLACE FUNCTION public.set_patient_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.patient_code IS NULL OR NEW.patient_code = '' THEN
    NEW.patient_code := 'PT-' || to_char(nextval('public.patient_code_seq'), 'FM000000');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_patient_code
  BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_patient_code();

-- Medical records (doctor only)
CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES auth.users(id),
  diagnosis text NOT NULL,
  treatment text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.medical_records TO authenticated;
GRANT ALL ON public.medical_records TO service_role;

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view medical records"
  ON public.medical_records FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can insert medical records"
  ON public.medical_records FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());

-- Waiting queue
CREATE TABLE public.waiting_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting',
  added_by uuid REFERENCES auth.users(id),
  added_at timestamptz NOT NULL DEFAULT now(),
  seen_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.waiting_queue TO authenticated;
GRANT ALL ON public.waiting_queue TO service_role;

ALTER TABLE public.waiting_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view queue"
  ON public.waiting_queue FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'reception') OR public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Reception can add to queue"
  ON public.waiting_queue FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'reception'));

CREATE POLICY "Doctors can update queue"
  ON public.waiting_queue FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'doctor'));

-- Profiles for staff (name + auto-assign role on signup based on metadata)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Handle new user: create profile + assign role from raw_user_meta_data.role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  BEGIN
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'reception');
  EXCEPTION WHEN OTHERS THEN
    _role := 'reception';
  END;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
