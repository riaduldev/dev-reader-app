import { bn } from "./dictionaries/bn";

/**
 * The dictionary shape is derived from the Bangla file, but literal types are
 * widened to `string` so the English file can provide its own wording while
 * still being forced to expose exactly the same keys.
 */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { -readonly [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof bn>;
