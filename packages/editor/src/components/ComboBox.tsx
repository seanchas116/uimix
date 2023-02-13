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
  // TODO: use Radix Select (currently native select is much faster when there are many options)
  return (
    <div className={twMerge("relative", className)}>
      <select
        className="absolute inset-0 text-xs"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((o) => (
          <option value={o.value}>{o.text}</option>
        ))}
      </select>
      <Input
        className="relative mr-4"
        icon={icon}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
