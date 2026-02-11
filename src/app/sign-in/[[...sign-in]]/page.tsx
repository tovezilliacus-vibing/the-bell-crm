import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";

type Props = { searchParams: Promise<{ redirect_url?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (userId) {
    const { redirect_url } = await searchParams;
    let target = "/";
    if (redirect_url) {
      if (redirect_url.startsWith("/")) {
        target = redirect_url;
      } else {
        try {
          const u = new URL(redirect_url);
          target = u.pathname || "/";
        } catch {
          target = "/";
        }
      }
    }
    redirect(target);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-8">
      <Link href="/" className="flex items-center rounded-lg bg-primary px-4 py-2">
        <Image
          src="/logo.png"
          alt="The Bell"
          width={140}
          height={38}
          className="h-10 w-auto object-contain"
          priority
        />
      </Link>
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none",
          },
        }}
        fallbackRedirectUrl="/"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
