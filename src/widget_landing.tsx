import React, { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

import { styled } from "@mui/system";
import TabsUnstyled from "@mui/base/TabsUnstyled";
import TabsListUnstyled from "@mui/base/TabsListUnstyled";
import TabUnstyled, { tabUnstyledClasses } from "@mui/base/TabUnstyled";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";

import ArrowRightIcon from "@mui/icons-material/ArrowRight";

import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";

const WIDTH = 1000;
const HEIGHT = 450;

const BOX_WIDTH = (WIDTH - 2 - 16) / 2 - 16;

let alertMessage = "";

let snackMessage = "";

const snackMessageWriteToRAM = "Configuration written to RAM.";

const snackMessageWriteToFlash = "Configuration written to Flash.";

let dynamicConfigList: any[] = [];
let staticConfigList: any[] = [];
let staticConfigTree: any = {};

let staticSection: string | undefined;
let _staticSection: string | undefined;
let staticCategory: string | undefined;

const TabsList = styled(TabsListUnstyled)`
  background-color: "transparent";
  display: flex;
  align-items: center;
  justify-content: left;
`;

let Tab: any;

const createTab = (fontColor: string) => {
  Tab = styled(TabUnstyled)`
    font-family: Arial;
    color: ${fontColor};
    cursor: pointer;
    font-size: 1rem;
    font-weight: 400;
    background-color: transparent;
    width: 150px;
    height: 20px;
    border-style: solid;
    border-width: 1px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    &.${tabUnstyledClasses.selected} {
      background-color: #007dc3;
      color: white;
    }
  `;
};

createTab("primary");

const findEntry = (obj: any, key: string): any => {
  let result: any;
  for (let property in obj) {
    if (obj.hasOwnProperty(property)) {
      if (property === key) {
        return obj[key];
      } else if (typeof obj[property] === "object") {
        result = findEntry(obj[property], key);
        if (typeof result !== "undefined") {
          return result;
        }
      }
    }
  }
};

const buildTrees = (configPrivate: any) => {
  dynamicConfigList = Object.keys(configPrivate.dynamicConfiguration).map(
    (item: any) => {
      const entry = configPrivate.dynamicConfiguration[item];
      return {
        key: item,
        ...entry
      };
    }
  );
  dynamicConfigList.sort((a: any, b: any) => a.name.localeCompare(b.name));

  staticConfigList = Object.keys(configPrivate.staticConfiguration).map(
    (item: any) => {
      const entry = configPrivate.staticConfiguration[item];
      return {
        key: item,
        ...entry
      };
    }
  );
  staticConfigList.sort((a: any, b: any) => a.name.localeCompare(b.name));

  staticConfigTree = {};
  const sections = new Set();
  const categories: any = {};
  Object.keys(configPrivate.staticConfiguration).forEach((item: any) => {
    const entry = configPrivate.staticConfiguration[item];
    if (entry.hasOwnProperty("section")) {
      if (!sections.has(entry.section)) {
        sections.add(entry.section);
        categories[entry.section] = new Set();
        staticConfigTree[entry.section] = {};
      }
    }
    if (entry.hasOwnProperty("category")) {
      if (!categories[entry.section].has(entry.category)) {
        categories[entry.section].add(entry.category);
        staticConfigTree[entry.section][entry.category] = [];
      }
      staticConfigTree[entry.section][entry.category].push({
        key: item,
        ...entry
      });
    }
  });
};

export const Landing = (props: any): JSX.Element => {
  const [alert, setAlert] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<boolean>(false);
  const [anchorElL1, setAnchorElL1] = React.useState<null | HTMLElement>(null);
  const [anchorElL2, setAnchorElL2] = React.useState<null | HTMLElement>(null);
  const [configListWidth, setConfigListWidth] = useState<number>(BOX_WIDTH);
  const [configTab, setConfigTab] = useState<string>("dynamic");
  const [section, setSection] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [config, setConfig] = useState<any>({});
  const [configKey, setConfigKey] = useState<string>("");
  const [configData, setConfigData] = useState<any>(null);
  const [configValue, setConfigValue] = useState<any>(null);
  const [configNames, setConfigNames] = useState<any>(null);
  const [numValues, setNumValues] = useState<number>(0);
  const [dynamicConfig, setDynamicConfig] = useState<any>({});
  const [staticConfig, setStaticConfig] = useState<any>({});

  const openMenuL1 = Boolean(anchorElL1);
  const openMenuL2 = Boolean(anchorElL2);

  const updateConfigEntry = () => {
    if (configKey === "") {
      return;
    }
    if (typeof configValue !== "string") {
      return;
    }
    const stringEntry: string[] = configValue.split(",");
    const numberEntry: number[] = [];
    for (const element of stringEntry) {
      const num = Number(element);
      if (isNaN(num)) {
        return;
      }
      numberEntry.push(num);
    }
    if (Array.isArray(config[configKey])) {
      config[configKey] = numberEntry;
    } else {
      config[configKey] = numberEntry[0];
    }
  };

  const handleMenuOpenL1 = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorElL1(event.currentTarget);
  };

  const handleMenuOpenL2 = (
    event: React.MouseEvent<HTMLButtonElement>,
    section: string
  ) => {
    _staticSection = section;
    setAnchorElL2(event.currentTarget);
  };

  const handleMenuOpenL3 = (
    event: React.MouseEvent<HTMLButtonElement>,
    category: string
  ) => {
    staticCategory = category;
    if (_staticSection && staticCategory) {
      staticSection = _staticSection;
      updateConfigEntry();
      setSection(staticSection + " - " + staticCategory);
      setSearch("");
      setConfigKey("");
      setConfigNames(
        staticConfigTree[staticSection][staticCategory].sort((a: any, b: any) =>
          a.name.localeCompare(b.name)
        )
      );
    }
    setAnchorElL1(null);
    setAnchorElL2(null);
  };

  const handleMenuOpenAll = (event: React.MouseEvent<HTMLButtonElement>) => {
    staticSection = "All";
    _staticSection = undefined;
    staticCategory = undefined;
    updateConfigEntry();
    setSection("All");
    setSearch("");
    setConfigKey("");
    setConfigNames(staticConfigList);
    setAnchorElL1(null);
    setAnchorElL2(null);
  };

  const handleMenuCloseL1 = () => {
    setAnchorElL1(null);
  };

  const handleMenuCloseL2 = () => {
    setAnchorElL1(null);
    setAnchorElL2(null);
  };

  const handleTabChange = (
    event: React.SyntheticEvent,
    tabValue: string | number
  ) => {
    updateConfigEntry();
    setSearch("");
    setConfigKey("");
    setConfigNames(null);
    if (tabValue === 0) {
      setConfigTab("dynamic");
    } else {
      setConfigTab("static");
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearch(value);
  };

  const handleConfigValueInputChange = (value: string) => {
    if (value !== "" && !/^[+\-0-9.,]+$/.test(value)) {
      return;
    }
    if (value.split(",").length !== numValues) {
      return;
    }
    setConfigValue(value);
  };

  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    key: string
  ) => {
    updateConfigEntry();
    setConfigKey(key);
    setConfigData(findEntry(props.configPrivate, key));
    setConfigValue(config[key]);
    if (Array.isArray(config[key])) {
      setNumValues(config[key].length);
    } else {
      setNumValues(1);
    }
  };

  const generateL1Menu = (): JSX.Element => {
    return (
      <Menu anchorEl={anchorElL1} open={openMenuL1} onClose={handleMenuCloseL1}>
        <MenuItem
          key={0}
          dense
          component={ButtonBase}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
            handleMenuOpenAll(event)
          }
          sx={{ width: "100%" }}
        >
          <Typography variant="body2">All</Typography>
        </MenuItem>
        {Object.keys(staticConfigTree)
          .sort()
          .map((item, index) => {
            return (
              <MenuItem
                key={index + 1}
                dense
                component={ButtonBase}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                  handleMenuOpenL2(event, item)
                }
                sx={{ width: "100%" }}
              >
                <Typography variant="body2">{item}</Typography>
              </MenuItem>
            );
          })}
      </Menu>
    );
  };

  const generateL2Menu = (): JSX.Element | null => {
    if (!_staticSection) {
      return null;
    }
    return (
      <Menu
        anchorEl={anchorElL2}
        open={openMenuL2}
        onClose={handleMenuCloseL2}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {Object.keys(staticConfigTree[_staticSection])
          .sort()
          .map((item, index) => {
            return (
              <MenuItem
                key={index}
                dense
                component={ButtonBase}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                  handleMenuOpenL3(event, item)
                }
                sx={{ width: "100%" }}
              >
                <Typography variant="body2">{item}</Typography>
              </MenuItem>
            );
          })}
      </Menu>
    );
  };

  const generateListItems = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    configNames?.forEach((item: any, index: number) => {
      if (!item.name.toLowerCase().includes(search.toLowerCase())) {
        return;
      }
      output.push(
        <Tooltip
          key={index}
          title={item.section + " - " + item.category}
          enterDelay={1000}
          placement="bottom-start"
          disableHoverListener={section !== "All"}
        >
          <ListItem dense divider>
            <ListItemButton
              onClick={(event) => handleListItemClick(event, item.key)}
              sx={{ padding: "0px 0px" }}
            >
              <ListItemText primary={item.name.trim()} />
            </ListItemButton>
          </ListItem>
        </Tooltip>
      );
    });
    return output;
  };

  const displayConfigData = (): JSX.Element => {
    return (
      <>
        <Stack spacing={2}>
          <Typography
            sx={{ marginBottom: "8px", fontSize: "1.1rem", fontWeight: "bold" }}
          >
            {configData.name}
          </Typography>
          <div>
            {numValues > 1 ? (
              <Typography sx={{ fontWeight: "bold" }}>Values</Typography>
            ) : (
              <Typography sx={{ fontWeight: "bold" }}>Value</Typography>
            )}
            <FormControl
              variant="outlined"
              size="small"
              sx={{ width: "100%", minWidth: BOX_WIDTH + "px" }}
            >
              <OutlinedInput
                value={configValue}
                onChange={(event) =>
                  handleConfigValueInputChange(event.target.value)
                }
              />
            </FormControl>
          </div>
          <div>
            <Stack spacing={5} direction="row">
              <div>
                <Typography sx={{ fontWeight: "bold" }}>Type</Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {configData.type}
                </Typography>
              </div>
              <div>
                <Typography sx={{ fontWeight: "bold" }}>Min</Typography>
                <Typography
                  sx={{ textAlign: "center", whiteSpace: "pre-wrap" }}
                >
                  {configData.min}
                </Typography>
              </div>
              <div>
                <Typography sx={{ fontWeight: "bold" }}>Max</Typography>
                <Typography
                  sx={{ textAlign: "center", whiteSpace: "pre-wrap" }}
                >
                  {configData.max}
                </Typography>
              </div>
              <div>
                <Typography sx={{ fontWeight: "bold" }}>Elements</Typography>
                {"elements" in configData ? (
                  <Typography
                    sx={{ textAlign: "center", whiteSpace: "pre-wrap" }}
                  >
                    {configData.elements}
                  </Typography>
                ) : (
                  <Typography
                    sx={{ textAlign: "center", whiteSpace: "pre-wrap" }}
                  >
                    1
                  </Typography>
                )}
              </div>
            </Stack>
          </div>
          <div>
            <Typography sx={{ fontWeight: "bold" }}>Label</Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{configKey}</Typography>
          </div>
          <div>
            <Typography sx={{ fontWeight: "bold" }}>Description</Typography>
            {configData.description && (
              <Typography sx={{ whiteSpace: "pre-wrap" }}>
                {configData.description.trim()}
              </Typography>
            )}
          </div>
        </Stack>
      </>
    );
  };

  useEffect(() => {
    createTab(props.fontColor);
  }, [props.fontColor]);

  useEffect(() => {
    const list = document.getElementById("configKeyList");
    if (list) {
      if (list.clientWidth === BOX_WIDTH) {
        setConfigListWidth(list.clientWidth);
      } else {
        setConfigListWidth(list.clientWidth - 8);
      }
    }
  }, [configNames]);

  useEffect(() => {
    if (configKey !== "") {
      setConfigValue(config[configKey]);
    }
  }, [config, configKey]);

  useEffect(() => {
    if (configTab === "dynamic") {
      setConfigNames(dynamicConfigList);
    } else {
      if (staticSection === "All") {
        setConfigNames(staticConfigList);
      } else if (staticSection && staticCategory) {
        setConfigNames(
          staticConfigTree[staticSection][
            staticCategory
          ].sort((a: any, b: any) => a.name.localeCompare(b.name))
        );
      }
    }
  }, [configTab]);

  useEffect(() => {
    if (configTab === "dynamic") {
      setConfig(dynamicConfig);
    } else {
      setConfig(staticConfig);
    }
  }, [configTab, dynamicConfig, staticConfig]);

  useEffect(() => {
    setDynamicConfig(Object.assign({}, props.dynamicConfig));
    setStaticConfig(Object.assign({}, props.staticConfig));
  }, [props.dynamicConfig, props.staticConfig]);

  useEffect(() => {
    buildTrees(props.configPrivate);
    setConfigNames(dynamicConfigList);
  }, [props.configPrivate]);

  useEffect(() => {
    staticSection = undefined;
    _staticSection = undefined;
    staticCategory = undefined;
  }, []);

  return (
    <>
      {alert ? (
        <Alert
          severity="error"
          onClose={() => setAlert(false)}
          sx={{ marginBottom: "16px" }}
        >
          {alertMessage}
        </Alert>
      ) : null}
      <Box sx={{ width: "100%" }}>
        <div style={{ minWidth: WIDTH + "px", position: "relative" }}>
          <div style={{ width: WIDTH + "px" }}>
            <Typography
              variant="h5"
              sx={{ height: "50px", textAlign: "center" }}
            >
              Configuration Editor
            </Typography>
            <TabsUnstyled defaultValue={0} onChange={handleTabChange}>
              <TabsList>
                <Tab sx={{ paddingTop: "5px" }}>Dynamic Config</Tab>
                <Tab sx={{ paddingTop: "5px" }}>Static Config</Tab>
              </TabsList>
            </TabsUnstyled>
          </div>
          <div style={{ position: "absolute", right: "0px", bottom: "3px" }}>
            <FormControl variant="outlined" size="small">
              <OutlinedInput
                value={search}
                placeholder="Search"
                onChange={(event) =>
                  handleSearchInputChange(event.target.value)
                }
                sx={{ width: "300px", height: "24px" }}
              />
            </FormControl>
          </div>
        </div>
        <Box
          sx={{
            minWidth: WIDTH + "px",
            height: HEIGHT + "px",
            display: "flex",
            flexFlow: "row",
            boxSizing: "border-box",
            border: 1,
            borderRadius: 1,
            borderColor: "grey.500",
            padding: "8px"
          }}
        >
          <Box
            sx={{
              width: BOX_WIDTH + "px",
              height: HEIGHT - 16 - 2 + "px",
              display: "flex",
              flexFlow: "column"
            }}
          >
            {configTab === "static" && (
              <>
                <div
                  onClick={handleMenuOpenL1}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    marginBottom: "16px",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", flexFlow: "row" }}>
                    <ArrowRightIcon
                      fontSize="large"
                      style={{ color: props.fontColor }}
                    />
                    <div
                      style={{ flex: 1, display: "flex", alignItems: "center" }}
                    >
                      {section === "" ? (
                        <Typography
                          sx={{ flex: 1, textAlign: "center", color: "gray" }}
                        >
                          Section
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ flex: 1, textAlign: "center" }}
                        >
                          {section}
                        </Typography>
                      )}
                    </div>
                  </div>
                  <Divider orientation="horizontal" variant="fullWidth" />
                </div>
                {generateL1Menu()}
                {generateL2Menu()}
              </>
            )}
            <div id="configKeyList" style={{ flex: 1, overflow: "auto" }}>
              <List sx={{ width: configListWidth + "px" }}>
                {generateListItems()}
              </List>
            </div>
          </Box>
          <Divider
            orientation="vertical"
            sx={{
              height: HEIGHT - 16 - 2 + "px",
              marginLeft: "16px",
              marginRight: "16px"
            }}
          />
          <Box
            sx={{
              flex: 1,
              height: HEIGHT - 16 - 2 + "px",

              display: "flex",
              flexFlow: "column"
            }}
          >
            <div style={{ flex: 1, overflow: "auto" }}>
              {configKey !== "" && configData !== null && displayConfigData()}
            </div>
          </Box>
        </Box>
        <div
          style={{
            minWidth: WIDTH + "px",
            marginTop: "20px",
            position: "relative"
          }}
        >
          <div
            style={{
              width: WIDTH + "px",
              display: "flex",
              justifyContent: "center"
            }}
          >
            <Stack spacing={2} direction="row">
              <Button
                onClick={(event) => {
                  updateConfigEntry();
                  props.writeConfig(dynamicConfig, staticConfig, true);
                  snackMessage = snackMessageWriteToFlash;
                  setSnackbar(true);
                }}
                sx={{
                  minWidth: "120px",
                  maxWidth: "120px",
                  textTransform: "none"
                }}
              >
                Write To Flash
              </Button>
              <Button
                onClick={(event) => {
                  updateConfigEntry();
                  props.writeConfig(dynamicConfig, staticConfig, false);
                  snackMessage = snackMessageWriteToRAM;
                  setSnackbar(true);
                }}
                sx={{
                  minWidth: "120px",
                  maxWidth: "120px",
                  textTransform: "none"
                }}
              >
                Write To RAM
              </Button>
            </Stack>
          </div>
          <div
            style={{
              position: "absolute",
              top: "0px",
              right: "0px"
            }}
          >
            <Button
              variant="text"
              onClick={(event) => {
                props.readConfig();
              }}
              sx={{
                textTransform: "none"
              }}
            >
              <Typography variant="body2" sx={{ textDecoration: "underline" }}>
                Reload from RAM
              </Typography>
            </Button>
          </div>
        </div>
        <Snackbar
          open={snackbar}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          message={snackMessage}
          onClose={() => setSnackbar(false)}
        />
      </Box>
    </>
  );
};
