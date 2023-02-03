import { observer } from "mobx-react-lite";

import { StyleInspector } from "./style/StyleInspector";
import {
  SideBarTabsContent,
  SideBarTabsList,
  SideBarTabsRoot,
  SideBarTabsTrigger,
} from "../../components/SideBarTabs";
import { ScrollArea } from "../../components/ScrollArea";

export const InspectorSideBar: React.FC = observer(() => {
  return (
    <SideBarTabsRoot
      defaultValue="design"
      className="w-[232px] flex flex-col contain-strict"
    >
      <SideBarTabsList>
        <SideBarTabsTrigger value="design">Design</SideBarTabsTrigger>
        <SideBarTabsTrigger value="interaction">Interaction</SideBarTabsTrigger>
      </SideBarTabsList>
      <SideBarTabsContent value="design" className="flex-1 relative">
        <ScrollArea className="absolute left-0 top-0 w-full h-full">
          <StyleInspector />
        </ScrollArea>
      </SideBarTabsContent>
      <SideBarTabsContent value="interaction">
        <div className="p-3">Todo</div>
      </SideBarTabsContent>
    </SideBarTabsRoot>
  );
});
InspectorSideBar.displayName = "InspectorSideBar";
