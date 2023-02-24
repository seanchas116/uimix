import { observer } from "mobx-react-lite";
import { projectState } from "../../../state/ProjectState";
import { InspectorHeading } from "../components/InspectorHeading";
import { InspectorPane } from "../components/InspectorPane";
import { InspectorTargetContext } from "../components/InspectorTargetContext";
import { ForeignComponentManager } from "../../../models/ForeignComponentManager";
import type docgen from "react-docgen-typescript";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { ForeignComponentRef } from "@uimix/node-data";
import { action } from "mobx";

export const PropertyPane: React.FC = observer(function PropertyPane() {
  const selectables = projectState.selectedSelectables.filter(
    (s) => s.node.type === "foreign"
  );

  if (!selectables.length) {
    return null;
  }

  // TODO: multiple components
  const selectable = selectables[0];
  const componentID = selectable.style.foreignComponentID;
  const component = componentID
    ? ForeignComponentManager.global?.get(componentID)
    : undefined;

  return (
    <InspectorPane>
      <InspectorHeading
        icon="material-symbols:code"
        iconClassName="text-pink-500"
        text={component?.name ?? "Properties"}
      />
      <InspectorTargetContext.Provider value={selectables}>
        {Object.entries(component?.props ?? {}).map(([key, value]) => {
          return (
            <div className="flex flex-col gap-1" key={key}>
              <div>{key}</div>
              <PropertyEdit
                prop={value}
                value={componentID?.props?.[key]}
                onValueChange={action((value) => {
                  const oldComponentID = selectable.style.foreignComponentID;
                  if (!oldComponentID) {
                    return;
                  }
                  const componentID: ForeignComponentRef = {
                    ...oldComponentID,
                    props: {
                      ...oldComponentID.props,
                      [key]: value,
                    },
                  };
                  selectable.style.foreignComponentID = componentID;
                })}
              />
            </div>
          );
        })}
      </InspectorTargetContext.Provider>
    </InspectorPane>
  );
});

const PropertyEdit: React.FC<{
  prop: docgen.PropItem;
  value: unknown;
  onValueChange: (value: unknown) => void;
}> = ({ prop, value, onValueChange }) => {
  if (prop.type.name === "string" || prop.type.name === "string | undefined") {
    return (
      <Input
        value={value ? String(value) : ""}
        onChange={(value) => onValueChange(value)}
      />
    );
  }
  if (
    prop.type.name === "boolean" ||
    prop.type.name === "boolean | undefined"
  ) {
    // return (
    //   <input
    //     type="checkbox"
    //     onChange={(e) => onValueChange(e.target.checked)}
    //   />
    // );
    return (
      <Select
        options={[
          { value: "", text: "" },
          { value: "false", text: "false" },
          { value: "true", text: "true" },
        ]}
        value={value === true ? "true" : value === false ? "false" : ""}
        onChange={(value) =>
          onValueChange(
            value === "true" ? true : value === "false" ? false : undefined
          )
        }
      />
    );
  }
  if (prop.type.name === "enum" || prop.type.name === "enum") {
    return (
      <Select
        options={prop.type.value.map(({ value }: { value: string }) => {
          try {
            const rawValue = JSON.parse(value);
            return {
              value: rawValue,
              text: rawValue,
            };
          } catch {
            return {
              value: "",
              text: "",
            };
          }
        })}
        value={value as string}
        onChange={(value) => onValueChange(value || undefined)}
      />
    );
  }
  return <div></div>;
};
