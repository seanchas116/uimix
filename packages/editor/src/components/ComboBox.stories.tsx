import React, { useState } from "react";
import { ComboBox } from "./ComboBox";
import googleFonts from "../fonts/GoogleFonts";
import { SelectOption } from "./Select";

export default {
  title: "ComboBox",
  component: ComboBox,
};

const googleFontOptions: SelectOption<string>[] = googleFonts.items.map(
  (item) => ({
    value: item.family,
    text: item.family,
  })
);

export const Basic: React.FC = () => {
  const [value, setValue] = useState<string | undefined>("div");

  return (
    <div className="flex flex-col gap-2 w-[200px]">
      <ComboBox
        value={value}
        onChange={setValue}
        placeholder="Select a tag"
        options={googleFontOptions}
      />
    </div>
  );
};