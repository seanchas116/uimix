import { Icon, IconifyIcon } from "@iconify/react";
import * as RadixToggleGroup from "@radix-ui/react-toggle-group";
import { twMerge } from "tailwind-merge";
import { Tooltip } from "./Tooltip";

export interface ToggleGroupItem<T extends string> {
  content: IconifyIcon | React.ReactNode;
  value: T;
  tooltip?: React.ReactNode;
}

export function ToggleGroup<T extends string>({
  className,
  items,
  value,
  onChange,
}: {
  className?: string;
  items: readonly ToggleGroupItem<T>[];
  value?: T;
  onChange?: (value?: T) => void;
}) {
  return (
    <RadixToggleGroup.Root
      className={twMerge(
        "bg-macaron-uiBackground w-fit rounded text-macaron-text inline-flex p-[2px]",
        className
      )}
      type="single"
      value={value ?? ""}
      onValueChange={(value) => {
        if (value) {
          onChange?.(value as T);
        } else {
          onChange?.(undefined);
        }
      }}
    >
      {items.map((item) => {
        return (
          <Tooltip text={item.tooltip} key={item.value}>
            <RadixToggleGroup.Item
              value={item.value}
              className="aria-checked:bg-macaron-active w-[30px] h-[20px] flex items-center justify-center rounded-sm"
            >
              {typeof item.content === "object" &&
              item.content &&
              "body" in item.content ? (
                <Icon icon={item.content} width={16} />
              ) : (
                item.content
              )}
            </RadixToggleGroup.Item>
          </Tooltip>
        );
      })}
    </RadixToggleGroup.Root>
  );
}
