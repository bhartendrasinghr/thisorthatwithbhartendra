import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sql } from '@/lib/db';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Mode = 'triage' | 'leadership_update' | 'task_summary';

export async function POST(req: Request) {
  const { mode, task_id, filters } = await req.json() as {
    mode: Mode;
    task_id?: string;
    filters?: { priority?: string[]; status?: string[]; product_id?: string[] };
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set on server' }, { status: 500 });
  }

  // Fetch context from DB
  const where: string[] = [];
  if (filters?.status?.length) where.push(`status = ANY(ARRAY['${filters.status.join("','")}'])`);
  if (filters?.priority?.length) where.push(`priority = ANY(ARRAY['${filters.priority.join("','")}'])`);
  if (filters?.product_id?.length) where.push(`product_id = ANY(ARRAY['${filters.product_id.join("','")}'])`);

  let context = '';
  if (mode === 'task_summary' && task_id) {
    const { rows } = await sql`
      SELECT t.*, p.name AS product_name FROM tasks t
      LEFT JOIN products p ON t.product_id = p.product_id
      WHERE t.task_id = ${task_id};
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    context = JSON.stringify(rows[0], null, 2);
  } else {
    // For triage / leadership: pull all open tasks with product context
    const { rows } = await sql`
      SELECT t.task_id, t.title, t.priority, t.status, t.owner_name, t.source_name,
             t.target_date, t.target_date_raw, t.update_note, t.blockers,
             p.name AS product_name
      FROM tasks t
      LEFT JOIN products p ON t.product_id = p.product_id
      WHERE t.status != 'Live'
      ORDER BY
        CASE t.priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
        t.task_id;
    `;
    context = JSON.stringify(rows, null, 2);
  }

  let systemPrompt = '';
  let userPrompt = '';

  if (mode === 'triage') {
    systemPrompt = `You are a senior product operations analyst at Motilal Oswal Financial Services. You help Bhartendra Singh (Senior PM, MO First) triage open work items and surface what genuinely needs attention this week. You are direct, practical, and never pad. You write like a sharp colleague who has read everything.`;
    userPrompt = `Here are the open tasks (status != Live):\n\n${context}\n\nGive me:\n\n**1. Top 3 items to push this week** — pick based on staleness, P0 status, blockers, or upcoming target dates. For each: task_id, why it matters, what action to take next.\n\n**2. Items that look stuck** — anything where the update_note suggests it's been waiting on something external (business team, compliance, leadership decision, etc). List them with what they're waiting on.\n\n**3. Quick wins** — items that look small / close to done. Worth knocking out to clear the board.\n\nKeep it tight. No headers besides what I gave you. Use markdown bullets.`;
  } else if (mode === 'leadership_update') {
    systemPrompt = `You are drafting a short, professionally-measured update from Bhartendra Singh (Senior PM, MO First) to leadership (Sehul sir, Vipul sir) at Motilal Oswal Financial Services. The tone is warm but factual, outcome-focused. No filler. No "I'm pleased to share". Read like a competent operator giving the actual state.`;
    userPrompt = `Open tasks across the portfolio:\n\n${context}\n\nDraft a leadership update covering:\n\n- **Headline state**: 1 sentence on overall portfolio health\n- **What shipped recently**: any 'Live' items (if mentioned in context as recently moved — otherwise skip)\n- **In motion**: 3-5 most important items currently progressing, with target dates if known\n- **Asks**: anything explicitly needing leadership input (look for blocked items or 'To Be Discussed' update_notes)\n- **Risks**: any P0 items without target dates, or items the notes suggest are stuck\n\nKeep to roughly 200-300 words. Use bold sparingly. No emoji.`;
  } else if (mode === 'task_summary') {
    systemPrompt = `You are a senior product analyst. You summarise a single work item in 2-3 sentences for a leader who hasn't seen it before. Be specific, factual. Capture what it is, where it stands, what's needed next.`;
    userPrompt = `Task:\n\n${context}\n\nWrite a 2-3 sentence executive summary. Then 1-2 bullets on what action could move it forward.`;
  } else {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('\n');

    return NextResponse.json({ output: text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'AI call failed' }, { status: 500 });
  }
}
