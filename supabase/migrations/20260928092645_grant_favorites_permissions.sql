GRANT SELECT, INSERT, DELETE ON public.favorites TO anon;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.favorites_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.favorites_id_seq TO authenticated;