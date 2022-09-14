import React, { useEffect, useState } from "react";

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

const alertMessageAddPublicConfigJSON =
  "Failed to retrieve config JSON file. Please check in file browser in left sidebar and ensure availability of config JSON file in /Packrat/ directory (e.g. /Packrat/1234567/config.json for PR1234567).";

const alertMessageAddPrivateConfigJSON =
  "Failed to retrieve config JSON file. Please check in file browser in left sidebar and ensure availability of config JSON file in /Packrat/ directory (e.g. /Packrat/1234567/config_private.json for PR1234567).";

const alertMessageReadConfigJSON = "Failed to read config JSON data.";

const ConfigEditorContainer = (props: any) => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [config, setConfig] = useState<any>(null);
  const [configJSON, setConfigJSON] = useState<any>(null);

  const retrieveConfigJSON = async (buildID?: number) => {
    const external = props.service.pinormos.isExternal();
    try {
      if (external) {
        await props.service.packrat.cache.addPublicConfig();
      } else {
        await props.service.packrat.cache.addPrivateConfig();
      }
    } catch (error) {
      console.error(error);
      if (external) {
        alertMessage = alertMessageAddPublicConfigJSON;
      } else {
        alertMessage = alertMessageAddPrivateConfigJSON;
      }
      setAlert(true);
      throw error;
    }
    let packratID: number;
    try {
      packratID = await props.service.touchcomm.getPackratID();
    } catch (error) {
      console.error(error);
      alertMessage = alertMessagePackratID;
      setAlert(true);
      throw error;
    }
    if (buildID && buildID === packratID) {
      return;
    }
    try {
      let config: any;
      if (external) {
        config = await requestAPI<any>("packrat/" + packratID + "/config.json");
      } else {
        config = await requestAPI<any>(
          "packrat/" + packratID + "/config_private.json"
        );
      }
      setConfigJSON(config);
    } catch (error) {
      if (external) {
        console.error(
          `Error - GET /webds/packrat/${packratID}/config.json\n${error}`
        );
      } else {
        console.error(
          `Error - GET /webds/packrat/${packratID}/config_private.json\n${error}`
        );
      }
      alertMessage = alertMessageReadConfigJSON;
      setAlert(true);
      throw error;
    }
  };

  const _retrieveConfigJSON = async () => {
    try {
      await retrieveConfigJSON(configJSON.buildID);
    } catch {}
  };

  const readConfig = async () => {
    let dynamicConfig: any;
    let staticConfig: any;
    let dataToSend: any = {
      command: "getDynamicConfig"
    };
    try {
      dynamicConfig = await requestAPI<any>("command", {
        body: JSON.stringify(dataToSend),
        method: "POST"
      });
    } catch (error) {
      console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
      alertMessage = alertMessageReadDynamic;
      setAlert(true);
      throw error;
    }
    dataToSend = {
      command: "getStaticConfig"
    };
    try {
      staticConfig = await requestAPI<any>("command", {
        body: JSON.stringify(dataToSend),
        method: "POST"
      });
    } catch (error) {
      console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
      alertMessage = alertMessageReadStatic;
      setAlert(true);
      throw error;
    }
    setConfig({
      dynamic: dynamicConfig,
      static: staticConfig
    });
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
        await retrieveConfigJSON();
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
    <>
      <ThemeProvider theme={webdsTheme}>
        <div className="jp-webds-widget-body">
          {alert && (
            <Alert
              severity="error"
              onClose={() => setAlert(false)}
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {alertMessage}
            </Alert>
          )}
          {initialized && (
            <Landing
              fontColor={jpFontColor}
              config={config}
              readConfig={_readConfig}
              writeConfig={_writeConfig}
              configJSON={configJSON}
              retrieveConfigJSON={_retrieveConfigJSON}
            />
          )}
        </div>
        {!initialized && (
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
        )}
      </ThemeProvider>
    </>
  );
};

export class ConfigEditorWidget extends ReactWidget {
  id: string;
  service: WebDSService;

  constructor(id: string, service: WebDSService) {
    super();
    this.id = id;
    this.service = service;
  }

  render(): JSX.Element {
    return (
      <div id={this.id + "_container"} className="jp-webds-widget-container">
        <div id={this.id + "_content"} className="jp-webds-widget">
          <ConfigEditorContainer service={this.service} />
        </div>
        <div className="jp-webds-widget-shadow jp-webds-widget-shadow-top"></div>
        <div className="jp-webds-widget-shadow jp-webds-widget-shadow-bottom"></div>
      </div>
    );
  }
}
