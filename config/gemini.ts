import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";

/**
 * Uploaded content specification. Supports base64 data, buffers, file URIs,
 * nested file objects, and plain text prompts.
 */
export type UploadedContent =
  | {
      mimeType: string;
      data: string | Buffer;
      [key: string]: any;
    }
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
      [key: string]: any;
    }
  | {
      fileUri: string;
      mimeType?: string;
      [key: string]: any;
    }
  | {
      fileData: {
        fileUri: string;
        mimeType?: string;
      };
      [key: string]: any;
    }
  | {
      text?: string;
      prompt?: string;
      files?: UploadedContent[];
      file?: UploadedContent;
      [key: string]: any;
    }
  | Record<string, any>
  | string;

/**
 * Additional options for Gemini API execution and configuration.
 */
export interface GeminiExecutionOptions {
  /** Model to use (defaults to current recommended gemini-3.8-flash) */
  model?: string;
  /** Custom Gemini API key (defaults to process.env.GEMINI_API_KEY or process.env.GOOGLE_API_KEY) */
  apiKey?: string;
  /** Sampling temperature between 0.0 and 2.0 */
  temperature?: number;
  /** Maximum number of output tokens */
  maxOutputTokens?: number;
  /** Stop sequences to abort generation */
  stopSequences?: string[];
  /** Optional prompt text to append to uploaded contents */
  prompt?: string;
  /** Whether to stream the response (default false) */
  stream?: boolean;
  /** Custom list of fallback models to try if the primary model fails */
  fallbackModels?: string[];
  /** Disable automatic fallback to backup models (default false) */
  disableFallback?: boolean;
}

/**
 * Default fallback models list tried sequentially if the primary model fails or is unavailable.
 * Covers Gemini 3.8 Flash, 3.6 Flash, 3.7 Flash, 3.5 Flash-Lite, 3.1 Flash-Lite, 3.5, 3 Flash Preview,
 * 2.5 Pro, 2.5 Flash, and 2.5 Flash-Lite.
 */
export const DEFAULT_FALLBACK_MODELS: string[] = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.5",
  "gemini-3-flash-preview",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

/**
 * Unified parameter object when calling geminiConfig with an options object.
 */
export interface GeminiConfigOptions extends GeminiExecutionOptions {
  /** System instruction steering the model's persona, tone, and behavior */
  systemInstructions?: string;
  /** Alias for systemInstructions */
  systemInstruction?: string;
  /** Uploaded content object (e.g. image, document, base64 data, file URI, or audio) */
  uploadedContents?: UploadedContent;
  /** Alias for uploadedContents */
  uploadedContent?: UploadedContent;
  /** Response schema object defining structured JSON output */
  responseSchema?: Record<string, any>;
  /** Alias for responseSchema */
  schema?: Record<string, any>;
}

/**
 * The assembled configuration structure ready for the @google/genai SDK.
 */
export interface GeminiConfigPayload {
  model: string;
  contents: any[];
  config: GenerateContentConfig;
}

/**
 * Structured response returned when calling the Gemini API.
 */
export interface GeminiExecutionResponse<T = any> {
  success: boolean;
  text: string;
  data: T | null;
  /** The model that successfully handled the generation request */
  modelUsed?: string;
  /** Record of attempted models and errors if fallbacks were triggered */
  fallbackAttempts?: Array<{ model: string; error: string }>;
  rawResponse: any;
  error?: string;
}

/**
 * Cached GoogleGenAI client instances by API key.
 */
const clientCache = new Map<string, GoogleGenAI>();

/**
 * Retrieve or initialize the GoogleGenAI client singleton for the specified API key.
 */
export function getGeminiClient(apiKey?: string): GoogleGenAI {
  const resolvedKey =
    apiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";

  if (!resolvedKey) {
    console.warn(
      "[Gemini Config] Warning: No GEMINI_API_KEY or GOOGLE_API_KEY found in environment variables."
    );
  }

  if (!clientCache.has(resolvedKey)) {
    clientCache.set(resolvedKey, new GoogleGenAI({ apiKey: resolvedKey }));
  }

  return clientCache.get(resolvedKey)!;
}

/**
 * Normalizes uploaded content objects into valid @google/genai content parts.
 * Handles base64 data, inline data, file URIs, buffers, and text.
 */
