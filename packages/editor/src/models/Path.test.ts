import { Path } from "./Path";
import { describe, it, expect } from "vitest";

describe(Path.name, () => {
  it("parses and emits closed path", () => {
    const d =
      "M8 5C8 5.55228 7.55228 6 7 6C6.44772 6 6 5.55228 6 5C6 4.44772 6.44772 4 7 4C7.55228 4 8 4.44772 8 5ZM8 7.82929C9.16519 7.41746 10 6.30622 10 5C10 3.34315 8.65685 2 7 2C5.34315 2 4 3.34315 4 5C4 6.30622 4.83481 7.41746 6 7.82929V16.1707C4.83481 16.5825 4 17.6938 4 19C4 20.6569 5.34315 22 7 22C8.65685 22 10 20.6569 10 19C10 17.6938 9.16519 16.5825 8 16.1707V14.8198L13.9806 13.6237C15.9303 13.2338 17.4242 11.741 17.866 9.87312C19.1006 9.5015 20 8.35578 20 7C20 5.34315 18.6569 4 17 4C15.3431 4 14 5.34315 14 7C14 8.23624 14.7478 9.29784 15.8157 9.75716C15.4633 10.7137 14.6354 11.4531 13.5883 11.6625L8 12.7802V7.82929ZM17 8C17.5523 8 18 7.55228 18 7C18 6.44772 17.5523 6 17 6C16.4477 6 16 6.44772 16 7C16 7.55228 16.4477 8 17 8ZM7 18C6.44772 18 6 18.4477 6 19C6 19.5523 6.44772 20 7 20C7.55228 20 8 19.5523 8 19C8 18.4477 7.55228 18 7 18Z";

    const path = Path.fromSVGPathData(d);

    const expected = d;
    const actual = path.toSVGPathData().replaceAll("z", "Z");

    expect(actual.split(" ")).toEqual(expected.split(" "));
  });
  it("parses and emits open path", () => {
    const d = "M19 1C131 -1 335 13 258 85C180 156 54 166 1 163";

    const path = Path.fromSVGPathData(d);

    expect(path.toSVGPathData()).toEqual(d);
  });
});
