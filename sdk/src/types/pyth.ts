import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Types --------------------------------------------------------------------

export class PriceStatus {
  static readonly Unknown = { unknown: {} };
  static readonly Trading = { trading: {} };
  static readonly Halted = { halted: {} };
  static readonly Auction = { auction: {} };

  static toString(priceStatus: any): string {
    if (priceStatus['unknown']) return 'Unknown';
    if (priceStatus['trading']) return 'Trading';
    if (priceStatus['halted']) return 'Halted';
    if (priceStatus['auction']) return 'Auction';
    return 'unknown';
  }
}

export class CorpAction {
  static readonly NoCorpAct = { noCorpAct: {} };

  static toString(corpAction: any): string {
    if (corpAction['noCorpAct']) return 'NoCorpAct';
    return 'unknown';
  }
}

export class PriceType {
  static readonly Unknown = { unknown: {} };
  static readonly Price = { price: {} };
  static readonly TWAP = { tWAP: {} };
  static readonly Volatility = { volatility: {} };

  static toString(priceType: any): string {
    if (priceType['unknown']) return 'Unknown';
    if (priceType['price']) return 'Price';
    if (priceType['tWAP']) return 'TWAP';
    if (priceType['volatility']) return 'Volatility';
    return 'unknown';
  }
}
