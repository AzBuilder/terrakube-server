import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  GithubOutlined,
  GitlabOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PlayCircleOutlined,
  ProfileOutlined,
  StopOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  UnlockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Breadcrumb,
  Button,
  Col,
  Divider,
  Form,
  Input,
  Layout,
  List,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography
} from "antd";
import { React, useEffect, useState } from "react";
import { IconContext } from "react-icons";
import { BiTerminal } from "react-icons/bi";
import { FiGitCommit } from "react-icons/fi";
import { HiOutlineExternalLink } from "react-icons/hi";
import { SiBitbucket, SiTerraform } from "react-icons/si";
import { VscAzureDevops } from "react-icons/vsc";
import { Link, useNavigate, useParams } from "react-router-dom";
import { v7 as uuid } from "uuid";
import ActionLoader from "../../ActionLoader.jsx";
import {
  ORGANIZATION_ARCHIVE,
  ORGANIZATION_NAME,
  WORKSPACE_ARCHIVE,
} from "../../config/actionTypes";
import axiosInstance from "../../config/axiosConfig";
import { CreateJob } from "../Jobs/Create";
import { DetailsJob } from "../Jobs/Details";
import { CLIDriven } from "../Workspaces/CLIDriven";
import { ResourceDrawer } from "../Workspaces/ResourceDrawer";
import { Schedules } from "../Workspaces/Schedules";
import { States } from "../Workspaces/States";
import { Tags } from "../Workspaces/Tags";
import { Variables } from "../Workspaces/Variables";
import { getServiceIcon } from "./Icons.js";
import { compareVersions } from "./Workspaces";
import "./Workspaces.css";
const { Option } = Select;
const { Paragraph } = Typography;
const include = {
  VARIABLE: "variable",
  JOB: "job",
  HISTORY: "history",
  SCHEDULE: "schedule",
  VCS: "vcs",
  AGENT: "agent",
  WEBHOOK: "webhook",
  REFERENCE: "reference",
  ORGANIZATION: "organization",
};
const { DateTime } = require("luxon");
const { Content } = Layout;
const { TabPane } = Tabs;
const iacTypes = [
  {
    id: "terraform",
    name: "Terraform",
    description:
      "Create an empty template. So you can define your template from scratch.",
    icon: (
      <IconContext.Provider value={{ size: "1.4em" }}>
        <SiTerraform />
      </IconContext.Provider>
    ),
  },
  {
    id: "tofu",
    name: "OpenTofu",
    icon: <img width="18px" src="/providers/opentofu.png" />,
  },
];

