import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("NextAuth Session Provider Resilience Configuration", async (t) => {
  const authProviderPath = path.resolve(process.cwd(), "app/components/AuthProvider.tsx");
  const authProviderSource = fs.readFileSync(authProviderPath, "utf8");

  await t.test("AuthProvider disables refetchOnWindowFocus to avoid tab blur client errors", () => {
    assert.ok(
      authProviderSource.includes("refetchOnWindowFocus={false}"),
      "AuthProvider must set refetchOnWindowFocus={false} to avoid Kaspersky / proxy fetch errors on tab change"
    );
  });

  await t.test("AuthProvider disables refetchWhenOffline to prevent unneeded network spam", () => {
    assert.ok(
      authProviderSource.includes("refetchWhenOffline={false}"),
      "AuthProvider must set refetchWhenOffline={false}"
    );
  });

  await t.test("AuthProvider disables refetchInterval to avoid background timer spam", () => {
    assert.ok(
      authProviderSource.includes("refetchInterval={0}"),
      "AuthProvider must set refetchInterval={0}"
    );
  });
});

