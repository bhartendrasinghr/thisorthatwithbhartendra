import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import seedData from '@/../data/tasks_seed.json';

const PRODUCTS = [
  { product_id: 'MOFIRST', name: 'MO First', tagline: 'Franchisee operating platform', lead: 'Bhartendra Singh', team: 'Product', color: '#1A1F6B' },
  { product_id: 'ADVPRO',  name: 'Advisory Pro', tagline: 'Advisor Platform', lead: 'Bhartendra Singh', team: 'Product', color: '#D4A93A' },
  { product_id: 'RIISE',   name: 'RIISE', tagline: 'RIISE web and app', lead: 'Raghava', team: 'Product', color: '#7C4DFF' },
  { product_id: 'ZOHO',    name: 'Zoho', tagline: 'New CRM', lead: 'Vishal', team: 'Product', color: '#00897B' },
  { product_id: 'EKYC',    name: 'KYC journey', tagline: 'eKYC Journey', lead: 'Vipul', team: 'Product', color: '#5E35B1' },
  { product_id: 'SAATHI',  name: 'Saathi', tagline: 'Old CRM', lead: 'Bhartendra Singh', team: 'Product', color: '#546E7A' },
  { product_id: 'COREIT',  name: 'IT Ops', tagline: 'Core IT Development', lead: 'Subhash', team: 'IT', color: '#37474F' },
];
const OWNERS = [
  { owner_name: 'Bhartendra Singh', initials: 'BS', team: 'Product' },
  { owner_name: 'Raghava', initials: 'RG', team: 'Product' },
  { owner_name: 'Subhash', initials: 'SB', team: 'IT' },
  { owner_name: 'Nayana',  initials: 'NY', team: 'Ops' },
  { owner_name: 'Ashish',  initials: 'AS', team: 'Business' },
  { owner_name: 'Vipul',   initials: 'VN', team: 'Product' },
  { owner_name: 'Vishal',  initials: 'VS', team: 'Product' },
];
const SOURCES = [
  { source_name: 'Kapil_Franchisee', description: 'Franchisee feedback (Kapil sir review)' },
  { source_name: 'Ops',              description: "Nayana's requirements" },
  { source_name: 'Business team',    description: 'Requests from business stakeholders' },
  { source_name: 'Compliance',       description: 'Items flagged by compliance / audit' },
  { source_name: 'Product',          description: 'Issues raised by field RMs and franchise partners' },
  { source_name: 'Leadership',       description: 'Business leadership asks' },
];

export async function POST() {
  // Create tables
  await sql`CREATE TABLE IF NOT EXISTS products (
    product_id TEXT PRIMARY KEY, name TEXT NOT NULL, tagline TEXT, lead TEXT, team TEXT, color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`;
  await sql`CREATE TABLE IF NOT EXISTS owners (
    owner_name TEXT PRIMARY KEY, initials TEXT, email TEXT, team TEXT
  );`;
  await sql`CREATE TABLE IF NOT EXISTS sources (
    source_name TEXT PRIMARY KEY, description TEXT
  );`;
  await sql`CREATE TABLE IF NOT EXISTS tasks (
    task_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
    priority TEXT NOT NULL CHECK (priority IN ('P0','P1','P2','P3')),
    status TEXT NOT NULL CHECK (status IN ('Not Started','In Progress','Blocked','UAT','Live')),
    size TEXT,
    owner_name TEXT REFERENCES owners(owner_name) ON DELETE SET NULL,
    source_name TEXT REFERENCES sources(source_name) ON DELETE SET NULL,
    target_date DATE,
    target_date_raw TEXT,
    dependency TEXT,
    blockers TEXT,
    update_note TEXT,
    tags TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`;
  await sql`CREATE TABLE IF NOT EXISTS task_history (
    id SERIAL PRIMARY KEY, task_id TEXT NOT NULL, field TEXT NOT NULL,
    old_value TEXT, new_value TEXT, changed_at TIMESTAMPTZ DEFAULT NOW()
  );`;

  for (const p of PRODUCTS) {
    await sql`INSERT INTO products (product_id, name, tagline, lead, team, color)
      VALUES (${p.product_id}, ${p.name}, ${p.tagline}, ${p.lead}, ${p.team}, ${p.color})
      ON CONFLICT (product_id) DO UPDATE SET name=EXCLUDED.name, tagline=EXCLUDED.tagline,
      lead=EXCLUDED.lead, team=EXCLUDED.team, color=EXCLUDED.color;`;
  }
  for (const o of OWNERS) {
    await sql`INSERT INTO owners (owner_name, initials, team)
      VALUES (${o.owner_name}, ${o.initials}, ${o.team})
      ON CONFLICT (owner_name) DO UPDATE SET initials=EXCLUDED.initials, team=EXCLUDED.team;`;
  }
  for (const s of SOURCES) {
    await sql`INSERT INTO sources (source_name, description)
      VALUES (${s.source_name}, ${s.description})
      ON CONFLICT (source_name) DO UPDATE SET description=EXCLUDED.description;`;
  }

  const { tasks } = seedData as any;
  let inserted = 0;
  for (const t of tasks) {
    await sql`INSERT INTO tasks (
      task_id, title, product_id, priority, status, size, owner_name, source_name,
      target_date, target_date_raw, dependency, blockers, update_note, tags, description
    ) VALUES (
      ${t.task_id}, ${t.title}, ${t.product_id}, ${t.priority}, ${t.status}, ${t.size},
      ${t.owner_name}, ${t.source_name}, ${t.target_date}, ${t.target_date_raw},
      ${t.dependency}, ${t.blockers}, ${t.update_note}, ${t.tags}, ${t.description}
    ) ON CONFLICT (task_id) DO NOTHING;`;
    inserted++;
  }

  return NextResponse.json({
    ok: true,
    products: PRODUCTS.length,
    owners: OWNERS.length,
    sources: SOURCES.length,
    tasks: inserted,
  });
}
