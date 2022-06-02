import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";

import { MainAreaWidget, WidgetTracker } from "@jupyterlab/apputils";

import { ILauncher } from "@jupyterlab/launcher";

import { WebDSService } from "@webds/service";

import { configEditorIcon } from "./icons";

import { ConfigEditorWidget } from "./widget_container";

/**
 * Initialization data for the @webds/config_editor extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: "@webds/config_editor:plugin",
  autoStart: true,
  requires: [ILauncher, ILayoutRestorer, WebDSService],
  activate: async (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    restorer: ILayoutRestorer,
    service: WebDSService
  ) => {
    console.log("JupyterLab extension @webds/config_editor is activated!");

    let widget: MainAreaWidget;
    const { commands, shell } = app;
    const command: string = "webds_config_editor:open";
    commands.addCommand(command, {
      label: "Configuration Editor",
      caption: "Configuration Editor",
      icon: (args: { [x: string]: any }) => {
        return args["isLauncher"] ? configEditorIcon : undefined;
      },
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new ConfigEditorWidget(app, service);
          widget = new MainAreaWidget<ConfigEditorWidget>({ content });
          widget.id = "webds_config_editor_widget";
          widget.title.label = "Configuration Editor";
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
      category: "WebDS - Tuning"
    });

    let tracker = new WidgetTracker<MainAreaWidget>({
      namespace: "webds_config_editor"
    });
    restorer.restore(tracker, {
      command,
      name: () => "webds_config_editor"
    });
  }
};

export default plugin;
