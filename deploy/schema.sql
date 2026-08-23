-- Das eine Tabellchen, um das sich alles dreht.
--
-- Vier Dienste lesen es: api-rust (Liste), api-cpp (Zaehlwerk),
-- api-python (Bericht) und worker-ts (schreibt). Es liegt deshalb hier
-- und nicht bei einem von ihnen — sonst gaebe es vier Wahrheiten
-- darueber, wie es aussieht.
create table if not exists items (
    id   bigserial primary key,
    name text        not null,
    -- Ohne Zeitstempel ist "die letzten zehn" nicht beantwortbar, und
    -- die id ist dafuer keine Auskunft: sie sagt die Reihenfolge des
    -- Einfuegens, nicht wann.
    angelegt_am timestamptz not null default now()
);

insert into items (name) values ('erster Eintrag'), ('zweiter Eintrag')
on conflict do nothing;
