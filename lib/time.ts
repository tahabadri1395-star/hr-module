const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function getISTDateTime(date: Date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    date: ist.toISOString().slice(0, 10),
    time: ist.toISOString().slice(11, 16),
    month: ist.toISOString().slice(0, 7),
  };
}
