-- Allow UPDATE on public_netdisk (needed for upsert / overwrite)
DROP POLICY IF EXISTS "public_netdisk_update" ON storage.objects;

CREATE POLICY "public_netdisk_update"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'public_netdisk')
WITH CHECK (bucket_id = 'public_netdisk');

-- Allow DELETE on public_netdisk
DROP POLICY IF EXISTS "public_netdisk_delete" ON storage.objects;

CREATE POLICY "public_netdisk_delete"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'public_netdisk');