import { Button } from "./stories/Button";
import { Header } from "./stories/Header";
import React from "react";
import ReactDOM from "react-dom/client";

interface Component {
  path: string; // path relative to project root e.g. "src/Button.tsx"
  name: string; // export name; e.g. "Button" ("default" for default export)
  component: React.ElementType;
}

export const components: Component[] = [
  {
    path: "src/stories/Button.tsx",
    name: "Button",
    component: Button,
  },
  {
    path: "src/stories/Header.tsx",
    name: "Header",
    component: Header,
  },
];

export { React, ReactDOM };
