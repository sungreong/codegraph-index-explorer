export function parseCodegraphJsonOutput(output: string): unknown {
  const cleaned = stripAnsiControlSequences(output).trim();
  if (!cleaned) {
    return [];
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const extracted = parseEmbeddedJson(cleaned);
    if (extracted !== undefined) {
      return extracted;
    }

    throw error;
  }
}

export function stripAnsiControlSequences(value: string): string {
  return value
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "")
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\u001b[@-Z\\-_]/g, "");
}

function parseEmbeddedJson(value: string): unknown {
  const starts = [...value]
    .map((char, index) => (char === "{" || char === "[" ? index : -1))
    .filter((index) => index >= 0);

  for (const start of starts) {
    const opening = value[start];
    const closing = opening === "{" ? "}" : "]";
    let end = value.lastIndexOf(closing);

    while (end > start) {
      const candidate = value.slice(start, end + 1).trim();
      try {
        return JSON.parse(candidate);
      } catch {
        end = value.lastIndexOf(closing, end - 1);
      }
    }
  }

  return undefined;
}
