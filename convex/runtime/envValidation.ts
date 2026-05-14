type IntegrationLike = {
  integrationId: string;
  name: string;
  provider: string;
  status:
    | "connected"
    | "disconnected"
    | "missing_credentials"
    | "manual_mode"
    | "error"
    | "demo_fallback"
    | "not_configured";
  envKeys: string[];
  fallback: string;
};

type IntegrationStatus =
  | "connected"
  | "disconnected"
  | "missing_credentials"
  | "manual_mode"
  | "error"
  | "demo_fallback"
  | "not_configured";

export type IntegrationCheckResult = {
  status: IntegrationStatus;
  statusLabel: string;
  result: string;
  configuredEnvVars: string[];
  missingEnvVars: string[];
  healthSummary: string;
  safePingAttempted: boolean;
  safePingSucceeded: boolean;
};

export function statusLabelFor(status: string) {
  return status.replace(/_/g, " ");
}

export function validateEnvPresence(envKeys: string[]) {
  const configuredEnvVars = envKeys.filter((key) => Boolean(process.env[key]));
  const missingEnvVars = envKeys.filter((key) => !process.env[key]);
  return {
    configuredEnvVars,
    missingEnvVars,
    allPresent: envKeys.length > 0 && missingEnvVars.length === 0,
  };
}

function validateWebhookUrl(url: string | undefined) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function evaluateIntegrationConnection(integration: IntegrationLike): IntegrationCheckResult {
  const { configuredEnvVars, missingEnvVars, allPresent } = validateEnvPresence(integration.envKeys);
  const manualEligible =
    integration.status === "manual_mode" ||
    integration.status === "demo_fallback" ||
    integration.status === "not_configured";

  if (integration.integrationId === "hermes_runtime") {
    const rawUrl = process.env.HERMES_RUNTIME_URL?.trim();
    const hadUrl = Boolean(rawUrl);
    let safePingAttempted = false;
    let safePingSucceeded = false;
    let status: IntegrationStatus;
    let result: string;

    if (!hadUrl) {
      status = "not_configured";
      result =
        "Hermes local runtime is not configured: set HERMES_RUNTIME_URL to the HTTP(S) endpoint for Hermes by Nous on the office Mac mini. No network request was made.";
    } else {
      safePingAttempted = true;
      safePingSucceeded = validateWebhookUrl(rawUrl);
      if (!safePingSucceeded) {
        status = "error";
        result = "HERMES_RUNTIME_URL is set but is not a valid http(s) URL. No network request was made.";
      } else {
        status = "connected";
        result =
          "HERMES_RUNTIME_URL is present with valid shape. Live health requests to Hermes are not enabled in this build; no network request was made.";
      }
    }

    const hermesConfigured = hadUrl && safePingSucceeded;
    return {
      status,
      statusLabel: statusLabelFor(status),
      result,
      configuredEnvVars: hermesConfigured ? ["HERMES_RUNTIME_URL"] : [],
      missingEnvVars: hermesConfigured ? [] : ["HERMES_RUNTIME_URL"],
      healthSummary: result,
      safePingAttempted,
      safePingSucceeded,
    };
  }

  let status: IntegrationStatus = integration.status;
  let result = "Manual fallback active.";
  let safePingAttempted = false;
  let safePingSucceeded = false;

  if (missingEnvVars.length > 0) {
    status = manualEligible ? integration.status : "missing_credentials";
    result = manualEligible
      ? "Manual fallback active. Missing required environment variables."
      : "Missing required environment variables.";
  } else if (integration.integrationId === "zapier") {
    safePingAttempted = true;
    safePingSucceeded = validateWebhookUrl(process.env.ZAPIER_CAMPAIGN_APPROVED_WEBHOOK_URL);
    if (!safePingSucceeded) {
      status = "error";
      result = "Webhook URL is configured but invalid.";
    } else {
      status = "connected";
      result = "Required environment variables detected. Webhook URL passed validation.";
    }
  } else if (integration.integrationId === "convex") {
    safePingAttempted = true;
    safePingSucceeded = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL && process.env.CONVEX_DEPLOYMENT);
    status = safePingSucceeded ? "connected" : "error";
    result = safePingSucceeded
      ? "Convex deployment metadata detected."
      : "Convex deployment metadata is incomplete.";
  } else if (integration.integrationId === "vercel") {
    safePingAttempted = true;
    safePingSucceeded = Boolean(process.env.VERCEL_ENV);
    status = safePingSucceeded ? "connected" : "manual_mode";
    result = safePingSucceeded
      ? `Vercel environment detected: ${process.env.VERCEL_ENV}.`
      : "Vercel environment metadata is not available in this runtime.";
  } else if (integration.integrationId === "clerk") {
    safePingAttempted = true;
    safePingSucceeded = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
    status = safePingSucceeded ? "connected" : "missing_credentials";
    result = safePingSucceeded
      ? "Required environment variables detected for Clerk."
      : "Clerk keys are incomplete.";
  } else if (allPresent) {
    status = "connected";
    result = "Required environment variables detected.";
  } else {
    status = manualEligible ? integration.status : "missing_credentials";
    result = manualEligible ? "Manual fallback active." : "Missing required environment variables.";
  }

  return {
    status,
    statusLabel: statusLabelFor(status),
    result,
    configuredEnvVars,
    missingEnvVars,
    healthSummary: result,
    safePingAttempted,
    safePingSucceeded,
  };
}
