import * as RadixSelect from "@radix-ui/react-select";
import downIcon from "@iconify-icons/ic/keyboard-arrow-down";
import { Icon, IconifyIcon } from "@iconify/react";
import { twMerge } from "tailwind-merge";
import { CustomSelect, SelectOption } from "./Select";
import { Input, UnstyledInput } from "./Input";

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
  // TODO: use Radix Select (currently native select is much faster when there are many options)
  return (
    <div
      className={twMerge(
        `relative
         outline-0 w-full h-7 bg-macaron-uiBackground rounded
         focus-within:ring-1 ring-inset ring-macaron-active text-macaron-text text-xs`,
        className
      )}
    >
      <select
        className="absolute inset-0 text-xs opacity-0"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((o) => (
          <option value={o.value}>{o.text}</option>
        ))}
      </select>
      <UnstyledInput
        className="absolute inset-0 right-4 bg-transparent px-1.5 outline-0 placeholder:text-macaron-disabledText"
        value={value}
        onChangeValue={onChange}
        placeholder={placeholder}
      />
      <Icon
        icon={downIcon}
        className="text-xs text-macaron-label absolute right-1 top-0 bottom-0 my-auto pointer-events-none"
      />
    </div>
  );
}
