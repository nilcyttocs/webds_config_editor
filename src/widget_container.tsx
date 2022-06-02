import React, { useEffect, useState } from "react";

import { JupyterFrontEnd } from "@jupyterlab/application";

import { ReactWidget } from "@jupyterlab/apputils";

import Alert from "@mui/material/Alert";

import CircularProgress from "@mui/material/CircularProgress";

import { ThemeProvider } from "@mui/material/styles";

import { WebDSService } from "@webds/service";

import { Landing } from "./widget_landing";

import { requestAPI } from "./handler";

let alertMessage = "";

const alertMessageReadDynamic = "Failed to read dynamic config from device.";

const alertMessageWriteDynamic = "Failed to write dynamic config to device.";

const alertMessageReadStatic = "Failed to read static config from device.";

const alertMessageWriteStatic = "Failed to write static config to device.";

const alertMessageCommitConfig = "Failed to write config to flash.";

const alertMessagePackratID = "Failed to read packrat ID from device.";

const alertMessagePrivateConfig =
  "Failed to retrieve private config JSON file. Please check in file browser in left sidebar and ensure availability of private config JSON file in /Packrat/ directory (e.g. /Packrat/1234567/config_private.json for PR1234567).";

const ConfigEditorContainer = (props: any) => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [dynamicConfig, setDynamicConfig] = useState<any>(null);
  const [staticConfig, setStaticConfig] = useState<any>(null);
  const [configPrivate, setConfigPrivate] = useState<any>(null);

  const readPrivateConfig = async () => {
    let packratID: string;
    try {
      packratID = await props.service.touchcomm.getPackratID();
    } catch (error) {
      console.error(error);
      alertMessage = alertMessagePackratID;
      setAlert(true);
      return;
    }
    try {
      const config = await requestAPI<any>(
        "packrat?packrat-id=" + packratID + "&filename=config_private.json"
      );
      setConfigPrivate(config);
    } catch (error) {
      console.error(
        `Error - GET /webds/packrat?packrat-id=3210915&filename=config_private.json\n${error}`
      );
      alertMessage = alertMessagePrivateConfig;
      setAlert(true);
      return;
    }
  };

  const readConfig = async () => {
    try {
      const config = await requestAPI<any>("command?query=getDynamicConfig");
      setDynamicConfig(config);
    } catch (error) {
      console.error(`Error - GET /webds/command\n${error}`);
      alertMessage = alertMessageReadDynamic;
      setAlert(true);
      return;
    }
    try {
      const config = await requestAPI<any>("command?query=getStaticConfig");
      setStaticConfig(config);
    } catch (error) {
      console.error(`Error - GET /webds/command\n${error}`);
      alertMessage = alertMessageReadStatic;
      setAlert(true);
      return;
    }
  };

  const writeConfig = async (
    dynamicConfig: any,
    staticConfig: any,
    commit: boolean
  ) => {
    let dataToSend: any = {
      command: "setDynamicConfig",
      payload: [dynamicConfig]
    };
    try {
      await requestAPI<any>("command", {
        body: JSON.stringify(dataToSend),
        method: "POST"
      });
    } catch (error) {
      console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
      alertMessage = alertMessageWriteDynamic;
      setAlert(true);
      return;
    }
    dataToSend = {
      command: "setStaticConfig",
      payload: [staticConfig]
    };
    try {
      await requestAPI<any>("command", {
        body: JSON.stringify(dataToSend),
        method: "POST"
      });
    } catch (error) {
      console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
      alertMessage = alertMessageWriteStatic;
      setAlert(true);
      return;
    }
    if (commit) {
      dataToSend = {
        command: "commitConfig"
      };
      try {
        await requestAPI<any>("command", {
          body: JSON.stringify(dataToSend),
          method: "POST"
        });
      } catch (error) {
        console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
        alertMessage = alertMessageCommitConfig;
        setAlert(true);
        return;
      }
    }
  };

  useEffect(() => {
    if (initialized) {
      return;
    }
    if (
      dynamicConfig !== null &&
      staticConfig !== null &&
      configPrivate !== null
    ) {
      setInitialized(true);
    }
  }, [initialized, dynamicConfig, staticConfig, configPrivate]);

  useEffect(() => {
    readConfig();
    readPrivateConfig();
  }, []);

  const webdsTheme = props.service.ui.getWebDSTheme();
  const jpFontColor = props.service.ui.getJupyterFontColor();

  return (
    <div className="jp-webds-widget-body">
      <ThemeProvider theme={webdsTheme}>
        {alert ? (
          <Alert
            severity="error"
            onClose={() => setAlert(false)}
            sx={{ marginBottom: "16px", whiteSpace: "pre-wrap" }}
          >
            {alertMessage}
          </Alert>
        ) : null}
        {initialized ? (
          <Landing
            fontColor={jpFontColor}
            dynamicConfig={dynamicConfig}
            staticConfig={staticConfig}
            readConfig={readConfig}
            writeConfig={writeConfig}
            configPrivate={configPrivate}
          />
        ) : (
          <>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)"
              }}
            >
              <CircularProgress color="primary" />
            </div>
          </>
        )}
      </ThemeProvider>
    </div>
  );
};

export class ConfigEditorWidget extends ReactWidget {
  frontend: JupyterFrontEnd | null = null;
  service: WebDSService | null = null;

  constructor(app: JupyterFrontEnd, service: WebDSService) {
    super();
    this.frontend = app;
    this.service = service;
  }

  render(): JSX.Element {
    return (
      <div className="jp-webds-widget">
        <ConfigEditorContainer
          frontend={this.frontend}
          service={this.service}
        />
      </div>
    );
  }
}
