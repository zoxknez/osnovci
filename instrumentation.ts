/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically loaded by Next.js on both server and edge runtimes.
 * Used for Sentry initialization and other monitoring setup.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side (not in edge runtime)
  if (process.env["NEXT_RUNTIME"] === "nodejs") {
    await import("./sentry.server.config");
  }

  // Edge runtime initialization
  if (process.env["NEXT_RUNTIME"] === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Error handler for nested React Server Components
 * Called when an error occurs in a Server Component
 */
export async function onRequestError(
  error: Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
  }
) {
  // Import Sentry dynamically to avoid bundling issues
  if (process.env["NEXT_RUNTIME"] === "nodejs") {
    const { captureException } = await import("@sentry/nextjs");
    captureException(error, {
      tags: {
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
        method: request.method,
      },
      extra: {
        path: request.path,
        headers: request.headers,
      },
    });
  }
}
