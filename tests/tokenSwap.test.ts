import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AccountLayout, approveChecked, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
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

  let mintA: PublicKey;
  let mintB: PublicKey;
  let faucetA: PublicKey;
  let faucetB: PublicKey;

  let feeReceiverWallet = Keypair.generate();
  let feeReceiver: PublicKey;

  let swapPool: PublicKey;
  let authority: PublicKey;
  let vaultA: PublicKey;
  let vaultB: PublicKey;
  let lpmint: PublicKey;

  let user = Keypair.generate();
  let tokenAccountA: PublicKey;
  let tokenAccountB: PublicKey;
  let tokenAccountPool: PublicKey;

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

    [mintA, faucetA] = await tokenFaucet.createMintAndFaucet(9);
    [mintB, faucetB] = await tokenFaucet.createMintAndFaucet(6);

    // TODO is there a better way to destructure this?
    const pdas = swapPoolPDA(tokenSwap.program.programId, mintA, mintB);
    swapPool = pdas.swapPool;
    authority = pdas.authority;
    vaultA = pdas.vaultA;
    vaultB = pdas.vaultB;
    lpmint = pdas.lpmint;

    feeReceiver = await getAssociatedTokenAddressSync(lpmint, feeReceiverWallet.publicKey);

    tokenAccountA = await getAssociatedTokenAddressSync(mintA, user.publicKey);
    tokenAccountB = await getAssociatedTokenAddressSync(mintB, user.publicKey);
    tokenAccountPool = await getAssociatedTokenAddressSync(lpmint, user.publicKey);

    await tokenSwap.provider.sendAndConfirm(new Transaction().add(
      createAssociatedTokenAccountInstruction(
        tokenSwap.wallet.publicKey,
        tokenAccountA,
        user.publicKey,
        mintA,
      ),
      createAssociatedTokenAccountInstruction(
        tokenSwap.wallet.publicKey,
        tokenAccountB,
        user.publicKey,
        mintB,
      ),
    ));
  });

  it("createTokenSwap ConstantProductCurve", async () => {
    const fees: Fees = {
      tradeFeeNumerator: new BN(TRADING_FEE_NUMERATOR),
      tradeFeeDenominator: new BN(TRADING_FEE_DENOMINATOR),
      ownerTradeFeeNumerator: new BN(OWNER_TRADING_FEE_NUMERATOR),
      ownerTradeFeeDenominator: new BN(OWNER_TRADING_FEE_DENOMINATOR),
      ownerWithdrawFeeNumerator: new BN(OWNER_WITHDRAW_FEE_NUMERATOR),
      ownerWithdrawFeeDenominator: new BN(OWNER_WITHDRAW_FEE_DENOMINATOR),
      hostFeeNumerator: new BN(HOST_FEE_NUMERATOR),
      hostFeeDenominator: new BN(HOST_FEE_DENOMINATOR),
    };

    await tokenFaucet.airdrop({
      amount: new BN(currentSwapTokenA),
      faucet: faucetA,
      mint: mintA,
      tokenAccount: tokenAccountA,
    });

    await tokenFaucet.airdrop({
      amount: new BN(currentSwapTokenB),
      faucet: faucetB,
      mint: mintB,
      tokenAccount: tokenAccountB,
    });

    console.log('creating token swap');
    await tokenSwap.initializeSwapPool({
      fees,
      swapCurveType: SwapCurveType.ConstantProductCurve,
      tokenBPriceOrOffset: new BN(0),
      feeReceiver,
      feeReceiverWallet: feeReceiverWallet.publicKey,
      mintA,
      mintB,
      source: user,
      sourceA: tokenAccountA,
      sourceB: tokenAccountB,
    });

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
    assert(fetchedSwapPool.swapCurveType['constantProductCurve']);
  });

  /*
  it("depositAllTokenTypes", async () => {
    const poolMintInfo = MintLayout.decode((await tokenSwap.connection.getAccountInfo(lpmint)).data);
    const swapTokenA = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA)).data);
    const swapTokenB = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB)).data);

    const supply = Number(poolMintInfo.supply);
    const tokenAmountA = Math.floor(
      (Number(swapTokenA.amount) * POOL_TOKEN_AMOUNT) / supply,
    );
    const tokenAmountB = Math.floor(
      (Number(swapTokenB.amount) * POOL_TOKEN_AMOUNT) / supply,
    );

    const userTransferAuthority = Keypair.generate();
    console.log('Creating depositor token a account');
    const userAccountA = await getOrCreateAssociatedTokenAccount(tokenSwap.connection, tokenSwap.wallet.payer, mintA, user.publicKey);
    await tokenFaucet.airdrop({
      amount: new BN(tokenAmountA),
      faucet: faucetA,
      mint: mintA,
      tokenAccount: userAccountA.address,
    });
    await approveChecked(
      tokenSwap.connection,
      tokenSwap.wallet.payer,
      mintA,
      userAccountA.address,
      userTransferAuthority.publicKey,
      user,
      tokenAmountA,
      9,
    );

    console.log('Creating depositor token b account');
    const userAccountB = await getOrCreateAssociatedTokenAccount(tokenSwap.connection, tokenSwap.wallet.payer, mintB, user.publicKey);
    await tokenFaucet.airdrop({
      amount: new BN(tokenAmountB),
      faucet: faucetB,
      mint: mintB,
      tokenAccount: userAccountB.address,
    });
    await approveChecked(
      tokenSwap.connection,
      tokenSwap.wallet.payer,
      mintB,
      userAccountB.address,
      userTransferAuthority.publicKey,
      user,
      tokenAmountB,
      6,
    );

    console.log('Creating depositor pool token account');
    const newAccountPool = await getOrCreateAssociatedTokenAccount(tokenSwap.connection, tokenSwap.wallet.payer, lpmint, user.publicKey);

    console.log('Depositing into swap');
    await tokenSwap.depositAllTokenTypes({
      poolTokenAmount: new BN(POOL_TOKEN_AMOUNT),
      maximumTokenAAmount: new BN(tokenAmountA),
      maximumTokenBAmount: new BN(tokenAmountB),
      swapPool,
      authority,
      userTransferAuthority,
      tokenA: userAccountA.address,
      tokenB: userAccountB.address,
      vaultA,
      vaultB,
      lpmint,
      lptoken: newAccountPool.address,
      mintA,
      mintB,
    });

    let info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA.address)).data);
    assert(Number(info.amount) == 0);
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB.address)).data);
    assert(Number(info.amount) == 0);
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA)).data);
    assert(Number(info.amount) == currentSwapTokenA + tokenAmountA);
    currentSwapTokenA += tokenAmountA;
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB)).data);
    assert(Number(info.amount) == currentSwapTokenB + tokenAmountB);
    currentSwapTokenB += tokenAmountB;
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(newAccountPool.address)).data);
    assert(Number(info.amount) == POOL_TOKEN_AMOUNT);
  });

  it("withdrawAllTokenTypes", async () => {
    const poolMintInfo = MintLayout.decode((await tokenSwap.connection.getAccountInfo(lpmint)).data);
    const swapTokenA = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA)).data);
    const swapTokenB = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB)).data);

    const supply = Number(poolMintInfo.supply);
    let feeAmount = 0;
    if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0) {
      feeAmount = Math.floor(
        (POOL_TOKEN_AMOUNT * OWNER_WITHDRAW_FEE_NUMERATOR) /
        OWNER_WITHDRAW_FEE_DENOMINATOR,
      );
    }
    const poolTokenAmount = POOL_TOKEN_AMOUNT - feeAmount;
    const tokenA = Math.floor(
      (Number(swapTokenA.amount) * poolTokenAmount) / supply,
    );
    const tokenB = Math.floor(
      (Number(swapTokenB.amount) * poolTokenAmount) / supply,
    );

    console.log('Creating withdraw token A account');
    const userAccountA = await getOrCreateAssociatedTokenAccount(tokenSwap.connection, tokenSwap.wallet.payer, mintA, user.publicKey);
    console.log('Creating withdraw token B account');
    const userAccountB = await getOrCreateAssociatedTokenAccount(tokenSwap.connection, tokenSwap.wallet.payer, mintB, user.publicKey);

    const userTransferAuthority = Keypair.generate();
    console.log('Approving withdrawal from pool account');
    await approveChecked(
      tokenSwap.connection,
      tokenSwap.wallet.payer,
      lpmint,
      tokenAccountPool.address,
      userTransferAuthority.publicKey,
      user,
      POOL_TOKEN_AMOUNT,
      2,
    );

    console.log('Withdrawing pool tokens for A and B tokens');
    await tokenSwap.withdrawAllTokenTypes({
      poolTokenAmount: new BN(POOL_TOKEN_AMOUNT),
      maximumTokenAAmount: new BN(tokenAmountA),
      maximumTokenBAmount: new BN(tokenAmountB),
      swapPool,
      authority,
      userTransferAuthority,
      lpmint,
      lptoken: newAccountPool.address,
      vaultA,
      vaultB,
      tokenA: userAccountA.address,
      tokenB: userAccountB.address,
      feeReceiver,
      mintA,
      mintB,
    });

    swapTokenA = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA)).data);
    swapTokenB = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB)).data);

    let info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(tokenAccountPool)).data);
    assert(
      Number(info.amount) == DEFAULT_POOL_TOKEN_AMOUNT - POOL_TOKEN_AMOUNT,
    );
    assert(swapTokenA.amount.toNumber() == currentSwapTokenA - tokenA);
    currentSwapTokenA -= tokenA;
    assert(swapTokenB.amount.toNumber() == currentSwapTokenB - tokenB);
    currentSwapTokenB -= tokenB;
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA.address)).data);
    assert(Number(info.amount) == tokenA);
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB.address)).data);
    assert(Number(info.amount) == tokenB);
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(feeAccount)).data);
    assert(Number(info.amount) == feeAmount);
    currentFeeAmount = feeAmount;
  });

  it("createAccountAndSwapAtomic", async () => {
    console.log('Creating swap token a account');
    let userAccountA = await mintA.createAccount(owner.publicKey);
    await mintA.mintTo(userAccountA, owner, [], SWAP_AMOUNT_IN);

    // @ts-ignore
    const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(
      connection,
    );
    const newAccount = new Account();
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: owner.publicKey,
        newAccountPubkey: newAccount.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: mintB.programId,
      }),
    );

    transaction.add(
      Token.createInitAccountInstruction(
        mintB.programId,
        mintB.publicKey,
        newAccount.publicKey,
        owner.publicKey,
      ),
    );

    const userTransferAuthority = Keypair.generate();
    transaction.add(
      Token.createApproveInstruction(
        mintA.programId,
        userAccountA,
        userTransferAuthority.publicKey,
        owner.publicKey,
        [owner],
        SWAP_AMOUNT_IN,
      ),
    );

    transaction.add(
      TokenSwap.swapInstruction(
        tokenSwap.tokenSwap,
        tokenSwap.authority,
        userTransferAuthority.publicKey,
        userAccountA,
        tokenSwap.tokenAccountA,
        tokenSwap.tokenAccountB,
        newAccount.publicKey,
        tokenSwap.poolToken,
        tokenSwap.feeAccount,
        null,
        tokenSwap.mintA,
        tokenSwap.mintB,
        tokenSwap.swapProgramId,
        TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenSwap.poolTokenProgramId,
        SWAP_AMOUNT_IN,
        0,
      ),
    );

    const confirmOptions = {
      skipPreflight: true
    }

    // Send the instructions
    console.log('sending big instruction');
    await sendAndConfirmTransaction(
      connection,
      transaction,
      [owner, newAccount, userTransferAuthority],
      confirmOptions
    );

    let info;
    info = await mintA.getAccountInfo(tokenAccountA);
    currentSwapTokenA = info.amount.toNumber();
    info = await mintB.getAccountInfo(tokenAccountB);
    currentSwapTokenB = info.amount.toNumber();
  });

  it("swap", async () => {
    console.log('Creating swap token a account');
    let userAccountA = await mintA.createAccount(owner.publicKey);
    await mintA.mintTo(userAccountA, owner, [], SWAP_AMOUNT_IN);
    const userTransferAuthority = Keypair.generate();
    await mintA.approve(
      userAccountA,
      userTransferAuthority.publicKey,
      owner,
      [],
      SWAP_AMOUNT_IN,
    );
    console.log('Creating swap token b account');
    let userAccountB = await mintB.createAccount(owner.publicKey);
    let poolAccount = SWAP_PROGRAM_OWNER_FEE_ADDRESS
      ? await tokenPool.createAccount(owner.publicKey)
      : null;

    const confirmOptions = {
      skipPreflight: true
    }

    console.log('Swapping');
    await tokenSwap.swap(
      userAccountA,
      tokenAccountA,
      tokenAccountB,
      userAccountB,
      tokenSwap.mintA,
      tokenSwap.mintB,
      TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      poolAccount,
      userTransferAuthority,
      SWAP_AMOUNT_IN,
      SWAP_AMOUNT_OUT,
      confirmOptions
    );

    await sleep(500);

    let info;
    info = await mintA.getAccountInfo(userAccountA);
    assert(info.amount.toNumber() == 0);

    info = await mintB.getAccountInfo(userAccountB);
    assert(info.amount.toNumber() == SWAP_AMOUNT_OUT);

    info = await mintA.getAccountInfo(tokenAccountA);
    assert(info.amount.toNumber() == currentSwapTokenA + SWAP_AMOUNT_IN);
    currentSwapTokenA += SWAP_AMOUNT_IN;

    info = await mintB.getAccountInfo(tokenAccountB);
    assert(info.amount.toNumber() == currentSwapTokenB - SWAP_AMOUNT_OUT);
    currentSwapTokenB -= SWAP_AMOUNT_OUT;

    info = await tokenPool.getAccountInfo(tokenAccountPool);
    assert(
      info.amount.toNumber() == DEFAULT_POOL_TOKEN_AMOUNT - POOL_TOKEN_AMOUNT,
    );

    info = await tokenPool.getAccountInfo(feeAccount);
    assert(info.amount.toNumber() == currentFeeAmount + OWNER_SWAP_FEE);

    if (poolAccount != null) {
      info = await tokenPool.getAccountInfo(poolAccount);
      assert(info.amount.toNumber() == HOST_SWAP_FEE);
    }
  });

  it("depositSingleTokenTypeExactAmountIn", async () => {
    // Pool token amount to deposit on one side
    const depositAmount = 10000;

    const poolMintInfo = await tokenPool.getMintInfo();
    const supply = poolMintInfo.supply.toNumber();
    const swapTokenA = await mintA.getAccountInfo(tokenAccountA);
    const poolTokenA = tradingTokensToPoolTokens(
      depositAmount,
      swapTokenA.amount.toNumber(),
      supply,
    );
    const swapTokenB = await mintB.getAccountInfo(tokenAccountB);
    const poolTokenB = tradingTokensToPoolTokens(
      depositAmount,
      swapTokenB.amount.toNumber(),
      supply,
    );

    const userTransferAuthority = Keypair.generate();
    console.log('Creating depositor token a account');
    const userAccountA = await mintA.createAccount(owner.publicKey);
    await mintA.mintTo(userAccountA, owner, [], depositAmount);
    await mintA.approve(
      userAccountA,
      userTransferAuthority.publicKey,
      owner,
      [],
      depositAmount,
    );
    console.log('Creating depositor token b account');
    const userAccountB = await mintB.createAccount(owner.publicKey);
    await mintB.mintTo(userAccountB, owner, [], depositAmount);
    await mintB.approve(
      userAccountB,
      userTransferAuthority.publicKey,
      owner,
      [],
      depositAmount,
    );
    console.log('Creating depositor pool token account');
    const newAccountPool = await tokenPool.createAccount(owner.publicKey);

    const confirmOptions = {
      skipPreflight: true
    }

    console.log('Depositing token A into swap');
    await tokenSwap.depositSingleTokenTypeExactAmountIn(
      userAccountA,
      newAccountPool,
      tokenSwap.mintA,
      TOKEN_PROGRAM_ID,
      userTransferAuthority,
      depositAmount,
      poolTokenA,
      confirmOptions
    );

    let info;
    info = await mintA.getAccountInfo(userAccountA);
    assert(info.amount.toNumber() == 0);
    info = await mintA.getAccountInfo(tokenAccountA);
    assert(info.amount.toNumber() == currentSwapTokenA + depositAmount);
    currentSwapTokenA += depositAmount;

    console.log('Depositing token B into swap');
    await tokenSwap.depositSingleTokenTypeExactAmountIn(
      userAccountB,
      newAccountPool,
      tokenSwap.mintB,
      TOKEN_PROGRAM_ID,
      userTransferAuthority,
      depositAmount,
      poolTokenB,
      confirmOptions
    );

    info = await mintB.getAccountInfo(userAccountB);
    assert(info.amount.toNumber() == 0);
    info = await mintB.getAccountInfo(tokenAccountB);
    assert(info.amount.toNumber() == currentSwapTokenB + depositAmount);
    currentSwapTokenB += depositAmount;
    info = await tokenPool.getAccountInfo(newAccountPool);
    assert(info.amount.toNumber() >= poolTokenA + poolTokenB);
  });

  it("withdrawSingleTokenTypeExactAmountOut", async () => {
    // Pool token amount to withdraw on one side
    const withdrawAmount = 50000;
    const roundingAmount = 1.0001; // make math a little easier

    const poolMintInfo = await tokenPool.getMintInfo();
    const supply = poolMintInfo.supply.toNumber();

    const swapTokenA = await mintA.getAccountInfo(tokenAccountA);
    const swapTokenAPost = swapTokenA.amount.toNumber() - withdrawAmount;
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

    const swapTokenB = await mintB.getAccountInfo(tokenAccountB);
    const swapTokenBPost = swapTokenB.amount.toNumber() - withdrawAmount;
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

    const userTransferAuthority = Keypair.generate();
    console.log('Creating withdraw token a account');
    const userAccountA = await mintA.createAccount(owner.publicKey);
    console.log('Creating withdraw token b account');
    const userAccountB = await mintB.createAccount(owner.publicKey);
    console.log('Creating withdraw pool token account');
    const poolAccount = await tokenPool.getAccountInfo(tokenAccountPool);
    const poolTokenAmount = poolAccount.amount.toNumber();
    await tokenPool.approve(
      tokenAccountPool,
      userTransferAuthority.publicKey,
      owner,
      [],
      adjustedPoolTokenA + adjustedPoolTokenB,
    );

    const confirmOptions = {
      skipPreflight: true
    }

    console.log('Withdrawing token A only');
    await tokenSwap.withdrawSingleTokenTypeExactAmountOut(
      userAccountA,
      tokenAccountPool,
      tokenSwap.mintA,
      TOKEN_PROGRAM_ID,
      userTransferAuthority,
      withdrawAmount,
      adjustedPoolTokenA,
      confirmOptions
    );

    let info;
    info = await mintA.getAccountInfo(userAccountA);
    assert(info.amount.toNumber() == withdrawAmount);
    info = await mintA.getAccountInfo(tokenAccountA);
    assert(info.amount.toNumber() == currentSwapTokenA - withdrawAmount);
    currentSwapTokenA += withdrawAmount;
    info = await tokenPool.getAccountInfo(tokenAccountPool);
    assert(info.amount.toNumber() >= poolTokenAmount - adjustedPoolTokenA);

    console.log('Withdrawing token B only');
    await tokenSwap.withdrawSingleTokenTypeExactAmountOut(
      userAccountB,
      tokenAccountPool,
      tokenSwap.mintB,
      TOKEN_PROGRAM_ID,
      userTransferAuthority,
      withdrawAmount,
      adjustedPoolTokenB,
      confirmOptions
    );

    info = await mintB.getAccountInfo(userAccountB);
    assert(info.amount.toNumber() == withdrawAmount);
    info = await mintB.getAccountInfo(tokenAccountB);
    assert(info.amount.toNumber() == currentSwapTokenB - withdrawAmount);
    currentSwapTokenB += withdrawAmount;
    info = await tokenPool.getAccountInfo(tokenAccountPool);
    assert(
      info.amount.toNumber() >=
      poolTokenAmount - adjustedPoolTokenA - adjustedPoolTokenB,
    );
  });
  */

});
