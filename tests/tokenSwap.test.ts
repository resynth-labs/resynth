import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AccountLayout, approveChecked, createApproveInstruction, createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { assert } from "chai";
import { Fees, SwapCurveType, swapPoolPDA, TokenFaucetClient, TokenSwapClient } from "../sdk/src";

function sleep(ms: number): Promise<boolean> {
  return new Promise((res) => {
    setTimeout(() => res(true), ms);
  });
}

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

  // function tradingTokensToPoolTokens(
  //   sourceAmount: number,
  //   swapSourceAmount: number,
  //   poolAmount: number,
  // ): number {
  //   const tradingFee =
  //     (sourceAmount / 2) * (TRADING_FEE_NUMERATOR / TRADING_FEE_DENOMINATOR);
  //   const ownerTradingFee =
  //     (sourceAmount / 2) * (OWNER_TRADING_FEE_NUMERATOR / OWNER_TRADING_FEE_DENOMINATOR);
  //   const sourceAmountPostFee = sourceAmount - tradingFee - ownerTradingFee;
  //   const root = Math.sqrt(sourceAmountPostFee / swapSourceAmount + 1);
  //   return Math.floor(poolAmount * (root - 1));
  // }

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

    // TODO is there a better way to destructure this?
    const pdas = swapPoolPDA(tokenSwap.program.programId, mintA, mintB);
    swapPool = pdas.swapPool;
    authority = pdas.authority;
    vaultA = pdas.vaultA;
    vaultB = pdas.vaultB;
    lpmint = pdas.lpmint;

    feeReceiver = await getAssociatedTokenAddressSync(lpmint, feeReceiverWallet.publicKey);

    userAccountA = await getAssociatedTokenAddressSync(mintA, user.publicKey);
    userAccountB = await getAssociatedTokenAddressSync(mintB, user.publicKey);
    userPoolTokenAccount = await getAssociatedTokenAddressSync(lpmint, user.publicKey);

    await tokenSwap.provider.sendAndConfirm(new Transaction().add(
      createAssociatedTokenAccountInstruction(
        tokenSwap.wallet.publicKey,
        userAccountA,
        user.publicKey,
        mintA,
      ),
      createAssociatedTokenAccountInstruction(
        tokenSwap.wallet.publicKey,
        userAccountB,
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

    const userTransferAuthority = Keypair.generate();

    await tokenFaucet.airdrop({
      amount: new BN(currentSwapTokenA),
      faucet: faucetA,
      mint: mintA,
      tokenAccount: userAccountA,
    });
    await approveChecked(
      tokenSwap.connection,
      tokenSwap.wallet.payer,
      mintA,
      userAccountA,
      userTransferAuthority.publicKey,
      user,
      currentSwapTokenA,
      mintADecimals,
    );

    await tokenFaucet.airdrop({
      amount: new BN(currentSwapTokenB),
      faucet: faucetB,
      mint: mintB,
      tokenAccount: userAccountB,
    });
    await approveChecked(
      tokenSwap.connection,
      tokenSwap.wallet.payer,
      mintB,
      userAccountB,
      userTransferAuthority.publicKey,
      user,
      currentSwapTokenB,
      mintBDecimals,
    );

    console.log('creating token swap');
    await tokenSwap.initializeSwapPool({
      fees,
      swapCurveType: SwapCurveType.ConstantProductCurve,
      tokenBPriceOrOffset: new BN(0),
      initialTokenAAmount: new BN(currentSwapTokenA),
      initialTokenBAmount: new BN(currentSwapTokenB),
      feeReceiver,
      feeReceiverWallet: feeReceiverWallet.publicKey,
      mintA,
      mintB,
      source: user.publicKey,
      userTransferAuthority,
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
    assert(fetchedSwapPool.swapCurveType['constantProductCurve']);

    assert(Number(MintLayout.decode((await tokenSwap.connection.getAccountInfo(lpmint)).data).supply) == DEFAULT_POOL_TOKEN_AMOUNT);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userPoolTokenAccount)).data).amount) == DEFAULT_POOL_TOKEN_AMOUNT);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA)).data).amount) == 0);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB)).data).amount) == 0);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA)).data).amount) == currentSwapTokenA);
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB)).data).amount) == currentSwapTokenB);
  });

  it("depositAllTokenTypes", async () => {
    const supply = Number(MintLayout.decode((await tokenSwap.connection.getAccountInfo(lpmint)).data).supply);
    const tokenAmountA = Math.floor(
      (Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA)).data).amount) * POOL_TOKEN_AMOUNT) / supply,
    );
    const tokenAmountB = Math.floor(
      (Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB)).data).amount) * POOL_TOKEN_AMOUNT) / supply,
    );

    console.log(`Depositing ${tokenAmountA} token a and ${tokenAmountB} token b`);
    const userTransferAuthority = Keypair.generate();
    await tokenFaucet.airdrop({
      amount: new BN(tokenAmountA),
      faucet: faucetA,
      mint: mintA,
      tokenAccount: userAccountA,
    });
    await approveChecked(
      tokenSwap.connection,
      tokenSwap.wallet.payer,
      mintA,
      userAccountA,
      userTransferAuthority.publicKey,
      user,
      tokenAmountA,
      mintADecimals,
    );

    await tokenFaucet.airdrop({
      amount: new BN(tokenAmountB),
      faucet: faucetB,
      mint: mintB,
      tokenAccount: userAccountB,
    });
    await approveChecked(
      tokenSwap.connection,
      tokenSwap.wallet.payer,
      mintB,
      userAccountB,
      userTransferAuthority.publicKey,
      user,
      tokenAmountB,
      mintBDecimals,
    );

    if (await tokenSwap.connection.getAccountInfo(userPoolTokenAccount) == null) {
      console.log('Creating depositor pool token account');
      await createAssociatedTokenAccount(
        tokenSwap.connection,
        tokenSwap.wallet.payer,
        lpmint,
        user.publicKey,
      );
    }

    console.log('Depositing into swap');
    await tokenSwap.depositAllTokenTypes({
      poolTokenAmount: new BN(POOL_TOKEN_AMOUNT),
      maximumTokenAAmount: new BN(tokenAmountA),
      maximumTokenBAmount: new BN(tokenAmountB),
      swapPool,
      authority,
      source: user.publicKey,
      userTransferAuthority,
      tokenA: userAccountA,
      tokenB: userAccountB,
      vaultA,
      vaultB,
      lpmint,
      lptoken: userPoolTokenAccount,
      mintA,
      mintB,
    });

    let info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA)).data);
    assert(Number(info.amount) == 0);
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB)).data);
    assert(Number(info.amount) == 0);
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA)).data);
    assert(Number(info.amount) == currentSwapTokenA + tokenAmountA);
    currentSwapTokenA += tokenAmountA;
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB)).data);
    assert(Number(info.amount) == currentSwapTokenB + tokenAmountB);
    currentSwapTokenB += tokenAmountB;
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userPoolTokenAccount)).data);
    assert(Number(info.amount) == DEFAULT_POOL_TOKEN_AMOUNT + POOL_TOKEN_AMOUNT);
  });

  it("withdrawAllTokenTypes", async () => {
    const supply = Number(MintLayout.decode((await tokenSwap.connection.getAccountInfo(lpmint)).data).supply);
    let feeAmount = 0;
    if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0) {
      feeAmount = Math.floor(
        (POOL_TOKEN_AMOUNT * OWNER_WITHDRAW_FEE_NUMERATOR) /
        OWNER_WITHDRAW_FEE_DENOMINATOR,
      );
    }
    const poolTokenAmount = POOL_TOKEN_AMOUNT - feeAmount;
    const tokenAmountA = Math.floor(
      (Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA)).data).amount) * poolTokenAmount) / supply,
    );
    const tokenAmountB = Math.floor(
      (Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB)).data).amount) * poolTokenAmount) / supply,
    );

    const userTransferAuthority = Keypair.generate();
    console.log('Approving withdrawal from pool account');
    await approveChecked(
      tokenSwap.connection,
      tokenSwap.wallet.payer,
      lpmint,
      userPoolTokenAccount,
      userTransferAuthority.publicKey,
      user,
      POOL_TOKEN_AMOUNT,
      lpmintDecimals,
    );

    console.log('Withdrawing pool tokens for A and B tokens');
    await tokenSwap.withdrawAllTokenTypes({
      poolTokenAmount: new BN(POOL_TOKEN_AMOUNT),
      minimumTokenAAmount: new BN(tokenAmountA),
      minimumTokenBAmount: new BN(tokenAmountB),
      swapPool,
      authority,
      source: user.publicKey,
      userTransferAuthority,
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

    let info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userPoolTokenAccount)).data);
    assert(
      Number(info.amount) == DEFAULT_POOL_TOKEN_AMOUNT,
    );
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA)).data).amount) == currentSwapTokenA - tokenAmountA);
    currentSwapTokenA -= tokenAmountA;
    assert(Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB)).data).amount) == currentSwapTokenB - tokenAmountB);
    currentSwapTokenB -= tokenAmountB;
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountA)).data);
    assert(Number(info.amount) == tokenAmountA);
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(userAccountB)).data);
    assert(Number(info.amount) == tokenAmountB);
    info = AccountLayout.decode((await tokenSwap.connection.getAccountInfo(feeReceiver)).data);
    assert(Number(info.amount) == feeAmount);
    currentFeeAmount = feeAmount;
  });

  it("createAccountAndSwapAtomic", async () => {
    console.log('Creating swap token a account');
    const swappper = Keypair.generate();

    const swapperAccountA = await createAssociatedTokenAccount(tokenSwap.connection, tokenSwap.wallet.payer, mintA, swappper.publicKey);

    await tokenFaucet.airdrop({
      amount: new BN(SWAP_AMOUNT_IN),
      faucet: faucetA,
      mint: mintA,
      tokenAccount: swapperAccountA,
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
    tokenSwap.provider.sendAndConfirm(transaction, [swappper, userTransferAuthority], { commitment: "confirmed" });

    currentSwapTokenA = Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultA)).data).amount);
    currentSwapTokenB = Number(AccountLayout.decode((await tokenSwap.connection.getAccountInfo(vaultB)).data).amount);
  });

  /*
  it("swap", async () => {
    // console.log('Creating swap token a account');
    // let userAccountA = await mintA.createAccount(owner.publicKey);
    // await mintA.mintTo(userAccountA, owner, [], SWAP_AMOUNT_IN);
    // const userTransferAuthority = Keypair.generate();
    // await mintA.approve(
    //   userAccountA,
    //   userTransferAuthority.publicKey,
    //   owner,
    //   [],
    //   SWAP_AMOUNT_IN,
    // );
    // console.log('Creating swap token b account');
    // let userAccountB = await mintB.createAccount(owner.publicKey);
    // let poolAccount = SWAP_PROGRAM_OWNER_FEE_ADDRESS
    //   ? await tokenPool.createAccount(owner.publicKey)
    //   : null;

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

    // await sleep(500);

    // let info;
    // info = await mintA.getAccountInfo(userAccountA);
    // assert(info.amount.toNumber() == 0);

    // info = await mintB.getAccountInfo(userAccountB);
    // assert(info.amount.toNumber() == SWAP_AMOUNT_OUT);

    // info = await mintA.getAccountInfo(tokenAccountA);
    // assert(info.amount.toNumber() == currentSwapTokenA + SWAP_AMOUNT_IN);
    // currentSwapTokenA += SWAP_AMOUNT_IN;

    // info = await mintB.getAccountInfo(tokenAccountB);
    // assert(info.amount.toNumber() == currentSwapTokenB - SWAP_AMOUNT_OUT);
    // currentSwapTokenB -= SWAP_AMOUNT_OUT;

    // info = await tokenPool.getAccountInfo(tokenAccountPool);
    // assert(
    //   info.amount.toNumber() == DEFAULT_POOL_TOKEN_AMOUNT - POOL_TOKEN_AMOUNT,
    // );

    // info = await tokenPool.getAccountInfo(feeAccount);
    // assert(info.amount.toNumber() == currentFeeAmount + OWNER_SWAP_FEE);

    // if (poolAccount != null) {
    //   info = await tokenPool.getAccountInfo(poolAccount);
    //   assert(info.amount.toNumber() == HOST_SWAP_FEE);
    // }
  });

  it("depositSingleTokenTypeExactAmountIn", async () => {
    // // Pool token amount to deposit on one side
    // const depositAmount = 10000;

    // const poolMintInfo = await tokenPool.getMintInfo();
    // const supply = poolMintInfo.supply.toNumber();
    // const swapTokenA = await mintA.getAccountInfo(tokenAccountA);
    // const poolTokenA = tradingTokensToPoolTokens(
    //   depositAmount,
    //   swapTokenA.amount.toNumber(),
    //   supply,
    // );
    // const swapTokenB = await mintB.getAccountInfo(tokenAccountB);
    // const poolTokenB = tradingTokensToPoolTokens(
    //   depositAmount,
    //   swapTokenB.amount.toNumber(),
    //   supply,
    // );

    // const userTransferAuthority = Keypair.generate();
    // console.log('Creating depositor token a account');
    // const userAccountA = await mintA.createAccount(owner.publicKey);
    // await mintA.mintTo(userAccountA, owner, [], depositAmount);
    // await mintA.approve(
    //   userAccountA,
    //   userTransferAuthority.publicKey,
    //   owner,
    //   [],
    //   depositAmount,
    // );
    // console.log('Creating depositor token b account');
    // const userAccountB = await mintB.createAccount(owner.publicKey);
    // await mintB.mintTo(userAccountB, owner, [], depositAmount);
    // await mintB.approve(
    //   userAccountB,
    //   userTransferAuthority.publicKey,
    //   owner,
    //   [],
    //   depositAmount,
    // );
    // console.log('Creating depositor pool token account');
    // const newAccountPool = await tokenPool.createAccount(owner.publicKey);

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

    // let info;
    // info = await mintA.getAccountInfo(userAccountA);
    // assert(info.amount.toNumber() == 0);
    // info = await mintA.getAccountInfo(tokenAccountA);
    // assert(info.amount.toNumber() == currentSwapTokenA + depositAmount);
    // currentSwapTokenA += depositAmount;

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

    // info = await mintB.getAccountInfo(userAccountB);
    // assert(info.amount.toNumber() == 0);
    // info = await mintB.getAccountInfo(tokenAccountB);
    // assert(info.amount.toNumber() == currentSwapTokenB + depositAmount);
    // currentSwapTokenB += depositAmount;
    // info = await tokenPool.getAccountInfo(newAccountPool);
    // assert(info.amount.toNumber() >= poolTokenA + poolTokenB);
  });

  it("withdrawSingleTokenTypeExactAmountOut", async () => {
    // // Pool token amount to withdraw on one side
    // const withdrawAmount = 50000;
    // const roundingAmount = 1.0001; // make math a little easier

    // const poolMintInfo = await tokenPool.getMintInfo();
    // const supply = poolMintInfo.supply.toNumber();

    // const swapTokenA = await mintA.getAccountInfo(tokenAccountA);
    // const swapTokenAPost = swapTokenA.amount.toNumber() - withdrawAmount;
    // const poolTokenA = tradingTokensToPoolTokens(
    //   withdrawAmount,
    //   swapTokenAPost,
    //   supply,
    // );
    // let adjustedPoolTokenA = poolTokenA * roundingAmount;
    // if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0) {
    //   adjustedPoolTokenA *=
    //     1 + OWNER_WITHDRAW_FEE_NUMERATOR / OWNER_WITHDRAW_FEE_DENOMINATOR;
    // }

    // const swapTokenB = await mintB.getAccountInfo(tokenAccountB);
    // const swapTokenBPost = swapTokenB.amount.toNumber() - withdrawAmount;
    // const poolTokenB = tradingTokensToPoolTokens(
    //   withdrawAmount,
    //   swapTokenBPost,
    //   supply,
    // );
    // let adjustedPoolTokenB = poolTokenB * roundingAmount;
    // if (OWNER_WITHDRAW_FEE_NUMERATOR !== 0) {
    //   adjustedPoolTokenB *=
    //     1 + OWNER_WITHDRAW_FEE_NUMERATOR / OWNER_WITHDRAW_FEE_DENOMINATOR;
    // }

    // const userTransferAuthority = Keypair.generate();
    // console.log('Creating withdraw token a account');
    // const userAccountA = await mintA.createAccount(owner.publicKey);
    // console.log('Creating withdraw token b account');
    // const userAccountB = await mintB.createAccount(owner.publicKey);
    // console.log('Creating withdraw pool token account');
    // const poolAccount = await tokenPool.getAccountInfo(tokenAccountPool);
    // const poolTokenAmount = poolAccount.amount.toNumber();
    // await tokenPool.approve(
    //   tokenAccountPool,
    //   userTransferAuthority.publicKey,
    //   owner,
    //   [],
    //   adjustedPoolTokenA + adjustedPoolTokenB,
    // );

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

    // let info;
    // info = await mintA.getAccountInfo(userAccountA);
    // assert(info.amount.toNumber() == withdrawAmount);
    // info = await mintA.getAccountInfo(tokenAccountA);
    // assert(info.amount.toNumber() == currentSwapTokenA - withdrawAmount);
    // currentSwapTokenA += withdrawAmount;
    // info = await tokenPool.getAccountInfo(tokenAccountPool);
    // assert(info.amount.toNumber() >= poolTokenAmount - adjustedPoolTokenA);

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

    // info = await mintB.getAccountInfo(userAccountB);
    // assert(info.amount.toNumber() == withdrawAmount);
    // info = await mintB.getAccountInfo(tokenAccountB);
    // assert(info.amount.toNumber() == currentSwapTokenB - withdrawAmount);
    // currentSwapTokenB += withdrawAmount;
    // info = await tokenPool.getAccountInfo(tokenAccountPool);
    // assert(
    //   info.amount.toNumber() >=
    //   poolTokenAmount - adjustedPoolTokenA - adjustedPoolTokenB,
    // );
  });
  */

});
