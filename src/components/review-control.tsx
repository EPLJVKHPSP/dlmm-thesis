"use client";
import { useState } from "react";

export function ReviewControl() {
  const [state, setState] = useState<"idle" | "loading" | "passed" | "error">("idle");

  async function validate() {
    setState("loading");
    try {
      const response = await fetch("/api/rebalance", { method: "POST" });
      const result = await response.json();
      setState(response.ok && result.validation?.passed && result.transactionSubmitted === false ? "passed" : "error");
    } catch {
      setState("error");
    }
  }

  return <div>
    <button className={state === "passed" ? "button reviewed" : "button"} onClick={validate} disabled={state === "loading" || state === "passed"}>
      {state === "loading" ? "Checking on server…" : state === "passed" ? "Validation passed · no transaction" : "Run server validation"}
    </button>
    {state === "error" && <p className="form-error">The allocation validation could not be completed.</p>}
  </div>;
}
