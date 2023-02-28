set -Eeuo pipefail
echo "Writing program buffers on mainnet"
echo "Buffer rent can be recovered with the command"
echo "solana program close --buffers -u m"

anchor build

echo "Writing resynth buffer"
solana program write-buffer -u m ../target/deploy/resynth.so

echo "Writing token_swap buffer"
solana program write-buffer -u m ../target/deploy/token_swap.so

echo "Buffer refund" $(solana address)
echo "Assign the buffer authority, and propose the program upgrade:"
echo "solana program set-buffer-authority -u m --new-buffer-authority 3JbS6Lk6SgopcBXZVead91AHXazMYsiTHa5AcFUQR2rq <resynth and token_swap buffers>"
