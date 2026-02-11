import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-8">
      <Link href="/" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2">
        <Image
          src="/logo.png"
          alt="The Bell"
          width={140}
          height={38}
          className="h-9 w-auto object-contain"
          priority
        />
        <span className="text-sm text-primary-foreground/90">CRM</span>
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
