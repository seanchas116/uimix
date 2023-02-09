import { useContext } from "react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { IconifyIcon } from "@iconify/react";
import { Input } from "../../../../components/Input";
import { sameOrMixed } from "../../../../utils/Mixed";
import { Selectable } from "../../../../models/Selectable";
import { InspectorTargetContext } from "../../components/InspectorTargetContext";
import { projectState } from "../../../../state/ProjectState";

export const InspectorInput = observer(function InspectorInput({
  className,
  get,
  set,
  icon,
}: {
  className?: string;
  get: (selectable: Selectable) => string | undefined;
  set: (selectable: Selectable, value?: string) => void;
  icon?: string | IconifyIcon;
}) {
  const selectables = useContext(InspectorTargetContext);
  const value = sameOrMixed(selectables.map((s) => get(s)));

  return (
    <Input
      icon={icon}
      className={className}
      value={value}
      onChange={action((value: string) => {
        for (const selectable of selectables) {
          set(selectable, value);
        }
        projectState.undoManager.stopCapturing();
      })}
    />
  );
});
