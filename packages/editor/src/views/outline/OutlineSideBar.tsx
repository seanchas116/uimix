import { observer } from "mobx-react-lite";
import {
  SideBarTabsContent,
  SideBarTabsList,
  SideBarTabsRoot,
  SideBarTabsTrigger,
} from "../../components/SideBarTabs";
import { ScrollArea } from "../../components/ScrollArea";
import { NodeTreeView } from "./NodeTreeView";
import { CodeTreeView } from "./CodeTreeView";

export const OutlineSideBar: React.FC = observer(() => {
  return (
    <SideBarTabsRoot
      defaultValue="layers"
      className="w-[256px] flex flex-col contain-strict"
    >
      <SideBarTabsList>
        <SideBarTabsTrigger value="layers">Layers</SideBarTabsTrigger>
        <SideBarTabsTrigger value="code">Code</SideBarTabsTrigger>
      </SideBarTabsList>
      <SideBarTabsContent value="layers" className="flex-1 relative">
        <ScrollArea className="absolute left-0 top-0 w-full h-full">
          <NodeTreeView />
        </ScrollArea>
      </SideBarTabsContent>
      <SideBarTabsContent value="code" className="flex-1 relative">
        <ScrollArea className="absolute left-0 top-0 w-full h-full">
          <CodeTreeView />
        </ScrollArea>
      </SideBarTabsContent>
    </SideBarTabsRoot>
  );
});
OutlineSideBar.displayName = "OutlineSideBar";
