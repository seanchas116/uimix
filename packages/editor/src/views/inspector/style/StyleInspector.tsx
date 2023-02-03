import { BorderPane } from "./BorderPane";
import { ComponentPane } from "./ComponentPane";
import { DebugPane } from "./DebugPane";
import { DimensionPane } from "./DimensionPane";
import { FillPane } from "./FillPane";
import { StackPane } from "./StackPane";
import { TextPane } from "./TextPane";

export function StyleInspector(): JSX.Element {
  return (
    <div className="flex flex-col">
      <ComponentPane />
      <DimensionPane />
      <StackPane />
      <FillPane />
      <BorderPane />
      <TextPane />
      <DebugPane />
    </div>
  );
}
