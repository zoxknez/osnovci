# Proposed Maintenance Tasks

## 1. Fix typo in documentation index
- **Issue:** The documentation index lists the question "Kako da konfigurem environment?", but "konfigurem" is a misspelling of "konfigurišem".
- **Suggested Task:** Update the phrasing to "Kako da konfigurišem environment?" to correct the typo and improve professionalism.
- **Location:** `izvestaji/00_INDEX.md`, search for the "Kako da konfigurem environment?" entry in the FAQ-style section.

## 2. Correct PDF footer pagination logic
- **Issue:** `exportHomeworkToPDF` writes a footer that always says "Strana 1" and only renders it once, so multi-page homework exports display incorrect page numbers and later pages lack the footer entirely.
- **Suggested Task:** Iterate through all pages after table generation and write a footer on each page that reflects the actual page index (e.g., "Strana ${page} od ${pageCount}").
- **Location:** `lib/utils/pdf-export.ts`, footer logic inside `exportHomeworkToPDF`.

## 3. Align comment with implementation in accessibility utilities
- **Issue:** The comment above `useA11yId` claims the function uses `useState` to ensure consistent IDs, but the implementation simply increments a module-level counter. This discrepancy can mislead readers.
- **Suggested Task:** Either update the implementation to actually use `useState` or adjust the comment to describe the current behavior accurately.
- **Location:** `lib/utils/accessibility.ts`, comment preceding `useA11yId`.

## 4. Strengthen cn utility test coverage
- **Issue:** The `cn` utility supports `clsx`-style object arguments (e.g., `{ active: condition }`), but the existing tests only cover strings and booleans. Missing object-based assertions leaves a regression risk.
- **Suggested Task:** Extend `__tests__/lib/utils/cn.test.ts` with a test case that passes object arguments and verifies truthy keys appear while falsy ones are omitted.
- **Location:** `__tests__/lib/utils/cn.test.ts`, add a new `it` block covering object arguments.
