import assert from "assert";
import { Address } from "@coral-xyz/anchor";

/**
 * Print oracle config to the console
 * {
 *   "nXAU":{"class":"Metal","oracle":"8y3WWjvmSmVGWVKH1rCA7VTRmuU7QbJ9axafSsBX5FcD","base":"USD","quote":"XAU"},
 *   "nXAG": ..
 * }
 **/
// Run with ts-node -T ..

type AssetClass = "Crypto" | "Equity" | "FX" | "Metal";

type Region = "US" | "GB";

interface Oracle {
  /** The asset class, crypto, equity, FX, or metal */
  class: AssetClass;
  /** The equity region, US, GB or undefined */
  region?: Region;
  /** The oracle address to derive all accounts */
  oracle: Address;
  /** The oracle pair, like ETH/USD */
  pair: string;
  /** The oracle base currency, like USD */
  base: string;
  /** The oracle quote currency, like ETH */
  quote: string;
}

async function main() {
  console.log("{");
  for (const entry of Object.entries(rawOraclesMainnet)) {
    const token = getToken(entry[0], entry[1]);

    console.log(`  "n${token.quote}":${JSON.stringify(token)},`);
  }
  console.log("}");
}

export function getToken(oracleLabel: string, oracleAddress: string): Oracle {
  if (!oracleAddress) {
    throw new Error(`oracle not found, ${oracleLabel}`);
  }

  const split = oracleLabel.split(".");

  assert(split.length === 2 || split.length === 3);

  // asset class is the first item
  const assetClass = split[0] as AssetClass;
  const pair = split[split.length - 1];
  const [quote, base] = pair.split("/");
  const region: Region | undefined = (
    split.length === 3 ? split[1] : undefined
  ) as Region | undefined;

  const token: Oracle = {
    class: assetClass,
    oracle: oracleAddress,
    pair,
    base,
    quote,
  };

  if (region) {
    token.region = region;
  }

  return token;
}

/** This is all solana mainnet oracles,
 * excluding several USD/XXX FX pairs.
 * CVX equity has been renamed to CHEVRON, it conflicted with crypto CVX Convex.
 */
