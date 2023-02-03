import { observer } from "mobx-react-lite";
import * as RadixPopover from "@radix-ui/react-popover";
import { projectState } from "../../../state/ProjectState";
import { InspectorHeading } from "../components/InspectorHeading";
import { InspectorPane } from "../components/InspectorPane";
import widgetsIcon from "@iconify-icons/ic/widgets";
import addIcon from "@iconify-icons/ic/add";
import removeIcon from "@iconify-icons/ic/remove";
import tagIcon from "@iconify-icons/ic/sharp-numbers";
import openInNewIcon from "@iconify-icons/ic/open-in-new";
import phoneIcon from "@iconify-icons/ic/phone-iphone";
import cursorIcon from "@iconify-icons/heroicons/cursor-arrow-rays";
import { Icon, IconifyIcon } from "@iconify/react";
import { IconButton } from "../../../components/IconButton";
import { Property, VariantInteractionType } from "node-data";
import textIcon from "@seanchas116/design-icons/json/text.json";
import switchIcon from "@seanchas116/design-icons/json/switch.json";
import { ComponentNode, Variant } from "../../../models/ComponentNode";
import { DoubleClickToEdit } from "../../../components/DoubleClickToEdit";
import { popoverStyle } from "../../../components/styles";
import { Input } from "../../../components/Input";
import { compact, startCase } from "lodash-es";
import { action } from "mobx";
import { Select } from "../../../components/Select";
import { Selectable } from "../../../models/Selectable";
import { ReactSortable } from "react-sortablejs";
import React from "react";
import { DropdownMenu } from "../../../components/Menu";
import { DragHandle, dragHandleClass } from "../components/DragHandle";
import clsx from "clsx";
import { viewportState } from "../../../state/ViewportState";

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
      <DragHandle className="absolute left-0 top-0 opacity-0 group-hover:opacity-100" />
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

