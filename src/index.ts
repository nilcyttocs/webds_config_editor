import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";

import { WidgetTracker } from "@jupyterlab/apputils";

import { ILauncher } from "@jupyterlab/launcher";

import { WebDSService, WebDSWidget } from "@webds/service";

import { configEditorIcon } from "./icons";

import ConfigEditorWidget from "./widget/ConfigEditorWidget";

namespace Attributes {
  export const command = "webds_config_editor:open";
  export const id = "webds_config_editor_widget";
  export const label = "Configuration Editor";
  export const caption = "Configuration Editor";
  export const category = "Touch - Config Library";
  export const rank = 10;
}

export let webdsService: WebDSService;

/**
 * Initialization data for the @webds/config_editor extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: "@webds/config_editor:plugin",
  autoStart: true,
  requires: [ILauncher, ILayoutRestorer, WebDSService],
  activate: (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    restorer: ILayoutRestorer,
    service: WebDSService
  ) => {
    console.log("JupyterLab extension @webds/config_editor is activated!");

    webdsService = service;

    let widget: WebDSWidget;
    const { commands, shell } = app;
    const command = Attributes.command;
    commands.addCommand(command, {
      label: Attributes.label,
      caption: Attributes.caption,
      icon: (args: { [x: string]: any }) => {
        return args["isLauncher"] ? configEditorIcon : undefined;
      },
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new ConfigEditorWidget(Attributes.id);
          widget = new WebDSWidget<ConfigEditorWidget>({ content });
          widget.id = Attributes.id;
          widget.title.label = Attributes.label;
          widget.title.icon = configEditorIcon;
          widget.title.closable = true;
        }

        if (!tracker.has(widget)) tracker.add(widget);

        if (!widget.isAttached) shell.add(widget, "main");

        shell.activateById(widget.id);
      }
    });

    launcher.add({
      command,
      args: { isLauncher: true },
      category: Attributes.category,
      rank: Attributes.rank
    });

    let tracker = new WidgetTracker<WebDSWidget>({
      namespace: Attributes.id
    });
    restorer.restore(tracker, {
      command,
      name: () => Attributes.id
    });
  }
};

export default plugin;
