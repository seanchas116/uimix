import clsx from "clsx";

export function InspectorHeading({
  text,
  dimmed,
  buttons,
}: {
  text: React.ReactNode;
  dimmed?: boolean;
  buttons?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between h-4">
      <h2
        className={clsx("leading-4 font-semibold", {
          "text-macaron-disabledText": dimmed,
        })}
      >
        {text}
      </h2>
      <div className="flex">{buttons}</div>
    </div>
  );
}
