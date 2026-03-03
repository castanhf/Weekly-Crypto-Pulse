const METHODOLOGY_SECTIONS = [
  {
    title: 'What we measure',
    points: [
      'Market structure indicators such as total crypto market capitalization, Bitcoin dominance, and broad risk sentiment.',
      'Positioning and participation signals that help identify whether leadership is concentrated or broadening across major assets.',
      'Weekly performance and momentum context for large-cap tokens to track relative strength and short-term trend shifts.'
    ]
  },
  {
    title: 'What data we use',
    points: [
      'Public market data from major spot exchanges and established index aggregators for prices, market cap, and dominance.',
      'Publicly available ETF flow disclosures and related institutional flow summaries where relevant to the weekly narrative.',
      'A consistent internal report schema so each edition can be compared against prior weeks without changing definitions.'
    ]
  },
  {
    title: 'Cadence',
    points: [
      'The report is published weekly and uses a fixed snapshot process for each issue.',
      'Metrics are reviewed in the same order every week to keep interpretation consistent and reduce process drift.',
      'When a data source is delayed, the report notes the timing and carries forward the most recent confirmed figure.'
    ]
  },
  {
    title: 'Limits of the analysis',
    points: [
      'This is a high-level market brief, not a complete model of all on-chain, macroeconomic, or project-specific risk factors.',
      'Data quality depends on third-party sources, which may revise values after publication.',
      'The analysis is descriptive and process-driven; it does not guarantee outcomes or eliminate uncertainty.'
    ]
  }
] as const;

export default function MethodologyPage(): JSX.Element {
  return (
    <section className="space-y-8">
      <header className="space-y-3 border-b border-line pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Methodology</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          Weekly Crypto Pulse follows a repeatable process so readers can compare each issue on like-for-like terms.
        </p>
      </header>

      <div className="space-y-4">
        {METHODOLOGY_SECTIONS.map((section) => (
          <article className="space-y-3 border border-line bg-white p-6" key={section.title}>
            <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-muted">
              {section.points.map((point) => (
                <li className="border-l-2 border-line pl-3" key={point}>
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
