import { Renderer } from "@freelensapp/extensions";
// transpiled .tsx code must have `React` symbol in scope when jsxRuntime is classic
// @ts-ignore
import React from "react";
import svgIcon from "./icons/credential-explorer.svg?raw";
import { debugLog, getDebugFilePath } from "../common/debug";
import { CredentialExplorerPage } from "./CredentialExplorerPage";

const pageId = "credential-explorer-dashboard";
const menuId = "credential-explorer-dashboard";

debugLog("renderer", "module loaded", { debugFilePath: getDebugFilePath(), pageId, menuId });

function extensionMeta(extension: unknown): Record<string, unknown> {
  const candidate = extension as Record<string, unknown>;

  return {
    id: candidate.id,
    name: candidate.name,
    version: candidate.version
  };
}

const {
  Component: { Icon }
} = Renderer;

export function CredentialExplorerIcon(props: Renderer.Component.IconProps) {
  debugLog("renderer", "icon render", { pageId, menuId });

  return <Icon {...props} svg={svgIcon} />;
}

export default class CredentialExplorerRendererExtension extends Renderer.LensExtension {
  clusterPages = [
    {
      id: pageId,
      components: {
        Page: () => {
          debugLog("renderer", "page component requested", { pageId });

          return <CredentialExplorerPage />;
        }
      }
    }
  ];

  clusterPageMenus = [
    {
      id: menuId,
      target: {
        pageId
      },
      title: "Credential Explorer",
      components: {
        Icon: CredentialExplorerIcon
      }
    }
  ];

  protected onActivate(): void {
    debugLog("renderer", "onActivate", {
      ...extensionMeta(this),
      pageIds: this.clusterPages.map((page) => page.id),
      menuIds: this.clusterPageMenus.map((menu) => menu.id),
      menuTargets: this.clusterPageMenus.map((menu) => menu.target)
    });
  }

  protected onDeactivate(): void {
    debugLog("renderer", "onDeactivate", extensionMeta(this));
  }
}
