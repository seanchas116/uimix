import { observer } from "mobx-react-lite";
import { Input } from "../../../../components/Input";
import { projectState } from "../../../../state/ProjectState";
import { sameOrMixed } from "../../../../utils/Mixed";
import { action } from "mobx";
import { IconifyIcon } from "@iconify/react";
import { useContext } from "react";
import { InspectorTargetContext } from "../../components/InspectorTargetContext";
import { Selectable } from "../../../../models/Selectable";

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
        projectState.history.commit();
      })}
    />
  );
});
