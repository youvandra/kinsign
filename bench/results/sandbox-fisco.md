# Sandbox operation log (FISCO BCOS local)

Generated 2026-10-09T18:52:57.075Z by `npm run bench:sandbox` against http://localhost:8621. Contract 0x6552F8f20E7c82fc0a74332A573d0ce0Ced6c29B.

| # | Actor | Action | Result | Transaction |
|---|---|---|---|---|
| 1 | bank | connected | {"network":"FISCO BCOS local","chainId":20200,"contract":"0x6552F8f20E7c82fc0a74332A573d0ce0Ced6c29B"} |  |
| 2 | customer | opens the app | {"balance":250000} |  |
| 3 | assistant | finance view | {"month":"2026-10","spent":1892,"left":5908,"bills":[{"payee":"State Grid electricity","usual":262,"latest":360,"flags":["increased"]},{"payee":"China Mobile","usual":58,"latest":58,"flags":["duplicate"]},{"payee":"Property management","usual":420,"latest":420,"flags":[]},{"payee":"Shenzhen Water"," |  |
| 4 | assistant | answers "how much did I spend this month?" | This month you have spent ¥1,892 so far and have ¥5,908 left from your income. The biggest part is Groceries ¥910. |  |
| 5 | assistant | answers "any tips for this month?" | Here is what I would look at: 1. China Mobile charged you twice. ¥58 on Oct 3 and Oct 6. Ask China Mobile to refund the extra charge. 2. State Grid electricity is up 37%. ¥360 this month against an average of ¥262. Worth checking the reading or the tariff before the next bill. 3. Groceries is runnin |  |
| 6 | customer | sets a groceries budget of ¥1600 | [{"category":"groceries","limit":1600,"spent":910,"projected":3134,"status":"watch"},{"category":"dining","limit":400,"spent":0,"projected":0,"status":"ok"}] |  |
| 7 | assistant | drafts "pay 260 to State Grid electricity" | {"reply":"I prepared ¥260 to State Grid electricity. Check it on screen and press Confirm when it looks right.","draft":{"payee":"State Grid electricity","amount":260,"note":"","id":"d1","state":"pending"}} |  |
| 8 | customer | confirms the draft off a call | {"action":"pay","holdId":null,"reasons":[],"score":0.04742587317756678} |  |
| 9 | customer | taps Confirm a second time | {"refused":"draft d1 is already sent"} |  |
| 10 | assistant | answers a coached request on a 25-minute call | {"reply":"This sounds like a scam: real police and banks never ask you to move money or keep it secret. Please hang up and call your son on his usual number. I have not prepared any payment.","drafts":0} |  |
| 11 | customer | types ¥30,000 to Wang Lei herself during the call | {"action":"hold","holdId":"0x7733b5d74c0f49e75b7b646beedbf29bd0864ae41d5e8c900c1f5aae7ca58891","reasons":["on a call for 25 min","new payee","amount 37.5x the usual"],"score":0.9271976660674204} |  |
| 12 | customer | tells the pause screen what the caller said | {"answers":{"askedBySomeoneOnCall":true,"toldToKeepSecret":true},"attested":true} |  |
| 13 | family | reads the family note | Mum wants to send ¥30,000 to Wang Lei, 37.5× her usual amount, to an account she has never paid. She was on a 25-minute call with a number outside her contacts when she sent it. She answered that someone on the call asked for it; she was told to keep it secret. Call her on a number you already know  |  |
| 14 | customer | tries to release her own hold | {"state":"Held"} | `0x8c2035d3b0e28f2293d8def7c9fc4668e5c07cf7f9685f412ac303580afc0b64` NotMember |
| 15 | family | son blocks from his own phone | {"state":"Blocked"} | `0xc7524a643936c4a6d7371b3851e9290f7c5afa3c6a56a69e85986651cc76cb31` ok |
| 16 | customer | pays ¥4,000 rent to a new landlord while on the phone with him | {"action":"hold","holdId":"0x6973869920e34f8e7730f9529329eda9736d9f4aa45f3f07f43c303244352679","reasons":["on a call for 6 min","new payee","amount 5.0x the usual"],"score":0.7890788694846962} |  |
| 17 | family | son releases after calling her back | {"state":"Released"} | `0xb9915fa57dbec269f861ccc4af2bf34fe42c46351c0f516e4f79b8171f217291` ok |
| 18 | bank | end of session | {"balance":245740,"spent":4260,"scamHold":{"state":"Blocked","chainMatches":true,"records":3,"refused":1}} |  |
