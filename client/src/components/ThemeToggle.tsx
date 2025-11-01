import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { user, setUser } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // Check localStorage first for immediate hydration
    const stored = localStorage.getItem('theme');
    return (stored as "light" | "dark") || "light";
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: "light" | "dark") => {
      if (!user) return null;
      const response = await apiRequest('PATCH', '/api/user/profile', { theme: newTheme });
      return response;
    },
    onSuccess: (updatedUser: any) => {
      if (updatedUser) {
        setUser(updatedUser);
      }
    },
  });

  // Sync theme from authenticated user when it loads
  useEffect(() => {
    if (user?.theme) {
      const userTheme = user.theme as "light" | "dark";
      setTheme(userTheme);
      localStorage.setItem('theme', userTheme);
    }
  }, [user?.theme]);

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save to localStorage for immediate hydration
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (user) {
      updateThemeMutation.mutate(newTheme);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
      className="h-9 w-9"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}
