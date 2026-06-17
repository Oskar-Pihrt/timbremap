/**
 * Serialize a JSON-LD object for safe embedding in a
 * `<script type="application/ld+json" dangerouslySetInnerHTML>` block.
 *
 * `JSON.stringify` escapes quotes but NOT `<` or `/`, so a literal `</script>`
 * inside any user-controlled field (review body, item title, description,
 * artist, display name, …) would close the JSON-LD `<script>` tag early and let
 * a following `<script>` execute — a stored XSS. Escaping `<`, `>`, `&` to their
 * `\uXXXX` JSON forms keeps the payload a valid JSON string while making it
 * impossible to break out of the `<script>` context (the only breakout vectors
 * inside a JSON-LD block are `</script>` and `<!--`).
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
