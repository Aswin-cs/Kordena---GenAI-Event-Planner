import test from "node:test";
import assert from "node:assert/strict";
import { escapeRegex, sanitizeString, clampNumber } from "../lib/security";
import { checkRateLimit, getClientIp } from "../lib/rate-limit";
import { authOptions } from "../lib/auth";
import nextConfig from "../next.config";

test("Security Utils - escapeRegex", async (t) => {
  await t.test("escapes RegExp metacharacters properly", () => {
    const maliciousInput = "test.*+?^${}()|[]\\event";
    const escaped = escapeRegex(maliciousInput);
    assert.equal(escaped, "test\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\event");

    // Must safely compile in RegExp without syntax error or unexpected matching
    const re = new RegExp(`^${escaped}$`);
    assert.equal(re.test("test.*+?^${}()|[]\\event"), true);
    assert.equal(re.test("test123event"), false);
  });

  await t.test("handles non-string or empty input safely", () => {
    assert.equal(escapeRegex(""), "");
    assert.equal(escapeRegex(null as any), "");
    assert.equal(escapeRegex(undefined as any), "");
  });
});

test("Security Utils - sanitizeString", async (t) => {
  await t.test("strips control characters and trims string", () => {
    const raw = "  Annual Tech Summit\u0000\u0007\u001F  ";
    const clean = sanitizeString(raw, 50);
    assert.equal(clean, "Annual Tech Summit");
  });

  await t.test("truncates string to specified maxLength", () => {
    const longString = "A".repeat(300);
    const sanitized = sanitizeString(longString, 100);
    assert.equal(sanitized.length, 100);
  });

  await t.test("returns empty string for non-string inputs", () => {
    assert.equal(sanitizeString(123), "");
    assert.equal(sanitizeString(null), "");
  });
});

test("Security Utils - clampNumber", async (t) => {
  await t.test("clamps number within bounds", () => {
    assert.equal(clampNumber(-50, 0, 1000, 100), 0);
    assert.equal(clampNumber(2500, 0, 1000, 100), 1000);
    assert.equal(clampNumber(500, 0, 1000, 100), 500);
  });

  await t.test("returns fallback when input is NaN or invalid", () => {
    assert.equal(clampNumber("not-a-number", 1, 100, 50), 50);
    assert.equal(clampNumber(undefined, 1, 100, 50), 50);
  });
});

test("Rate Limiter - checkRateLimit", async (t) => {
  await t.test("extracts client IP from headers accurately", () => {
    const reqWithForwarded = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    assert.equal(getClientIp(reqWithForwarded), "203.0.113.195");

    const reqWithRealIp = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "198.51.100.4" },
    });
    assert.equal(getClientIp(reqWithRealIp), "198.51.100.4");
  });

  await t.test("allows requests up to configured limit and blocks when exceeded", () => {
    const mockReq = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "192.0.2.1" },
    });

    const opts = { maxRequests: 3, windowSeconds: 2, bucketPrefix: "unit-test" };

    // Request 1: allowed
    const res1 = checkRateLimit(mockReq, opts);
    assert.equal(res1.allowed, true);
    assert.equal(res1.remaining, 2);

    // Request 2: allowed
    const res2 = checkRateLimit(mockReq, opts);
    assert.equal(res2.allowed, true);
    assert.equal(res2.remaining, 1);

    // Request 3: allowed
    const res3 = checkRateLimit(mockReq, opts);
    assert.equal(res3.allowed, true);
    assert.equal(res3.remaining, 0);

    // Request 4: blocked (HTTP 429)
    const res4 = checkRateLimit(mockReq, opts);
    assert.equal(res4.allowed, false);
    assert.ok(res4.response);
    assert.equal(res4.response.status, 429);
  });
});

test("NextAuth Security Configuration", async (t) => {
  await t.test("enforces JWT strategy and 30-day session lifetime", () => {
    assert.equal(authOptions.session?.strategy, "jwt");
    assert.equal(authOptions.session?.maxAge, 30 * 24 * 60 * 60);
  });

  await t.test("enforces httpOnly and SameSite cookie policies", () => {
    assert.equal(authOptions.cookies?.sessionToken?.options?.httpOnly, true);
    assert.equal(authOptions.cookies?.sessionToken?.options?.sameSite, "lax");
    assert.equal(authOptions.cookies?.sessionToken?.options?.path, "/");
  });
});

