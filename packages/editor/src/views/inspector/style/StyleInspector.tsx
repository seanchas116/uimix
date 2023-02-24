import { BorderPane } from "./BorderPane";
import { DebugPane } from "./DebugPane";
import { DimensionsPane } from "./DimensionsPane";
import { FillPane } from "./FillPane";
import { LayoutPane } from "./LayoutPane";
import { PropertyPane } from "./PropertyPane";
import { TextPane } from "./TextPane";

export function StyleInspector(): JSX.Element {
  return (
    <div className="flex flex-col">
      {/* <ComponentPane /> */}
      <DimensionsPane />
      <LayoutPane />
      <FillPane />
      <BorderPane />
      <TextPane />
      <PropertyPane />
      <DebugPane />
    </div>
  );
}
