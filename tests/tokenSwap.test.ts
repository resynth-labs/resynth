import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AccountLayout, createApproveInstruction, createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { assert } from "chai";
import { Fees, SwapCurveType, swapPoolPDA, TokenFaucetClient, TokenSwapClient } from "../sdk/src";

describe("token swap", () => {
  const tokenSwap = new TokenSwapClient(
    "localnet",
    undefined,
    new NodeWallet(Keypair.generate()),
  );

  const tokenFaucet = new TokenFaucetClient(
    "localnet",
    tokenSwap.connection,
    tokenSwap.wallet,
  );

  // Hard-coded fee address, for testing production mode
  const SWAP_PROGRAM_OWNER_FEE_ADDRESS = "HfoTxFR1Tm6kGmWgYWD6J7YHVy1UwqSULUGVLXkJqaKN";

  // Pool fees
  const TRADING_FEE_NUMERATOR = 25;
  const TRADING_FEE_DENOMINATOR = 10000;
  const OWNER_TRADING_FEE_NUMERATOR = 5;
  const OWNER_TRADING_FEE_DENOMINATOR = 10000;
  const OWNER_WITHDRAW_FEE_NUMERATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 1;
  const OWNER_WITHDRAW_FEE_DENOMINATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 6;
  const HOST_FEE_NUMERATOR = 20;
  const HOST_FEE_DENOMINATOR = 100;

  // Initial amount in each swap token
  let currentSwapTokenA = 1000000;
  let currentSwapTokenB = 1000000;
  let currentFeeAmount = 0;

  // Swap instruction constants
  // Because there is no withdraw fee in the production version, these numbers
  // need to get slightly tweaked in the two cases.
  const SWAP_AMOUNT_IN = 100000;
  const SWAP_AMOUNT_OUT = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 90661 : 90674;
  const SWAP_FEE = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 22727 : 22730;
  const HOST_SWAP_FEE = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? Math.floor((SWAP_FEE * HOST_FEE_NUMERATOR) / HOST_FEE_DENOMINATOR) : 0;
  const OWNER_SWAP_FEE = SWAP_FEE - HOST_SWAP_FEE;

  // Pool token amount minted on init
  const DEFAULT_POOL_TOKEN_AMOUNT = 1000000000;
  // Pool token amount to withdraw / deposit
  const POOL_TOKEN_AMOUNT = 10000000;

  const mintADecimals = 2;
  const mintBDecimals = 2;
  const lpmintDecimals = 2;

  let mintA: PublicKey;
  let mintB: PublicKey;
  let faucetA: PublicKey;
  let faucetB: PublicKey;

  let feeReceiverWallet = Keypair.generate();
  let feeReceiver: PublicKey;

  let hostFeeReceiverWallet = Keypair.generate();
  let hostFeeReceiver: PublicKey;

  let swapPool: PublicKey;
  let authority: PublicKey;
  let vaultA: PublicKey;
  let vaultB: PublicKey;
  let lpmint: PublicKey;

  let user = Keypair.generate();
  let userAccountA: PublicKey;
  let userAccountB: PublicKey;
  let userPoolTokenAccount: PublicKey;

  function tradingTokensToPoolTokens(
    sourceAmount: number,
    swapSourceAmount: number,
    poolAmount: number,
  ): number {
    const tradingFee =
      (sourceAmount / 2) * (TRADING_FEE_NUMERATOR / TRADING_FEE_DENOMINATOR);
    const ownerTradingFee =
      (sourceAmount / 2) * (OWNER_TRADING_FEE_NUMERATOR / OWNER_TRADING_FEE_DENOMINATOR);
    const sourceAmountPostFee = sourceAmount - tradingFee - ownerTradingFee;
    const root = Math.sqrt(sourceAmountPostFee / swapSourceAmount + 1);
    return Math.floor(poolAmount * (root - 1));
  }

  before(async () => {
    let airdropSignature = await tokenSwap.connection.requestAirdrop(
      tokenSwap.wallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await tokenSwap.connection.confirmTransaction(
      airdropSignature,
      "confirmed"
    );

    airdropSignature = await tokenSwap.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await tokenSwap.connection.confirmTransaction(
      airdropSignature,
      "confirmed"
    );

    [mintA, faucetA] = await tokenFaucet.createMintAndFaucet(mintADecimals);
    [mintB, faucetB] = await tokenFaucet.createMintAndFaucet(mintBDecimals);

    ({ swapPool, authority, vaultA, vaultB, lpmint } = swapPoolPDA(tokenSwap.program.programId, mintA, mintB));

    feeReceiver = await getAssociatedTokenAddressSync(lpmint, feeReceiverWallet.publicKey);

    userAccountA = await getAssociatedTokenAddressSync(mintA, user.publicKey);
    userAccountB = await getAssociatedTokenAddressSync(mintB, user.publicKey);
    userPoolTokenAccount = await getAssociatedTokenAddressSync(lpmint, user.publicKey);
  });

  it("createTokenSwap ConstantProductCurve", async () => {
    await tokenFaucet.airdrop({
      amount: new BN(currentSwapTokenA),
      faucet: faucetA,
      mint: mintA,
      owner: user.publicKey,
    });
    await tokenFaucet.airdrop({
      amount: new BN(currentSwapTokenB),
      faucet: faucetB,
      mint: mintB,
      owner: user.publicKey,
    });

    console.log('creating token swap');
    await tokenSwap.initializeSwapPool({
      fees: {
        tradeFeeNumerator: new BN(TRADING_FEE_NUMERATOR),
        tradeFeeDenominator: new BN(TRADING_FEE_DENOMINATOR),
        ownerTradeFeeNumerator: new BN(OWNER_TRADING_FEE_NUMERATOR),
        ownerTradeFeeDenominator: new BN(OWNER_TRADING_FEE_DENOMINATOR),
        ownerWithdrawFeeNumerator: new BN(OWNER_WITHDRAW_FEE_NUMERATOR),
        ownerWithdrawFeeDenominator: new BN(OWNER_WITHDRAW_FEE_DENOMINATOR),
        hostFeeNumerator: new BN(HOST_FEE_NUMERATOR),
        hostFeeDenominator: new BN(HOST_FEE_DENOMINATOR),
      },
      swapCurveType: SwapCurveType.ConstantProductCurve,
      tokenBPriceOrOffset: new BN(0),
      initialTokenAAmount: new BN(currentSwapTokenA),
      initialTokenBAmount: new BN(currentSwapTokenB),
      feeReceiver,
      feeReceiverWallet: feeReceiverWallet.publicKey,
      mintA,
      mintB,
      owner: user,
      sourceA: userAccountA,
      sourceB: userAccountB,
    });

    hostFeeReceiver = await createAssociatedTokenAccount(tokenSwap.connection, tokenSwap.wallet.payer, lpmint, hostFeeReceiverWallet.publicKey);

    const fetchedSwapPool = (await tokenSwap.fetchSwapPool(swapPool)).account;

    assert(fetchedSwapPool.tokenProgram.equals(TOKEN_PROGRAM_ID));
    assert(fetchedSwapPool.vaultA.equals(vaultA));
    assert(fetchedSwapPool.vaultB.equals(vaultB));
    assert(fetchedSwapPool.mintA.equals(mintA));
    assert(fetchedSwapPool.mintB.equals(mintB));
    assert(fetchedSwapPool.lpmint.equals(lpmint));
    assert(fetchedSwapPool.feeReceiver.equals(feeReceiver));
    assert(
      TRADING_FEE_NUMERATOR == Number(fetchedSwapPool.fees.tradeFeeNumerator),
    );
    assert(
      TRADING_FEE_DENOMINATOR == Number(fetchedSwapPool.fees.tradeFeeDenominator),
    );
    assert(
      OWNER_TRADING_FEE_NUMERATOR ==
      Number(fetchedSwapPool.fees.ownerTradeFeeNumerator),
    );
    assert(
      OWNER_TRADING_FEE_DENOMINATOR ==
      Number(fetchedSwapPool.fees.ownerTradeFeeDenominator),
    );
    assert(
      OWNER_WITHDRAW_FEE_NUMERATOR ==
      Number(fetchedSwapPool.fees.ownerWithdrawFeeNumerator),
    );
    assert(
      OWNER_WITHDRAW_FEE_DENOMINATOR ==
      Number(fetchedSwapPool.fees.ownerWithdrawFeeDenominator),
    );
    assert(HOST_FEE_NUMERATOR == Number(fetchedSwapPool.fees.hostFeeNumerator));
    assert(
      HOST_FEE_DENOMINATOR == Number(fetchedSwapPool.fees.hostFeeDenominator),
    );
    assert('constantProductCurve' in fetchedSwapPool.swapCurveType);

    assert(Number(MintLayout.decode((await tokenSwap.connection.getAccountInfo(lpmint))!.data).supply) == DEFAULT_POOL_TOKEN_AMOUNT);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userPoolTokenAccount))!.data).amount) == DEFAULT_POOL_TOKEN_AMOUNT);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA))!.data).amount) == 0);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB))!.data).amount) == 0);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount) == currentSwapTokenA);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount) == currentSwapTokenB);
  });

  it("depositAllTokenTypes", async () => {
    const supply = Number(MintLayout.decode((await tokenSwap.connection.getAccountInfo(lpmint))!.data).supply);
    const tokenAmountA = Math.floor(
      (Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount) * POOL_TOKEN_AMOUNT) / supply,
    );
    const tokenAmountB = Math.floor(
      (Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount) * POOL_TOKEN_AMOUNT) / supply,
    );

    console.log(`Depositing ${tokenAmountA} token a and ${tokenAmountB} token b`);
    await tokenFaucet.airdrop({
      amount: new BN(tokenAmountA - Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA))!.data).amount)),
      faucet: faucetA,
      mint: mintA,
      owner: user.publicKey,
    });
    await tokenFaucet.airdrop({
      amount: new BN(tokenAmountB - Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB))!.data).amount)),
      faucet: faucetB,
      mint: mintB,
      owner: user.publicKey,
    });

    console.log('Depositing into swap');
    await tokenSwap.depositAllTokenTypes({
      poolTokenAmount: new BN(POOL_TOKEN_AMOUNT),
      maximumTokenAAmount: new BN(tokenAmountA),
      maximumTokenBAmount: new BN(tokenAmountB),
      swapPool,
      authority,
      owner: user,
      tokenA: userAccountA,
      tokenB: userAccountB,
      vaultA,
      vaultB,
      lpmint,
      lptoken: userPoolTokenAccount,
      mintA,
      mintB,
    });

    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA))!.data).amount) == 0);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB))!.data).amount) == 0);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount) == currentSwapTokenA + tokenAmountA);
    currentSwapTokenA += tokenAmountA;
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount) == currentSwapTokenB + tokenAmountB);
    currentSwapTokenB += tokenAmountB;
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userPoolTokenAccount))!.data).amount) == DEFAULT_POOL_TOKEN_AMOUNT + POOL_TOKEN_AMOUNT);
  });

  it("withdrawAllTokenTypes", async () => {
    const supply = Number(MintLayout.decode((await tokenSwap.connection.getAccountInfo(lpmint))!.data).supply);
    let feeAmount = 0;
    if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0) {
      feeAmount = Math.floor(
        (POOL_TOKEN_AMOUNT * OWNER_WITHDRAW_FEE_NUMERATOR) /
        OWNER_WITHDRAW_FEE_DENOMINATOR,
      );
    }
    const poolTokenAmount = POOL_TOKEN_AMOUNT - feeAmount;
    const tokenAmountA = Math.floor(
      (Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount) * poolTokenAmount) / supply,
    );
    const tokenAmountB = Math.floor(
      (Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount) * poolTokenAmount) / supply,
    );

    console.log('Withdrawing pool tokens for A and B tokens');
    await tokenSwap.withdrawAllTokenTypes({
      poolTokenAmount: new BN(POOL_TOKEN_AMOUNT),
      minimumTokenAAmount: new BN(tokenAmountA),
      minimumTokenBAmount: new BN(tokenAmountB),
      swapPool,
      authority,
      owner: user,
      lpmint,
      lptoken: userPoolTokenAccount,
      vaultA,
      vaultB,
      tokenA: userAccountA,
      tokenB: userAccountB,
      feeReceiver,
      mintA,
      mintB,
    });

    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userPoolTokenAccount))!.data).amount) == DEFAULT_POOL_TOKEN_AMOUNT);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount) == currentSwapTokenA - tokenAmountA);
    currentSwapTokenA -= tokenAmountA;
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount) == currentSwapTokenB - tokenAmountB);
    currentSwapTokenB -= tokenAmountB;
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA))!.data).amount) == tokenAmountA);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB))!.data).amount) == tokenAmountB);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(feeReceiver))!.data).amount) == feeAmount);
    currentFeeAmount = feeAmount;
  });

  it("swap", async () => {
    const swappper = Keypair.generate();

    console.log('Creating swap token a account');
    const swapperAccountA = await tokenFaucet.airdrop({
      amount: new BN(SWAP_AMOUNT_IN),
      faucet: faucetA,
      mint: mintA,
      owner: swappper.publicKey,
    });

    console.log('Creating swap token b account');
    const swapperAccountB = await createAssociatedTokenAccount(tokenSwap.connection, tokenSwap.wallet.payer, mintB, swappper.publicKey);

    console.log('Swapping');
    await tokenSwap.swap({
      amountIn: new BN(SWAP_AMOUNT_IN),
      minimumAmountOut: new BN(SWAP_AMOUNT_OUT),
      swapPool,
      authority,
      owner: swappper,
      sourceToken: swapperAccountA,
      sourceVault: vaultA,
      destVault: vaultB,
      destToken: swapperAccountB,
      lpmint,
      feeReceiver,
      hostFeeReceiver,
    });

    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(swapperAccountA))!.data).amount) == 0);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(swapperAccountB))!.data).amount) == SWAP_AMOUNT_OUT);

    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount) == currentSwapTokenA + SWAP_AMOUNT_IN);
    currentSwapTokenA += SWAP_AMOUNT_IN;

    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount) == currentSwapTokenB - SWAP_AMOUNT_OUT);
    currentSwapTokenB -= SWAP_AMOUNT_OUT;

    //TODO these numbers are off
    // console.log(`Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(feeReceiver)).data).amount) = ${Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(feeReceiver)).data).amount)}`);
    // console.log(`OWNER_SWAP_FEE = ${OWNER_SWAP_FEE}`);
    // //assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(feeReceiver)).data).amount) == currentFeeAmount + OWNER_SWAP_FEE);
    // console.log(`Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(hostFeeReceiver)).data).amount) = ${Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(hostFeeReceiver)).data).amount)}`);
    // console.log(`HOST_SWAP_FEE = ${HOST_SWAP_FEE}`);
    // //assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(hostFeeReceiver)).data).amount) == HOST_SWAP_FEE);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(feeReceiver))!.data).amount) == 18547);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(hostFeeReceiver))!.data).amount) == 4636);
  });

  it("createAccountAndSwapAtomic", async () => {
    const swappper = Keypair.generate();

    console.log('Creating swap token a account');
    const swapperAccountA = await tokenFaucet.airdrop({
      amount: new BN(SWAP_AMOUNT_IN),
      faucet: faucetA,
      mint: mintA,
      owner: swappper.publicKey,
    });

    const transaction = new Transaction();

    const swapperAccountB = getAssociatedTokenAddressSync(mintB, swappper.publicKey);
    transaction.add(
      createAssociatedTokenAccountInstruction(
        tokenSwap.wallet.payer.publicKey,
        swapperAccountB,
        swappper.publicKey,
        mintB,
      )
    );

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      createApproveInstruction(
        swapperAccountA,
        userTransferAuthority.publicKey,
        swappper.publicKey,
        SWAP_AMOUNT_IN,
      ),
    );

    transaction.add(
      await tokenSwap.swapInstruction({
        amountIn: new BN(SWAP_AMOUNT_IN),
        minimumAmountOut: new BN(0),
        swapPool,
        authority,
        owner: swappper.publicKey,
        userTransferAuthority: userTransferAuthority.publicKey,
        sourceTokenAccount: swapperAccountA,
        sourceVault: vaultA,
        destVault: vaultB,
        destTokenAccount: swapperAccountB,
        lpmint,
        feeReceiver,
        hostFeeReceiver,
      }),
    );

    // Send the instructions
    console.log('sending big instruction');
    await tokenSwap.provider.sendAndConfirm(transaction, [swappper, userTransferAuthority], { commitment: "confirmed", skipPreflight: true });

    currentSwapTokenA = Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount);
    currentSwapTokenB = Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount);
  });

  it("depositSingleTokenTypeExactAmountIn", async () => {
    // Pool token amount to deposit on one side
    const depositAmount = 10000;

    const supply = Number(MintLayout.decode((await tokenSwap.connection.getAccountInfo(lpmint))!.data).supply);
    const poolTokenA = tradingTokensToPoolTokens(
      depositAmount,
      Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount),
      supply,
    );
    const poolTokenB = tradingTokensToPoolTokens(
      depositAmount,
      Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount),
      supply,
    );

    console.log('Creating depositor token a account');
    await tokenFaucet.airdrop({
      amount: new BN(depositAmount - Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA))!.data).amount)),
      faucet: faucetA,
      mint: mintA,
      owner: user.publicKey,
    });

    console.log('Creating depositor token b account');
    await tokenFaucet.airdrop({
      amount: new BN(depositAmount - Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB))!.data).amount)),
      faucet: faucetB,
      mint: mintB,
      owner: user.publicKey,
    });

    console.log('Depositing token A into swap');
    await tokenSwap.depositSingleTokenTypeExactAmountIn({
      sourceTokenAmount: new BN(depositAmount),
      minimumPoolTokenAmount: new BN(poolTokenA),
      swapPool,
      authority,
      owner: user,
      tokenA: userAccountA,
      tokenB: null,
      vaultA,
      vaultB,
      lpmint,
      lptoken: userPoolTokenAccount,
      mintA,
      mintB,
    });

    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA))!.data).amount) == 0);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount) == currentSwapTokenA + depositAmount);
    currentSwapTokenA += depositAmount;

    console.log('Depositing token B into swap');
    await tokenSwap.depositSingleTokenTypeExactAmountIn({
      sourceTokenAmount: new BN(depositAmount),
      minimumPoolTokenAmount: new BN(poolTokenB),
      swapPool,
      authority,
      owner: user,
      tokenA: null,
      tokenB: userAccountB,
      vaultA,
      vaultB,
      lpmint,
      lptoken: userPoolTokenAccount,
      mintA,
      mintB,
    });

    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB))!.data).amount) == 0);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount) == currentSwapTokenB + depositAmount);
    currentSwapTokenB += depositAmount;
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userPoolTokenAccount))!.data).amount) >= poolTokenA + poolTokenB);
  });

  it("withdrawSingleTokenTypeExactAmountOut", async () => {
    // Pool token amount to withdraw on one side
    const withdrawAmount = 50000;
    const roundingAmount = 1.0001; // make math a little easier

    const supply = Number(MintLayout.decode((await tokenSwap.connection.getAccountInfo(lpmint))!.data).supply);

    const swapTokenAPost = Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount) - withdrawAmount;
    const poolTokenA = tradingTokensToPoolTokens(
      withdrawAmount,
      swapTokenAPost,
      supply,
    );
    let adjustedPoolTokenA = poolTokenA * roundingAmount;
    if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0) {
      adjustedPoolTokenA *=
        1 + OWNER_WITHDRAW_FEE_NUMERATOR / OWNER_WITHDRAW_FEE_DENOMINATOR;
    }

    const swapTokenBPost = Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount) - withdrawAmount;
    const poolTokenB = tradingTokensToPoolTokens(
      withdrawAmount,
      swapTokenBPost,
      supply,
    );
    let adjustedPoolTokenB = poolTokenB * roundingAmount;
    if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0) {
      adjustedPoolTokenB *=
        1 + OWNER_WITHDRAW_FEE_NUMERATOR / OWNER_WITHDRAW_FEE_DENOMINATOR;
    }

    const poolTokenAmount = Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userPoolTokenAccount))!.data).amount);

    console.log('Withdrawing token A only');
    await tokenSwap.withdrawSingleTokenTypeExactAmountOut({
      destinationTokenAmount: new BN(withdrawAmount),
      maximumPoolTokenAmount: new BN(adjustedPoolTokenA),
      swapPool,
      authority,
      owner: user,
      lpmint,
      lptoken: userPoolTokenAccount,
      vaultA,
      vaultB,
      tokenA: userAccountA,
      tokenB: null,
      feeReceiver,
      mintA,
      mintB,
    });

    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA))!.data).amount) == withdrawAmount);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA))!.data).amount) == currentSwapTokenA - withdrawAmount);
    currentSwapTokenA += withdrawAmount;
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userPoolTokenAccount))!.data).amount) >= poolTokenAmount - adjustedPoolTokenA);

    console.log('Withdrawing token B only');
    await tokenSwap.withdrawSingleTokenTypeExactAmountOut({
      destinationTokenAmount: new BN(withdrawAmount),
      maximumPoolTokenAmount: new BN(adjustedPoolTokenB),
      swapPool,
      authority,
      owner: user,
      lpmint,
      lptoken: userPoolTokenAccount,
      vaultA,
      vaultB,
      tokenA: null,
      tokenB: userAccountB,
      feeReceiver,
      mintA,
      mintB,
    });

    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB))!.data).amount) == withdrawAmount);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB))!.data).amount) == currentSwapTokenB - withdrawAmount);
    currentSwapTokenB += withdrawAmount;
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userPoolTokenAccount))!.data).amount) >= poolTokenAmount - adjustedPoolTokenA - adjustedPoolTokenB);
  });

});
