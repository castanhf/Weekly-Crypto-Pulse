import type { AssetId, FiatCurrency, MarketAssetSnapshot, MarketDataSnapshot } from '../../domain/market-data';
import { MarketDataProviderResponseError } from './errors';
import type { MarketDataProvider, MarketDataProviderRequest } from './provider';

type FetchFn = (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>;

type CoinGeckoAssetPayload = Record<string, number>;
type CoinGeckoPriceResponse = Record<string, CoinGeckoAssetPayload>;

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3/simple/price';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const readNumericField = (assetId: AssetId, payload: Record<string, unknown>, field: string): number => {
  const value = payload[field];

  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new MarketDataProviderResponseError(`CoinGecko response is missing numeric field "${field}" for asset "${assetId}".`);
  }

  return value;
};

const mapAssetPayload = (assetId: AssetId, payload: unknown): MarketAssetSnapshot => {
  if (!isRecord(payload)) {
    throw new MarketDataProviderResponseError(`CoinGecko response is missing payload for asset "${assetId}".`);
  }

  return {
    assetId,
    price: readNumericField(assetId, payload, 'usd'),
    marketCap: readNumericField(assetId, payload, 'usd_market_cap'),
    volume24h: readNumericField(assetId, payload, 'usd_24h_vol'),
    change24hPercent: readNumericField(assetId, payload, 'usd_24h_change')
  };
};

const parseCoinGeckoResponse = (
  body: unknown,
  request: MarketDataProviderRequest
): ReadonlyArray<MarketAssetSnapshot> => {
  if (!isRecord(body)) {
    throw new MarketDataProviderResponseError('CoinGecko response must be a JSON object.');
  }

  return request.assetIds.map((assetId) => mapAssetPayload(assetId, body[assetId]));
};

export class CoinGeckoMarketDataProvider implements MarketDataProvider {
  private readonly fetchFn: FetchFn;

  public constructor(fetchFn: FetchFn = fetch) {
    this.fetchFn = fetchFn;
  }

  public async fetchSnapshot(request: MarketDataProviderRequest): Promise<MarketDataSnapshot> {
    const query = this.buildQuery(request.assetIds, request.currency);
    const response = await this.fetchFn(`${COINGECKO_BASE_URL}?${query.toString()}`);

    if (!response.ok) {
      throw new MarketDataProviderResponseError(`CoinGecko request failed with status ${response.status}.`);
    }

    const json = (await response.json()) as CoinGeckoPriceResponse;
    const assets = parseCoinGeckoResponse(json, request);

    return {
      provider: 'coingecko',
      currency: request.currency,
      capturedAt: new Date().toISOString(),
      assets
    };
  }

  private buildQuery(assetIds: ReadonlyArray<AssetId>, currency: FiatCurrency): URLSearchParams {
    return new URLSearchParams({
      ids: assetIds.join(','),
      vs_currencies: currency,
      include_market_cap: 'true',
      include_24hr_vol: 'true',
      include_24hr_change: 'true'
    });
  }
}
