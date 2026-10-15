import type { DataType, DataValue } from "@/types";

/** Parse numeric CSV, whitespace-separated cells, or a JSON array in reading order. */
export function parseNumericData(value: string): number[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (!trimmed.startsWith("[") && /(^|[,;])\s*[,;]|[,;]\s*$/.test(trimmed)) {
    throw new Error("Malformed CSV: empty numeric cells are not accepted.");
  }
  let data: unknown;
  try {
    data = trimmed.startsWith("[")
      ? JSON.parse(trimmed)
      : trimmed.split(/[\s,;]+/).map(Number);
  } catch {
    throw new Error("Use a valid JSON array, such as [38, 12, 71].");
  }
  if (
    !Array.isArray(data) ||
    data.some(
      (x) =>
        typeof x !== "number" || !Number.isSafeInteger(x) || Math.abs(x) > 1e12,
    )
  ) {
    throw new Error(
      "Use numeric CSV/TXT or a JSON array of integers. Headers and non-numeric cells are not accepted.",
    );
  }
  if (data.length > 20000)
    throw new Error("The dataset limit is 20,000 elements.");
  return data as number[];
}

/** Text tokens preserve spelling, case and leading zeros; quoted cells preserve spaces. */
export function parseInputData(value: string, type: DataType): DataValue[] {
  if (type === "number") return parseNumericData(value);
  const trimmed = value.trim();
  if (!trimmed) return [];
  let data: unknown;
  if (trimmed.startsWith("[")) {
    try {
      data = JSON.parse(trimmed);
    } catch {
      throw new Error(
        'Use a valid JSON string array, such as ["apple", "A12"].',
      );
    }
  } else {
    const tokens: string[] = [];
    let i = 0,
      awaitingCell = false;
    while (i < trimmed.length) {
      while (/\s/.test(trimmed[i] || "") && i < trimmed.length) i++;
      if (i === trimmed.length) break;
      if (/[,;]/.test(trimmed[i]))
        throw new Error("Empty text cells are not accepted.");
      let token = "";
      if (trimmed[i] === '"') {
        i++;
        let closed = false;
        while (i < trimmed.length) {
          if (trimmed[i] === '"') {
            if (trimmed[i + 1] === '"') {
              token += '"';
              i += 2;
            } else {
              i++;
              closed = true;
              break;
            }
          } else token += trimmed[i++];
        }
        if (!closed || (i < trimmed.length && !/[\s,;]/.test(trimmed[i])))
          throw new Error(
            'Check quoted cells. Use "New York" for a value containing spaces.',
          );
      } else {
        while (i < trimmed.length && !/[\s,;]/.test(trimmed[i])) {
          if (trimmed[i] === '"')
            throw new Error("Quote the complete text cell.");
          token += trimmed[i++];
        }
      }
      tokens.push(token);
      awaitingCell = false;
      while (i < trimmed.length && /\s/.test(trimmed[i])) i++;
      if (i < trimmed.length && /[,;]/.test(trimmed[i])) {
        i++;
        awaitingCell = true;
      }
    }
    if (awaitingCell) throw new Error("Empty text cells are not accepted.");
    data = tokens;
  }
  if (
    !Array.isArray(data) ||
    data.some(
      (x) => typeof x !== "string" || !x.trim() || Array.from(x).length > 256,
    )
  )
    throw new Error(
      "Text mode requires nonblank strings of at most 256 characters. Quote every value in JSON, including numeric-looking IDs.",
    );
  if (data.length > 20000)
    throw new Error("The dataset limit is 20,000 elements.");
  if (
    data.reduce((sum: number, x: string) => sum + Array.from(x).length, 0) >
    1000000
  )
    throw new Error(
      "Text input must contain at most 1,000,000 characters in total.",
    );
  return data as string[];
}
