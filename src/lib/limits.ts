/**
 * Shared input-size caps. Enforced authoritatively in the DB (migration
 * 20260617000015) and re-checked in server actions for clear error messages;
 * the matching `maxLength` on form fields is UX only. Keep these in sync with
 * the migration's CHECK constraints.
 */
export const MAX_REVIEW_LEN = 5000;
export const MAX_DESCRIPTION_LEN = 10000;
export const MAX_TITLE_LEN = 300;
export const MAX_GENRES = 20;
export const MAX_GENRE_LEN = 50;
