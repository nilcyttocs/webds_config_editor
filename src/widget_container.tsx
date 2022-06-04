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

const alertMessageAddPrivateConfig =
  "Failed to retrieve private config JSON file. Please check in file browser in left sidebar and ensure availability of private config JSON file in /Packrat/ directory (e.g. /Packrat/1234567/config_private.json for PR1234567).";

const alertMessageGetPrivateConfig = "Failed to read private config JSON data.";

const ConfigEditorContainer = (props: any) => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [dynamicConfig, setDynamicConfig] = useState<any>(null);
  const [staticConfig, setStaticConfig] = useState<any>(null);
  const [configPrivate, setConfigPrivate] = useState<any>(null);

  const retrievePrivateConfig = async () => {
    try {
      await props.service.packrat.cache.addPrivateConfig();
    } catch (error) {
      console.error(error);
      alertMessage = alertMessageAddPrivateConfig;
      setAlert(true);
      throw error;
    }
    let packratID: string;
    try {
      packratID = await props.service.touchcomm.getPackratID();
    } catch (error) {
      console.error(error);
      alertMessage = alertMessagePackratID;
      setAlert(true);
      throw error;
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
      alertMessage = alertMessageGetPrivateConfig;
      setAlert(true);
      throw error;
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
      throw error;
    }
    try {
      const config = await requestAPI<any>("command?query=getStaticConfig");
      setStaticConfig(config);
    } catch (error) {
      console.error(`Error - GET /webds/command\n${error}`);
      alertMessage = alertMessageReadStatic;
      setAlert(true);
      throw error;
    }
  };

  const _readConfig = async () => {
    try {
      await readConfig();
    } catch {}
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
      throw error;
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
      throw error;
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
        throw error;
      }
    }
  };

  const _writeConfig = async (
    dynamicConfig: any,
    staticConfig: any,
    commit: boolean
  ) => {
    try {
      await writeConfig(dynamicConfig, staticConfig, commit);
    } catch {}
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await retrievePrivateConfig();
        await readConfig();
      } catch {
        return;
      }
      setInitialized(true);
    };
    initialize();
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
            readConfig={_readConfig}
            writeConfig={_writeConfig}
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
