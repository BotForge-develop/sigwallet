ALTER TABLE public.pairing_sessions 
ADD COLUMN pairing_code TEXT DEFAULT lpad(floor(random() * 1000000)::text, 6, '0');