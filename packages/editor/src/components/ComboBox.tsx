import * as RadixSelect from "@radix-ui/react-select";
import { popoverStyle } from "./styles";
import checkIcon from "@iconify-icons/ic/check";
import upIcon from "@iconify-icons/ic/keyboard-arrow-up";
import downIcon from "@iconify-icons/ic/keyboard-arrow-down";
import { Icon, IconifyIcon } from "@iconify/react";
import { twMerge } from "tailwind-merge";
import { CustomSelect, Select, SelectOption } from "./Select";
import { Input, UnstyledInput } from "./Input";

export function ComboBox({
  className,
  options,
  placeholder,
  value,
  onChange,
}: {
  className?: string;
  options: readonly SelectOption<string>[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}): JSX.Element {
  return (
    <div className={twMerge("relative", className)}>
      <Input value={value} onChange={onChange} placeholder={placeholder} />
      <CustomSelect
        options={options}
        trigger={
          <RadixSelect.Trigger
            className={"absolute inset-0 pointer-events-none outline-none"}
          >
            <div className="opacity-0">
              <RadixSelect.Value />
            </div>
            <RadixSelect.Icon className="absolute top-0 bottom-0 h-3 my-auto right-1.5 pointer-events-auto">
              <Icon icon={downIcon} className="text-xs text-macaron-label" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
        }
        value={
          options.some((o) => o.value === value) ? value : options[0]?.value
        }
        onChange={onChange}
      />
    </div>
  );
}
