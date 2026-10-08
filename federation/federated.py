"""Kinsign federated coercion score on FATE 2.2.

Guest = the bank: holds the label (scam or not) and the transaction features.
Host = the mobile operator: holds what it knows about the call in progress.

1. ECDH PSI on curve25519 aligns the two sides on an event id both can compute
   (the customer's number and the minute). Neither side learns the other's
   non-matching rows.
2. Hetero SecureBoost is trained twice with the same FATE code:
   - bank-only: complete_secure = num_trees, so every tree splits on bank
     features only;
   - federated: complete_secure = 0, so trees may split on operator features,
     found by the host over Paillier-encrypted gradients.
3. Both models score the test events; the guest writes the scores.

Run: KINSIGN_OPERATOR=base|hard .venv/bin/python federated.py --parties guest:9999 host:10000 --log_level WARNING
"""
import os
import time

import pandas as pd
from fate.arch import Context
from fate.arch.dataframe import PandasReader
from fate.arch.launchers.multiprocess_launcher import launch
from fate.arch.protocol.psi import psi_run
from fate.ml.ensemble import HeteroSecureBoostGuest, HeteroSecureBoostHost

HERE = os.path.dirname(os.path.abspath(__file__))
TREES = int(os.environ.get("KINSIGN_TREES", "5"))
DEPTH = int(os.environ.get("KINSIGN_DEPTH", "3"))
LIMIT = int(os.environ.get("KINSIGN_LIMIT", "0"))  # rows per split for a quick run; 0 = all
SETTING = os.environ.get("KINSIGN_OPERATOR", "base")


def frame(ctx: Context, split: str):
    side = "bank" if ctx.is_on_guest else "operator"
    df = pd.read_csv(os.path.join(HERE, "data", SETTING, f"{side}_{split}.csv"))
    if LIMIT and ctx.is_on_guest:
        df = df.head(LIMIT)
    df["sample_id"] = range(len(df))
    reader = PandasReader(
        sample_id_name="sample_id",
        match_id_name="id",
        label_name="y" if ctx.is_on_guest else None,
        dtype="float32",
    )
    return reader.to_frame(ctx, df), len(df)


def run(ctx: Context):
    t0 = time.time()
    train, n_train = frame(ctx, "train")
    test, n_test = frame(ctx, "test")
    train = psi_run(ctx.sub_ctx("psi_train"), train, "ecdh_psi", "curve25519")
    test = psi_run(ctx.sub_ctx("psi_test"), test, "ecdh_psi", "curve25519")
    who = "bank" if ctx.is_on_guest else "operator"
    print(f"{who}: train {n_train} -> {train.shape[0]} after PSI, test {n_test} -> {test.shape[0]}, {time.time() - t0:.0f}s")

    scores = {}
    for name, complete_secure in (("bank_only", TREES), ("federated", 0)):
        mctx = ctx.sub_ctx(name)
        t1 = time.time()
        if ctx.is_on_guest:
            m = HeteroSecureBoostGuest(num_trees=TREES, max_depth=DEPTH, complete_secure=complete_secure)
            m.fit(mctx.sub_ctx("fit"), train)
            pred = m.predict(mctx.sub_ctx("predict"), test).as_pd_df()
            scores[name] = pred
            fi = m.get_model().get("meta", {}).get("feature_importance") if hasattr(m, "get_model") else None
        else:
            m = HeteroSecureBoostHost(num_trees=TREES, max_depth=DEPTH, complete_secure=complete_secure)
            m.fit(mctx.sub_ctx("fit"), train)
            m.predict(mctx.sub_ctx("predict"), test)
        print(f"{who}: {name} trained and scored in {time.time() - t1:.0f}s")

    if ctx.is_on_guest:
        OUTDIR = os.path.join(HERE, "out", SETTING)
        os.makedirs(OUTDIR, exist_ok=True)
        a, b = scores["bank_only"], scores["federated"]
        print("guest prediction columns:", list(a.columns))
        a.to_csv(os.path.join(OUTDIR, "pred_bank_only.csv"), index=False)
        b.to_csv(os.path.join(OUTDIR, "pred_federated.csv"), index=False)
        print(f"bank: wrote predictions, total {time.time() - t0:.0f}s")


if __name__ == "__main__":
    launch(run)
