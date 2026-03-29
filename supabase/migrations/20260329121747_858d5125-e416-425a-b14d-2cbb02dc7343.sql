CREATE TABLE public.wallet_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coin text NOT NULL,
  address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, coin)
);

ALTER TABLE public.wallet_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wallet addresses"
ON public.wallet_addresses FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert own addresses"
ON public.wallet_addresses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
ON public.wallet_addresses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);