import React from "react";
import ReactDOM from "react-dom/client";
import { useEffect, useRef } from "react";

export const IFrame: React.FC<{
  init: (window: Window, iframe: HTMLIFrameElement) => React.ReactNode;
  className?: string;
}> = ({ init, className }) => {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) {
      return;
    }

    const window = iframe.contentWindow;
    if (!window) {
      return;
    }

    window.document.open();
    window.document.write(
      "<!DOCTYPE html><html><head><style>body { margin: 0; }</style></head><body><div id='root'></div></body></html>"
    );
    window.document.close();

    const reactRoot = ReactDOM.createRoot(
      window.document.getElementById("root") as HTMLElement
    );

    reactRoot.render(
      <React.StrictMode>{init(window, iframe)}</React.StrictMode>
    );

    return () => {
      reactRoot.unmount();
    };
  }, []);

  return <iframe ref={ref} className={className} />;
};

IFrame.displayName = "IFrame";
