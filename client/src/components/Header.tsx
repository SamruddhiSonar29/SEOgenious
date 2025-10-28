import { Search } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Search className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            SEOgenious
          </h1>
        </div>
      </div>
    </header>
  );
}
