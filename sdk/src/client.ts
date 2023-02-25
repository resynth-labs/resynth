import { AnchorProvider, BN, BorshAccountsCoder, BorshCoder, Idl, Instruction, Program, ProgramAccount, Wallet } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionSignature } from "@solana/web3.js";
import RESYNTH_CONFIG from './config.json';
import { IDL, Resynth } from './idl';
import { MarginAccount, SyntheticAsset } from "./types";

export class ResynthClient {
  accountDiscriminators: Record<string, string> = {};
  cluster: 'devnet' | 'localnet' | 'mainnet';
  coder: BorshCoder;
  config: any;
  connection: Connection;
  program: Program<Resynth>;
  programId: PublicKey;
  provider: AnchorProvider;
  url: string;
  wallet: Wallet;

  constructor(cluster: 'devnet' | 'localnet' | 'mainnet', connection?: Connection, wallet?: Wallet) {
    this.cluster = cluster;
    this.config = RESYNTH_CONFIG[this.cluster]
    this.programId = new PublicKey(this.config.programId);
    this.url = this.config.url;

    this.connection = connection ? connection : new Connection(this.url, 'confirmed');

    this.wallet = wallet ? wallet : {} as unknown as any;

    const opts = AnchorProvider.defaultOptions();
    this.provider = new AnchorProvider(connection, wallet, opts);
    this.program = new Program<Resynth>(IDL, this.programId, this.provider);

    // @ts-ignore
    this.coder = this.program._coder;

    this.accountDiscriminators[BorshAccountsCoder.accountDiscriminator("MarginAccount").toString('base64')] = "MarginAccount";
    this.accountDiscriminators[BorshAccountsCoder.accountDiscriminator("SyntheticAsset").toString('base64')] = "SyntheticAsset";
  }

  // Accounts -----------------------------------------------------------------

  decodeAccountName(buffer: Buffer): string {
    const accountDiscriminator = buffer.slice(0, 8).toString('base64');
    return this.accountDiscriminators[accountDiscriminator];
  }

  decodeAccount(accountName: string, buffer: Buffer): any {
    // Anchor uses camelCase for account names, but the discriminator is in PascalCase.
    accountName = accountName.charAt(0).toLowerCase() + accountName.slice(1);
    return this.coder.accounts.decodeUnchecked(accountName, buffer);
  }

  encodeAccount(accountName: string, account: any): Buffer {
    const buffer = Buffer.alloc(8192);
    // @ts-ignore
    const layout = this.coder.accounts.accountLayouts.get(accountName);
    if (!layout) {
      throw new Error(`Unknown account: ${accountName}`);
    }
    const len = layout.encode(account, buffer);
    let accountData = buffer.slice(0, len);
    let discriminator = BorshAccountsCoder.accountDiscriminator(accountName);
    return Buffer.concat([discriminator, accountData]);
  }

  async fetchAllMarginAccounts(): Promise<ProgramAccount<MarginAccount>[]> {
    return await this.program.account.marginAccount.all() as ProgramAccount<MarginAccount>[];
  }

  async fetchMarginAccount(address: PublicKey): Promise<ProgramAccount<MarginAccount>> {
    return { publicKey: address, account: await this.program.account.marginAccount.fetch(address) } as ProgramAccount<MarginAccount>;
  }

  async fetchAllSyntheticAssets(): Promise<ProgramAccount<SyntheticAsset>[]> {
    return await this.program.account.syntheticAsset.all() as ProgramAccount<SyntheticAsset>[];
  }

  async fetchSyntheticAsset(address: PublicKey): Promise<ProgramAccount<SyntheticAsset>> {
    return { publicKey: address, account: await this.program.account.syntheticAsset.fetch(address) } as ProgramAccount<SyntheticAsset>;
  }

  // Instructions -------------------------------------------------------------

  decodeInstruction(str: string): Instruction {
    return this.coder.instruction.decode(str, "base58");
  }

  async initializeSyntheticAsset(params: {
    decimals: number,
    syntheticAssetAccount: PublicKey,
    collateralMintAccount: PublicKey,
    collateralVaultAccount: PublicKey,
    syntheticMintAccount: PublicKey,
    syntheticOracleAccount: PublicKey,
    assetAuthorityAccount: PublicKey,
    payerAccount: PublicKey,
  }): Promise<TransactionSignature> {
    return this.program.rpc.initializeSyntheticAsset(
      params.decimals,
      {
        accounts: {
          syntheticAsset: params.syntheticAssetAccount,
          collateralMint: params.collateralMintAccount,
          collateralVault: params.collateralVaultAccount,
          syntheticMint: params.syntheticMintAccount,
          syntheticOracle: params.syntheticOracleAccount,
          assetAuthority: params.assetAuthorityAccount,
          payer: params.payerAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  }

  async initializeMarginAccount(params: {
    payerAccount: PublicKey,
    syntheticAssetAccount: PublicKey,
    marginAccountAccount: PublicKey,
  }): Promise<TransactionSignature> {
    return this.program.rpc.initializeMarginAccount(
      {
        accounts: {
          payer: params.payerAccount,
          owner: this.wallet.publicKey,
          syntheticAsset: params.syntheticAssetAccount,
          marginAccount: params.marginAccountAccount,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  }

  async mintSyntheticAsset(params: {
    collateralAmount: BN,
    mintAmount: BN,
    syntheticAssetAccount: PublicKey,
    collateralVaultAccount: PublicKey,
    syntheticMintAccount: PublicKey,
    syntheticOracleAccount: PublicKey,
    assetAuthorityAccount: PublicKey,
    marginAccountAccount: PublicKey,
    collateralAccountAccount: PublicKey,
    syntheticAccountAccount: PublicKey,
  }): Promise<TransactionSignature> {
    return this.program.rpc.mintSyntheticAsset(
      params.collateralAmount,
      params.mintAmount,
      {
        accounts: {
          syntheticAsset: params.syntheticAssetAccount,
          collateralVault: params.collateralVaultAccount,
          syntheticMint: params.syntheticMintAccount,
          syntheticOracle: params.syntheticOracleAccount,
          assetAuthority: params.assetAuthorityAccount,
          owner: this.wallet.publicKey,
          marginAccount: params.marginAccountAccount,
          collateralAccount: params.collateralAccountAccount,
          syntheticAccount: params.syntheticAccountAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )
  }

}