const rawOraclesMainnet = {
  "Crypto.1INCH/USD": "7jAVut34sgRj6erznsYvLYvjc9GJwXTpN88ThZSDJ65G",
  "Crypto.AAVE/USD": "3wDLxH34Yz8tGjwHszQ2MfzHwRoaQgKA32uq2bRpjJBW",
  "Crypto.ACM/USD": "DkJYJzmWJTM5n6DhpSASSbCbkSZBfBuejGMQgdCSdG6S",
  "Crypto.ADA/USD": "3pyn4svBbxJ9Wnn3RVeafyLWfzie6yC5eTig2S62v9SC",
  "Crypto.ALGO/USD": "HqFyq1wh1xKvL7KDqqT7NJeSPdAqsDqnmBisUC2XdXAX",
  "Crypto.ALICE/USD": "EnQvR2SDjrZ6KW9vjiiEj858SuJ8GAFZtyEoLiM3KXmR",
  "Crypto.ALPACA/USD": "AjPqQDnU57QmpwrxGMYgrE4gnC9A45foEGhHQ6bksmhw",
  "Crypto.ALPINE/USD": "BDjSnCA2KAxT52jBakjqUKYNWuzFcBcAJuswduRxE9YH",
  "Crypto.AMB/USD": "DorJuUQkqSLwop7ZgeVgRdCm1UpU6P6PAKHTvc5oCf4e",
  "Crypto.AMP/USD": "FEahUmcozi3aVvEFGqaKhE7VRN9Kde9sXoFt4vJMu2fx",
  "Crypto.ANC/USD": "8Lf8PjxiEV9qtvG2ERmbqiLBmYRYBUhP5bPYYppEraJ7",
  "Crypto.APE/USD": "2TdKEvPTKpDtJo6pwxd79atZFQNWiSUT2T47nF9j5qFy",
  "Crypto.APT/USD": "FNNvb1AFDnDVPkocEri8mWbJ1952HQZtFLuwPiUjSJQ",
  "Crypto.ARG/USD": "3Ptsk2n47MdzyWRxxqTmTBPXchSgKeps28DPhfNjmwnt",
  "Crypto.ASR/USD": "DREnv2yUicrGMjbWrwfjP2CkTyo9HCX8kxkk93SG1JLB",
  "Crypto.ATLAS/USD": "81Rz3i7MC9nHYo1vQg6kJM5hepjqb63Y1gnr3AkrD36D",
  "Crypto.ATM/USD": "AgtZ5HDwpEUx7E6HCPj8WuePCQT5CYsXAQunaqPhuaqE",
  "Crypto.ATOM/USD": "CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN",
  "Crypto.AURORA/USD": "4CN6wptBvspBswRuG4SdCfZ5aLs9QwQW7yMX6mZLER8Q",
  "Crypto.AUTO/USD": "ESqFGzXe7amt6EjTdcRGwGjs4ZorDJBfpuwzqAHS8hJS",
  "Crypto.AVAX/USD": "Ax9ujW5B9oqcv59N8m6f1BpTBq2rGeGaBcpKjC5UYsXU",
  "Crypto.AXS/USD": "DNpsJ5PqsYbhN2RCbswBQXgvyywEiVF9VJnszvnkEKVh",
  "Crypto.BANANA/USD": "AjKQToyCGpHzA5cm6yqJMLQZAeaV2a7QgrXV48rDpb1b",
  "Crypto.BAR/USD": "BaQXoM8otNhHNzZLc7L8fWruYTtduShr4TMvViWxyyAe",
  "Crypto.BCH/USD": "5ALDzwcRJfSyGdGyhP3kP628aqBNHZzLuVww7o9kdspe",
  "Crypto.BETH/USD": "9b5KLoW4BDi3S9A35pKjVpVCAGjxArh6R8H45tqFA4As",
  "Crypto.BIFI/USD": "8bKz3jMDqvnbL83ivqovDZqepZkVS9cWgsyBE2csLUti",
  "Crypto.BIT/USD": "8apEP8G5ZThPSXsff11nMoBmwo3nU176EEFZHM6jzLox",
  "Crypto.BLUR/USD": "9yoZqrXpNpP8vfE7XhN3jPxzALpFA8C5Nvs1RNXQigCQ",
  "Crypto.BNB/USD": "4CkQJBxhU8EZ2UjhigbtdaPbpTe6mqf811fipYBFbSYN",
  "Crypto.BNX/USD": "71zVFi5tkWhZraw48Bjx77jGXdGhk5vSDeo2aHDVtY7k",
  "Crypto.BONK/USD": "8ihFLu5FimgTQ1Unh4dVyEHUGodJ5gJQCrQf4KUVB9bN",
  "Crypto.BRZ/USD": "2wrWGm63xWubz7ue4iYR3qvBbaUJhZVi4eSpNuU8k8iF",
  "Crypto.BSW/USD": "5uCb1mZ5YJRVEmfRRAi4pWM7T92eXfeULC4BcmYjwQjF",
  "Crypto.BTC/USD": "GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU",
  "Crypto.BTT/USD": "e3agiUKMg3AW5wNN3sYMDtfzPRdwDfrgdgudyRFUtpk",
  "Crypto.BUSD/USD": "7BHyT7XPMSA6LHYTgDTaeTPe3KTkKibMXZNxF5kiVsw1",
  "Crypto.C98/USD": "45rTB9ezDcTX5tMZx2uJUBbBEqAWDhXykYbBfaSWUXvD",
  "Crypto.CAKE/USD": "3NwwDpM8EX6vrpogtWVrfE7FvCumLbguXDqVE1NNegbJ",
  "Crypto.CBETH/USD": "2Ub3m4JoNtLGeb3VaPaJNbG5R2CUA29LkQhaaB5xcpYE",
  "Crypto.CELO/USD": "9SWiag8E2zG3hF4UL8VzXU84hqZwfEVqvCeyqwfTdfAp",
  "Crypto.CHR/USD": "DjxokrpJxFVU86JhnDv64YUwemQtWdXh7xkpRYVDif7C",
  "Crypto.CHZ/USD": "Gb5LWEh4cnm8N6R4CVnnAfstzc6v25PY4noxnjHY6vF5",
  "Crypto.CITY/USD": "BX3vuJjk4KaCRXmT1WcnsNwSjYvV5vk9wMCUR1yF1mT9",
  "Crypto.COPE/USD": "9xYBiDWYsh2fHzpsz3aaCnNHCKWBNtfEDLtU6kS4aFD9",
  "Crypto.COW/USD": "6Gktp5YoeA5desPTs8mgPbdsCHVkuYQNVKsjrZuSgdj3",
  "Crypto.CRO/USD": "3N1vJmJuhMH86w2P4YvNw9gz3LCrLsyJjnxLE28uUrC5",
  "Crypto.CRV/USD": "BssWQpang2G5ioc8FVdecffVSTLfQkqyRdgqn3zVnnhV",
  "Crypto.CUSD/USD": "Adix7ZMPUXxmbKJxbf4JmgLPfAkM4GbzRxDRPxReKYGA",
  "Crypto.CVX/USD": "8BQg4YBtjuaNcnhhQHfUtrEkR5PMq972pVvEwxov1zMT",
  "Crypto.DAI/USD": "CtJ8EkqLmeYyGB8s4jevpeNsvmD4dxVR2krfsDLcvV8Y",
  "Crypto.DAR/USD": "FNNtefq4ugrbxNwk9x1sRtSmY6YVF5w7YYdzd51nTKUZ",
  "Crypto.DOGE/USD": "FsSM3s38PX9K7Dn6eGzuE29S2Dsk1Sss1baytTQdCaQj",
  "Crypto.DOT/USD": "EcV1X1gY2yb4KXxjVQtTHTbioum2gvmPnFk4zYAt7zne",
  "Crypto.DYDX/USD": "7mTNndBZ47etksui45AHZKPa5wd4vG3kwvUziXNVNF9k",
  "Crypto.ETH/USD": "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB",
  "Crypto.FET/USD": "DVLSBiYJphKBZxJnKwmENeVWnGkh5UdQp9hPhqSZEmE7",
  "Crypto.FIDA/USD": "ETp9eKXVv1dWwHSpsXRUuXHmw24PwRkttCGVgpZEY9zF",
  "Crypto.FIL/USD": "2R96x9iQSB4i4NuYJ57aiv4AeBrcGtKm4yiEN3HM3NxM",
  "Crypto.FLOKI/USD": "8CysoCDUkjFowt4V93Ji8FGyjVw9MhE5eZbEeGvtm1KG",
  "Crypto.FLOW/USD": "4DBpxHBnKFTjq51b4Tz5x82X8xPCnnsnrvUSmXkU1rw1",
  "Crypto.FTM/USD": "7Dn52EY5EGE8Nvvw98KVMGPWTiTGn3PF4y24TVLyXdT9",
  "Crypto.FTT/USD": "8JPJJkmDScpcNmBRKGZuPuG2GYAveQgP3t5gFuMymwvF",
  "Crypto.FXS/USD": "8mNDGq7qw8YhqkP93zMFd6Wjg7h2gAG9oUBgadL9eGJL",
  "Crypto.GAL/USD": "4EfndRZ19jKkYhHq6QA4iSUxDtpGM4sqwC53UrynwBer",
  "Crypto.GALA/USD": "WJ4BLQwr2i3no5pJXGZgpNRsY5CwHSUpHHpq6JzG5cC",
  "Crypto.GMT/USD": "DZYZkJcFJThN9nZy4nK3hrHra1LaWeiyoZ9SMdLFEFpY",
  "Crypto.GOFX/USD": "7UYk5yhrQtFbZV2bLX1gtqN7QdU9xpBMyAk7tFgoTatk",
  "Crypto.HAY/USD": "5QYZz56i9MBwmRoKwQN1YW1iiwLv1WUZrJdtoh4MHwgY",
  "Crypto.HNT/USD": "7moA1i5vQUpfDwSpK6Pw9s56ahB7WFGidtbL2ujWrVvm",
  "Crypto.HXRO/USD": "B47CC1ULLw1jKTSsr1N1198zrUHp3LPduzepJyzgLn2g",
  "Crypto.INJ/USD": "9EdtbaivHQYA4Nh3XzGR6DwRaoorqXYnmpfsnFhvwuVj",
  "Crypto.INTER/USD": "C4u5Yffovuukj8FzH5aSRM8qBz2L3t1Pcrgqps4H7kDg",
  "Crypto.ITA/USD": "CAgaXU1ZTcRtTMHXA4qcrHmVgb9n99VkRy9KFX74szup",
  "Crypto.JET/USD": "9j2xgDVWMY4WZXSj4AL4asCBtzCXz8jqRcDMbcVeZgNU",
  "Crypto.JITOSOL/USD": "7yyaeuJ1GGtVBLT2z2xub5ZWYKaNhF28mj1RdV4VDFVk",
  "Crypto.JST/USD": "H34QeZNfyZvrg6osG7vANdgyZUWfTQPUXHfmziaoMSTx",
  "Crypto.JUV/USD": "Ca1CYqcazjiLrxg1wBZcXcCoYuhiHL94yNRxa8EtStXA",
  "Crypto.KCS/USD": "EWMFtKAoHgkXiQMWHiHFfGhhHpjYocyAFhbuEV98f6CW",
  "Crypto.LAZIO/USD": "F8ARXC8mnUaskDrCN1UgoaN2X1DV7fUKGzDFNCY7xceY",
  "Crypto.LINK/USD": "ALdkqQDMfHNg77oCNskfX751kHys4KE7SFuZzuKaN536",
  "Crypto.LTC/USD": "8RMnV1eD55iqUFJLMguPkYBkq8DCtx81XcmAja93LvRR",
  "Crypto.LUNA/USD": "GXwvSeEvZ5a1f1tdNSQBRcmRaQ73AxJTi7w6FmCrdiyn",
  "Crypto.LUNC/USD": "5bmWuR1dgP4avtGYMNKLuxumZTVKGgoN2BCMXWDNL9nY",
  "Crypto.MATIC/USD": "7KVswB9vkCgeM3SHP7aGDijvdRAHK8P5wi9JXViCrtYh",
  "Crypto.MBOX/USD": "2emufxAcbS8VM3J5TMec4Fjx3ums8iKPFrXuUG4FDF3z",
  "Crypto.MDX/USD": "4zPGCR7B6Q18Go6Xak8VT7QZG8zvAcfhw3eBSc3j9fef",
  "Crypto.MEAN/USD": "3gRmkxULkty8XmiGidbGT8Kt9EnfsJgruacKA4ykeseC",
  "Crypto.MER/USD": "G4AQpTYKH1Fmg38VpFQbv6uKYQMpRhJzNPALhp7hqdrs",
  "Crypto.MIR/USD": "m24crrKFG5jw5ySpvb1k83PRFKVUgzTRm4uvK2WYZtX",
  "Crypto.MNGO/USD": "79wm3jjcPr6RaNQ4DGvP5KxG1mNd3gEBsg6FsNVFezK4",
  "Crypto.MSOL/USD": "E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9",
  "Crypto.NEAR/USD": "ECSFWQ1bnnpqPVvoy9237t2wddZAaHisW88mYxuEHKWf",
  "Crypto.NFT/USD": "FRYvkUuRw72E55NxQEmmyrBSNmFPPurhfSrviVJGxHNe",
  "Crypto.OG/USD": "NmHXWXsierXEpwsvJxjq7Wm3JfVgPwLpgneHmFtojHS",
  "Crypto.OMI/USD": "TkEA78PckPktSY43gFvY2VKRM131GSJSHaXs12PmzHi",
  "Crypto.ONE/USD": "EHkW5sh588isxidKdTvpmBgRQTg9fta6qQMcWQirPVD2",
  "Crypto.OP/USD": "4o4CUwzFwLqCvmA5x1G4VzoZkAhAcbiuiYyjWX1CVbY2",
  "Crypto.ORCA/USD": "4ivThkX8uRxBpHsdWSqyXYihzKF3zpRGAUCqyuagnLoV",
  "Crypto.PINKSALE/USD": "7QFhdpnLNUWk97dvbZg1SUm4kvp2KQJZNuMcN5pqZjwb",
  "Crypto.POR/USD": "8YUhtrcZ85wXwo58ZGoky2JoLHzN4f9EHofB5hsuYWaz",
  "Crypto.PORT/USD": "jrMH4afMEodMqirQ7P89q5bGNJxD8uceELcsZaVBDeh",
  "Crypto.PORTO/USD": "ADM4YMVzHeDh41889f6bqzKtYqgL3tAMMWyxiEBYxXQn",
  "Crypto.PSG/USD": "57gm1MSpiFzciPrHtPYeL9SoVw3vavv2bUCLGZkpmxsT",
  "Crypto.RACA/USD": "J2hxDFKn1h5juw9ewLaCT2i3Kw2GBR2romUFASH9yz9R",
  "Crypto.RAY/USD": "AnLf8tVYCM816gmBjiy8n53eXKKEDydT5piYjjQDPgTB",
  "Crypto.RETH/USD": "Bn9Ee7ZY5gxRjkbVDW66X1SSRiuAPGD2Phd1818MpJFC",
  "Crypto.SAMO/USD": "5wRjzrwWZG3af3FE26ZrRj3s8A3BVNyeJ9Pt9Uf2ogdf",
  "Crypto.SANTOS/USD": "3cb5eWkW5MBKpnv8iyJaftRUzHR8XmLZ7yVMm4FXgvHa",
  "Crypto.SBR/USD": "8Td9VML1nHxQK6M8VVyzsHo32D7VBk72jSpa9U861z2A",
  "Crypto.SCNSOL/USD": "25yGzWV5okF7aLivSCE4xnjVUPowQcThhhx5Q2fgFhkm",
  "Crypto.SFP/USD": "EbBjuFyFgeYEjGoiT3DwZmqPiXTyUwZ1qTMF3h5Xi5mk",
  "Crypto.SHIB/USD": "HD7fKr26unn2521YNNKeV7o45c4qzpzbNMceg2NCysE1",
  "Crypto.SLND/USD": "HkGEau5xY1e8REXUFbwvWWvyJGywkgiAZZFpryyraWqJ",
  "Crypto.SNY/USD": "BkN8hYgRjhyH5WNBQfDV73ivvdqNKfonCMhiYVJ1D9n9",
  "Crypto.SOL/USD": "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG",
  "Crypto.SRM/USD": "3NBReDRTLKMQEKiLD5tGcx4kXbTf88b7f2xLS9UuGjym",
  "Crypto.STETH/USD": "9uuLtZ5T4spZacA6gnECzGZwjdTfek9rBpTU3ZqZn4dS",
  "Crypto.STNEAR/USD": "B4D4iM5HtEkPkAQuhrbspWY7ySJe1ShyS63nktS4RXoV",
  "Crypto.STRK/USD": "CWCk1CnNM84uKvuGfq1gdhTjueE69VREPZRthz5y4gXr",
  "Crypto.STSOL/USD": "Bt1hEbY62aMriY1SyQqbeZbm8VmSbQVGBFzSzMuVNWzN",
  "Crypto.SUN/USD": "2TLgNFV8KCuLy6Bmfk5mcaeTpprZmTw7RexapVq5ujSS",
  "Crypto.SWEAT/USD": "5XBkJbpTwdXKSdLKQX4snSq4emQGpwSH1X87NiBGhJLF",
  "Crypto.TAPT/USD": "7CgRf6kzJfWN3h9bN9BwDoZDoubsQ7FTw2Wg7snWCUTp",
  "Crypto.THETA/USD": "H3mXf5d7p2Ha8t6QNJnYAq4SznK13kgXz7c37PRfFtY4",
  "Crypto.THG/USD": "CBskgoGVpWFJDvHVh3vU37rjk8HNodztVNe3qC8dhniJ",
  "Crypto.TLM/USD": "5bnBjEJTHm4b8j4TbQaXDLhF1RmNgasmJM4J3BghKXor",
  "Crypto.TUSD/USD": "5XWd8DwwPy6rbiS4WQaQf3eWctzwzrkUqLjYpRLta2PY",
  "Crypto.TWT/USD": "4daXXmao452ZQkqnorGSFbE8VTjwdFrnnCmN1wPu2AKs",
  "Crypto.UNI/USD": "98dE7gWsyWggCizXAS4qrSgcRxrYrAXCoZsbJTLVN81W",
  "Crypto.USDC/USD": "Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD",
  "Crypto.USDD/USD": "8LyrY9KByxdKYjtjcLqHEYgdXLfXjBKtgyrJyY3Q1qGH",
  "Crypto.USDT/USD": "3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL",
  "Crypto.USTC/USD": "H8DvrfSaRfUyP1Ytse1exGf7VSinLWtmKNNaBhA4as9P",
  "Crypto.VAI/USD": "8sqTeLp6ytuYFkoXodF6xXZoAg2wFQ3EK1npEXuqFU9H",
  "Crypto.WIN/USD": "CzBtDw4jHB9h5c597u5QB1q2XdhGCaNzVvmYbYwVuDUo",
  "Crypto.WOM/USD": "5ZgP2BpQ3VnyD84B5eD2ouudNjAdHAPMrsFwbDgVGeW5",
  "Crypto.WOO/USD": "DPp7R1Mb4bCAa2MVSHnezU8biwrLn4yi5LgSyAnEH9s2",
  "Crypto.XMR/USD": "5m4ycgV8V6V6ZG7JaHyPZMTcJXj4Ar4qLBCxTCoKquWU",
  "Crypto.XVS/USD": "9phzbSLLzqRJsZi6JwQXLCeY4kDanak8s6wqx6vUGnji",
  "Crypto.XWG/USD": "9ruzHUYg3k9bZPrSMBFaSXJsP7AKsq9ahStWbeD15ZdE",
  "Crypto.ZBC/USD": "3bNH7uDsap5nzwhCvv98i7VshjMagtx1NXTDBLbPYD66",
  "Equity.GB.CSPX/USD": "8NZppuDZ77hSBh532CEruJEXkbkjMsuy1t1HrUP35n88",
  "Equity.GB.IB01/USD": "5h37FZtKo5CzYdyeQWtTxpFePZf4qshFUtRjr6QneZrC",
  "Equity.GB.IBTA/USD": "9ehsNJ4feXfvZuJWJgLMZefR53joH9mAf2ZdEey3uUkP",
  "Equity.US.AAPL/USD": "5yixRcKtcs5BZ1K2FsLFwmES1MyA92d6efvijjVevQCw",
  "Equity.US.AMC/USD": "78aTPvgWhfRzPcc94bNNdsbB3EiGJpsu1RJp22KbAz1N",
  "Equity.US.AMGN/USD": "27inCyLk19JMJnBEwE8wtn6dTDSxp97oTPf9MhvX2H6B",
  "Equity.US.AMZN/USD": "DEjXZ6W6ymAqtH5MQGhuLGCtbEtVJigDoD5KLQHRiL8H",
  "Equity.US.AXP/USD": "BmSuygV51C6AzzYSgj92iueQnNc2MC6NQ96pViHDsJSs",
  "Equity.US.BA/USD": "9tf9q8qRG7e54jnf5B3JiEU72NCRH4P7iN7iz5Y9Mcrh",
  "Equity.US.CAT/USD": "CePNxB9pNFx1T9X9tDNpy6kJRUKVRBZdGQuDjojPiwhV",
  "Equity.US.COIN/USD": "J9yXwNQvsSgNTCZSBN7N2qXJ9nHPCn9wbk4TY2ZSqenG",
  "Equity.US.CRM/USD": "JAQCd6De3U6rBja3sQYyMczoMjQRsJNJCHySK5z7PfAP",
  "Equity.US.CSCO/USD": "5G5RudmNai1xJ7TKLi8GMZLKrrwExMwxzJnk1CTjfjTe",
  "Equity.US.CHEVRON/USD": "HT1hru9DDngH4WBpoJw8ZELexc3JnnXoD8iJ5STaYeAY",
  "Equity.US.DIS/USD": "8Z9ga6aWkBqLdHYu3TV6yVFSBH9LzUDx4RsJ4u2e7uPd",
  "Equity.US.DOW/USD": "HQLBTVRdQFpC3YZ7qAhjVUAhreDUwVrATfxRCVgFiA6H",
  "Equity.US.EFA/USD": "51FLpkn3Q6bkHUTsQX5FH7zrhZhePqWH33wgRWWRwShZ",
  "Equity.US.GE/USD": "GCXQHTQYCpNDyx41kUkxs3S4Vmuoq18rgTjKzc6pWd89",
  "Equity.US.GME/USD": "8WgyG6Rss2MzHu5bJh7ELxkH6XtwE4wsFouVSb4DvHpR",
  "Equity.US.GOOG/USD": "GWHdhCkwAjghsGPhEnszsPt5AMt5A55KFPLDq2UQBxYH",
  "Equity.US.GOVT/USD": "G9C5tQhFdvJGMFer6Gh4PnoVChpVLMjCWFJbAizFmbG6",
  "Equity.US.GS/USD": "BXZFD411bXg2dHAjMqRyUvU3uZdrSq1mCcqaXxSqhRwR",
  "Equity.US.HD/USD": "D6JmjWhbuBSwEqDts2KppWbSuggmpbeNUxziZyfXVTcG",
  "Equity.US.HON/USD": "27Jd46Vegg5A6LZT338h6LvJ5nppNmGEmEjYTja7c2ZF",
  "Equity.US.IBM/USD": "EzH8BL1J7dSv5sMLFZCP82bFCqyUdEcnzrybDT51EMK4",
  "Equity.US.INTC/USD": "E2BGMqdNAgF1u1SvA2J8iximzTPXjbftiV4wn9uQypn2",
  "Equity.US.IVV/USD": "7213mBWm2D4M3YVbJ2wSGkJw4wohMo7K9otFFGQZyiKr",
  "Equity.US.IWM/USD": "H9iWBKw64K3wJTgZejyT6kDnTuJFPKJHP5nQBcVPtrP2",
  "Equity.US.JNJ/USD": "2FHYjieQsCqfYKwNjXDhYeK1CroFoRhzYaTdKttoySWE",
  "Equity.US.JPM/USD": "9ZxikeH16Kuoqgiu9MhgEdxgXoAWvTvL5EHB7SuATwQZ",
  "Equity.US.KO/USD": "BQfDqHChh8HJmxcGUSWqsH5Fm8VuUbBcBUVG5yfVzKxQ",
  "Equity.US.MCD/USD": "FD1p7pUFCD8LWoX5XTpawzURThQ58iMJ54Rd4WZ4QgdX",
  "Equity.US.MINT/USD": "6zFVj11RZf4vxVU6oBBUSvkaSb5yTrvg8rk57UGFUmCm",
  "Equity.US.MMM/USD": "J2h8oMCXiBZjpZGUC2N6pK8Q9mcDjPdGcgwEEZ3qbwNQ",
  "Equity.US.MRK/USD": "ETyeW5VtWJWu5kjmsZ6M7Mvef7hsaNdS4kngaPHB9uPT",
  "Equity.US.MSFT/USD": "F42aKaaZR1CCbyiu6PXaz9WAgRUBHhUtSjHSmHwcwjM2",
  "Equity.US.NFLX/USD": "9rBVCiY1ZjgZo1YqqTc88hQShEfbHTwYcCcx1xx6AntR",
  "Equity.US.NKE/USD": "7xbwrYYdSmJgCDb24dus1eVew6GzU9fWPMc5x2REQfW3",
  "Equity.US.PG/USD": "Cf3rThBTnrkQxb9mp7PKbWapgQDPF4sKw5pfbSXSirqy",
  "Equity.US.QQQ/USD": "B8piRrj78PWq59VL5PJ4fZ8JxbsQB6sFKQTuaEEGsCuz",
  "Equity.US.SHV/USD": "8y5MU4u7HxSJ3rzSzgLv4D93KBtg4D4N3bqWVQFb5ph1",
  "Equity.US.SPY/USD": "2k1qZ9ZMNUNmpGghq6ZQRj7z2d2ATNnzzYugVhiTDCPn",
  "Equity.US.TLT/USD": "BiXZdquUPXQ6R1a2dikwKyuWhP4aFTsfb1oK9eFWx6ja",
  "Equity.US.TRV/USD": "FHqM2TH3dDsCWfnhWDdhCnWBMRxTFvRmLH2qfZx1gDQc",
  "Equity.US.TSLA/USD": "2YDWKqoJ1jZgoirNC4c4WLj2JAAf8hxLz5A9HTmPG2AC",
  "Equity.US.UNH/USD": "MNctk8onwrFGk3iub6zT3dZL9KxmUyJyP7vBVoRbYzg",
  "Equity.US.USO/USD": "F18GttsJyMSY1MfYUvpfFiRGBwZkUtzzBJPGLninx3Sc",
  "Equity.US.V/USD": "EQD4DixYfkaUcbUn4VCp5Ayc1DXbVGwY3qcx8rHjPej9",
  "Equity.US.VOO/USD": "3PG533WaBTZmtrfxDCXJxYfTLR3XVsSpyZHizvesVpGQ",
  "Equity.US.VZ/USD": "7tuaiVrQbeYmdkDzM2vGoBXmSNHzKUMDTF29iJGz1Vtj",
  "Equity.US.WBA/USD": "GyZ8r1zkbpJmRVXcpT1oytsBFqWkuKT3y2hiFhQHXvxk",
  "Equity.US.WMT/USD": "4Q46APzzWhDrjwKArDFNs4pNeRVFZPF3v9d67FnBMCuh",
  "Equity.US.XLE/USD": "ARMVMXRxTRDCr2rE9rRWG32wqKNF4pf11WQcBDsKFj23",
  "FX.AUD/USD": "7ycfa1ENNT5dVVoMtiMjsgVbkWKFJbu6nF2h1UVT18Cf",
  "FX.EUR/USD": "CQzPyC5xVhkuBfWFJiPCvPEnBshmRium4xxUxnX1ober",
  "FX.GBP/USD": "9wFA8FYZwvBbhE22uvYBZniTXi1KJiN8iNQsegkTWZqS",
  "FX.NZD/USD": "AtZbXC9LFhSPxYikz78CaLUuDZcmweWLY96eRJbzspB8",
  "Metal.XAG/USD": "HMVfAm6uuwnPnHRzaqfMhLNyrYHxaczKTbzeDcjBvuDo",
  "Metal.XAU/USD": "8y3WWjvmSmVGWVKH1rCA7VTRmuU7QbJ9axafSsBX5FcD",
};

main();
