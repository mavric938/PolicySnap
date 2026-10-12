import { PolicyIssue } from '@/types';
import { MOCK_ISSUES } from '@/data/mock';

const CACHE_KEY = 'policysnap_issues_cache';

/**
 * Fetch all issues from the server API, with offline localStorage fallback
 */
export async function getIssues(): Promise<PolicyIssue[]> {
  try {
    const res = await fetch('/api/issues', {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      },
    });

    if (res.ok) {
      const data: PolicyIssue[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
        return data;
      }
    }
  } catch (err) {
    console.warn('API fetch failed, checking local cache:', err);
  }

  // Fallback to local storage if available
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }

  // Fallback to initial mock data
  return MOCK_ISSUES;
}

/**
 * Get single issue by ID
 */
export async function getIssueById(id: string): Promise<PolicyIssue | undefined> {
  const issues = await getIssues();
  return issues.find((i) => i.id === id) || issues[0];
}

/**
 * Create a new issue via API
 */
export async function createIssue(data: {
  title: string;
  summary: string;
  sourceUrl?: string;
  actorTags: string[] | string;
  category?: string;
  status?: 'active' | 'closed';
  criteriaDescriptions?: import('@/types').CriteriaDescriptions;
  actorCards?: import('@/types').ActorCard[];
}): Promise<{ success: boolean; issue?: PolicyIssue; error?: string }> {
  try {
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Gagal menambahkan isu' };
    }

    // Refresh cache
    if (typeof window !== 'undefined' && result.issue) {
      try {
        const currentCache = localStorage.getItem(CACHE_KEY);
        const list: PolicyIssue[] = currentCache ? JSON.parse(currentCache) : [];
        const nextList = [result.issue, ...list.filter((i: PolicyIssue) => i.id !== result.issue.id)];
        localStorage.setItem(CACHE_KEY, JSON.stringify(nextList));
      } catch {
        // ignore
      }
    }

    return { success: true, issue: result.issue };
  } catch (err) {
    console.error('Error creating issue:', err);
    return { success: false, error: 'Koneksi ke server gagal' };
  }
}

/**
 * Toggle active / closed status of an issue
 */
export async function toggleIssueStatus(
  id: string,
  newStatus: 'active' | 'closed'
): Promise<{ success: boolean; issue?: PolicyIssue; error?: string }> {
  try {
    const res = await fetch('/api/issues', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Gagal mengubah status' };
    }

    return { success: true, issue: result.issue };
  } catch (err) {
    console.error('Error toggling status:', err);
    return { success: false, error: 'Koneksi ke server gagal' };
  }
}

/**
 * Update an existing issue
 */
export async function updateIssue(
  id: string,
  updates: Partial<PolicyIssue>
): Promise<{ success: boolean; issue?: PolicyIssue; error?: string }> {
  try {
    const res = await fetch('/api/issues', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Gagal memperbarui isu' };
    }

    if (typeof window !== 'undefined' && result.issue) {
      const currentCache = localStorage.getItem(CACHE_KEY);
      if (currentCache) {
        try {
          const list: PolicyIssue[] = JSON.parse(currentCache);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify(list.map((i) => (i.id === id ? result.issue : i)))
          );
        } catch {
          // ignore
        }
      }
    }

    return { success: true, issue: result.issue };
  } catch (err) {
    console.error('Error updating issue:', err);
    return { success: false, error: 'Koneksi ke server gagal' };
  }
}

/**
 * Check backend AI configuration status
 */
export async function getAIBackendStatus(): Promise<{
  configured: boolean;
  activeProvider: string;
  activeModel: string;
  deepseekConfigured: boolean;
}> {
  try {
    const res = await fetch('/api/ai/extract-issue', { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch AI backend status:', err);
  }
  return {
    configured: false,
    activeProvider: 'heuristic',
    activeModel: 'Metadata Parser',
    deepseekConfigured: false,
  };
}

/**
 * Extract policy issue details automatically from a news URL via AI
 */
export async function extractIssueFromUrl(params: {
  url: string;
  apiKey?: string;
  provider?: string;
}): Promise<{
  success: boolean;
  data?: {
    title: string;
    category: string;
    summary: string;
    actorTags: string[];
    criteriaDescriptions: import('@/types').CriteriaDescriptions;
    actorCards: import('@/types').ActorCard[];
  };
  method?: string;
  model?: string;
  hasApiKey?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/ai/extract-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Gagal mengekstrak berita' };
    }

    return result;
  } catch (err) {
    console.error('Error extracting from URL:', err);
    return { success: false, error: 'Koneksi ke layanan ekstraksi gagal' };
  }
}

/**
 * Delete an issue by ID
 */
export async function deleteIssue(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/issues?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Gagal menghapus isu' };
    }

    if (typeof window !== 'undefined') {
      try {
        const currentCache = localStorage.getItem(CACHE_KEY);
        if (currentCache) {
          const list: PolicyIssue[] = JSON.parse(currentCache);
          localStorage.setItem(CACHE_KEY, JSON.stringify(list.filter((i: PolicyIssue) => i.id !== id)));
        }
      } catch {
        // ignore
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Error deleting issue:', err);
    return { success: false, error: 'Koneksi ke server gagal' };
  }
}

