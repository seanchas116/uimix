import * as RadixTabs from "@radix-ui/react-tabs";
import tw from "tailwind-styled-components";

export const SideBarTabsRoot = RadixTabs.Root;

export const SideBarTabsList: typeof RadixTabs.List = tw(
  RadixTabs.List
)`px-2 box-content h-8 border-b border-macaron-separator`;

export const SideBarTabsTrigger: typeof RadixTabs.Trigger = tw(
  RadixTabs.Trigger
)`font-semibold text-macaron-disabledText border-macaron-active leading-8 h-8 px-2 aria-selected:text-macaron-text aria-selected:border-b-2 hover:text-macaron-label`;

export const SideBarTabsContent = RadixTabs.Content;