export function formatUploadedContents(uploadedContents?: UploadedContent | UploadedContent[]): any[] {
  if (!uploadedContents) return [];

  // Array of items: flatten and recursively process
  if (Array.isArray(uploadedContents)) {
    return uploadedContents.flatMap((item) => formatUploadedContents(item));
  }

  // Primitive string
  if (typeof uploadedContents === "string") {
    return [{ text: uploadedContents }];
  }

  // Standard inlineData part: { inlineData: { mimeType, data } }
  if (uploadedContents.inlineData?.data && uploadedContents.inlineData?.mimeType) {
    return [{ inlineData: uploadedContents.inlineData }];
  }

  // Flat data + mimeType: { data, mimeType }
  if (uploadedContents.data && uploadedContents.mimeType) {
    const dataStr = Buffer.isBuffer(uploadedContents.data)
      ? uploadedContents.data.toString("base64")
      : String(uploadedContents.data);
    return [
      {
        inlineData: {
          data: dataStr,
          mimeType: uploadedContents.mimeType,
        },
      },
    ];
  }

  // Standard fileData part: { fileData: { fileUri, mimeType } }
  if (uploadedContents.fileData?.fileUri) {
    return [{ fileData: uploadedContents.fileData }];
  }

  // Flat fileUri + mimeType
  if (uploadedContents.fileUri) {
    return [
      {
        fileData: {
          fileUri: uploadedContents.fileUri,
          mimeType: uploadedContents.mimeType || "application/octet-stream",
        },
      },
    ];
  }

  // Composite object containing text, prompt, and/or nested files
  const parts: any[] = [];
  if (uploadedContents.text) {
    parts.push({ text: uploadedContents.text });
  }
  if (uploadedContents.prompt && uploadedContents.prompt !== uploadedContents.text) {
    parts.push({ text: uploadedContents.prompt });
  }
  if (Array.isArray(uploadedContents.files)) {
    parts.push(...uploadedContents.files.flatMap((f: any) => formatUploadedContents(f)));
  }
  if (uploadedContents.file) {
    parts.push(...formatUploadedContents(uploadedContents.file));
  }

  if (parts.length > 0) {
    return parts;
  }

  // Fallback: serializable object converted to JSON text context
  try {
    return [{ text: JSON.stringify(uploadedContents) }];
  } catch {
    return [{ text: String(uploadedContents) }];
  }
}

/**
 * Builds the complete configuration payload for the Gemini API.
 * Accepts either:
 *  1. Positional arguments: (systemInstructions, uploadedContents, responseSchema, extraOptions)
 *  2. A single options object: ({ systemInstructions, uploadedContents, responseSchema, ... })
 */
export function createGeminiConfig(
  systemInstructions?: string | GeminiConfigOptions,
  uploadedContents?: UploadedContent,
  responseSchema?: Record<string, any>,
  extraOptions?: GeminiExecutionOptions
): GeminiConfigPayload {
  // Support both object parameter and positional parameters
  let resolvedSystemInstructions = "";
  let resolvedUploadedContents: UploadedContent | undefined;
  let resolvedResponseSchema: Record<string, any> | undefined;
  let options: GeminiExecutionOptions = {};

  if (typeof systemInstructions === "object" && systemInstructions !== null) {
    const opts = systemInstructions as GeminiConfigOptions;
    resolvedSystemInstructions = opts.systemInstructions || opts.systemInstruction || "";
    resolvedUploadedContents = opts.uploadedContents || opts.uploadedContent;
    resolvedResponseSchema = opts.responseSchema || opts.schema;
    options = opts;
  } else {
    resolvedSystemInstructions = systemInstructions || "";
    resolvedUploadedContents = uploadedContents;
    resolvedResponseSchema = responseSchema;
    options = extraOptions || {};
  }

  // Model default: gemini-3.8-flash (current generation model)
  const model = options.model || "gemini-3.8-flash";

  // Build content parts
  const contents: any[] = formatUploadedContents(resolvedUploadedContents);

  // If extra prompt was provided, append it to contents
  if (options.prompt && !contents.some((c) => c.text === options.prompt)) {
    contents.push({ text: options.prompt });
  }

  // If contents is empty, supply a default minimal user prompt
  if (contents.length === 0) {
    contents.push({ text: "Please process the request according to the system instructions." });
  }

  // Build GenerateContentConfig
  const config: GenerateContentConfig = {};

  if (resolvedSystemInstructions) {
    config.systemInstruction = resolvedSystemInstructions;
  }

  if (resolvedResponseSchema) {
    config.responseMimeType = "application/json";
    config.responseSchema = resolvedResponseSchema;
  }

  if (typeof options.temperature === "number") {
    config.temperature = options.temperature;
  }

  if (typeof options.maxOutputTokens === "number") {
    config.maxOutputTokens = options.maxOutputTokens;
  }

  if (options.stopSequences && options.stopSequences.length > 0) {
    config.stopSequences = options.stopSequences;
  }

  return {
    model,
    contents,
    config,
  };
}

