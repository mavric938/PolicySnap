import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { PolicyIssue } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'issues.json');

// Helper to safely read local issues
async function getStoredIssues(): Promise<PolicyIssue[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper to safely write local issues
async function saveIssues(issues: PolicyIssue[]): Promise<void> {
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(issues, null, 2), 'utf-8');
}

// Convert Supabase row to PolicyIssue
function mapSupabaseIssue(row: any): PolicyIssue {
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
    createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

// GET: Retrieve all policy issues
export async function GET() {
  try {
    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('issues')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && Array.isArray(data) && data.length > 0) {
            const mapped = data.map(mapSupabaseIssue);
            return NextResponse.json(mapped, {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache',
              },
            });
          }
        } catch (supabaseErr) {
          console.warn('Supabase issues query failed, falling back to local file:', supabaseErr);
        }
      }
    }

    // 2. Local fallback
    const issues = await getStoredIssues();
    return NextResponse.json(issues, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Failed to read issues' }, { status: 500 });
  }
}

// POST: Create and publish a new policy issue
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.summary) {
      return NextResponse.json({ error: 'Judul dan ringkasan wajib diisi' }, { status: 400 });
    }

    const actorTags = Array.isArray(body.actorTags)
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
      imageUrl: body.imageUrl?.trim() || '',
      criteriaDescriptions: body.criteriaDescriptions || undefined,
      actorCards: Array.isArray(body.actorCards) ? body.actorCards : undefined,
    };

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('issues').insert({
            id: newIssue.id,
            title: newIssue.title,
            summary: newIssue.summary,
            category: newIssue.category,
            source_url: newIssue.sourceUrl,
            actor_tags: newIssue.actorTags,
            status: newIssue.status,
            total_evaluations: 0,
            image_url: newIssue.imageUrl,
            criteria_descriptions: newIssue.criteriaDescriptions,
            actor_cards: newIssue.actorCards,
          });
        } catch (supaErr) {
          console.warn('Supabase issue insert warning:', supaErr);
        }
      }
    }

    // 2. Always sync local file backup
    const issues = await getStoredIssues();
    const updatedIssues = [newIssue, ...issues];
    await saveIssues(updatedIssues);

    return NextResponse.json({ success: true, issue: newIssue }, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}

// PUT: Update an issue
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Issue ID wajib disertakan' }, { status: 400 });
    }

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const supabasePayload: any = {};
          if (updates.title) supabasePayload.title = updates.title;
          if (updates.summary) supabasePayload.summary = updates.summary;
          if (updates.category) supabasePayload.category = updates.category;
          if (updates.sourceUrl !== undefined) supabasePayload.source_url = updates.sourceUrl;
          if (updates.actorTags) supabasePayload.actor_tags = updates.actorTags;
          if (updates.status) supabasePayload.status = updates.status;
          if (updates.totalEvaluations !== undefined) supabasePayload.total_evaluations = updates.totalEvaluations;
          if (updates.criteriaDescriptions) supabasePayload.criteria_descriptions = updates.criteriaDescriptions;
          if (updates.actorCards) supabasePayload.actor_cards = updates.actorCards;

          await supabase.from('issues').update(supabasePayload).eq('id', id);
        } catch (supaErr) {
          console.warn('Supabase update issue warning:', supaErr);
        }
      }
    }

    // 2. Sync local file
    const issues = await getStoredIssues();
    const index = issues.findIndex((i) => i.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Isu tidak ditemukan di file lokal' }, { status: 404 });
    }

    const current = issues[index];
    const updatedIssue: PolicyIssue = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
    };

    issues[index] = updatedIssue;
    await saveIssues(issues);

    return NextResponse.json({ success: true, issue: updatedIssue });
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
  }
}

// DELETE: Delete an issue
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'Issue ID wajib disertakan' }, { status: 400 });
    }

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('issues').delete().eq('id', id);
        } catch (supaErr) {
          console.warn('Supabase delete issue warning:', supaErr);
        }
      }
    }

    // 2. Sync local file
    const issues = await getStoredIssues();
    const filteredIssues = issues.filter((i) => i.id !== id);
    await saveIssues(filteredIssues);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return NextResponse.json({ error: 'Failed to delete issue' }, { status: 500 });
  }
}
