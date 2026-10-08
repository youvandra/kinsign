# @kinsign/api

The bank's HTTP API.
- `index.ts` boots the chain and the bank and serves everything.
- `bank.ts` holds the demo bank context.
- `views.ts` maps bank state to `@kinsign/protocol` DTOs.
- `routes/` has one file per area: bank, device records, demo controls.
- `http/` holds the router, input validation, the device RPC proxy and the static web app.

The API holds only the operator and review-desk keys. Devices sign their own decisions.
