import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FALLBACK_MODELS,
  formatUploadedContents,
} from "../config/gemini";

test("Gemini Config - Fallback Models Strategy", async (t) => {
  await t.test("exports non-empty list of fallback models", () => {
    assert.ok(Array.isArray(DEFAULT_FALLBACK_MODELS));
    assert.ok(DEFAULT_FALLBACK_MODELS.length >= 3);
  });

  await t.test("primary tier contains ultra-fast low-latency models", () => {
    assert.ok(
      DEFAULT_FALLBACK_MODELS.includes("gemini-3.8-flash") ||
      DEFAULT_FALLBACK_MODELS.includes("gemini-3.7-flash") ||
      DEFAULT_FALLBACK_MODELS.includes("gemini-3.5-flash")
    );
  });

  await t.test("deep tier contains capable reasoning models", () => {
    assert.ok(
      DEFAULT_FALLBACK_MODELS.some((m) => m.includes("pro") || m.includes("3.5"))
    );
  });
});

test("Gemini Config - formatUploadedContents Normalizer", async (t) => {
  await t.test("normalizes raw text string into text part", () => {
    const parts = formatUploadedContents("Evaluate the timeline risk.");
    assert.strictEqual(parts.length, 1);
    assert.deepStrictEqual(parts[0], { text: "Evaluate the timeline risk." });
  });

  await t.test("normalizes flat { data, mimeType } into inlineData part", () => {
    const parts = formatUploadedContents({
      mimeType: "image/png",
      data: "base64EncodedImageDataHere",
    });
    assert.strictEqual(parts.length, 1);
    assert.deepStrictEqual(parts[0], {
      inlineData: {
        mimeType: "image/png",
        data: "base64EncodedImageDataHere",
      },
    });
  });

  await t.test("converts Buffer payload into base64 string", () => {
    const buffer = Buffer.from("Hello Event Planner", "utf8");
    const parts = formatUploadedContents({
      mimeType: "text/plain",
      data: buffer,
    });
    assert.strictEqual(parts.length, 1);
    assert.strictEqual(
      parts[0].inlineData.data,
      buffer.toString("base64")
    );
    assert.strictEqual(parts[0].inlineData.mimeType, "text/plain");
  });

  await t.test("normalizes fileUri into fileData part", () => {
    const parts = formatUploadedContents({
      fileUri: "https://generativelanguage.googleapis.com/v1beta/files/abc123xyz",
      mimeType: "application/pdf",
    });
    assert.strictEqual(parts.length, 1);
    assert.deepStrictEqual(parts[0], {
      fileData: {
        fileUri: "https://generativelanguage.googleapis.com/v1beta/files/abc123xyz",
        mimeType: "application/pdf",
      },
    });
  });

  await t.test("flattens an array of mixed contents", () => {
    const parts = formatUploadedContents([
      "First instruction",
      { fileUri: "uri://test.png", mimeType: "image/png" },
      "Second instruction",
    ]);
    assert.strictEqual(parts.length, 3);
    assert.strictEqual(parts[0].text, "First instruction");
    assert.strictEqual(parts[1].fileData.fileUri, "uri://test.png");
    assert.strictEqual(parts[2].text, "Second instruction");
  });

  await t.test("returns empty array for undefined or null", () => {
    assert.deepStrictEqual(formatUploadedContents(undefined), []);
    assert.deepStrictEqual(formatUploadedContents(null as any), []);
  });
});

