-- =============================================================================
-- Export COMPLET du schéma public — toutes les tables
-- Supabase → SQL Editor → Run → copier TOUT le résultat et coller au chat
-- =============================================================================

-- A) TOUTES LES COLONNES (1 ligne = 1 colonne) — le plus utile à coller
select
  c.table_name,
  c.ordinal_position as pos,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
order by c.table_name, c.ordinal_position;

-- B) Liste des tables + nombre de colonnes
select
  t.table_name,
  count(c.column_name) as nb_colonnes
from information_schema.tables t
left join information_schema.columns c
  on c.table_schema = t.table_schema
  and c.table_name = t.table_name
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
group by t.table_name
order by t.table_name;

-- C) Toutes les clés étrangères
select
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name as to_table,
  ccu.column_name as to_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
order by tc.table_name, kcu.column_name;

-- D) Toutes les contraintes PRIMARY KEY / UNIQUE
select
  tc.table_name,
  tc.constraint_type,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ' order by kcu.ordinal_position) as columns
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
where tc.table_schema = 'public'
  and tc.constraint_type in ('PRIMARY KEY', 'UNIQUE')
group by tc.table_name, tc.constraint_type, tc.constraint_name
order by tc.table_name, tc.constraint_type;

-- E) RLS : activé ou non sur chaque table
select
  c.relname as table_name,
  case c.relrowsecurity when true then 'RLS ON' else 'RLS OFF' end as rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- F) Toutes les policies RLS
select
  tablename as table_name,
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- G) Index (hors PK auto)
select
  t.relname as table_name,
  i.relname as index_name,
  pg_get_indexdef(ix.indexrelid) as index_definition
from pg_class t
join pg_index ix on t.oid = ix.indrelid
join pg_class i on i.oid = ix.indexrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relkind = 'r'
  and not ix.indisprimary
order by t.relname, i.relname;

-- H) Contraintes CHECK
select
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
from information_schema.table_constraints tc
join information_schema.check_constraints cc
  on tc.constraint_name = cc.constraint_name
  and tc.constraint_schema = cc.constraint_schema
where tc.table_schema = 'public'
  and tc.constraint_type = 'CHECK'
order by tc.table_name, tc.constraint_name;

-- I) Comptage lignes par table (aperçu données)
select
  relname as table_name,
  n_live_tup as approx_row_count
from pg_stat_user_tables
where schemaname = 'public'
order by relname;