export const WorkspaceDetails = ({ setOrganizationName, selectedTab }) => {
  const navigate = useNavigate();
  const { id, runid, orgid } = useParams();
  if (orgid !== null && orgid !== undefined && orgid !== "") {
    sessionStorage.setItem(ORGANIZATION_ARCHIVE, orgid);
  }
  const organizationId = sessionStorage.getItem(ORGANIZATION_ARCHIVE);
  sessionStorage.setItem(WORKSPACE_ARCHIVE, id);
  const [workspace, setWorkspace] = useState({});
  const [manageWorkspace, setManageWorkspace] = useState(false);
  const [manageState, setManageState] = useState(false);
  const [variables, setVariables] = useState([]);
  const [reference, setReferences] = useState([]);
  const [collectionVariables, setCollectionVariables] = useState([]);
  const [collectionEnvVariables, setCollectionEnvVariables] = useState([]);
  const [globalVariables, setGlobalVariables] = useState([]);
  const [globalEnvVariables, setGlobalEnvVariables] = useState([]);
  const [history, setHistory] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [open, setOpen] = useState(false);
  const [resource, setResource] = useState({});
  const [envVariables, setEnvVariables] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stateDetailsVisible, setStateDetailsVisible] = useState(false);
  const [jobId, setJobId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobVisible, setJobVisible] = useState(false);
  const [organizationNameLocal, setOrganizationNameLocal] = useState([]);
  const [workspaceName, setWorkspaceName] = useState("...");
  const [activeKey, setActiveKey] = useState(
    selectedTab !== null ? selectedTab : "1"
  );
  const [terraformVersions, setTerraformVersions] = useState([]);
  const [waiting, setWaiting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [lastRun, setLastRun] = useState("");
  const [executionMode, setExecutionMode] = useState("...");
  const [agent, setAgent] = useState("...");
  const [sshKeys, setSSHKeys] = useState([]);
  const [agentList, setAgentList] = useState([]);
  const [orgTemplates, setOrgTemplates] = useState([]);
  const [vcsProvider, setVCSProvider] = useState("");
  const [resources, setResources] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [currentStateId, setCurrentStateId] = useState(0);
  const [selectedIac, setSelectedIac] = useState("");
  const [actions, setActions] = useState([]);
  const [webhook, setWebhook] = useState({});
  const [pushWebhookEnabled, setPushWebhookEnabled] = useState(true);
  const [defaultBranch, setDefaultBranch] = useState("");
  const [defaultPath, setDefaultPath] = useState("");
  const [defaultTemplate, setDefaultTemplate] = useState("");
  const [contextState, setContextState] = useState({});
  const pushWebhookName = "PUSH";
  const handleClick = (jobid) => {
    changeJob(jobid);
    navigate(
      `/organizations/${organizationId}/workspaces/${id}/runs/${jobid}`
    );
  };
  const handleIacChange = (iac) => {
    setSelectedIac(iac);
    loadVersions(iac);
  };

  const outputColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (text) => (
        <Paragraph style={{ margin: "0px" }} copyable={{ tooltips: false }}>
          {text}
        </Paragraph>
      ),
    },
  ];

  const resourceColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <Button onClick={() => showDrawer(record)} type="link">
          {text} &nbsp;
          <HiOutlineExternalLink />
        </Button>
      ),
    },
    {
      title: "Provider",
      dataIndex: "provider",
      key: "provider",
      sorter: (a, b) => a.provider.localeCompare(b.provider),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      onFilter: (value, record) => record.type.indexOf(value) === 0,
      sorter: (a, b) => a.type.localeCompare(b.type),
      render: (text, record) => (
        <>
          <Avatar
            shape="square"
            size="small"
            src={getServiceIcon(record.provider, record.type)}
          />{" "}
          &nbsp;{text}
        </>
      ),
    },
    {
      title: "Module",
      dataIndex: "module",
      key: "module",
    },
  ];
  const handleStatesClick = (key) => {
    switchKey(key);
  };
  const callback = (key) => {
    switchKey(key);
  };

  const getIaCIconById = (id) => {
    const item = iacTypes.find((iacType) => iacType.id === id);
    return item ? item.icon : null;
  };

  const loadSSHKeys = () => {
    axiosInstance.get(`organization/${organizationId}/ssh`).then((response) => {
      console.log(response.data.data);
      setSSHKeys(response.data.data);
    });
  };

  const loadAgentlist = () => {
    axiosInstance
      .get(`organization/${organizationId}/agent`)
      .then((response) => {
        console.log(response.data.data);
        setAgentList(response.data.data);
      });
  };

  const loadOrgTemplates = () => {
    axiosInstance
      .get(`organization/${organizationId}/template`)
      .then((response) => {
        console.log(response.data.data);
        setOrgTemplates(response.data.data);
      });
  };

  const showDrawer = (record) => {
    setOpen(true);
    setResource(record);
  };

  const switchKey = (key) => {
    setActiveKey(key);
    switch (key) {
      case "1":
        navigate(
          `/organizations/${organizationId}/workspaces/${id}`
        );
        break;
      case "2":
        setJobVisible(false);
        navigate(
          `/organizations/${organizationId}/workspaces/${id}/runs`
        );
        break;
      case "3":
        setStateDetailsVisible(false);
        navigate(
          `/organizations/${organizationId}/workspaces/${id}/states`
        );
        break;
      case "4":
        navigate(
          `/organizations/${organizationId}/workspaces/${id}/variables`
        );
        break;
      case "5":
        navigate(
          `/organizations/${organizationId}/workspaces/${id}/schedules`
        );
        break;
      case "6":
        navigate(
          `/organizations/${organizationId}/workspaces/${id}/settings`
        );
        break;
      default:
        break;
    }
  };

  const evaluateCriteria = (criteria, context) => {
    try {
      console.log("Evaluating criteria:", criteria);
      console.log(context);
      const result = eval(criteria.filter);
      console.log("Result:", result);
      if (result) {
        if (!criteria.settings) {
          return {};
        }
        return criteria.settings.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {});
      }
    } catch (error) {
      console.error("Error evaluating criteria:", error);
    }
    return null;
  };

  const fetchActions = async () => {
    try {
      const response = await axiosInstance.get(
        `action?filter[action]=active==true;type=in=('Workspace/Action')`
      );
      console.log("Actions:", response.data);
      const fetchedActions = response.data.data || [];
      setActions(fetchedActions);
    } catch (error) {
      console.error("Error fetching actions:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadWorkspace(true, true, true);
    loadPermissionSet();
    setLoading(false);
    loadSSHKeys();
    loadAgentlist();
    loadOrgTemplates();
    const interval = setInterval(() => {
      loadWorkspace(false, false, false);
      loadPermissionSet();
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const changeJob = (id) => {
    console.log(id);
    setJobId(id);
    setJobVisible(true);
    setActiveKey("2");
  };

  const loadVersions = (iacType) => {
    const versionsApi = `${new URL(window._env_.REACT_APP_TERRAKUBE_API_URL).origin
      }/${iacType}/index.json`;
    axiosInstance.get(versionsApi).then((resp) => {
      console.log(resp);
      const tfVersions = [];
      if (iacType === "tofu") {
        resp.data.forEach((release) => {
          if (!release.tag_name.includes("-"))
            tfVersions.push(release.tag_name.replace("v", ""));
        });
      } else {
        for (const version in resp.data.versions) {
          if (!version.includes("-")) tfVersions.push(version);
        }
      }
      setTerraformVersions(tfVersions.sort(compareVersions).reverse());
      console.log(tfVersions);
    });
  };
  
  const loadPermissionSet = () => {
    console.log("Loading Organization Permission Values")
    const url = `${new URL(window._env_.REACT_APP_TERRAKUBE_API_URL).origin}/access-token/v1/teams/permissions/organization/${organizationId}`;
    axiosInstance.get(url).then((response) => {
      console.log(response.data)
      setManageState(response.data.manageState);
      setManageWorkspace(response.data.manageWorkspace);

      if(id !== undefined && id !== null) {
        console.log("Loading Workspace Permission Values: " + id)
        const urlWorkspaceAccess = `${new URL(window._env_.REACT_APP_TERRAKUBE_API_URL).origin}/access-token/v1/teams/permissions/organization/${organizationId}/workspace/${id}`;
        axiosInstance.get(urlWorkspaceAccess).then((response) => {
          console.log(response.data)
          setManageState(response.data.manageState);
          setManageWorkspace(response.data.manageWorkspace);
        })
      }
    })
  };

  const loadWorkspace = (_loadVersions, _loadWebhook, _loadPermissionSet) => {
    var url = `organization/${organizationId}/workspace/${id}?include=job,variable,history,schedule,vcs,agent,organization,reference`;
    if (_loadWebhook) url += ",webhook";
    axiosInstance
      .get(`organization/${organizationId}/template`)
      .then((template) => {
        setTemplates(template.data.data);
        axiosInstance
          .get(
            `organization/${organizationId}/workspace/${id}?include=job,variable,history,schedule,vcs,agent,organization,webhook,reference`
          )
          .then((response) => {
            if (_loadVersions)
              loadVersions(response.data.data.attributes.iacType);

            if (_loadPermissionSet)
              loadPermissionSet()

            setWorkspace(response.data);
            console.log(response.data);
            if (response.data.included) {
              setupWorkspaceIncludes(
                response.data,
                setVariables,
                setJobs,
                setEnvVariables,
                setHistory,
                setSchedule,
                template.data.data,
                setLastRun,
                setVCSProvider,
                setCurrentStateId,
                currentStateId,
                axiosInstance,
                setResources,
                setOutputs,
                setAgent,
                _loadWebhook,
                setWebhook,
                setPushWebhookEnabled,
                setContextState,
                setReferences, setCollectionVariables, setCollectionEnvVariables, setGlobalVariables, setGlobalEnvVariables
              );
            }

            const organization = response.data.included.find(
              (item) => item.type === "organization"
            );
            if (organization) {
              const organizationName = organization.attributes.name;
              setOrganizationName(organizationName);
              sessionStorage.setItem(ORGANIZATION_NAME, organizationName);
              console.log(organizationName);
            }
            setOrganizationNameLocal(sessionStorage.getItem(ORGANIZATION_NAME));
            setWorkspaceName(response.data.data.attributes.name);
            setExecutionMode(response.data.data.attributes.executionMode);
            if (runid && _loadVersions) changeJob(runid); // if runid is provided, show the job details
            fetchActions();
          });
      });
  };

  const handlePushWebhookClick = () => {
    setPushWebhookEnabled(!pushWebhookEnabled);
  }

  const handleBranchChange = (e) => {
    setDefaultBranch(e.target.value);
  }
  const handlePathChange = (e) => {
    setDefaultPath(e.target.value);
  }
  const handleTemplateChange = (e) => {
    orgTemplates.forEach((template) => {
      if (template.id === e) {
        setDefaultTemplate(template.attributes.name);
        return;
      }
    });
  }

  const handleClickSettings = () => {
    switchKey("6");
  };

  const handleLockButton = (locked) => {
    const body = {
      data: {
        type: "workspace",
        id: id,
        attributes: {
          locked: !locked,
        },
      },
    };
    axiosInstance
      .patch(`organization/${organizationId}/workspace/${id}`, body, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
      .then((response) => {
        console.log(response);
        if (response.status === 204) {
          loadWorkspace(true);
          var newstatus = locked ? "unlocked" : "locked";
          message.success("Workspace " + newstatus + " successfully");
        } else {
          var newstatus = locked ? "unlock" : "lock";
          message.errr("Workspace " + newstatus + " failed");
        }
      });
  };

  const onFinish = (values) => {
    setWaiting(true);
    const pushWebhookId = webhook[pushWebhookName]?.id;
    const pushWebhookExists = pushWebhookId && pushWebhookId != "";
    const body = {
      "atomic:operations": [{
        op: "update",
        href: `/organization/${organizationId}/workspace/${id}`,
        data: {
          type: "workspace",
          id: id,
          attributes: {
            name: values.name,
            description: values.description,
            folder: values.folder,
            locked: values.locked,
            lockDescription: values.lockDescription,
            executionMode: values.executionMode,
            moduleSshKey: values.moduleSshKey,
            terraformVersion: values.terraformVersion,
            iacType: values.iacType,
            branch: values.branch,
            defaultTemplate: values.defaultTemplate,
          },
        },
      }]
    }
    if (pushWebhookEnabled) {
      const newPushWebhookId = pushWebhookExists ? "" : uuid();
      body["atomic:operations"].push({
        op: pushWebhookExists ? "update" : "add",
        href: pushWebhookExists ? `/organization/${organizationId}/workspace/${id}/webhook/${pushWebhookId}` : `/organization/${organizationId}/workspace/${id}/webhook`,
        data: {
          type: "webhook",
          id: pushWebhookExists ? pushWebhookId : newPushWebhookId,
          attributes: {
            id: pushWebhookExists ? pushWebhookId : newPushWebhookId,
            branch: values.pushWebhookBranch,
            path: values.pushWebhookPath,
            event: pushWebhookName,
            templateId: values.pushWebhookTemplate,
          },
        }
      })
    }
    if (!pushWebhookEnabled && pushWebhookExists) {
      body["atomic:operations"].push({
        op: "remove",
        href: `/organization/${organizationId}/workspace/${id}/webhook/${pushWebhookId}`,
      });
    }

    console.log(body);

    try {
      axiosInstance
        .post("/operations",
          body, atomicHeader
        )
        .then((response) => {
          console.log(response);
          if (response.status === 200) {
            const pushWebhookData = response.data["atomic:results"][1]?.data;
            if (pushWebhookEnabled && pushWebhookData) {
              var updatedWebhook = {};
              updatedWebhook[pushWebhookData.attributes.event] = {
                id: pushWebhookData.id,
                type: pushWebhookData.type,
                ...pushWebhookData.attributes,
              };
              setWebhook(updatedWebhook);
            }
            if (!pushWebhookEnabled && pushWebhookExists) {
              var updatedWebhook = webhook;
              updatedWebhook[pushWebhookName] = null;
              setWebhook(updatedWebhook);
            }
            message.success("workspace updated successfully");
          } else {
            message.error("workspace update failed");
          }
          setWaiting(false);
        });
    } catch (error) {
      console.error("error updating workspace:", error);
      message.error("workspace update failed");
      if (error.response) {
        if (error.response.status === 424) {
          message.error("failed to create push webhook, please check if the set vcs connection has the correct permissions on the linked repository.");
        }
        setWaiting(false);
      }
    }

    var bodyAgent;
    console.log(`Using Agent: ${values.executorAgent}`);
    if (values.executorAgent === "default") {
      bodyAgent = {
        data: null,
      };
    } else {
      bodyAgent = {
        data: {
          type: "agent",
          id: values.executorAgent,
        },
      };
    }
    console.log(bodyAgent);
    axiosInstance
      .patch(
        `/organization/${organizationId}/workspace/${id}/relationships/agent`,
        bodyAgent, genericHeader)
      .then((response) => {
        console.log("Update Workspace agent successfully");
        console.log(response);
        if (response.status === 204) {
          console.log("Workspace agent updated successfully");
        } else {
          console.log("Workspace agent update failed");
        }
      });
  };

  const genericHeader = {
    headers: {
      "Content-Type": "application/vnd.api+json",
    },
  };
  const atomicHeader = {
    headers: {
      "content-type": "application/vnd.api+json;ext=\"https://jsonapi.org/ext/atomic\"",
      "accept": "application/vnd.api+json;ext=\"https://jsonapi.org/ext/atomic\"",
    },
  };

  const deleteWebhook = () => {
    const webhooks = Object.entries(webhook);
    if (webhooks.length == 0) return;
    var body = {
      "atomic:operations": []
    };
    webhooks.map(([_, hook]) => {
      body["atomic:operations"].push({
        op: "remove",
        href: `/organization/${organizationId}/workspace/${id}/webhook/${hook.id}`,
      });
    });
    try {
      axiosInstance.post(
        "/operations",
        body, atomicHeader
      )
        .then((response) => {
          if (response.status == 200) {
            message.success("Webhook deleted successfully");
          } else {
            message.error("Webhook deletion failed");
          }
        });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      message.error("Webhook deletion failed");
      if (error.response) {
        if (error.response.status === 424) {
          message.error("Failed to delete webhook, please check if the set VCS connection has the correct permissions on the linked repository.");
        }
      }
    }
  }

  const renderVCSLogo = (vcs) => {
    switch (vcs) {
      case "GITLAB":
        return <GitlabOutlined style={{ fontSize: "18px" }} />;
      case "BITBUCKET":
        return (
          <IconContext.Provider value={{ size: "18px" }}>
            <SiBitbucket />
            &nbsp;
          </IconContext.Provider>
        );
      case "AZURE_DEVOPS":
        return (
          <IconContext.Provider value={{ size: "18px" }}>
            <VscAzureDevops />
            &nbsp;
          </IconContext.Provider>
        );
      default:
        return <GithubOutlined style={{ fontSize: "18px" }} />;
    }
  };

  const onDelete = (workspace) => {
    let randomLetters = generateRandomString(4);
    let deletedName = `${workspace.data.attributes.name.substring(
      0,
      21
    )}_DEL_${randomLetters}`;
    console.log(`New deleted name; ${deletedName}`);
    const body = {
      data: {
        type: "workspace",
        id: id,
        attributes: {
          name: deletedName,
          deleted: "true",
        },
      },
    };
    axiosInstance
        .patch(
            `/organization/${organizationId}/workspace/${id}/relationships/vcs`,
            {
              data: null,
            },
            {
              headers: {
                "Content-Type": "application/vnd.api+json",
              },
            }
        )
        .then((response) => {
          console.log("Deleting VCS refernce successfully");
          axiosInstance
              .patch(`organization/${organizationId}/workspace/${id}`, body, genericHeader)
              .then((response) => {
                console.log(response);
                if (response.status === 204) {
                  console.log(response);
                  message.success("Workspace deleted successfully");
                  navigate(`/organizations/${organizationId}/workspaces`);
                } else {
                  message.error("Workspace deletion failed");
                }
              });
          deleteWebhook();
        });

  };

  return (
    <Content style={{ padding: "0 50px" }}>
      <Breadcrumb
        style={{ margin: "16px 0" }}
        items={[
          {
            title: organizationNameLocal,
          },
          {
            title: (
              <Link to={`/organizations/${organizationId}/workspaces`}>
                Workspaces
              </Link>
            ),
          },
          {
            title: workspaceName,
          },
        ]}
      />

      <div className="site-layout-content">
        <div className="workspaceDisplay">
          {loading || !workspace.data || !variables || !jobs ? (
            <Spin spinning={true} tip="Loading Workspace...">
              <p style={{ marginTop: "50px" }}></p>
            </Spin>
          ) : (
            <div className="orgWrapper">
              <div className="variableActions">
                <h2>{workspace.data.attributes.name}</h2>
              </div>
              <Space className="workspace-details" direction="vertical">
                <Paragraph
                  style={{ margin: "0px" }}
                  copyable={{ text: id, tooltips: false }}
                >
                  <span className="workspace-details"> ID: {id} </span>
                </Paragraph>
                {(workspace.data.attributes?.description === "") ? (
                  <a
                    className="workspace-button"
                    onClick={handleClickSettings}
                    style={{ color: "#3b3d45" }}
                  >
                    Add workspace description
                  </a>
                )
                :
                (
                  workspace.data.attributes.description
                )}
                <Space
                    size={40}
                    style={{marginBottom: "40px"}}
                    direction="horizontal"
                >
                  <span>
                    {workspace.data.attributes.locked ? (
                        <>
                          <LockOutlined/> Locked
                        </>
                    ) : (
                        <>
                          <UnlockOutlined/> Unlocked
                        </>
                    )}
                  </span>
                  <span>
                    <ProfileOutlined/> Resources{" "}
                    <span style={{fontWeight: "500"}}>
                      {resources.length}
                    </span>
                  </span>
                  <Space direction="horizontal">
                    {getIaCIconById(workspace.data.attributes?.iacType)}
                    <span>
                      {getIaCNameById(workspace.data.attributes?.iacType)}{" "}
                      <a
                          onClick={handleClickSettings}
                          className="workspace-button"
                          style={{color: "#3b3d45"}}
                      >
                        v{workspace.data.attributes.terraformVersion}
                      </a>
                    </span>
                  </Space>

                  <span>
                    <ClockCircleOutlined/> Updated{" "}
                    <span style={{fontWeight: "500"}}>
                      {DateTime.fromISO(lastRun).toRelative() ??
                          "never executed"}
                    </span>
                  </span>

                  <span>
                    {workspace.data.attributes.locked ? (
                        <>
                          <Alert
                              message="Lock Description"
                              description= {workspace.data.attributes.lockDescription}
                              type="warning"
                              showIcon
                          />
                        </>
                    ) : (
                        <>
                        </>
                    )}
                  </span>
                </Space>
              </Space>

              <Tabs
                  activeKey={activeKey}
                  defaultActiveKey={selectedTab}
                  onTabClick={handleStatesClick}
                  tabBarExtraContent={
                    <>
                      <Space direction="horizontal">
                        {actions &&
                            actions
                                .reduce((acc, action) => {
                                  if (!action.attributes.displayCriteria) {
                                    acc.push(action);
                              return acc;
                            }

                            let displayCriteria;
                            try {
                              displayCriteria = JSON.parse(
                                action.attributes.displayCriteria
                              );
                            } catch (error) {
                              console.error(
                                "Error parsing displayCriteria JSON:",
                                error
                              );
                              return acc;
                            }

                            for (const criteria of displayCriteria) {
                              const settings = evaluateCriteria(criteria, {
                                workspace: workspace.data,
                                state: contextState,
                                resources: resources,
                                apiUrl: new URL(
                                  window._env_.REACT_APP_TERRAKUBE_API_URL
                                ).origin,
                                settings: action.settings,
                              });
                              if (settings) {
                                action.settings = settings; // Attach settings to the action
                                console.log("settings");
                                console.log(action);
                                acc.push(action);
                                break;
                              }
                            }

                            return acc;
                          }, [])
                          .filter(
                            (action) =>
                              action?.attributes.type === "Workspace/Action"
                          )
                          .map((action, index) => (
                            <ActionLoader
                              key={index}
                              action={action?.attributes.action}
                              context={{
                                workspace: workspace.data,
                                state: contextState,
                                resources: resources,
                                apiUrl: new URL(
                                  window._env_.REACT_APP_TERRAKUBE_API_URL
                                ).origin,
                                settings: action.settings,
                              }}
                            />
                          ))}
                      <Button
                        type="default"
                        htmlType="button"
                        onClick={() =>
                          handleLockButton(workspace.data.attributes.locked)
                        }
                        icon={
                          workspace.data.attributes.locked ? (
                            <UnlockOutlined />
                          ) : (
                            <LockOutlined />
                          )
                        }
                        disabled={!manageWorkspace}
                      >
                        {workspace.data.attributes.locked ? "Unlock" : "Lock"}
                      </Button>
                      <CreateJob changeJob={changeJob} />
                    </Space>
                  </>
                }
                onChange={callback}
              >
                <TabPane tab="Overview" key="1">
                  <Row>
                    <Col span={19} style={{ paddingRight: "20px" }}>
                      {workspace.data.attributes.source === "empty" &&
                        workspace.data.attributes.branch === "remote-content" &&
                        workspace.data.relationships.history.data.length < 1 ? (
                        <CLIDriven
                          organizationName={organizationNameLocal}
                          workspaceName={workspaceName}
                        />
                      ) : (
                        <div>
                          <h3>Latest Run</h3>
                          <div
                            style={{ marginRight: "150px", borderWidth: "1px" }}
                          >
                            <List
                              itemLayout="horizontal"
                              style={{
                                border: "1px solid #c2c5cb",
                                padding: "24px",
                              }}
                              dataSource={
                                jobs.length > 0
                                  ? jobs
                                    .sort((a, b) => a.id - b.id)
                                    .reverse()
                                    .slice(0, 1)
                                  : []
                              }
                              renderItem={(item) => (
                                <List.Item>
                                  <List.Item.Meta
                                    style={{ margin: "0px", padding: "0px" }}
                                    avatar={
                                      <Avatar
                                        shape="square"
                                        icon={<UserOutlined />}
                                      />
                                    }
                                    description={
                                      <div>
                                        <Row>
                                          <Col span={20}>
                                            <h4 className="ant-list-item-meta-title">
                                              <a
                                                onClick={() =>
                                                  handleClick(item.id)
                                                }
                                              >
                                                {item.title}
                                              </a>{" "}
                                            </h4>
                                            <b>{item.createdBy}</b> triggered a
                                            run {item.latestChange} via{" "}
                                            <b>{item.via || "UI"}</b>{" "}
                                            {item.commitId !== "000000000" ? (
                                              <>
                                                <FiGitCommit />{" "}
                                                {item.commitId?.substring(0, 6)}{" "}
                                              </>
                                            ) : (
                                              ""
                                            )}
                                          </Col>
                                          <Col>
                                            {
                                              <div className="textLeft">
                                                <Tag
                                                  icon={
                                                    item.status ==
                                                      "completed" ? (
                                                      <CheckCircleOutlined />
                                                    ) : item.status ==
                                                      "running" ? (
                                                      <SyncOutlined spin />
                                                    ) : item.status ===
                                                      "waitingApproval" ? (
                                                      <ExclamationCircleOutlined />
                                                    ) : item.status ===
                                                      "cancelled" ? (
                                                      <StopOutlined />
                                                    ) : item.status ===
                                                      "failed" ? (
                                                      <StopOutlined />
                                                    ) : item.status ===
                                                      "notExecuted" ? (
                                                      <CheckCircleOutlined />
                                                    ) : (
                                                      <ClockCircleOutlined />
                                                    )
                                                  }
                                                  color={item.statusColor}
                                                >
                                                  {item.status}
                                                </Tag>{" "}
                                              </div>
                                            }
                                          </Col>
                                        </Row>
                                        <br />
                                        <br />
                                        <Row>
                                          <Col span={20}></Col>
                                          <Col>
                                            <Button
                                              onClick={() =>
                                                handleClick(item.id)
                                              }
                                            >
                                              See details
                                            </Button>
                                          </Col>
                                        </Row>
                                      </div>
                                    }
                                  />
                                </List.Item>
                              )}
                            />
                          </div>
                          <Tabs
                            type="card"
                            style={{ marginTop: "30px" }}
                            items={[
                              {
                                label: `Resources (${resources.length})`,
                                key: "1",
                                children: (
                                  <Table
                                    dataSource={resources}
                                    columns={resourceColumns}
                                  />
                                ),
                              },
                              {
                                label: `Outputs (${outputs.length})`,
                                key: "2",
                                children: (
                                  <Table
                                    dataSource={outputs}
                                    columns={outputColumns}
                                  />
                                ),
                              },
                            ]}
                          />

                          <ResourceDrawer
                            resource={resource}
                            workspace={workspace.data}
                            setOpen={setOpen}
                            open={open}
                            organizationId={organizationId}
                            organizationName={organizationNameLocal}
                          />
                        </div>
                      )}
                    </Col>
                    <Col span={5}>
                      <Space direction="vertical">
                        <br />
                        <span className="App-text">
                          {workspace.data.attributes.branch !==
                            "remote-content" ? (
                            <>
                              {" "}
                              {renderVCSLogo(vcsProvider)}{" "}
                              <a
                                href={fixSshURL(
                                  workspace.data.attributes.source
                                )}
                                target="_blank"
                              >
                                {new URL(
                                  fixSshURL(workspace.data.attributes.source)
                                )?.pathname
                                  ?.replace(".git", "")
                                  ?.substring(1)}
                              </a>
                            </>
                          ) : (
                            <>
                              <IconContext.Provider value={{ size: "1.4em" }}>
                                <BiTerminal />
                              </IconContext.Provider>
                              &nbsp;&nbsp;cli/api driven workflow
                            </>
                          )}
                        </span>
                        <span className="App-text">
                          <ThunderboltOutlined /> Execution Mode:{" "}
                          <a onClick={handleClickSettings}>{executionMode}</a>{" "}
                        </span>
                        <span className="App-text">
                          <PlayCircleOutlined /> Auto apply: <a>Off</a>{" "}
                        </span>
                        <Divider />
                        <h4>Tags</h4>
                        <Tags
                          organizationId={organizationId}
                          workspaceId={id}
                          manageWorkspace={manageWorkspace}
                        />
                      </Space>
                    </Col>
                  </Row>
                </TabPane>

                <TabPane tab="Runs" key="2">
                  {jobVisible ? (
                    <DetailsJob jobId={jobId} />
                  ) : (
                    <div>
                      <h3>Run List</h3>
                      <List
                        itemLayout="horizontal"
                        dataSource={jobs.sort((a, b) => a.id - b.id).reverse()}
                        renderItem={(item) => (
                          <List.Item
                            extra={
                              <div className="textLeft">
                                <Tag
                                  icon={
                                    item.status == "completed" ? (
                                      <CheckCircleOutlined />
                                    ) : item.status == "noChanges" ? (
                                      <CheckCircleOutlined />
                                    ) : item.status == "running" ? (
                                      <SyncOutlined spin />
                                    ) : item.status === "waitingApproval" ? (
                                      <ExclamationCircleOutlined />
                                    ) : item.status === "cancelled" ? (
                                      <StopOutlined />
                                    ) : item.status === "failed" ? (
                                      <StopOutlined />
                                    ) : (
                                      <ClockCircleOutlined />
                                    )
                                  }
                                  color={item.statusColor}
                                >
                                  {item.status}
                                </Tag>{" "}
                                <br />
                                <span className="metadata">
                                  {item.latestChange}
                                </span>
                              </div>
                            }
                          >
                            <List.Item.Meta
                              style={{ margin: "0px", padding: "0px" }}
                              avatar={
                                <Avatar
                                  shape="square"
                                  icon={<UserOutlined />}
                                />
                              }
                              title={
                                <a onClick={() => handleClick(item.id)}>
                                  {item.title}
                                </a>
                              }
                              description={
                                <span>
                                  {" "}
                                  #job-{item.id} |
                                  {item.commitId !== "000000000" ? (
                                    <>
                                      {" "}
                                      commitId {item.commitId?.substring(
                                        0,
                                        6
                                      )}{" "}
                                    </>
                                  ) : (
                                    ""
                                  )}
                                  | <b>{item.createdBy}</b> triggered via{" "}
                                  {item.via || "UI"}
                                </span>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </TabPane>
                <TabPane tab="States" key="3" disabled={!manageState}>
                  <States
                    history={history}
                    setStateDetailsVisible={setStateDetailsVisible}
                    stateDetailsVisible={stateDetailsVisible}
                    workspace={workspace.data}
                    organizationId={organizationId}
                    organizationName={organizationNameLocal}
                    onRollback={loadWorkspace}
                    manageState={manageState}
                  />
                </TabPane>
                <TabPane tab="Variables" key="4">
                  <Variables vars={variables} env={envVariables} manageWorkspace={manageWorkspace} collectionVars={collectionVariables} collectionEnvVars={collectionEnvVariables} globalVariables={globalVariables} globalEnvVariables={globalEnvVariables}/>
                </TabPane>
                <TabPane tab="Schedules" key="5">
                  {templates ? (
                    <Schedules schedules={schedule} manageWorkspace={manageWorkspace}/>
                  ) : (
                    <p>Loading...</p>
                  )}
                </TabPane>
                <TabPane tab="Settings" key="6">
                  <div className="generalSettings">
                    <h1>General Settings</h1>
                    <Spin spinning={waiting}>
                      <Form
                        onFinish={onFinish}
                        initialValues={{
                          name: workspace.data.attributes.name,
                          description: workspace.data.attributes.description,
                          folder: workspace.data.attributes.folder,
                          locked: workspace.data.attributes.locked,
                          lockDescription: workspace.data.attributes.lockDescription,
                          moduleSshKey: workspace.data.attributes.moduleSshKey,
                          executionMode:
                            workspace.data.attributes.executionMode,
                          iacType: workspace.data.attributes.iacType,
                          branch: workspace.data.attributes.branch,
                          defaultTemplate:
                            workspace.data.attributes.defaultTemplate,
                          executorAgent:
                            workspace.data.relationships.agent.data?.id == null
                              ? "default"
                              : workspace.data.relationships.agent.data?.id,
                          pushWebhookBranch: webhook[pushWebhookName]?.branch,
                          pushWebhookPath: webhook[pushWebhookName]?.path,
                          pushWebhookTemplate: webhook[pushWebhookName]?.templateId,
                        }}
                        layout="vertical"
                        name="form-settings"
                      >
                        <Form.Item name="id" label="ID">
                          <Paragraph copyable={{ tooltips: false }}>
                            <span className="App-text"> {id}</span>
                          </Paragraph>
                        </Form.Item>
                        <Form.Item
                          name="name"
                          rules={[
                            { required: true },
                            {
                              pattern: /^[A-Za-z0-9_-]+$/,
                              message:
                                "Only dashes, underscores, and alphanumeric characters are permitted.",
                            },
                          ]}
                          label="Name"
                        >
                          <Input disabled={!manageWorkspace}/>
                        </Form.Item>

                        <Form.Item
                          valuePropName="value"
                          name="description"
                          label="Description"
                        >
                          <Input.TextArea placeholder="Workspace description" disabled={!manageWorkspace}/>
                        </Form.Item>
                        <Form.Item
                          name="terraformVersion"
                          label={
                            getIaCNameById(
                              selectedIac || workspace.data.attributes?.iacType
                            ) + " Version"
                          }
                          extra={
                            "The version of " +
                            getIaCNameById(
                              selectedIac || workspace.data.attributes?.iacType
                            ) +
                            " to use for this workspace. Upon creating this workspace, the latest version was selected and will be used until it is changed manually. It will not upgrade automatically."
                          }
                        >
                          <Select
                            defaultValue={
                              workspace.data.attributes.terraformVersion
                            }
                            style={{ width: 250 }}
                            disabled={!manageWorkspace}
                          >
                            {terraformVersions.map(function (name, index) {
                              return <Option key={name}>{name}</Option>;
                            })}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          name="folder"
                          label={
                            getIaCNameById(
                              selectedIac || workspace.data.attributes?.iacType
                            ) + " Working Directory"
                          }
                          extra={
                            "The directory that " +
                            getIaCNameById(
                              selectedIac || workspace.data.attributes?.iacType
                            ) +
                            " will execute within. This defaults to the root of your repository and is typically set to a subdirectory matching the environment when multiple environments exist within the same repository."
                          }
                          onChange={handlePathChange}
                        >
                          <Input disabled={!manageWorkspace}/>
                        </Form.Item>
                        <Form.Item
                          name="branch"
                          label="Default Branch"
                          tooltip="The branch from which the runs are kicked off, this is used for runs issued from the UI."
                          extra="Don't update the value when using CLI Driven workflows. This is only used in VCS driven workflow."
                          onChange={handleBranchChange}
                        >
                          <Input disabled={!manageWorkspace}/>
                        </Form.Item>
                        <Form.Item
                          name="locked"
                          valuePropName="checked"
                          label="Lock Workspace"
                          tooltip={{
                            title: "Lock Workspace",
                            icon: <InfoCircleOutlined />,
                          }}
                        >
                          <Switch disabled={!manageWorkspace}/>
                        </Form.Item>
                        <Form.Item
                            valuePropName="value"
                            name="lockDescription"
                            label="Setup custom lock description message"
                        >
                          <Input.TextArea placeholder="Lock description details" disabled={!manageWorkspace}/>
                        </Form.Item>
                        <Form.Item
                          name="iacType"
                          label="Select IaC type "
                          extra="IaC type when running the workspace (Example: terraform or tofu) "
                        >
                          <Select
                            defaultValue={workspace.data.attributes?.iacType}
                            style={{ width: 250 }}
                            onChange={handleIacChange}
                            disabled={!manageWorkspace}
                          >
                            {iacTypes.map(function (iacType, index) {
                              return (
                                <Option key={iacType.id}>
                                  {getIaCIconById(iacType.id)} {iacType.name}{" "}
                                </Option>
                              );
                            })}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          name="executionMode"
                          label="Execution Mode"
                          extra={
                            "Use this option with terraform remote state/cloud block if you want to execute " +
                            getIaCNameById(
                              selectedIac || workspace.data.attributes?.iacType
                            ) +
                            " CLI remotely and just upload the state to Terrakube"
                          }
                        >
                          <Select
                            defaultValue={
                              workspace.data.attributes.executionMode
                            }
                            style={{ width: 250 }}
                            disabled={!manageWorkspace}
                          >
                            <Option key="remote">remote</Option>
                            <Option key="local">local</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item
                          name="defaultTemplate"
                          label="Default template when doing a git push to the repository"
                          extra="Default template when doing a git push to the repository"
                        >
                          <Select
                            onChange={handleTemplateChange}
                            defaultValue={
                              workspace.data.attributes.defaultTemplate
                            }
                            placeholder="select default template"
                            style={{ width: 250 }}
                            disabled={!manageWorkspace}
                          >
                            {orgTemplates.map(function (template, index) {
                              return (
                                <Option key={template?.id}>
                                  {template?.attributes?.name}
                                </Option>
                              );
                            })}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          name="moduleSshKey"
                          label="Download modules SSH Keys"
                          extra="Use this option to add a SSH key to allow module downloads"
                        >
                          <Select
                            defaultValue={
                              workspace.data.attributes.moduleSshKey
                            }
                            placeholder="select SSH Key"
                            style={{ width: 250 }}
                            disabled={!manageWorkspace}
                          >
                            {sshKeys.map(function (sshKey, index) {
                              return (
                                <Option key={sshKey?.id}>
                                  {sshKey?.attributes?.name}
                                </Option>
                              );
                            })}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          name="executorAgent"
                          label="Executor agent to run the job"
                          extra="Use this option to select which executor agent will run the job remotely"
                        >
                          <Select
                            defaultValue={
                              workspace.data.attributes.moduleSshKey
                            }
                            placeholder="select Job Agent"
                            style={{ width: 250 }}
                            disabled={!manageWorkspace}
                          >
                            {agentList.map(function (agentKey, index) {
                              return (
                                <Option key={agentKey?.id}>
                                  {agentKey?.attributes?.name}
                                </Option>
                              );
                            })}
                            <Option key="default">default</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item
                          label="Enable Push Webhook?"
                          hidden={vcsProvider == ""}
                          tooltip={{
                            title: "Whether to enable push webhook",
                            icon: <InfoCircleOutlined />,
                          }}
                        >
                          <Switch onChange={handlePushWebhookClick} defaultValue={pushWebhookEnabled} disabled={!manageWorkspace}/>
                        </Form.Item>
                        <Form.Item
                          hidden={!pushWebhookEnabled}
                          name="pushWebhookBranch"
                          label="Webhook Branch"
                          tooltip="A list of branch prefixes that will trigger a run."
                          extra="A list of branch regex besides the default VCS branch that will trigger a run, for example 'feat,fix'. Values are separated by comma."
                          rules={[{ required: false }]}
                        >
                          <Input placeholder={defaultBranch} disabled={!manageWorkspace}/>
                        </Form.Item>
                        <Form.Item
                          hidden={!pushWebhookEnabled}
                          name="pushWebhookPath"
                          label="Webhook Path"
                          tooltip="A list of regex to match against the paths in the source that will trigger a run."
                          extra="A list of regex to match against the paths besides the 'Terraform Working Directory' that will trigger a run, for example 'modules/.*.tf'. Values are separated by comma."
                          rules={[{ required: false }]}
                        >
                          <Input placeholder={defaultPath} disabled={!manageWorkspace}/>
                        </Form.Item>
                        <Form.Item
                          hidden={!pushWebhookEnabled}
                          name="pushWebhookTemplate"
                          label="Webhook Template"
                          tooltip="The template that will be executed when a push event is received from the selected VCS provider."
                          extra="The template that will be executed when a push event is received from the selected VCS provider."
                          rules={[{ required: false }]}
                        >
                          <Select placeholder={defaultTemplate} style={{ width: 250 }} disabled={!manageWorkspace}>
                            {orgTemplates.map(function (template, index) {
                              return (
                                <Option key={template?.id}>
                                  {template?.attributes?.name}
                                </Option>
                              );
                            })}
                          </Select>
                        </Form.Item>
                        <Form.Item>
                          <Button type="primary" htmlType="submit" disabled={!manageWorkspace}>
                            Save settings
                          </Button>
                        </Form.Item>
                      </Form>
                    </Spin>
                    <h1>Delete Workspace</h1>
                    <div className="App-Text">
                      Deleting thill permanently delete the
                      information. Please be certain that you understand this.
                      This action cannot be undone.
                    </div>
                    <Popconfirm
                      onConfirm={() => {
                        onDelete(workspace);
                      }}
                      style={{ width: "100%" }}
                      title={
                        <p>
                          Workspace will be permanently deleted <br /> from this
                          organization.
                          <br />
                          Are you sure?
                        </p>
                      }
                      okText="Yes"
                      cancelText="No"
                      placement="bottom"
                    >
                      <Button type="default" danger style={{ width: "100%" }} disabled={!manageWorkspace}>
                        <Space>
                          <DeleteOutlined />
                          Delete from Terrakube
                        </Space>
                      </Button>
                    </Popconfirm>
                  </div>
                </TabPane>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </Content>
  );
};

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateRandomString(length) {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function setupWorkspaceIncludes(
  data,
  setVariables,
  setJobs,
  setEnvVariables,
  setHistory,
  setSchedule,
  templates,
  setLastRun,
  setVCSProvider,
  setCurrentStateId,
  currentStateId,
  axiosInstance,
  setResources,
  setOutputs,
  setAgent,
  _loadWebhook,
  setWebhook,
  setPushWebhookEnabled,
  setContextState,
  setReferences,
  setCollectionVariables,
  setCollectionEnvVariables,
  setGlobalVariables,
  setGlobalEnvVariables
) {
  let variables = [];
  let jobs = [];
  let webhooks = {};
  let envVariables = [];
  let history = [];
  let schedule = [];
  let references = [];
  let collectionVariables = [];
  let collectionEnvVariables = [];
  let globalVariables = [];
  let globalEnvVariables = [];
  let includes = data.included;
  console.log(data.attributes?.iacType);
  includes.forEach((element) => {
    console.log(element);
    switch (element.type) {
      case include.ORGANIZATION:
        console.log("Checking global variables");
        axiosInstance
            .get(`/organization/${element.id}/globalvar`).then((response) => {
              console.log(`Global Variables Data: ${JSON.stringify(response.data.data)}`)
              let globalVar = response.data.data;
              if (globalVar != null ) {
                globalVar.forEach((variableItem) => {
                  console.log(`Variable: ${JSON.stringify(variableItem)}`);
                  if (variableItem.attributes.category === "ENV") {
                    console.log(`Adding global var env`);
                    globalEnvVariables.push({
                      id: variableItem.id,
                      type: variableItem.type,
                      ...variableItem.attributes,
                    });
                  } else {
                    console.log(`Adding global var terraform`);
                    globalVariables.push({
                      id: variableItem.id,
                      type: variableItem.type,
                      ...variableItem.attributes,
                    });
                  }
                })
              }
            }
        )
        break;
      case include.JOB:
        let finalColor = "";
        switch (element.attributes.status) {
          case "completed":
            finalColor = "#2eb039";
            break;
          case "noChanges":
            finalColor = "#9f37fa";
            break;
          case "rejected":
            finalColor = "#FB0136";
            break;
          case "failed":
            finalColor = "#FB0136";
            break;
          case "running":
            finalColor = "#108ee9";
            break;
          case "waitingApproval":
            finalColor = "#fa8f37";
            break;
          default:
            finalColor = "";
            break;
        }
        jobs.push({
          id: element.id,
          title:
            "Queue manually using " +
            getIaCNameById(data?.data?.attributes?.iacType),
          statusColor: finalColor,
          commitId: element.attributes.commitId,
          stepNumber: element.attributes.stepNumber,
          latestChange: DateTime.fromISO(
            element.attributes.createdDate
          ).toRelative(),
          ...element.attributes,
        });
        setLastRun(element.attributes.updatedDate);
        break;
      case include.HISTORY:
        console.log(element);
        history.push({
          id: element.id,
          title:
            "Queue manually using " +
            getIaCNameById(data?.data?.attributes?.iacType),
          relativeDate: DateTime.fromISO(
            element.attributes.createdDate
          ).toRelative(),
          createdDate: element.attributes.createdDate,
          ...element.attributes,
        });
        break;

      case include.SCHEDULE:
        schedule.push({
          id: element.id,
          name: templates?.find(
            (template) => template.id === element.attributes.templateReference
          )?.attributes?.name,
          ...element.attributes,
        });
        break;
      case include.VCS:
        setVCSProvider(element.attributes.vcsType);
        break;
      case include.AGENT:
        setAgent(element.id);
        break;
      case include.VARIABLE:
        if (element.attributes.category == "ENV") {
          envVariables.push({
            id: element.id,
            type: element.type,
            ...element.attributes,
          });
        } else {
          variables.push({
            id: element.id,
            type: element.type,
            ...element.attributes,
          });
        }
        break;
      case include.WEBHOOK:
        webhooks[element.attributes.event] = {
          id: element.id,
          type: element.type,
          ...element.attributes,
        };
        break;
      case include.REFERENCE:
        console.log("Checking references");
        axiosInstance
            .get(`/reference/${element.id}/collection?include=item`).then((response) => {
              console.log(`Reference Data: ${response.data}`)
              let collectionInfo = response.data.data;
              if (response.data.included != null ) {
                let items = response.data.included;
                items.forEach((item) => {
                  item.attributes.priority = collectionInfo.attributes.priority;
                  item.attributes.collectionName = collectionInfo.attributes.name;
                  if (item.attributes.category === "ENV") {
                    collectionEnvVariables.push({
                      id: item.id,
                      type: item.type,
                      ...item.attributes,
                    });
                  } else {
                    collectionVariables.push({
                      id: item.id,
                      type: item.type,
                      ...item.attributes,
                    });
                  }
                })
              }
            }
          )
        break;
    }
  });

  console.log("Setting all values for the UI")
  setVariables(variables);
  setEnvVariables(envVariables);
  setJobs(jobs);
  setHistory(history);
  setSchedule(schedule);
  setCollectionVariables(collectionVariables)
  setCollectionEnvVariables(collectionEnvVariables)
  setGlobalVariables(globalVariables);
  setGlobalEnvVariables(globalEnvVariables);
  if (_loadWebhook) {
    setWebhook(webhooks);
    setPushWebhookEnabled(webhooks["PUSH"] ? true : false);
  }

  console.log(
    `Parsing state for workspace ${sessionStorage.getItem(WORKSPACE_ARCHIVE)} `
  );
  // set state data
  var lastState = history
    .sort((a, b) => a.jobReference - b.jobReference)
    .reverse()[0];
  // reload state only if there is a new version
  console.log("Get latest state");
  if (currentStateId !== lastState?.id) {
    const organizationId = sessionStorage.getItem(ORGANIZATION_ARCHIVE);
    const workspaceId = sessionStorage.getItem(WORKSPACE_ARCHIVE);
      const url = `${new URL(window._env_.REACT_APP_TERRAKUBE_API_URL).origin}/access-token/v1/teams/permissions/organization/${organizationId}/workspace/${workspaceId}`;
      axiosInstance.get(url).then((response) => {
        console.log(`Manage Permission Workspace Set:`)
        console.log(response.data)
        loadState(
            lastState,
            axiosInstance,
            setOutputs,
            setResources,
            sessionStorage.getItem(WORKSPACE_ARCHIVE),
            setContextState,
            response.data.manageState
        );
      })
  }
  setCurrentStateId(lastState?.id);
}

function loadState(
  state,
  axiosInstance,
  setOutputs,
  setResources,
  workspaceId,
  setContextState,
  manageState
) {
  console.log(`Loading State ${manageState} `)
  if (!state || !manageState) {
    return;
  }

  var currentState;
  var organizationId = sessionStorage.getItem(ORGANIZATION_ARCHIVE);

  axiosInstance.get(state.output).then((resp) => {
    var result = parseState(resp.data);
    setContextState(resp.data);
    if (result.outputs.length < 1 && result.resources.length < 1) {
      axiosInstance
        .get(
          `${new URL(window._env_.REACT_APP_TERRAKUBE_API_URL).origin
          }/tfstate/v1/organization/${organizationId}/workspace/${workspaceId}/state/terraform.tfstate`
        )
        .then((currentStateData) => {
          console.log("Current State Data");
          console.log(currentStateData.data);
          currentState = currentStateData.data;
          setContextState(currentState);
          console.log(
            "Parsing state using current state data instead of json representation"
          );
          result = parseOldState(currentState);

          console.log("result parsing state", result);
          setResources(result.resources);
          setOutputs(result.outputs);
        })
        .catch(function (error) {
          console.error(error);
        });
    } else {
      console.log("result parsing state", result);
      setResources(result.resources);
      setOutputs(result.outputs);
    }
  });
}

function parseState(state) {
  var resources = [];
  var outputs = [];
  console.log("Current state");
  console.log(state);
  // parse root outputs
  if (state?.values?.outputs != null) {
    for (const [key, value] of Object.entries(state?.values?.outputs)) {
      if (typeof value.type === "string") {
        console.log(typeof value.type);
        outputs.push({
          name: key,
          type: value.type,
          value: value.value,
        });
      } else {
        console.log(typeof value.type);
        const jsonObject = JSON.stringify(value.value);
        const jsonType = value.type.toString();
        console.log(jsonObject);
        outputs.push({
          name: key,
          type: "Other type",
          value: jsonObject,
        });
      }
    }
  } else {
    console.log("State has no outputs");
  }

  // parse root module resources
  if (state?.values?.root_module?.resources != null) {
    for (const [key, value] of Object.entries(
      state?.values?.root_module?.resources
    )) {
      resources.push({
        name: value.name,
        type: value.type,
        provider: value.provider_name,
        module: "root_module",
        values: value.values,
        depends_on: value.depends_on,
      });
    }
  } else {
    console.log("State has no resources");
  }

  // parse child module resources
  if (state?.values?.root_module?.child_modules?.length > 0) {
    state?.values?.root_module?.child_modules?.forEach((moduleVal, index) => {
      console.log(`Checking child ${moduleVal.address} with index ${index}`);
      if (moduleVal.resources != null)
        for (const [key, value] of Object.entries(moduleVal.resources)) {
          resources.push({
            name: value.name,
            type: value.type,
            provider: value.provider_name,
            module: moduleVal.address,
            values: value.values,
            depends_on: value.depends_on,
          });
        }

      if (moduleVal.child_modules?.length > 0) {
        resources = parseChildModules(resources, moduleVal.child_modules);
      }
    });
  } else {
    console.log("State has no child modules resources");
  }

  return { resources: resources, outputs: outputs };
}

function parseOldState(state) {
  var resources = [];
  var outputs = [];
  console.log("Current State Data using fallback parsing method");
  console.log(state);

  console.log("Parsing outputs fallback method");
  if (state?.outputs != null) {
    for (const [key, value] of Object.entries(state?.outputs)) {
      if (typeof value.type === "string") {
        console.log(typeof value.type);
        outputs.push({
          name: key,
          type: value.type,
          value: value.value,
        });
      } else {
        console.log(typeof value.type);
        const jsonObject = JSON.stringify(value.value);
        console.log(jsonObject);
        outputs.push({
          name: key,
          type: "Other type",
          value: jsonObject,
        });
      }
    }
  } else {
    console.log("State has no outputs");
  }

  console.log("Parsing resources and modules fallback method");
  if (state?.resources != null && state?.resources.length > 0) {
    state?.resources.forEach((value) => {
      if (value.module != null) {
        resources.push({
          name: value.name,
          type: value.type,
          provider: value.provider.replace("provider[", "").replace("]", ""),
          module: value.module,
          values: value.instances[0].attributes,
          depends_on: value.instances[0].dependencies,
        });
      } else {
        resources.push({
          name: value.name,
          type: value.type,
          provider: value.provider.replace('provider["', "").replace('"]', ""),
          module: "root_module",
          values: value.instances[0].attributes,
          depends_on: value.instances[0].dependencies,
        });
      }
    });
  } else {
    console.log("State has no resources/modules");
  }

  console.log({ resources: resources, outputs: outputs });

  return { resources: resources, outputs: outputs };
}

function parseChildModules(resources, child_modules) {
  child_modules?.forEach((moduleVal, index) => {
    console.log(
      `Checking nested child ${moduleVal.address} with index ${index}`
    );
    if (moduleVal.resources != null)
      for (const [key, value] of Object.entries(moduleVal.resources)) {
        resources.push({
          name: value.name,
          type: value.type,
          provider: value.provider_name,
          module: moduleVal.address,
          values: value.values,
          depends_on: value.depends_on,
        });
      }

    if (moduleVal.child_modules?.length > 0) {
      resources = parseChildModules(resources);
    }
  });

  return resources;
}

function fixSshURL(source) {
  if (source.startsWith("git@")) {
    return source.replace(":", "/").replace("git@", "https://");
  } else {
    return source;
  }
}

function getIaCNameById(id) {
  const item = iacTypes.find((iacType) => iacType.id === id);
  return item ? item.name : null;
}
