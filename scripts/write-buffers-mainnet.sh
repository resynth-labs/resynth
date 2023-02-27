set -Eeuo pipefail

anchor build &&
solana program write-buffer -u m ../target/deploy/resynth.so &&
solana program write-buffer -u m ../target/deploy/token_swap.so &&

echo "Buffer refund" $(solana address) &&
echo "Assign the buffer authority, and propose the program upgrade:" &&
echo "solana program set-buffer-authority -u m --new-buffer-authority 3JbS6Lk6SgopcBXZVead91AHXazMYsiTHa5AcFUQR2rq <resynth and swap buffers>" &&
