import { NextResponse } from 'next/server';
import { PolicyIssue } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { readLocalJson, writeLocalJson } from '@/lib/localStore';
import { getCategoryIllustration } from '@/lib/categoryTheme';
import { errorResponse, requireAdmin, ValidationError } from '@/lib/auth/session';

const LOCAL_FILE = 'issues.json';
const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate', Pragma: 'no-cache' };

interface IssueRow {
  id: string;
  title: string;
  summary: string;
  source_url?: string;
  actor_tags?: string[];
  category?: string;
  status?: 'active' | 'closed';
  total_evaluations?: number;
  image_url?: string;
  criteria_descriptions?: PolicyIssue['criteriaDescriptions'];
  actor_cards?: PolicyIssue['actorCards'];
  created_at?: string;
}

// Convert Supabase row to PolicyIssue
function mapSupabaseIssue(row: IssueRow): PolicyIssue {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    sourceUrl: row.source_url || '',
    actorTags: row.actor_tags || [],
    category: row.category || 'Pendidikan & Kesehatan',
    status: row.status || 'active',
    totalEvaluations: row.total_evaluations || 0,
    imageUrl: row.image_url || '',
    criteriaDescriptions: row.criteria_descriptions || undefined,
    actorCards: row.actor_cards || undefined,
    createdAt: (row.created_at || new Date().toISOString()).split('T')[0],
  };
}

/** Ambil hanya field isu yang boleh diubah admin (whitelist), dalam format kolom Supabase. */
function toSupabaseUpdate(updates: Partial<PolicyIssue>): Partial<IssueRow> {
  const payload: Partial<IssueRow> = {};
  if (updates.title) payload.title = updates.title;
  if (updates.summary) payload.summary = updates.summary;
  if (updates.category) payload.category = updates.category;
  if (updates.sourceUrl !== undefined) payload.source_url = updates.sourceUrl;
  if (updates.actorTags) payload.actor_tags = updates.actorTags;
  if (updates.status === 'active' || updates.status === 'closed') payload.status = updates.status;
  if (updates.totalEvaluations !== undefined) payload.total_evaluations = updates.totalEvaluations;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
  if (updates.criteriaDescriptions) payload.criteria_descriptions = updates.criteriaDescriptions;
  if (updates.actorCards) payload.actor_cards = updates.actorCards;
  return payload;
}

function pickIssueUpdates(body: Record<string, unknown>): Partial<PolicyIssue> {
  const allowed: (keyof PolicyIssue)[] = [
    'title',
    'summary',
    'category',
    'sourceUrl',
    'actorTags',
    'status',
    'totalEvaluations',
    'imageUrl',
    'criteriaDescriptions',
    'actorCards',
  ];
  const updates: Partial<PolicyIssue> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) (updates as Record<string, unknown>)[key] = body[key];
  }
  return updates;
}

// GET: Retrieve all policy issues (publik)
export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseClient()
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json((data || []).map(mapSupabaseIssue), { headers: NO_STORE });
    }

    return NextResponse.json(await readLocalJson<PolicyIssue>(LOCAL_FILE), { headers: NO_STORE });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal membaca daftar isu');
  }
}

// POST: Create and publish a new policy issue (admin)
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (!body.title?.trim() || !body.summary?.trim()) {
      throw new ValidationError('Judul dan ringkasan wajib diisi');
    }

    const actorTags: string[] = Array.isArray(body.actorTags)
      ? body.actorTags
      : typeof body.actorTags === 'string'
        ? body.actorTags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : ['Pemerintah', 'Masyarakat'];

    const newIssue: PolicyIssue = {
      id: `issue-${Date.now()}`,
      title: body.title.trim(),
      summary: body.summary.trim(),
      sourceUrl: body.sourceUrl?.trim() || '',
      actorTags: actorTags.length > 0 ? actorTags : ['Pemerintah', 'Publik'],
      category: body.category?.trim() || 'Pendidikan & Kesehatan',
      status: body.status === 'closed' ? 'closed' : 'active',
      createdAt: new Date().toISOString().split('T')[0],
      totalEvaluations: 0,
      imageUrl: body.imageUrl?.trim() || getCategoryIllustration(body.category),
      criteriaDescriptions: body.criteriaDescriptions || undefined,
      actorCards: Array.isArray(body.actorCards) ? body.actorCards : undefined,
    };

    if (isSupabaseConfigured()) {
      const { error } = await getSupabaseClient()
        .from('issues')
        .insert({ id: newIssue.id, ...toSupabaseUpdate(newIssue), total_evaluations: 0 });
      if (error) throw error;
    } else {
      const issues = await readLocalJson<PolicyIssue>(LOCAL_FILE);
      await writeLocalJson(LOCAL_FILE, [newIssue, ...issues]);
    }

    return NextResponse.json({ success: true, issue: newIssue }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal membuat isu');
  }
}

// PUT: Update an issue (admin)
export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) throw new ValidationError('Issue ID wajib disertakan');

    const updates = pickIssueUpdates(body);

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseClient()
        .from('issues')
        .update(toSupabaseUpdate(updates))
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Isu tidak ditemukan' }, { status: 404 });
      return NextResponse.json({ success: true, issue: mapSupabaseIssue(data) });
    }

    const issues = await readLocalJson<PolicyIssue>(LOCAL_FILE);
    const index = issues.findIndex((i) => i.id === id);
    if (index === -1) return NextResponse.json({ error: 'Isu tidak ditemukan' }, { status: 404 });

    const updatedIssue: PolicyIssue = { ...issues[index], ...updates, id, createdAt: issues[index].createdAt };
    issues[index] = updatedIssue;
    await writeLocalJson(LOCAL_FILE, issues);

    return NextResponse.json({ success: true, issue: updatedIssue });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal memperbarui isu');
  }
}

// DELETE: Delete an issue (admin)
export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body?.id;
    }
    if (!id) throw new ValidationError('Issue ID wajib disertakan');

    if (isSupabaseConfigured()) {
      const { error } = await getSupabaseClient().from('issues').delete().eq('id', id);
      if (error) throw error;
    } else {
      const issues = await readLocalJson<PolicyIssue>(LOCAL_FILE);
      await writeLocalJson(
        LOCAL_FILE,
        issues.filter((i) => i.id !== id)
      );
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    return errorResponse(error, 'Gagal menghapus isu');
  }
}
