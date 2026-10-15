-- Keep sealed capsule files sealed. Run once in the Supabase SQL editor.
-- Capsule files live at {space_id}/capsules/{capsule_id}/{file}; they can only be read
-- once the capsule has opened and the reader is a recipient (authors can always read their own).

create or replace function can_read_capsule_file(p_name text)
returns boolean
language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from capsules c
    where c.id::text = (storage.foldername(p_name))[3]
      and c.space_id::text = (storage.foldername(p_name))[1]
      and is_member(c.space_id)
      and (
        c.author_id = auth.uid()   -- authors may always read what they sealed (needed to delete files)
        or (c.opens_at <= now() and (c.to_user is null or c.to_user = auth.uid()))
      )
  );
$$;

drop policy if exists "members read photos" on storage.objects;
create policy "members read photos" on storage.objects for select
  using (
    bucket_id = 'photos'
    and is_member(((storage.foldername(name))[1])::uuid)
    and ((storage.foldername(name))[2] is distinct from 'capsules' or can_read_capsule_file(name))
  );
