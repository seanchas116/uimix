export function incrementAlphanumeric(str: string): string {
  const numMatches = /[1-9][0-9]*$/.exec(str);
  if (numMatches) {
    const numPart = numMatches[0];
    const strPart = str.slice(0, str.length - numPart.length);

    return `${strPart}${Number.parseInt(numPart) + 1}`;
  }

  return str + "1";
}

export function getIncrementalUniqueName(
  existings: ReadonlySet<string>,
  name: string
): string {
  while (existings.has(name)) {
    name = incrementAlphanumeric(name);
  }
  return name;
}
