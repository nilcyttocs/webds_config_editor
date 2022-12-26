import React, { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";

import CircularProgress from "@mui/material/CircularProgress";

import { ThemeProvider } from "@mui/material/styles";

import Landing from "./Landing";

import { webdsService } from "./local_exports";

import {
  ALERT_MESSAGE_READ_DYNAMIC,
  ALERT_MESSAGE_WRITE_DYNAMIC,
  ALERT_MESSAGE_READ_STATIC,
  ALERT_MESSAGE_WRITE_STATIC,
  ALERT_MESSAGE_COMMIT_CONFIG,
  ALERT_MESSAGE_PACKRAT_ID,
  ALERT_MESSAGE_ADD_PUBLIC_CONFIG_JSON,
  ALERT_MESSAGE_ADD_PRIVATE_CONFIG_JSON,
  ALERT_MESSAGE_READ_CONFIG_JSON
} from "./constants";

import { requestAPI } from "../handler";

let alertMessage = "";

export const ConfigEditorComponent = (props: any) => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [config, setConfig] = useState<any>(null);
  const [configJSON, setConfigJSON] = useState<any>(null);

  const webdsTheme = webdsService.ui.getWebDSTheme();
  const addStaticConfigUsage = webdsService.analytics.addStaticConfigUsage;

  const showAlert = (message: string) => {
    alertMessage = message;
    setAlert(true);
  };

  const retrieveConfigJSON = async (buildID?: number) => {
    const external = webdsService.pinormos.isExternal();
    try {
      if (external) {
        await webdsService.packrat.cache.addPublicConfig();
      } else {
        await webdsService.packrat.cache.addPrivateConfig();
      }
    } catch (error) {
      console.error(error);
      if (external) {
        showAlert(ALERT_MESSAGE_ADD_PUBLIC_CONFIG_JSON);
      } else {
        showAlert(ALERT_MESSAGE_ADD_PRIVATE_CONFIG_JSON);
      }
      throw error;
    }
    let packratID: number;
    try {
      packratID = await webdsService.touchcomm.getPackratID();
    } catch (error) {
      console.error(error);
      showAlert(ALERT_MESSAGE_PACKRAT_ID);
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
      showAlert(ALERT_MESSAGE_READ_CONFIG_JSON);
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
      showAlert(ALERT_MESSAGE_READ_DYNAMIC);
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
      showAlert(ALERT_MESSAGE_READ_STATIC);
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
      showAlert(ALERT_MESSAGE_WRITE_DYNAMIC);
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
      showAlert(ALERT_MESSAGE_WRITE_STATIC);
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
        showAlert(ALERT_MESSAGE_COMMIT_CONFIG);
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
              addStaticConfigUsage={addStaticConfigUsage}
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

export default ConfigEditorComponent;
