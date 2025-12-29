-- Migration to remove Google Sheets dependency and add Supabase tables for Affiliates

BEGIN;

-- Affiliates Table
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  name text NOT NULL,
  instagram text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliates" ON public.affiliates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own affiliates" ON public.affiliates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own affiliates" ON public.affiliates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own affiliates" ON public.affiliates
  FOR DELETE USING (user_id = auth.uid());

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(affiliate_id, date)
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliates events" ON public.calendar_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = calendar_events.affiliate_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own affiliates events" ON public.calendar_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = calendar_events.affiliate_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own affiliates events" ON public.calendar_events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = calendar_events.affiliate_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own affiliates events" ON public.calendar_events
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = calendar_events.affiliate_id AND user_id = auth.uid())
  );

-- Affiliate Achievements Table
CREATE TABLE IF NOT EXISTS public.affiliate_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  achievement_id text NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(affiliate_id, achievement_id)
);

ALTER TABLE public.affiliate_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliates achievements" ON public.affiliate_achievements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_achievements.affiliate_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own affiliates achievements" ON public.affiliate_achievements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_achievements.affiliate_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own affiliates achievements" ON public.affiliate_achievements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_achievements.affiliate_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own affiliates achievements" ON public.affiliate_achievements
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_achievements.affiliate_id AND user_id = auth.uid())
  );

COMMIT;
