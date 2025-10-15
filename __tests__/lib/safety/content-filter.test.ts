// ContentFilter Tests
import { describe, expect, it } from "vitest";
import {
  AgeFilter,
  ContentFilter,
  PIIDetector,
} from "@/lib/safety/content-filter";

describe("ContentFilter", () => {
  describe("check", () => {
    it("should flag inappropriate words", () => {
      const result = ContentFilter.check("Ovo je mržnja tekst");
      expect(result.safe).toBe(false);
      expect(result.flagged).toContain("mržnja");
    });

    it("should pass safe content", () => {
      const result = ContentFilter.check("Danas sam uradio domaći zadatak");
      expect(result.safe).toBe(true);
      expect(result.flagged).toHaveLength(0);
    });

    it("should filter inappropriate words", () => {
      const result = ContentFilter.check("mržnja je loša");
      expect(result.filtered).toContain("***");
      expect(result.filtered).not.toContain("mržnja");
    });
  });

  describe("autoCorrect", () => {
    it("should reduce repeated characters", () => {
      const corrected = ContentFilter.autoCorrect("heeeeej");
      expect(corrected).toBe("heej");
    });

    it("should reduce excessive punctuation", () => {
      const corrected = ContentFilter.autoCorrect("Šta!!!!!");
      expect(corrected).toBe("Šta!!");
    });

    it("should trim whitespace", () => {
      const corrected = ContentFilter.autoCorrect("  tekst  ");
      expect(corrected).toBe("tekst");
    });
  });
});

describe("AgeFilter", () => {
  describe("isAppropriate", () => {
    it("should reject content for users under 7", () => {
      const result = AgeFilter.isAppropriate("Test content", 6);
      expect(result.appropriate).toBe(false);
      expect(result.suggestedAge).toBe(7);
    });

    it("should accept content for users 7-15", () => {
      const result = AgeFilter.isAppropriate("Jednostavan tekst", 10);
      expect(result.appropriate).toBe(true);
    });

    it("should accept content for users over 15", () => {
      const result = AgeFilter.isAppropriate("Bilo koji tekst", 16);
      expect(result.appropriate).toBe(true);
    });
  });

  describe("simplify", () => {
    it("should replace complex words", () => {
      const simplified = AgeFilter.simplify("međutim, moram da kažem");
      expect(simplified).toContain("ali");
    });
  });
});

describe("PIIDetector", () => {
  describe("detect", () => {
    it("should detect email addresses", () => {
      const result = PIIDetector.detect("Moj email je test@example.com");
      expect(result.detected).toBe(true);
      expect(result.types).toContain("email");
      expect(result.masked).toContain("[EMAIL ADRESA]");
    });

    it("should detect phone numbers (Serbian format)", () => {
      const result = PIIDetector.detect("Pozovi me na 0612345678");
      expect(result.detected).toBe(true);
      expect(result.types).toContain("phone");
      expect(result.masked).toContain("[TELEFON]");
    });

    it("should detect JMBG", () => {
      const result = PIIDetector.detect("Moj JMBG je 1234567890123");
      expect(result.detected).toBe(true);
      expect(result.types).toContain("jmbg");
      expect(result.masked).toContain("[JMBG]");
    });

    it("should not detect PII in safe content", () => {
      const result = PIIDetector.detect("Danas sam uradio domaći");
      expect(result.detected).toBe(false);
      expect(result.types).toHaveLength(0);
    });
  });

  describe("generateWarning", () => {
    it("should generate warning for detected PII", () => {
      const warning = PIIDetector.generateWarning(["email", "phone"]);
      expect(warning).toContain("UPOZORENJE");
      expect(warning).toContain("email");
      expect(warning).toContain("phone");
    });

    it("should return empty string for no PII", () => {
      const warning = PIIDetector.generateWarning([]);
      expect(warning).toBe("");
    });
  });
});
