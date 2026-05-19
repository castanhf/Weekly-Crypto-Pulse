const normalizeHeadline = (headline: string): string =>
  headline.toLowerCase().replace(/\s+/g, ' ').trim();

export const isStuckLoop = (
  currentHeadline: string,
  previousHeadline: string,
  currentFailedCheckIds: ReadonlyArray<string>,
  previousFailedCheckIds: ReadonlyArray<string>
): boolean => {
  if (currentFailedCheckIds.length === 0) return false;

  const headlineMatch = normalizeHeadline(currentHeadline) === normalizeHeadline(previousHeadline);

  const sameChecks =
    currentFailedCheckIds.length === previousFailedCheckIds.length &&
    currentFailedCheckIds.every((id) => previousFailedCheckIds.includes(id));

  return headlineMatch && sameChecks;
};
