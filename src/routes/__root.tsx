import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider } from "../lib/theme";
import { PinProvider } from "../lib/pin-context";
import { AppGate } from "../components/app-gate";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Wedding Planner" },
      {
        name: "description",
        content:
          "Premium wedding planning & budget management — events, family members, items, PIN-secured edits, recycle bin, activity logs.",
      },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Wedding Planner" },
      {
        property: "og:description",
        content: "Plan and manage the whole wedding in one elegant place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Wedding Planner" },
      { name: "description", content: "A web app for wedding planning and budget management, offering a premium UI and offline capabilities." },
      { property: "og:description", content: "A web app for wedding planning and budget management, offering a premium UI and offline capabilities." },
      { name: "twitter:description", content: "A web app for wedding planning and budget management, offering a premium UI and offline capabilities." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9a9fe1d1-319f-4458-9281-a69ad0a6d41b/id-preview-f2b68387--cf3f42c5-7adc-4748-874a-2c472a3a1658.lovable.app-1780491656050.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9a9fe1d1-319f-4458-9281-a69ad0a6d41b/id-preview-f2b68387--cf3f42c5-7adc-4748-874a-2c472a3a1658.lovable.app-1780491656050.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppGate>
            <PinProvider>
              <Outlet />
            </PinProvider>
          </AppGate>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
