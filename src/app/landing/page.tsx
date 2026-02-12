/** App domain for landing-page links. Always use app subdomain so links work from www/thebellcrm.eu. */
const APP_URL = "https://app.thebellcrm.eu";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          The BELL CRM
        </h1>
        <p className="text-lg text-muted-foreground">
          Customer relationship management for your sales pipeline. Manage leads,
          contacts, and deals in one place.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href={`${APP_URL}/sign-up`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Get started
          </a>
          <a
            href={`${APP_URL}/sign-in`}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Sign in
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          Use the app at{" "}
          <a
            href={APP_URL}
            className="underline underline-offset-4 hover:text-foreground"
          >
            app.thebellcrm.eu
          </a>
        </p>
      </div>
    </div>
  );
}
