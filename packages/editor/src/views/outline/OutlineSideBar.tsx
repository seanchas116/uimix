import { observer } from "mobx-react-lite";
import {
  SideBarTabsContent,
  SideBarTabsList,
  SideBarTabsRoot,
  SideBarTabsTrigger,
} from "../../components/SideBarTabs";
import { ScrollArea } from "../../components/ScrollArea";
import { NodeTreeView } from "./NodeTreeView";
import { Icon } from "@iconify/react";
import { DocumentTreeView } from "./DocumentTreeView";

export const OutlineSideBar: React.FC = observer(() => {
  return (
    <SideBarTabsRoot
      defaultValue="layers"
      className="w-[256px] flex flex-col contain-strict"
    >
      <SideBarTabsList>
        <SideBarTabsTrigger value="layers">
          <span className="flex gap-1.5 items-center">
            <Icon
              icon="material-symbols:layers-outline"
              className="text-base"
            />
            Layers
          </span>
        </SideBarTabsTrigger>
        <SideBarTabsTrigger value="pages">
          <span className="flex gap-1.5 items-center">
            <Icon icon="material-symbols:topic-outline" className="text-base" />
            Pages
          </span>
        </SideBarTabsTrigger>
      </SideBarTabsList>
      <SideBarTabsContent
        value="layers"
        className="flex-1 relative outline-none"
      >
        <ScrollArea className="absolute left-0 top-0 w-full h-full">
          <NodeTreeView />
        </ScrollArea>
      </SideBarTabsContent>
      <SideBarTabsContent
        value="pages"
        className="flex-1 relative outline-none"
      >
        <ScrollArea className="absolute left-0 top-0 w-full h-full">
          <DocumentTreeView />
        </ScrollArea>
      </SideBarTabsContent>
    </SideBarTabsRoot>
  );
});
OutlineSideBar.displayName = "OutlineSideBar";
