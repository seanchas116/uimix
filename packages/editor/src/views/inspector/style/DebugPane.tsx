import { observer } from "mobx-react-lite";
import { Mixed, sameOrMixed } from "../../../utils/Mixed";
import { projectState } from "../../../state/ProjectState";
import { InspectorHeading } from "../components/InspectorHeading";
import { InspectorPane } from "../components/InspectorPane";

export const DebugPane: React.FC = observer(function DebugPane() {
  const selectables = projectState.selectedSelectables;

  if (!selectables.length) {
    return null;
  }

  const id = sameOrMixed(selectables.map((s) => s.node.id));

  return (
    <InspectorPane>
      <InspectorHeading
        icon="material-symbols:info-outline-rounded"
        text="Debug"
      />
      <dl className="select-text">
        <dt className="text-macaron-label">Node ID</dt>
        <dd>{id === Mixed ? "Mixed" : id}</dd>
      </dl>
    </InspectorPane>
  );
});
