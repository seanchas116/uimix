import { compact, startCase } from "lodash-es";
import React, { ReactNode } from "react";
import clsx from "clsx";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import * as RadixPopover from "@radix-ui/react-popover";
import { ReactSortable } from "react-sortablejs";
import addIcon from "@iconify-icons/ic/add";
import removeIcon from "@iconify-icons/ic/remove";
import tagIcon from "@iconify-icons/ic/sharp-numbers";
import { Icon, IconifyIcon } from "@iconify/react";
import textIcon from "@seanchas116/design-icons/json/text.json";
import switchIcon from "@seanchas116/design-icons/json/switch.json";
import { projectState } from "../../../state/ProjectState";
import { viewportState } from "../../../state/ViewportState";
import { IconButton } from "../../../components/IconButton";
import { DoubleClickToEdit } from "../../../components/DoubleClickToEdit";
import { popoverStyle } from "../../../components/styles";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { DropdownMenu } from "../../../components/Menu";
import { InspectorHeading } from "../components/InspectorHeading";
import { InspectorPane } from "../components/InspectorPane";
import { Node } from "../../../models/Node";
import { VariantCondition } from "uimix-node-data";

export function getIconAndTextForCondition(
  condition:
    | VariantCondition
    | {
        type: "default";
      }
): {
  icon: IconifyIcon | string;
  text: ReactNode;
} {
  switch (condition.type) {
    case "default": {
      return {
        icon: {
          body: '<circle fill="currentColor" cx="12" cy="12" r="4"/>',
          width: 24,
          height: 24,
        },
        text: "Default",
      };
    }
    case "hover":
      return {
        icon: "material-symbols:arrow-selector-tool-outline-rounded",
        text: "Hover",
      };
    case "active":
      return {
        icon: "material-symbols:left-click-rounded",
        text: "Active",
      };
    case "maxWidth":
      return {
        icon: "material-symbols:phone-iphone-outline",
        text: (
          <>
            Mobile
            <span className="opacity-50 pl-2">{condition.value}</span>
          </>
        ),
      };
  }
}

/*
function PropRow({
  property,
  onChange,
  onDelete,
}: {
  property: Property;
  onChange: (property: Property) => void;
  onDelete: () => void;
}) {
  const icon =
    property.type === "number"
      ? tagIcon
      : property.type === "boolean"
      ? switchIcon
      : textIcon;
  const text = property.name;

  return (
    <div className="h-7 pl-4 pr-3 flex items-center gap-2 group relative">
      <RadixPopover.Root>
        <RadixPopover.Trigger>
          <IconButton
            icon={icon}
            className="text-macaron-disabledText text-base"
          />
        </RadixPopover.Trigger>
        <RadixPopover.Portal>
          <RadixPopover.Content
            side="left"
            align="start"
            alignOffset={-12}
            sideOffset={8}
            className={`w-[200px] ${popoverStyle} rounded-lg shadow-lg p-2 flex flex-col gap-2`}
          >
            <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
              <label className="text-macaron-label">Type</label>
              <Select
                value={property.type}
                options={[
                  {
                    value: "boolean",
                    text: "Boolean",
                    icon: switchIcon,
                  },
                  {
                    value: "number",
                    text: "Number",
                    icon: tagIcon,
                  },
                  {
                    value: "string",
                    text: "String",
                    icon: textIcon,
                  },
                ]}
                onChange={(type) => {
                  onChange({
                    ...property,
                    type,
                  });
                }}
              />
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
              <label className="text-macaron-label">Default</label>
              <Input placeholder="TODO" />
            </div>
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>
      <DoubleClickToEdit
        className="h-full flex-1"
        value={text}
        onChange={function (value: string): void {
          onChange({
            ...property,
            name: value,
          });
        }}
      />
      <IconButton
        icon={removeIcon}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      />
    </div>
  );
}
*/

