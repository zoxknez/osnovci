// cn utility tests
import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("bg-red-500", "text-white");
    expect(result).toContain("bg-red-500");
    expect(result).toContain("text-white");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toContain("base-class");
    expect(result).toContain("active-class");
  });

  it("should handle falsy values", () => {
    const result = cn("base", false && "hidden", undefined, null);
    expect(result).toBe("base");
  });

  it("should override conflicting Tailwind classes", () => {
    const result = cn("bg-red-500", "bg-blue-500");
    expect(result).toContain("bg-blue-500");
    expect(result).not.toContain("bg-red-500");
  });
});
