
-- Pairing sessions for QR-code device login
CREATE TABLE public.pairing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'expired')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text,
  access_token text,
  refresh_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

ALTER TABLE public.pairing_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can create a pending session (the desktop creates it before auth)
CREATE POLICY "Anyone can create pairing sessions"
  ON public.pairing_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending' AND user_id IS NULL);

-- Authenticated users can approve their own sessions  
CREATE POLICY "Authenticated users can approve sessions"
  ON public.pairing_sessions FOR UPDATE
  TO authenticated
  USING (status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'approved');

-- Anyone can read sessions by token (for polling)
CREATE POLICY "Anyone can read sessions by token"
  ON public.pairing_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enable realtime for pairing
ALTER PUBLICATION supabase_realtime ADD TABLE public.pairing_sessions;
