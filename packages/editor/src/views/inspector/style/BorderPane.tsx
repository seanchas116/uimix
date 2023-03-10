import { observer } from "mobx-react-lite";
import addIcon from "@iconify-icons/ic/add";
import removeIcon from "@iconify-icons/ic/remove";
import { Color } from "../../../utils/Color";
import { ColorInput } from "../components/ColorInput";
import { Mixed, sameOrMixed } from "../../../utils/Mixed";
import { projectState } from "../../../state/ProjectState";
import { IconButton } from "../../../components/IconButton";
import { InspectorHeading } from "../components/InspectorHeading";
import { InspectorPane } from "../components/InspectorPane";
import { action } from "mobx";
import { InspectorTargetContext } from "../components/InspectorTargetContext";
import icon_line_weight from "@iconify-icons/ic/outline-line-weight";
import eachEdgeIcon from "@seanchas116/design-icons/json/separate-edges.json";
import edgeTopIcon from "@seanchas116/design-icons/json/edge-top.json";
import edgeRightIcon from "@seanchas116/design-icons/json/edge-right.json";
import edgeBottomIcon from "@seanchas116/design-icons/json/edge-bottom.json";
import edgeLeftIcon from "@seanchas116/design-icons/json/edge-left.json";
import { SeparableInput } from "../../../components/SeparableInput";
import { useContext } from "react";
import { abstractNodeTypes } from "../../../models/Node";

function BorderWidthEdit() {
  const selectables = useContext(InspectorTargetContext);
  const top = sameOrMixed(selectables.map((s) => s.style.borderTopWidth));
  const right = sameOrMixed(selectables.map((s) => s.style.borderRightWidth));
  const bottom = sameOrMixed(selectables.map((s) => s.style.borderBottomWidth));
  const left = sameOrMixed(selectables.map((s) => s.style.borderLeftWidth));

  return (
    <SeparableInput
      title="Border Width"
      values={{
        top: String(top),
        right: String(right),
        bottom: String(bottom),
        left: String(left),
      }}
      edgeIcons={{
        all: icon_line_weight,
        top: edgeTopIcon,
        right: edgeRightIcon,
        bottom: edgeBottomIcon,
        left: edgeLeftIcon,
      }}
      toggleIcon={eachEdgeIcon}
      onChange={(edge, value) => {
        let numValue = Number.parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          numValue = 0;
        }

        for (const selectable of selectables) {
          switch (edge) {
            case "top":
              selectable.style.borderTopWidth = numValue;
              break;
            case "right":
              selectable.style.borderRightWidth = numValue;
              break;
            case "bottom":
              selectable.style.borderBottomWidth = numValue;
              break;
            case "left":
              selectable.style.borderLeftWidth = numValue;
              break;
            case "all":
              selectable.style.borderTopWidth = numValue;
              selectable.style.borderRightWidth = numValue;
              selectable.style.borderBottomWidth = numValue;
              selectable.style.borderLeftWidth = numValue;
              break;
          }
        }

        projectState.undoManager.stopCapturing();

        return true;
      }}
    />
  );
}

export const BorderPane: React.FC = observer(function BorderPane() {
  const selectables = projectState.selectedSelectables.filter(
    (s) => !abstractNodeTypes.includes(s.node.type)
  );
  const border = sameOrMixed(selectables.map((s) => s.style.border));
  const hasBorder = border && border !== Mixed;

  const onChangeBorder = action((border: Color | undefined) => {
    for (const selectable of selectables) {
      const adding = border && !selectable.style.border;
      selectable.style.border = border?.toHex() ?? null;
      if (adding) {
        selectable.style.borderTopWidth = 1;
        selectable.style.borderRightWidth = 1;
        selectable.style.borderBottomWidth = 1;
        selectable.style.borderLeftWidth = 1;
      }
      if (!border) {
        selectable.style.borderTopWidth = 0;
        selectable.style.borderRightWidth = 0;
        selectable.style.borderBottomWidth = 0;
        selectable.style.borderLeftWidth = 0;
      }
    }
  });
  const onChangeEndBorder = action(() => {
    projectState.undoManager.stopCapturing();
  });

  if (!selectables.length) {
    return null;
  }

  return (
    <InspectorPane>
      <InspectorHeading
        icon="material-symbols:border-color-outline"
        text="Border"
        dimmed={!hasBorder}
        buttons={
          hasBorder ? (
            <IconButton
              icon={removeIcon}
              onClick={() => {
                onChangeBorder(undefined);
              }}
            />
          ) : (
            <IconButton
              icon={addIcon}
              onClick={() => {
                onChangeBorder(Color.from("black"));
              }}
            />
          )
        }
      />
      {border === Mixed ? (
        <div className="text-macaron-disabledText">Mixed</div>
      ) : border ? (
        <InspectorTargetContext.Provider value={selectables}>
          <div className="flex flex-col gap-2">
            <ColorInput
              value={Color.from(border) ?? Color.black}
              onChange={onChangeBorder}
              onChangeEnd={onChangeEndBorder}
            />
            <BorderWidthEdit />
          </div>
        </InspectorTargetContext.Provider>
      ) : null}
    </InspectorPane>
  );
});
