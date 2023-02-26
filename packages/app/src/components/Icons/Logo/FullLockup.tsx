import { useTheme } from "styled-components";

import { ColorPalette } from "../../../styles/palette";

export const FullLockup = ({
  logomarkColor,
  textColor,
  width,
}: {
  logomarkColor?: keyof ColorPalette;
  textColor?: keyof ColorPalette;
  width?: string;
}) => {
  const { palette } = useTheme();

  return (
    <svg
      width={width || "180px"}
      viewBox="0 0 3319 354"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M895.805 94.7783C884.357 88.8335 871.601 85.839 858.697 86.0671C845.276 85.8576 832.009 88.9386 820.061 95.0396C812.486 98.9936 805.732 104.344 800.154 110.807C794.964 104.264 788.561 98.7777 781.294 94.6475C770.934 88.8241 759.221 85.82 747.33 85.9363C734.641 85.6863 722.087 88.5746 710.789 94.3428C706.066 96.8134 701.668 99.8561 697.692 103.402V89.6823H640.153V271.44H697.867V165.295C697.708 159.918 699.07 154.605 701.796 149.963C704.393 145.758 708.091 142.339 712.492 140.076C717.236 137.627 722.518 136.399 727.859 136.505C735.518 136.289 742.964 139.036 748.639 144.171C751.502 146.868 753.742 150.155 755.204 153.803C756.667 157.45 757.317 161.372 757.109 165.295V271.528H814.822V165.295C814.672 159.941 815.969 154.645 818.577 149.963C821.103 145.701 824.82 142.265 829.272 140.076C833.955 137.672 839.155 136.446 844.421 136.505C851.969 136.329 859.291 139.077 864.852 144.171C867.715 146.868 869.955 150.155 871.417 153.803C872.88 157.45 873.53 161.372 873.322 165.295V271.528H931.036V158.588C931.434 145.02 928.193 131.592 921.649 119.692C915.585 109.104 906.619 100.462 895.805 94.7783V94.7783Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M1093.7 104.882C1088.68 100.094 1082.93 96.1253 1076.67 93.1222C1066.3 88.274 1054.95 85.8461 1043.49 86.0226C1027.66 85.7298 1012.08 89.9454 998.57 98.1748C985.342 106.393 974.587 118.026 967.443 131.843C959.634 146.906 955.703 163.67 956.005 180.626C955.674 197.473 959.608 214.132 967.443 229.06C974.76 242.811 985.55 254.417 998.745 262.728C1012.09 271.123 1027.59 275.48 1043.36 275.272C1054.93 275.455 1066.39 273.028 1076.89 268.173C1083.02 265.213 1088.64 261.319 1093.57 256.63V271.527H1150.32V89.7683H1093.57L1093.7 104.882ZM1055.32 223.267C1048.09 223.428 1040.95 221.594 1034.7 217.967C1028.44 214.339 1023.31 209.059 1019.87 202.709C1016.33 195.892 1014.48 188.326 1014.48 180.648C1014.48 172.969 1016.33 165.403 1019.87 158.587C1023.31 152.228 1028.43 146.938 1034.69 143.303C1040.95 139.668 1048.09 137.827 1055.32 137.985C1062.8 137.859 1070.17 139.739 1076.67 143.429C1082.79 146.899 1087.74 152.097 1090.9 158.369C1094.25 165.135 1095.93 172.602 1095.79 180.146C1096.26 191.519 1092.3 202.631 1084.75 211.158C1081.01 215.178 1076.45 218.342 1071.37 220.432C1066.29 222.522 1060.81 223.489 1055.32 223.267V223.267Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M1335.12 95.3443C1324.32 89.0385 1312 85.814 1299.49 86.0233C1286.41 85.7796 1273.46 88.7723 1261.82 94.7344C1256.89 97.3556 1252.3 100.574 1248.15 104.317V89.6821H1190.66V271.44H1248.37V167.908C1248.24 162.153 1249.66 156.469 1252.48 151.444C1255.14 146.807 1259.04 142.994 1263.74 140.424C1268.68 137.764 1274.23 136.414 1279.85 136.505C1283.99 136.359 1288.12 137.056 1291.99 138.553C1295.85 140.051 1299.37 142.318 1302.33 145.216C1305.33 148.151 1307.68 151.678 1309.23 155.569C1310.79 159.461 1311.52 163.634 1311.37 167.821V271.44H1369.08V155.19C1369.17 143.076 1366.06 131.152 1360.09 120.607C1354.14 110.139 1345.53 101.425 1335.12 95.3443V95.3443Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M1521.44 89.7695L1484.6 200.009L1448.32 89.7695H1386.11L1455.52 259.027L1414.22 348.186H1473.46L1505.68 272.268L1583.65 89.7695H1521.44Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M1615.91 206.454C1611.35 206.297 1606.81 207.095 1602.57 208.798C1598.34 210.501 1594.51 213.071 1591.34 216.341C1588.19 219.589 1585.72 223.431 1584.08 227.641C1582.44 231.852 1581.65 236.347 1581.78 240.863C1581.67 245.397 1582.45 249.909 1584.09 254.139C1585.74 258.369 1588.2 262.235 1591.34 265.516C1597.87 271.966 1606.7 275.583 1615.89 275.583C1625.09 275.583 1633.91 271.966 1640.45 265.516C1643.59 262.235 1646.05 258.369 1647.69 254.139C1649.33 249.909 1650.12 245.397 1650.01 240.863C1650.13 236.347 1649.35 231.852 1647.71 227.641C1646.06 223.431 1643.6 219.589 1640.45 216.341C1637.28 213.078 1633.45 210.514 1629.23 208.811C1625 207.108 1620.47 206.305 1615.91 206.454V206.454Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M1821.32 97.2169C1806.59 89.2526 1790.04 85.2592 1773.3 85.6312C1755.88 85.3714 1738.7 89.634 1723.44 98.0009C1708.95 105.935 1696.89 117.629 1688.52 131.844C1680.09 146.782 1675.7 163.647 1675.77 180.787C1675.84 197.927 1680.36 214.756 1688.91 229.627C1697.55 243.996 1710 255.706 1724.88 263.469C1741.07 271.785 1759.07 275.961 1777.27 275.621C1791.76 275.8 1806.15 273.198 1819.66 267.956C1832.35 262.893 1843.56 254.731 1852.27 244.218L1820.4 212.814C1815.15 218.85 1808.62 223.641 1801.28 226.839C1793.68 230.011 1785.51 231.597 1777.27 231.499C1768.44 231.732 1759.71 229.596 1751.99 225.314C1744.82 221.185 1739.07 214.991 1735.49 207.544C1734.28 205.109 1733.29 202.573 1732.52 199.965L1862.97 199.312C1864.12 195.322 1864.94 191.242 1865.41 187.116C1865.76 183.545 1865.98 179.973 1865.98 176.488C1866.22 160.074 1862.06 143.893 1853.93 129.622C1846.21 116.065 1834.94 104.862 1821.32 97.2169V97.2169ZM1750.64 135.764C1757.67 131.421 1765.81 129.212 1774.08 129.405C1781.54 129.187 1788.89 131.14 1795.26 135.023C1801.14 138.87 1805.71 144.416 1808.35 150.921C1809.58 153.802 1810.53 156.792 1811.19 159.85L1732.39 160.286C1733.12 157.905 1734.01 155.577 1735.05 153.317C1738.49 146.121 1743.89 140.037 1750.64 135.764V135.764Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M2064.22 89.7695H2001.27L1970.97 138.813L1940.54 89.7695H1873.44L1935.13 178.667L1869.69 271.528H1932.64L1967.56 217.649L2000.87 271.528H2067.62L2003.41 178.057L2064.22 89.7695Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M2193.01 219.522C2186.63 222.105 2179.8 223.379 2172.93 223.268C2165.46 223.341 2158.11 221.48 2151.58 217.867C2145.18 214.355 2139.91 209.098 2136.39 202.71C2132.67 195.824 2130.81 188.096 2130.97 180.278C2130.84 172.672 2132.71 165.164 2136.39 158.501C2139.92 152.241 2145.12 147.073 2151.4 143.561C2157.97 139.886 2165.4 138.008 2172.93 138.117C2179.52 137.996 2186.07 139.15 2192.22 141.514C2197.92 143.793 2203 147.374 2207.07 151.967L2244.17 114.553C2235.21 105.285 2224.42 97.9728 2212.48 93.0798C2199.91 88.0246 2186.47 85.4937 2172.93 85.6319C2155.04 85.3711 2137.38 89.6261 2121.59 98.0016C2106.75 105.83 2094.32 117.526 2085.61 131.845C2076.75 146.557 2072.21 163.462 2072.52 180.627C2072.35 197.72 2076.88 214.532 2085.61 229.235C2094.18 243.658 2106.57 255.444 2121.41 263.296C2137.23 271.658 2154.9 275.898 2172.8 275.622C2186.37 275.976 2199.87 273.462 2212.4 268.245C2224.94 263.028 2236.23 255.226 2245.53 245.351L2208.38 208.677C2204.14 213.402 2198.88 217.11 2193.01 219.522V219.522Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M2414.35 94.7774C2402.79 88.7379 2389.88 85.7397 2376.85 86.0662C2364.06 85.8003 2351.42 88.799 2340.13 94.7774C2335.66 97.1764 2331.5 100.101 2327.73 103.489V0H2270.02V271.527H2327.73V167.907C2327.62 162.149 2329.05 156.465 2331.88 151.443C2334.55 146.806 2338.44 142.993 2343.14 140.424C2348.08 137.754 2353.63 136.404 2359.25 136.504C2363.4 136.358 2367.53 137.055 2371.39 138.553C2375.26 140.05 2378.78 142.317 2381.73 145.215C2384.71 148.166 2387.04 151.695 2388.59 155.584C2390.14 159.473 2390.86 163.638 2390.73 167.82V271.439H2448.44V155.189C2448.74 142.581 2445.63 130.125 2439.45 119.125C2433.54 108.816 2424.84 100.377 2414.35 94.7774V94.7774Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M2610.75 104.883C2605.72 100.115 2599.97 96.148 2593.73 93.1233C2583.35 88.2795 2572 85.8518 2560.55 86.0237C2544.76 85.7558 2529.23 89.9705 2515.76 98.176C2502.53 106.394 2491.77 118.028 2484.63 131.844C2476.82 146.907 2472.89 163.671 2473.19 180.627C2472.86 197.474 2476.8 214.133 2484.63 229.061C2491.95 242.812 2502.74 254.418 2515.93 262.729C2529.28 271.124 2544.77 275.481 2560.55 275.274C2572.12 275.456 2583.58 273.029 2594.08 268.174C2600.2 265.215 2605.83 261.32 2610.75 256.632V271.528H2667.51V89.7695H2610.75V104.883ZM2572.55 223.268C2565.32 223.43 2558.18 221.596 2551.93 217.968C2545.67 214.341 2540.54 209.061 2537.1 202.71C2533.56 195.894 2531.71 188.327 2531.71 180.649C2531.71 172.97 2533.56 165.404 2537.1 158.588C2540.54 152.229 2545.66 146.94 2551.92 143.304C2558.18 139.669 2565.32 137.828 2572.55 137.986C2580.03 137.86 2587.4 139.74 2593.9 143.43C2600.02 146.9 2604.97 152.098 2608.13 158.37C2611.48 165.136 2613.16 172.603 2613.02 180.148C2613.49 191.52 2609.54 202.633 2601.98 211.159C2598.24 215.179 2593.68 218.343 2588.6 220.433C2583.52 222.523 2578.04 223.491 2572.55 223.268V223.268Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M2852.17 95.3443C2841.38 89.0385 2829.06 85.814 2816.55 86.0233C2803.46 85.7796 2790.52 88.7723 2778.88 94.7344C2773.94 97.3556 2769.35 100.574 2765.21 104.317V89.6821H2707.5V271.44H2765.21V167.908C2765.08 162.153 2766.5 156.469 2769.31 151.444C2771.98 146.807 2775.88 142.994 2780.58 140.424C2785.52 137.764 2791.07 136.414 2796.69 136.505C2800.83 136.359 2804.96 137.056 2808.83 138.553C2812.69 140.051 2816.21 142.318 2819.17 145.216C2822.17 148.151 2824.52 151.678 2826.07 155.569C2827.63 159.461 2828.36 163.634 2828.21 167.821V271.44H2885.92V155.19C2886 143.076 2882.9 131.152 2876.93 120.607C2871.04 110.167 2862.5 101.455 2852.17 95.3443V95.3443Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M3044.09 101.876C3039.8 98.3708 3035.08 95.442 3030.03 93.1653C3019.5 88.4097 3008.05 86.0443 2996.5 86.2399C2981.15 85.9551 2966.02 89.8628 2952.74 97.5398C2939.46 105.217 2928.53 116.371 2921.15 129.796C2913.78 143.919 2909.93 159.607 2909.93 175.529C2909.93 191.452 2913.78 207.139 2921.15 221.263C2928.27 234.616 2938.81 245.844 2951.71 253.799C2965.16 261.901 2980.62 266.052 2996.33 265.777C3007.9 265.98 3019.36 263.552 3029.85 258.677C3034.53 256.487 3038.92 253.753 3042.95 250.532V261.683C3043.29 267.251 3042.37 272.824 3040.27 277.993C3038.17 283.163 3034.94 287.799 3030.81 291.562C3022.64 298.56 3011.45 302.059 2997.24 302.059C2987.34 302.296 2977.53 300.238 2968.56 296.048C2960.14 291.835 2952.7 285.899 2946.73 278.626L2911.11 313.775C2920.18 326.501 2932.55 336.516 2946.91 342.74C2963.42 349.911 2981.29 353.432 2999.29 353.062C3017.41 353.372 3035.35 349.465 3051.68 341.651C3066.56 334.491 3079.09 323.27 3087.83 309.289C3096.79 294.537 3101.34 277.534 3100.93 260.289V89.7679H3044.17L3044.09 101.876ZM3028.15 209.808C3021.83 213.412 3014.65 215.22 3007.37 215.034C3000.26 215.205 2993.25 213.395 2987.11 209.808C2981.34 206.315 2976.62 201.334 2973.45 195.391C2970.09 189.405 2968.34 182.651 2968.39 175.79C2968.31 168.87 2969.98 162.041 2973.23 155.929C2976.45 150.007 2981.26 145.092 2987.11 141.73C2993.39 138.173 3000.51 136.367 3007.72 136.503C3014.96 136.301 3022.11 138.111 3028.37 141.73C3033.96 145.168 3038.5 150.082 3041.47 155.929C3044.61 161.937 3046.23 168.622 3046.18 175.399C3046.33 182.479 3044.71 189.485 3041.47 195.783C3038.44 201.616 3033.83 206.478 3028.15 209.808V209.808Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M3306.9 129.622C3299.12 116.152 3287.84 105.031 3274.25 97.434C3259.52 89.4602 3242.97 85.4662 3226.22 85.8483C3208.81 85.5885 3191.63 89.8511 3176.37 98.218C3161.87 106.135 3149.8 117.832 3141.44 132.061C3133.08 147.021 3128.74 163.887 3128.86 181.016C3128.97 198.146 3133.53 214.953 3142.1 229.8C3150.76 244.171 3163.22 255.881 3178.11 263.643C3194.3 271.959 3212.3 276.135 3230.5 275.795C3244.98 275.974 3259.36 273.371 3272.85 268.129C3285.54 263.066 3296.75 254.904 3305.46 244.391L3273.59 212.988C3268.34 219.024 3261.81 223.815 3254.47 227.012C3246.88 230.179 3238.73 231.765 3230.5 231.673C3221.66 231.907 3212.92 229.772 3205.18 225.488C3198.02 221.346 3192.27 215.155 3188.68 207.717C3187.49 205.274 3186.5 202.74 3185.71 200.139L3315.98 199.529C3317.12 195.538 3317.93 191.458 3318.38 187.333C3318.76 183.804 3318.95 180.256 3318.95 176.706C3319.24 160.217 3315.07 143.955 3306.9 129.622V129.622ZM3203.61 135.981C3210.64 131.634 3218.79 129.424 3227.05 129.622C3234.51 129.415 3241.86 131.366 3248.23 135.24C3254.12 139.083 3258.69 144.63 3261.32 151.138C3262.55 154.019 3263.5 157.009 3264.16 160.067L3185.58 160.503C3186.29 158.116 3187.18 155.786 3188.24 153.534C3191.57 146.277 3196.9 140.114 3203.61 135.763V135.981Z"
        fill={palette[textColor || "accent"]}
      />
      <path
        d="M197.001 122.281L168.012 23.9456C167.246 21.3677 162.212 21.3677 159.44 23.9456L53.395 122.281C50.878 124.616 52.1183 127.376 55.6932 127.376H75.7689C78.4197 127.376 79.9518 128.945 79.1979 130.89L0.196382 332.473C-0.569678 334.419 0.974603 335.988 3.62542 335.988H79.3195C81.9703 335.988 84.7306 334.419 85.4966 332.473L164.474 130.89C165.24 128.945 168 127.376 170.651 127.376H190.727C194.302 127.376 197.694 124.628 197.013 122.281H197.001Z"
        fill={palette[logomarkColor || "accent"]}
      />
      <path
        d="M175.563 235.707L204.552 334.042C205.318 336.62 210.352 336.62 213.125 334.042L319.169 235.707C321.687 233.372 320.446 230.612 316.871 230.612H296.796C294.145 230.612 292.613 229.043 293.367 227.098L372.344 25.5142C373.11 23.5686 371.566 22 368.915 22H293.221C290.57 22 287.81 23.5686 287.044 25.5142L208.066 227.098C207.3 229.043 204.54 230.612 201.889 230.612H181.814C178.239 230.612 174.846 233.36 175.527 235.707H175.563Z"
        fill={palette[logomarkColor || "accent"]}
      />
      <g opacity="0.6">
        <path
          d="M499.741 330.406L412.507 107.75C411.243 104.516 406.671 104.516 405.406 107.75L368.234 202.632C367.006 205.782 367.006 209.284 368.234 212.433L415.401 332.814C416.131 334.687 418.478 335.988 421.153 335.988H494.014C497.99 335.988 500.86 333.203 499.765 330.406H499.741Z"
          fill={palette[logomarkColor || "accent"]}
        />
      </g>
    </svg>
  );
};