test("Next.js Security Headers Configuration", async (t) => {
  await t.test("poweredByHeader is disabled to prevent framework fingerprinting", () => {
    assert.equal(nextConfig.poweredByHeader, false);
  });

  await t.test("registers essential security headers", async () => {
    assert.ok(typeof nextConfig.headers === "function");
    const headersList = await nextConfig.headers();
    assert.ok(Array.isArray(headersList));

    const globalHeaders = headersList.find((h) => h.source === "/:path*");
    assert.ok(globalHeaders, "Expected global /:path* security headers");

    const headerKeys = globalHeaders.headers.map((h: any) => h.key);
    assert.ok(headerKeys.includes("X-Content-Type-Options"));
    assert.ok(headerKeys.includes("X-Frame-Options"));
    assert.ok(headerKeys.includes("Strict-Transport-Security"));
    assert.ok(headerKeys.includes("Referrer-Policy"));
    assert.ok(headerKeys.includes("Permissions-Policy"));

    const frameOptions = globalHeaders.headers.find(
      (h: any) => h.key === "X-Frame-Options"
    );
    assert.equal(frameOptions?.value, "DENY");

    const contentTypeOptions = globalHeaders.headers.find(
      (h: any) => h.key === "X-Content-Type-Options"
    );
    assert.equal(contentTypeOptions?.value, "nosniff");
  });
});

test("AI Route Authorization Lock Guard (Backend Security)", async (t) => {
  const { requireAuthSession } = await import("../lib/security");
  const { POST: postGenerate } = await import("../app/api/generate/route");
  const { POST: postAiEvaluate } = await import("../app/api/ai-evaluate/route");
  const { POST: postChat } = await import("../app/api/chat/route");

  await t.test("requireAuthSession rejects unauthenticated access with 401", async () => {
    const authResult = await requireAuthSession();
    assert.equal(authResult.authorized, false);
    assert.ok(authResult.response);
    assert.equal(authResult.response.status, 401);

    const body = await authResult.response.json();
    assert.equal(body.success, false);
    assert.equal(body.code, "UNAUTHORIZED");
  });

  await t.test("POST /api/generate blocks unauthorized requests with 401", async () => {
    const fakeReq = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "A luxury gala" }),
    });

    const res = await postGenerate(fakeReq);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.code, "UNAUTHORIZED");
  });

  await t.test("POST /api/ai-evaluate blocks unauthorized requests with 401", async () => {
    const fakeReq = new Request("http://localhost:3000/api/ai-evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "Tech Summit" }),
    });

    const res = await postAiEvaluate(fakeReq);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.code, "UNAUTHORIZED");
  });

  await t.test("POST /api/chat blocks unauthorized requests with 401", async () => {
    const fakeReq = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello AI" }),
    });

    const res = await postChat(fakeReq);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.code, "UNAUTHORIZED");
  });
});

test("Backend API Route Strict Parameter Validation", async (t) => {
  const { POST: postUserStatus } = await import("../app/api/user-status/route");

  await t.test("POST /api/user-status rejects missing event parameters with 400", async () => {
    // Missing eventName
    const missingNameReq = new Request("http://localhost:3000/api/user-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "",
        eventType: "Conference",
        budget: 50000,
        eventDate: "2027-01-01",
        guestCount: 100,
        plannedItems: ["Audio"],
      }),
    });
    const nameRes = await postUserStatus(missingNameReq);
    assert.equal(nameRes.status, 400);
    const nameBody = await nameRes.json();
    assert.equal(nameBody.success, false);
    assert.equal(nameBody.error, "VALIDATION_ERROR");

    // Missing/0 budget
    const zeroBudgetReq = new Request("http://localhost:3000/api/user-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "Annual Summit",
        eventType: "Conference",
        budget: 0,
        eventDate: "2027-01-01",
        guestCount: 100,
        plannedItems: ["Audio"],
      }),
    });
    const budgetRes = await postUserStatus(zeroBudgetReq);
    assert.equal(budgetRes.status, 400);
    const budgetBody = await budgetRes.json();
    assert.equal(budgetBody.success, false);
    assert.equal(budgetBody.error, "VALIDATION_ERROR");

    // Missing plannedItems
    const emptyPlanningReq = new Request("http://localhost:3000/api/user-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "Annual Summit",
        eventType: "Conference",
        budget: 50000,
        eventDate: "2027-01-01",
        guestCount: 100,
        plannedItems: [],
      }),
    });
    const planRes = await postUserStatus(emptyPlanningReq);
    assert.equal(planRes.status, 400);
    const planBody = await planRes.json();
    assert.equal(planBody.success, false);
    assert.equal(planBody.error, "VALIDATION_ERROR");
  });
});
