BEGIN;

-- Tabela de resumo mensal de métricas de afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_metrics_monthly (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  posts_total integer NOT NULL DEFAULT 0,
  posts_vendas integer NOT NULL DEFAULT 0,
  posts_atencao integer NOT NULL DEFAULT 0,
  nao_postou integer NOT NULL DEFAULT 0,
  pontos_total integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_metrics_monthly_unique'
  ) THEN
    ALTER TABLE public.affiliate_metrics_monthly
      ADD CONSTRAINT affiliate_metrics_monthly_unique UNIQUE (affiliate_id, year, month);
  END IF;
END $$;

ALTER TABLE public.affiliate_metrics_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "read own affiliate metrics monthly" ON public.affiliate_metrics_monthly
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_metrics_monthly.affiliate_id
        AND a.owner_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "insert own affiliate metrics monthly" ON public.affiliate_metrics_monthly
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_metrics_monthly.affiliate_id
        AND a.owner_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "update own affiliate metrics monthly" ON public.affiliate_metrics_monthly
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_metrics_monthly.affiliate_id
        AND a.owner_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "delete own affiliate metrics monthly" ON public.affiliate_metrics_monthly
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_metrics_monthly.affiliate_id
        AND a.owner_user_id = auth.uid()
    )
  );

-- Índice para buscas por afiliado e período
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_affiliate_metrics_monthly_affiliate_period'
  ) THEN
    CREATE INDEX idx_affiliate_metrics_monthly_affiliate_period
      ON public.affiliate_metrics_monthly(affiliate_id, year, month);
  END IF;
END $$;

-- Função de arquivamento: gera resumo mensal e apaga dados diários antigos
CREATE OR REPLACE FUNCTION public.archive_old_affiliate_metrics(months_to_keep integer DEFAULT 24)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  cutoff_month date := date_trunc('month', (now() - (interval '1 month' * months_to_keep))::date);
  archive_month date;
BEGIN
  -- Para cada mês totalmente anterior ao cutoff
  FOR archive_month IN
    SELECT DISTINCT date_trunc('month', date)::date
    FROM public.affiliate_metrics
    WHERE date < cutoff_month
  LOOP
    -- Agrega métricas desse mês por afiliado
    INSERT INTO public.affiliate_metrics_monthly (
      affiliate_id,
      year,
      month,
      posts_total,
      posts_vendas,
      posts_atencao,
      nao_postou,
      pontos_total
    )
    SELECT
      affiliate_id,
      EXTRACT(YEAR FROM date)::int AS year,
      EXTRACT(MONTH FROM date)::int AS month,
      COUNT(*) FILTER (WHERE status IN ('postou', 'postou_vendas')) AS posts_total,
      COUNT(*) FILTER (WHERE status = 'postou_vendas') AS posts_vendas,
      COUNT(*) FILTER (WHERE status = 'postou') AS posts_atencao,
      COUNT(*) FILTER (WHERE status = 'nao_postou') AS nao_postou,
      COALESCE(SUM(points), 0) AS pontos_total
    FROM public.affiliate_metrics
    WHERE date >= date_trunc('month', archive_month)::date
      AND date < (date_trunc('month', archive_month) + interval '1 month')::date
    GROUP BY affiliate_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
    ON CONFLICT (affiliate_id, year, month) DO UPDATE
      SET posts_total = EXCLUDED.posts_total,
          posts_vendas = EXCLUDED.posts_vendas,
          posts_atencao = EXCLUDED.posts_atencao,
          nao_postou = EXCLUDED.nao_postou,
          pontos_total = EXCLUDED.pontos_total;

    -- Remove linhas diárias já arquivadas
    DELETE FROM public.affiliate_metrics
    WHERE date >= date_trunc('month', archive_month)::date
      AND date < (date_trunc('month', archive_month) + interval '1 month')::date;
  END LOOP;
END;
$$;

-- Agenda diária para arquivar dados com mais de 24 meses, se pg_cron/cron estiver disponível
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    PERFORM cron.schedule(
      'archive_old_affiliate_metrics_daily',
      '0 3 * * *',
      $$SELECT public.archive_old_affiliate_metrics(24);$$
    );
  END IF;
END;
$$;

COMMIT;

