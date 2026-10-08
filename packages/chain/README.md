# @kinsign/chain

The adapter to the `KinsignRelease` contract.
- `ReleaseClient` simulates every write to name the revert, then sends it anyway, so refusals leave failed receipts on chain.
- `network.ts` starts an anvil running the same bytecode, or connects to FISCO BCOS through `KINSIGN_RPC`.
- `fisco-funding.ts` tops up accounts through the FISCO console. FISCO's web3 endpoint refuses senders with a zero balance, even at gas price 0.

Contract artifacts are read from `contracts/out`, so run `forge build` first. The FISCO console is expected at `infra/fisco/build/console` (see `infra/fisco/setup.sh`).