export const ConditionEditor: React.FC<{
  value: VariantCondition;
  onChangeValue: (value: VariantCondition) => void;
}> = ({ value: condition, onChangeValue: onChangeCondition }) => {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-2 items-center">
      <label className="text-macaron-label">Type</label>
      <Select
        value={condition.type}
        options={(["hover", "active", "maxWidth"] as const).map((value) => ({
          value,
          text: startCase(value),
        }))}
        onChange={action(
          (value: "hover" | "active" | "maxWidth" | undefined) => {
            if (!value) {
              return;
            }
            if (value === "maxWidth") {
              onChangeCondition({
                type: value,
                value: 768,
              });
            } else {
              onChangeCondition({
                type: value,
              });
            }
          }
        )}
      />
      {condition.type === "maxWidth" && (
        <>
          <label className="text-macaron-label">Max Width</label>
          <Input
            value={String(condition.value)}
            onChange={action((value) => {
              onChangeCondition({
                type: "maxWidth",
                value: Number(value),
              });
            })}
          ></Input>
        </>
      )}
    </div>
  );
};

const VariantRow = observer(function VariantRow({
  component,
  variant,
}: {
  component: Node;
  variant: Node;
}) {
  const rootNode = component.children[0];
  if (!rootNode) {
    return null;
  }
  const selectable = projectState.project.selectables.get([variant.id]);

  const condition = variant.type === "variant" ? variant.condition : undefined;
  const { icon, text } = getIconAndTextForCondition(
    condition ?? { type: "default" }
  );

  const onClick = action(() => {
    projectState.rootSelectable.deselect();
    selectable.select();
  });

  const onDeleteButtonClick = action((e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO
    // component.variants.remove(variant);
    // if (selectable.selected) {
    //   projectState.rootSelectable.deselect();
    //   selectable.parent?.select();
    // }
    // projectState.history.commit();
  });

  const onMouseEnter = action(() => {
    viewportState.hoveredSelectable = selectable;
  });
  const onMouseLeave = action(() => {
    viewportState.hoveredSelectable = undefined;
  });

  const hovered = viewportState.hoveredSelectable === selectable;

  return (
    <div
      className="px-1 group"
      aria-selected={selectable.selected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={clsx(
          "h-8 flex items-center gap-1.5 group-aria-selected:bg-macaron-active group-aria-selected:text-macaron-activeText px-2 relative rounded",
          hovered && "ring-1 ring-inset ring-macaron-active"
        )}
      >
        {condition ? (
          <RadixPopover.Root>
            <RadixPopover.Trigger>
              <IconButton
                icon={icon}
                className="text-xs text-macaron-disabledText group-aria-selected:text-macaron-activeText"
              />
            </RadixPopover.Trigger>
            <RadixPopover.Portal>
              <RadixPopover.Content
                side="left"
                align="start"
                alignOffset={-12}
                sideOffset={8}
                className={`w-[200px] ${popoverStyle} rounded-lg shadow-xl p-2 flex flex-col gap-2`}
              >
                <ConditionEditor
                  value={condition}
                  onChangeValue={action((value) => {
                    variant.condition = value;
                    projectState.undoManager.stopCapturing();
                  })}
                />
              </RadixPopover.Content>
            </RadixPopover.Portal>
          </RadixPopover.Root>
        ) : (
          <Icon
            icon={icon}
            className="text-base text-macaron-disabledText group-aria-selected:text-macaron-activeText"
          />
        )}
        <span className="flex-1 text-ellipsis whitespace-nowrap">{text}</span>
        {condition && (
          <IconButton
            icon={removeIcon}
            className="opacity-0 group-hover:opacity-100 transition-opacity group-aria-selected:text-macaron-activeText"
            onClick={onDeleteButtonClick}
          />
        )}
      </div>
    </div>
  );
});

function getCurrentComponent(): Node | undefined {
  for (const selectable of projectState.selectedSelectables) {
    if (selectable.node.type === "component") {
      return selectable.node;
    }
    if (selectable.node.parent?.type === "component") {
      return selectable.node.parent;
    }
  }
}

export const ComponentPane: React.FC = observer(function ComponentPane() {
  const component = getCurrentComponent();
  if (!component) {
    return null;
  }

  return (
    <>
      {/* <InspectorPane>
        <InspectorHeading
          text="Properties"
          buttons={
            <IconButton
              icon={addIcon}
              onClick={() => {
                component.props.push({
                  name: "value",
                  type: "string",
                });
                projectState.history.commit();
              }}
            />
          }
        />
        <div className="-my-1 -mx-3">
          <ReactSortable
            handle={`.${dragHandleClass}`}
            list={component.props.map((prop) => ({
              id: prop.name,
            }))}
            setList={action((list: { id: string }[]) => {
              const propForName = new Map(
                component.props.map((prop) => [prop.name, prop])
              );
              const newProps = compact(
                list.map((item) => propForName.get(item.id))
              );
              component.props.replace(newProps);
              projectState.history.commit();
            })}
          >
            {component.props.map((prop, i) => (
              <PropRow
                key={prop.name}
                property={prop}
                onChange={action((newProp) => {
                  component.props[i] = newProp;
                  projectState.history.commit();
                })}
                onDelete={action(() => {
                  component.props.splice(i, 1);
                  projectState.history.commit();
                })}
              />
            ))}
          </ReactSortable>
        </div>
      </InspectorPane> */}
      <InspectorPane>
        <InspectorHeading
          icon="material-symbols:widgets-rounded"
          iconClassName="text-macaron-component opacity-100"
          text={component.name}
          buttons={
            <DropdownMenu
              trigger={(props) => <IconButton icon={addIcon} {...props} />}
              defs={[
                {
                  type: "command",
                  text: "Add Variant",
                  onClick: action(() => {
                    component.append([
                      {
                        type: "variant",
                        condition: {
                          type: "hover",
                        },
                      },
                    ]);
                    projectState.undoManager.stopCapturing();
                  }),
                },
                {
                  type: "command",
                  text: "Add Breakpoint",
                  onClick: action(() => {
                    component.append([
                      {
                        type: "variant",
                        condition: {
                          type: "maxWidth",
                          value: 767,
                        },
                      },
                    ]);
                    projectState.undoManager.stopCapturing();
                  }),
                },
              ]}
            />
          }
        />
        <div className="-my-1 -mx-3">
          <VariantRow component={component} variant={component.children[0]} />
          <ReactSortable
            list={component.children
              .filter((v) => v.type === "variant")
              .map((variant) => ({
                id: variant?.id,
              }))}
            setList={action((list: { id: string }[]) => {
              const variantForID = new Map(
                component.children.map((variant) => [variant.id, variant])
              );
              const newVariants = compact(
                list.map((item) => variantForID.get(item.id))
              ).filter((v) => v.type === "variant");
              const newVariantJSONs = newVariants.map((v) => v.toJSON());
              component.delete(1, component.children.length - 1);
              component.insert(1, newVariantJSONs);

              projectState.undoManager.stopCapturing();
            })}
          >
            {component.children
              .filter((v) => v.type === "variant")
              .map((v) => (
                <VariantRow key={v.id} component={component} variant={v} />
              ))}
          </ReactSortable>
        </div>
      </InspectorPane>
      {/* <InspectorPane>
        <InspectorHeading
          text="Breakpoints"
          buttons={
            <IconButton
              icon={addIcon}
              onClick={action(() => {
                const variant = new Variant();
                variant.condition = {
                  type: "maxWidth",
                  value: 768,
                };
                component.variants.push(variant);
              })}
            />
          }
        />
        <div className="-my-1 -mx-3">
          {component.variants
            .filter((v) => v.condition.type === "maxWidth")
            .map((v) => (
              <VariantRow key={v.id} component={component} variant={v} />
            ))}
        </div>
      </InspectorPane> */}
    </>
  );
});
