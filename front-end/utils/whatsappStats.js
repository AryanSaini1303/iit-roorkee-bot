// Pure helpers: no I/O, so they are easy to test.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
export const MODE_LABELS = { DSA: 'DSA', CWC: 'Guidelines' };

const dayKey = (t) => new Date(t + IST_OFFSET_MS).toISOString().slice(0, 10);
const toMs = (v) => {
  const t = v ? new Date(v).getTime() : NaN;
  return Number.isNaN(t) ? null : t;
};

// One entry per question: { phone, at, category, origin }
function collectQuestions(conversations) {
  const out = [];
  for (const c of conversations) {
    const msgs = Array.isArray(c.messages) ? c.messages : [];
    msgs.forEach((m, i) => {
      if (m?.role !== 'user') return;
      const reply = msgs[i + 1]?.role === 'system' ? msgs[i + 1] : null;
      out.push({
        phone: c.phone_number,
        at: toMs(m.createdAt) ?? toMs(c.updated_at),
        category: reply?.category || null,
        origin: reply?.origin || null,
      });
    });
  }
  return out;
}

export function buildWhatsAppUsers(waUsers, conversations) {
  const questions = collectQuestions(conversations);
  const byPhone = new Map();
  for (const c of conversations) {
    const e = byPhone.get(c.phone_number) || { sessions: 0, last: null };
    e.sessions += 1;
    const t = toMs(c.updated_at);
    if (t && (!e.last || t > e.last)) e.last = t;
    byPhone.set(c.phone_number, e);
  }
  const qCount = new Map();
  for (const q of questions) qCount.set(q.phone, (qCount.get(q.phone) || 0) + 1);

  return waUsers
    .map((u) => {
      const e = byPhone.get(u.phone_number) || { sessions: 0, last: null };
      const mode = u.active_origin || 'DSA';
      return {
        id: u.user_id,
        source: 'whatsapp',
        phone: u.phone_number,
        mode,
        mode_label: MODE_LABELS[mode] || mode,
        questions: qCount.get(u.phone_number) || 0,
        sessions: e.sessions,
        created_at: u.created_at || null,
        last_active: e.last ? new Date(e.last).toISOString() : null,
      };
    })
    .sort((a, b) => (b.last_active || '').localeCompare(a.last_active || ''));
}

export function computeWhatsAppStats(waUsers, conversations, now = Date.now(), days = 14) {
  const questions = collectQuestions(conversations);
  const dayMs = 24 * 60 * 60 * 1000;
  const today = dayKey(now);
  const weekAgo = now - 7 * dayMs;

  const perDay = new Map();
  for (let i = days - 1; i >= 0; i--) perDay.set(dayKey(now - i * dayMs), 0);

  const activePhones = new Set();
  const perUser = new Map();
  const categories = new Map();
  const modes = new Map();
  let questionsToday = 0;
  let questionsWeek = 0;
  let uncategorised = 0;

  for (const q of questions) {
    perUser.set(q.phone, (perUser.get(q.phone) || 0) + 1);
    if (q.at) {
      const k = dayKey(q.at);
      if (perDay.has(k)) perDay.set(k, perDay.get(k) + 1);
      if (k === today) questionsToday++;
      if (q.at >= weekAgo) {
        questionsWeek++;
        activePhones.add(q.phone);
      }
    }
    if (q.category) categories.set(q.category, (categories.get(q.category) || 0) + 1);
    else uncategorised++;
    if (q.origin) modes.set(q.origin, (modes.get(q.origin) || 0) + 1);
  }

  const newUsersWeek = waUsers.filter((u) => {
    const t = toMs(u.created_at);
    return t && t >= weekAgo;
  }).length;

  const totalUsers = waUsers.length;
  const topUsers = [...perUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phone, questions]) => ({ phone, questions }));

  return {
    totals: {
      users: totalUsers,
      activeUsersWeek: activePhones.size,
      newUsersWeek,
      questions: questions.length,
      questionsToday,
      questionsWeek,
      sessions: conversations.length,
      avgQuestionsPerUser: totalUsers ? +(questions.length / totalUsers).toFixed(1) : 0,
    },
    perDay: [...perDay.entries()].map(([date, count]) => ({ date, count })),
    categories: [...categories.entries()]
      .map(([name, num]) => ({ name, num }))
      .sort((a, b) => b.num - a.num),
    uncategorised,
    modes: [...modes.entries()]
      .map(([origin, num]) => ({ origin, label: MODE_LABELS[origin] || origin, num }))
      .sort((a, b) => b.num - a.num),
    currentModes: ['DSA', 'CWC'].map((origin) => ({
      origin,
      label: MODE_LABELS[origin],
      num: waUsers.filter((u) => (u.active_origin || 'DSA') === origin).length,
    })),
    topUsers,
  };
}
