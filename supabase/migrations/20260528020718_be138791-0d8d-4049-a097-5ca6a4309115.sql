
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_course_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  section TEXT,
  owner_user_id UUID NOT NULL,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.class_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  google_user_id TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, user_id)
);

CREATE INDEX idx_class_members_class ON public.class_members(class_id);
CREATE INDEX idx_class_members_user ON public.class_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_members TO authenticated;
GRANT ALL ON public.class_members TO service_role;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_class_member(_class_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.class_members WHERE class_id = _class_id AND user_id = _user_id)
$$;

CREATE POLICY "Members or owner can view class"
ON public.classes FOR SELECT TO authenticated
USING (auth.uid() = owner_user_id OR public.is_class_member(id, auth.uid()));

CREATE POLICY "Authenticated can create class"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owner can update class"
ON public.classes FOR UPDATE TO authenticated
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owner can delete class"
ON public.classes FOR DELETE TO authenticated
USING (auth.uid() = owner_user_id);

CREATE POLICY "Members or owner can view members"
ON public.class_members FOR SELECT TO authenticated
USING (
  public.is_class_member(class_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.owner_user_id = auth.uid())
);

CREATE POLICY "Owner can add members"
ON public.class_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.owner_user_id = auth.uid())
  OR auth.uid() = user_id
);

CREATE POLICY "Owner or self can remove members"
ON public.class_members FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.owner_user_id = auth.uid())
);

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
