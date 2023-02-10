import { Icon, IconifyIconProps } from "@iconify/react";
import clsx from "clsx";

export function InspectorHeading({
  icon,
  text,
  dimmed,
  buttons,
}: {
  icon: IconifyIconProps["icon"];
  text: React.ReactNode;
  dimmed?: boolean;
  buttons?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between h-4">
      <h2
        className={clsx("leading-4 font-medium flex gap-1.5", {
          "text-macaron-disabledText": dimmed,
        })}
      >
        <Icon icon={icon} className="text-base" />
        {text}
      </h2>
      <div className="flex">{buttons}</div>
    </div>
  );
}