const VariantRow = observer(function VariantRow({
  component,
  variant,
}: {
  component: ComponentNode;
  variant: Variant;
}) {
  const rootNode = component.firstChild;
  if (!rootNode) {
    return null;
  }
  const selectable = Selectable.get(rootNode, variant);

  const condition = variant.condition;

  let icon: IconifyIcon | string;
  let text: React.ReactNode;

  if (condition.type === "interaction") {
    icon = cursorIcon;
    text = startCase(condition.value);
  } else {
    icon = phoneIcon;
    text = (
      <>
        Mobile
        <span className="text-macaron-disabledText">
          <span className="mx-1.5">{"<"}</span>
          {condition.value}
        </span>
      </>
    );
  }

  const onClick = action(() => {
    projectState.rootSelectable.deselect();
    selectable.select();
  });

  const onDeleteButtonClick = action((e: React.MouseEvent) => {
    e.stopPropagation();
    component.variants.remove(variant);
    if (selectable.selected) {
      projectState.rootSelectable.deselect();
      selectable.parent?.select();
    }
    projectState.history.commit();
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
      aria-selected={selectable.selected}
      className={clsx(
        "h-7 flex items-center gap-2 group aria-selected:bg-macaron-active pl-4 pr-3 relative",
        hovered && "ring-1 ring-inset ring-macaron-active"
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <DragHandle className="absolute left-0 top-0 opacity-0 group-hover:opacity-100" />
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
            {condition.type === "maxWidth" ? (
              <div className="grid grid-cols-[1fr_1fr] gap-2 items-center">
                <label className="text-macaron-label">Max Width</label>
                <Input
                  value={String(condition.value)}
                  onChange={action((value) => {
                    variant.condition = {
                      type: "maxWidth",
                      value: Number(value),
                    };
                    projectState.history.commit();
                  })}
                ></Input>
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_1fr] gap-2 items-center">
                <label className="text-macaron-label">Interaction</label>
                <Select
                  value={condition.value}
                  options={Object.values(VariantInteractionType.Values).map(
                    (value) => ({
                      value,
                      text: startCase(value),
                    })
                  )}
                  onChange={action((value: VariantInteractionType) => {
                    variant.condition = {
                      type: "interaction",
                      value,
                    };
                    projectState.history.commit();
                  })}
                />
              </div>
            )}
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>
      <span className="flex-1">{text}</span>
      <IconButton
        icon={removeIcon}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDeleteButtonClick}
      />
    </div>
  );
});

const DefaultVariantRow = observer(function VariantRow({
  component,
}: {
  component: ComponentNode;
}) {
  const rootNode = component.firstChild;
  if (!rootNode) {
    return null;
  }
  const selectable = Selectable.get(rootNode);

  const onClick = action(() => {
    const rootNode = component.firstChild;
    if (!rootNode) {
      return;
    }
    projectState.rootSelectable.deselect();
    selectable.select();
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
      aria-selected={selectable.selected}
      className={clsx(
        "h-7 flex items-center gap-2 group aria-selected:bg-macaron-active pl-4 pr-3 relative",
        hovered && "ring-1 ring-inset ring-macaron-active"
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="w-4 h-4" />
      <span className="flex-1">Default</span>
    </div>
  );
});

export const ComponentPane: React.FC = observer(function ComponentPane() {
  let _component: ComponentNode | undefined;
  for (const selectable of projectState.selectedSelectables) {
    if (selectable.node.type === "component") {
      _component = selectable.node;
      break;
    }
    if (selectable.node.parent?.type === "component") {
      _component = selectable.node.parent;
      break;
    }
  }

  if (!_component) {
    return null;
  }
  const component = _component;

  return (
    <>
      <InspectorPane>
        <InspectorHeading
          text={
            <div className="flex items-center">
              <Icon
                className={"mr-1.5 text-xs text-macaron-component"}
                icon={widgetsIcon}
              />
              {component.name}
            </div>
          }
        />
      </InspectorPane>
      <InspectorPane>
        <InspectorHeading
          text="Web Page"
          dimmed
          buttons={
            <IconButton
              icon={addIcon}
              onClick={() => {
                // TODO
              }}
            />
          }
        />
      </InspectorPane>
      <InspectorPane>
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
      </InspectorPane>
      <InspectorPane>
        <InspectorHeading
          text="Variants & Breakpoints"
          buttons={
            <DropdownMenu
              trigger={(props) => <IconButton icon={addIcon} {...props} />}
              defs={[
                {
                  type: "command",
                  text: "Add Variant",
                  onClick: action(() => {
                    const variant = Variant.create();
                    variant.condition = {
                      type: "interaction",
                      value: "hover",
                    };
                    component.variants.push(variant);
                    projectState.history.commit();
                  }),
                },
                {
                  type: "command",
                  text: "Add Breakpoint",
                  onClick: action(() => {
                    const variant = Variant.create();
                    variant.condition = {
                      type: "maxWidth",
                      value: 720,
                    };
                    component.variants.push(variant);
                    projectState.history.commit();
                  }),
                },
              ]}
            />
          }
        />
        <div className="-my-1 -mx-3">
          <DefaultVariantRow component={component} />
          <ReactSortable
            handle={`.${dragHandleClass}`}
            list={component.variants.map((variant) => ({
              id: variant?.id,
            }))}
            setList={action((list: { id: string }[]) => {
              const variantForID = new Map(
                component.variants.map((variant) => [variant.id, variant])
              );
              const newVariants = compact(
                list.map((item) => variantForID.get(item.id))
              );
              component.variants.replace(newVariants);
              projectState.history.commit();
            })}
          >
            {component.variants.map((v) => (
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
      <InspectorPane>
        <InspectorHeading
          text="Scripts"
          buttons={
            <IconButton
              icon={openInNewIcon}
              onClick={action(() => {
                // TODO
              })}
            />
          }
        />
      </InspectorPane>
    </>
  );
});
