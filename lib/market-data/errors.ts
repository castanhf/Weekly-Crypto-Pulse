export class MarketDataIngestionError extends Error {
  public readonly cause?: unknown;

  public constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'MarketDataIngestionError';
    this.cause = options?.cause;
  }
}

export class MarketDataProviderResponseError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'MarketDataProviderResponseError';
  }
}
