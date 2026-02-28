export type Report = {
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
};

export const reports: ReadonlyArray<Report> = [
  {
    slug: 'placeholder-week-1',
    title: 'Placeholder Weekly Report',
    publishedAt: 'TBD',
    summary: 'This is placeholder metadata for the first weekly report.'
  }
];
