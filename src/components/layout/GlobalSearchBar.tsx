"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function GlobalSearchBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const currentQ = searchParams.get("q") ?? "";

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== currentQ) {
      inputRef.current.value = currentQ;
    }
  }, [currentQ]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.q as HTMLInputElement).value?.trim() ?? "";
    const next = new URLSearchParams(searchParams.toString());
    if (q) {
      next.set("q", q);
    } else {
      next.delete("q");
    }
    const queryString = next.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-sm">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={currentQ}
          placeholder="Search…"
          className="pl-8 h-9 bg-muted/50"
          aria-label="Search"
        />
      </div>
    </form>
  );
}
