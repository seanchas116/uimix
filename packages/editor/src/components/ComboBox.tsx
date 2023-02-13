import * as RadixSelect from "@radix-ui/react-select";
import downIcon from "@iconify-icons/ic/keyboard-arrow-down";
import { Icon, IconifyIcon } from "@iconify/react";
import { twMerge } from "tailwind-merge";
import { CustomSelect, SelectOption } from "./Select";
import { Input } from "./Input";

export function ComboBox({
  className,
  options,
  placeholder,
  value,
  onChange,
  icon,
}: {
  className?: string;
  options: readonly SelectOption<string>[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  icon?: string | IconifyIcon;
}): JSX.Element {
  return (
    <div className={twMerge("relative", className)}>
      <Input
        icon={icon}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
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
