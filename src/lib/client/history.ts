// localStorage-based history management for static site

export interface HistoryEntry {
  id: string;
  fileName: string;
  processedAt: string;
  status: string;
  channelCount: number;
  sampleRate: number;
  sampleCount: number;
  targetHand: string | null;
  exportLeRobot: boolean;
}

const STORAGE_KEY = 'tlabel_processing_history';
const MAX_ENTRIES = 100;

export function getHistory(): { history: HistoryEntry[]; total: number } {
  if (typeof window === 'undefined') {
    return { history: [], total: 0 };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { history: [], total: 0 };
    }
    const history: HistoryEntry[] = JSON.parse(stored);
    return {
      history: history.sort((a, b) =>
        new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
      ),
      total: history.length,
    };
  } catch {
    return { history: [], total: 0 };
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'processedAt'>): HistoryEntry {
  const newEntry: HistoryEntry = {
    ...entry,
    id: `proc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    processedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') {
    return newEntry;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const history: HistoryEntry[] = stored ? JSON.parse(stored) : [];

    history.push(newEntry);

    // 限制历史记录数量
    if (history.length > MAX_ENTRIES) {
      history.splice(0, history.length - MAX_ENTRIES);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage 不可用或已满
  }

  return newEntry;
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
