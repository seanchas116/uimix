import React, { useState } from "react";
import htmlTags from "html-tags";
import { ComboBox } from "./ComboBox";

export default {
  title: "ComboBox",
  component: ComboBox,
};

export const Basic: React.FC = () => {
  const [value, setValue] = useState<string | undefined>("div");

  return (
    <div className="flex flex-col gap-2 w-[200px]">
      <ComboBox
        value={value}
        onChange={setValue}
        options={htmlTags.map((tag) => ({
          value: tag,
          text: tag,
        }))}
      />
    </div>
  );
};
