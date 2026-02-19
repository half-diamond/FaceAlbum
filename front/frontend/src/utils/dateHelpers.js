// helpers to group photos by date header
export function dateKeyISO(dateStr) {
  const d = new Date(dateStr);
  return d.toISOString().slice(0,10); // YYYY-MM-DD
}

export function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function isYesterday(date) {
  const d = new Date(date);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toDateString() === y.toDateString();
}

export function formatDateHeader(dateStr) {
  const d = new Date(dateStr);
  if (isToday(dateStr)) return "Today";
  if (isYesterday(dateStr)) return "Yesterday";
  // else: show pretty month+year or day-month
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function groupByDateHeader(items) {
  // items: [{id, filename, uploaded_at}, ...] sorted newest->oldest
  const groups = [];
  const map = new Map();

  for (const it of items) {
    const key = dateKeyISO(it.uploaded_at);
    if (!map.has(key)) {
      const label = formatDateHeader(it.uploaded_at);
      map.set(key, { dateKey: key, label, items: [] });
      groups.push(map.get(key));
    }
    map.get(key).items.push(it);
  }
  return groups;
}