/**
 * Main Gemini API function.
 * Configures and executes a Gemini generation call with system instructions,
 * uploaded contents (multimodal / object), and structured response schema.
 *
 * @param systemInstructions - Steering prompt string defining persona & constraints.
 * @param uploadedContents - Object containing uploaded file, image, base64 data, or text.
 * @param responseSchema - JSON schema object enforcing structured JSON response.
 * @param extraOptions - Optional settings (model, apiKey, temperature, prompt).
 *
 * @returns Promise<GeminiExecutionResponse<T>> with parsed JSON data and raw response.
 *
 * @example
 * ```ts
 * import { geminiConfig } from "@/config/gemini";
 *
 * const response = await geminiConfig(
 *   "You are an expert event coordinator.",
 *   { mimeType: "image/png", data: base64Image },
 *   {
 *     type: "object",
 *     properties: {
 *       title: { type: "string" },
 *       theme: { type: "string" },
 *     },
 *     required: ["title", "theme"]
 *   }
 * );
 *
 * console.log(response.data?.title);
 * ```
 */
export async function geminiConfig<T = any>(
  systemInstructions?: string | GeminiConfigOptions,
  uploadedContents?: UploadedContent,
  responseSchema?: Record<string, any>,
  extraOptions?: GeminiExecutionOptions
): Promise<GeminiExecutionResponse<T>> {
  try {
    const payload = createGeminiConfig(
      systemInstructions,
      uploadedContents,
      responseSchema,
      extraOptions
    );

    const resolvedOptions =
      typeof systemInstructions === "object" && systemInstructions !== null
        ? (systemInstructions as GeminiConfigOptions)
        : extraOptions || {};

    const apiKey = resolvedOptions.apiKey;
    const ai = getGeminiClient(apiKey);

    // Build models queue: primary model first, followed by fallback models
    const primaryModel = payload.model || "gemini-3.8-flash";
    const customFallbacks = resolvedOptions.fallbackModels || DEFAULT_FALLBACK_MODELS;
    const disableFallback = resolvedOptions.disableFallback === true;

    // Ordered unique model list to try
    const modelsToTry: string[] = disableFallback
      ? [primaryModel]
      : Array.from(new Set([primaryModel, ...customFallbacks]));

    let lastError: any = null;
    const fallbackAttempts: Array<{ model: string; error: string }> = [];

    for (let i = 0; i < modelsToTry.length; i++) {
      const candidateModel = modelsToTry[i];
      try {
        if (i > 0) {
          console.info(
            `[Gemini Config] Attempting fallback model (${i}/${modelsToTry.length - 1}): "${candidateModel}"...`
          );
        }

        const result = await ai.models.generateContent({
          model: candidateModel,
          contents: payload.contents,
          config: payload.config,
        });

        const text = result.text?.trim() || "";
        let data: T | null = null;

        // If response schema or JSON mime type was configured, parse JSON safely
        const isJsonExpected =
          payload.config.responseMimeType === "application/json" ||
          payload.config.responseSchema !== undefined;

        if (isJsonExpected && text) {
          try {
            data = JSON.parse(text) as T;
          } catch {
            // Fallback for markdown-wrapped code blocks ```json ... ```
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                data = JSON.parse(jsonMatch[1]) as T;
              } catch {
                console.warn("[Gemini Config] Failed to parse JSON response:", text);
              }
            }
          }
        }

        return {
          success: true,
          text,
          data,
          modelUsed: candidateModel,
          fallbackAttempts: fallbackAttempts.length > 0 ? fallbackAttempts : undefined,
          rawResponse: result,
        };
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        fallbackAttempts.push({ model: candidateModel, error: errMsg });
        lastError = err;

        const nextModel = modelsToTry[i + 1];
        if (nextModel) {
          console.warn(
            `[Gemini Config] Model "${candidateModel}" failed: ${errMsg}. Falling back to "${nextModel}"...`
          );
        }
      }
    }

    console.error(
      `[Gemini Config] All ${modelsToTry.length} attempted models failed:`,
      fallbackAttempts
    );

    return {
      success: false,
      text: "",
      data: null,
      fallbackAttempts,
      rawResponse: null,
      error:
        lastError?.message ||
        `All attempted Gemini models failed (${modelsToTry.join(", ")})`,
    };
  } catch (error: any) {
    console.error("[Gemini Config] Error executing Gemini API call:", error);
    return {
      success: false,
      text: "",
      data: null,
      rawResponse: null,
      error: error?.message || String(error),
    };
  }
}

// Attach configuration builder utility as a property on geminiConfig
geminiConfig.createConfig = createGeminiConfig;
geminiConfig.formatUploadedContents = formatUploadedContents;
geminiConfig.getClient = getGeminiClient;
geminiConfig.fallbackModels = DEFAULT_FALLBACK_MODELS;

export default geminiConfig;
