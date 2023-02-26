import { useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// import { Token } from "@resynth/resynth-sdk";

import { useNetwork } from "../contexts/NetworkProvider";
import { useResynth } from "../contexts/ResynthProvider";
import { useModals } from "../contexts/ModalsProvider";
import { bigIntToTokens } from "../utils/numbers";
import { openTxInExplorer } from "../utils/explore";
import { notify } from "../utils/notify";
import { color, spacing } from "../styles/mixins";
import { Flexbox, Spacer } from "../components/Layout";
import { AccentText } from "../components/Typography";
import { Input, Select, SelectOption } from "../components/Fields";
import { Button, PrimaryButton } from "../components/Buttons";
import { ExternalLink, SwapArrows, UnknownToken } from "../components/Icons";

const SwapContainer = styled(Flexbox)`
  max-width: ${({ theme }) => theme.view.elements.maxWidth};
  margin: ${spacing()} auto;
  padding: ${spacing("lg")};
  background: ${color("base")};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadow.base};
`;

// const SlippageButton = styled(Button)<{ isActive: boolean }>`
//   width: 75px;
//   height: 30px;
//   color: ${color("base")};
//   background: ${color("accent")};
//   border-radius: 50px;

//   ${({ isActive, theme }) => {
//     if (!isActive) return "";

//     return `
//       margin-top: -1px;
//       margin-bottom: 1px;
//       background: ${theme.palette.primary};
//       box-shadow: ${theme.shadow.base};
//     `;
//   }}
// `;

export const Swap = () => {
  const theme = useTheme();
  const { network } = useNetwork();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setIsWalletModalOpen } = useModals();
  const { client, isClientLoading } = useResynth();
  // const { markets, tokens } = client;
  // const marketPairs = Object.values(markets)
  //   .filter((market) => market !== undefined)
  //   .map(
  //     (market) =>
  //       `${market.configuration?.baseSymbol}/${market.configuration?.quoteSymbol}`
  //   );
  // const [isSendingTx, setIsSendingTx] = useState(false);
  // const [wasTxError, setWasTxError] = useState(false);

  // // Token options / input & output tokens
  // const tokenOptions = Object.values(tokens).map((token: Token) => ({
  //   key: token.configuration.mint.toBase58(),
  //   label: token.configuration.symbol,
  //   leftElement: token.configuration.logoUrl ? (
  //     <img
  //       key={token.configuration.mint.toBase58()}
  //       width="20px"
  //       src={token.configuration.logoUrl}
  //       alt={token.configuration.symbol}
  //     />
  //   ) : (
  //     <UnknownToken key={token.configuration.mint.toBase58()} size="20px" />
  //   ),
  //   rightElement: (
  //     <AccentText key={token.configuration.mint.toBase58()} size="xs">
  //       {bigIntToTokens(token.balance, token.configuration.decimals)}
  //     </AccentText>
  //   ),
  // }));
  // const [inputToken, setInputToken] = useState<Token>();
  // const [outputToken, setOutputToken] = useState<Token>();
  // const inputTokenOptions = outputToken
  //   ? tokenOptions.filter(
  //       (token) =>
  //         marketPairs.includes(
  //           `${outputToken.configuration.symbol}/${token.label}`
  //         ) ||
  //         marketPairs.includes(
  //           `${token.label}/${outputToken.configuration.symbol}`
  //         )
  //     )
  //   : tokenOptions;
  // const outputTokenOptions = inputToken
  //   ? tokenOptions.filter(
  //       (token) =>
  //         marketPairs.includes(
  //           `${inputToken.configuration.symbol}/${token.label}`
  //         ) ||
  //         marketPairs.includes(
  //           `${token.label}/${inputToken.configuration.symbol}`
  //         )
  //     )
  //   : tokenOptions;

  // // Current market based on input and output tokens
  // const market =
  //   inputToken &&
  //   outputToken &&
  //   Object.values(markets).filter((market) => {
  //     if (market.configuration) {
  //       const marketPair = `${market.configuration?.baseSymbol}/${market.configuration?.quoteSymbol}`;
  //       return (
  //         marketPair ===
  //           `${inputToken.configuration.symbol}/${outputToken.configuration.symbol}` ||
  //         marketPair ===
  //           `${outputToken.configuration.symbol}/${inputToken.configuration.symbol}`
  //       );
  //     }
  //   })[0];

  // // Swap type and amounts in/out
  // const [swapType, setSwapType] = useState<"exactIn" | "exactOut">("exactIn");
  // // const [slippage, setSlippage] = useState<number | undefined>();
  // const [amountIn, setAmountIn] = useState("");
  // const [amountOut, setAmountOut] = useState("");

  // // Maximum amounts in/out
  // const maxAmountIn = inputToken
  //   ? bigIntToTokens(inputToken.balance, inputToken.configuration.decimals)
  //   : 0;
  // /*
  // const maxAmountOut =
  //   market && inputToken && outputToken
  //     ? Number(
  //         market
  //           .getAmountOut(
  //             inputToken.configuration.symbol,
  //             Number(amountIn),
  //             outputToken.configuration.symbol
  //           )
  //           .toFixed(outputToken.configuration.decimals)
  //       )
  //     : 0;
  // */
  // const maxAmountOut = 0;

  // // Reset all swap data
  // const resetSwapData = () => {
  //   setInputToken(undefined);
  //   setAmountIn("");
  //   setOutputToken(undefined);
  //   setAmountOut("");
  // };

  // // Submit swap transaction
  // const submitSwap = async () => {
  //   if (!market || !wallet.publicKey || !wallet.signTransaction) return;
  //   setIsSendingTx(true);
  //   const notificationId = notify({
  //     content: "Sending transaction...",
  //     type: "loading",
  //   });

  //   let txId = "";
  //   try {
  //     const swapTx = client.makeSwapTransaction(
  //       inputToken.configuration.symbol,
  //       swapType === "exactIn" ? parseFloat(amountIn) : 0,
  //       outputToken.configuration.symbol,
  //       swapType === "exactOut" ? parseFloat(amountOut) : 0
  //     );

  //     txId = await wallet.sendTransaction(swapTx, connection);
  //     console.log("Successful swap: ", txId);
  //   } catch (err) {
  //     console.error(err);
  //   }

  //   setIsSendingTx(false);
  //   notify({
  //     id: notificationId,
  //     content: txId ? (
  //       <Flexbox
  //         alignItems="center"
  //         onClick={() => openTxInExplorer(txId, network)}
  //       >
  //         Your swap of {parseFloat(amountIn).toFixed(2)}{" "}
  //         {inputToken.configuration.symbol} ⇄ {parseFloat(amountOut).toFixed(2)}{" "}
  //         {outputToken.configuration.symbol} was successful.
  //         <ExternalLink color="base" />
  //       </Flexbox>
  //     ) : (
  //       "There was an error processing your swap."
  //     ),
  //     type: txId ? "success" : "error",
  //     style: txId ? { cursor: "pointer" } : undefined,
  //   });

  //   if (txId) {
  //     resetSwapData();
  //   } else {
  //     setWasTxError(true);
  //   }
  // };

  // // Anytime wallet changes, reset inputs
  // useEffect(resetSwapData, [wallet.connected]);

  // // Update amounts in/out on change to their compliment
  // useEffect(() => {
  //   if (!market) return;

  //   // Amount out
  //   if (swapType === "exactIn" && inputToken && amountIn) {
  //     setAmountOut("0");
  //     /*
  //     setAmountOut(
  //       market
  //         .getAmountOut(
  //           inputToken.configuration.symbol,
  //           Number(amountIn),
  //           outputToken.configuration.symbol
  //         )
  //         .toFixed(outputToken.configuration.decimals)
  //     );
  //     */
  //   }

  //   // Amount in
  //   if (swapType === "exactOut" && outputToken && amountOut) {
  //     setAmountIn("0");
  //     /*
  //     setAmountIn(
  //       market
  //         .getAmountIn(
  //           inputToken.configuration.symbol,
  //           outputToken.configuration.symbol,
  //           Number(amountOut)
  //         )
  //         .toFixed(inputToken.configuration.decimals)
  //     );
  //     */
  //   }

  //   setWasTxError(false);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [market, amountIn, amountOut]);

  return (
    <SwapContainer width="95%" alignItems="center" flexColumn>
    </SwapContainer>
  );
};
  //     {/** INPUT DATA **/}
  //     <Flexbox width="100%" justifyContent="space-between" alignItems="center">
  //       <Select
  //         width="40%"
  //         label="Input token"
  //         value={
  //           tokenOptions.filter(
  //             (option: any) =>
  //               option.key === inputToken?.configuration.mint.toBase58()
  //           )[0]
  //         }
  //         options={inputTokenOptions}
  //         noOptionsMessage="No input tokens for this market"
  //         onChange={(token: SelectOption) => setInputToken(tokens[token.label])}
  //         needsValue={wallet.connected && !inputToken}
  //         error={wasTxError}
  //         disabled={isSendingTx || isClientLoading}
  //       />
  //       <Input
  //         width="57.5%"
  //         type="number"
  //         label="Amount in"
  //         value={amountIn}
  //         max={maxAmountIn}
  //         maxButton={{
  //           isActive: !!amountIn && Number(amountIn) === maxAmountIn,
  //           onClick: () => setAmountIn(maxAmountIn.toString()),
  //         }}
  //         onChange={(amount: string) => {
  //           setAmountIn(amount);
  //           setSwapType("exactIn");
  //         }}
  //         needsValue={inputToken && !amountIn}
  //         error={wasTxError}
  //         disabled={!inputToken || isSendingTx || isClientLoading}
  //       />
  //     </Flexbox>

  //     {/** SWITCH DATA **/}
  //     <Flexbox marginY="base">
  //       <Button
  //         onClick={() => {
  //           setInputToken(outputToken);
  //           setAmountIn(amountOut);
  //           setOutputToken(inputToken);
  //           setAmountOut(amountIn);
  //         }}
  //         disabled={isSendingTx || !inputToken || !outputToken}
  //       >
  //         <SwapArrows size={theme.font.size.lg} />
  //       </Button>
  //     </Flexbox>

  //     {/** OUTPUT DATA **/}
  //     <Flexbox width="100%" justifyContent="space-between" alignItems="center">
  //       <Select
  //         width="40%"
  //         label="Output token"
  //         value={
  //           tokenOptions.filter(
  //             (option: any) =>
  //               option.key === outputToken?.configuration.mint.toBase58()
  //           )[0]
  //         }
  //         options={outputTokenOptions}
  //         noOptionsMessage="No output tokens for this market"
  //         onChange={(token: SelectOption) =>
  //           setOutputToken(tokens[token.label])
  //         }
  //         needsValue={wallet.connected && !inputToken}
  //         error={wasTxError}
  //         disabled={isSendingTx || isClientLoading}
  //       />
  //       <Input
  //         width="57.5%"
  //         type="number"
  //         label="Amount out"
  //         value={amountOut}
  //         max={maxAmountOut}
  //         maxButton={{
  //           isActive: !!amountOut && Number(amountOut) === maxAmountOut,
  //           onClick: () => setAmountOut(maxAmountOut.toString()),
  //         }}
  //         onChange={(amount: string) => {
  //           setAmountOut(amount);
  //           setSwapType("exactOut");
  //         }}
  //         needsValue={outputToken && !amountOut}
  //         error={wasTxError}
  //         disabled={!outputToken || isSendingTx || isClientLoading}
  //       />
  //     </Flexbox>

  //     {/** SLIPPAGE **/}
  //     {/* <Flexbox width="95%" flexColumn marginY="xl">
  //       <AccentText>Slippage</AccentText>
  //       <Spacer />
  //       <Flexbox
  //         width="100%"
  //         alignItems="center"
  //         justifyContent="space-between"
  //       >
  //         {[0.001, 0.005, 0.0075, 0.01].map((slipPercentage) => (
  //           <SlippageButton
  //             onClick={() => setSlippage(slipPercentage)}
  //             isActive={slippage === slipPercentage}
  //           >
  //             <BodyText size="xs" weight="bold">
  //               {slipPercentage * 100}%
  //             </BodyText>
  //           </SlippageButton>
  //         ))}
  //         <SlippageButton
  //           onClick={() => setSlippage(undefined)}
  //           isActive={slippage === undefined}
  //         >
  //           <BodyText size="lg" weight="bold">
  //             ∞
  //           </BodyText>
  //         </SlippageButton>
  //       </Flexbox>
  //     </Flexbox> */}

  //     {/** SWAP BUTTON **/}
  //     <Spacer size="xl" />
  //     <PrimaryButton
  //       fullWidth
  //       label={
  //         wallet.connected
  //           ? isSendingTx
  //             ? "Swapping..."
  //             : "Swap"
  //           : "Connect wallet"
  //       }
  //       onClick={() => {
  //         if (isClientLoading || isSendingTx) return;

  //         if (wallet.connected) {
  //           submitSwap();
  //         } else {
  //           setIsWalletModalOpen(true);
  //         }
  //       }}
  //       isLoading={isClientLoading}
  //       disabled={
  //         isClientLoading ||
  //         isSendingTx ||
  //         (wallet.connected &&
  //           (!inputToken || !amountIn || !outputToken || !amountOut))
  //       }
  //     />
