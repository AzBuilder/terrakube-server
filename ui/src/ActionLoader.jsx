import React, { useEffect, useState } from "react";
import * as Icons from "@ant-design/icons";
import { transform } from "@babel/standalone";
import { Typography, Collapse } from "antd";
import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalGridLines,
  LineSeries,
} from "react-vis";
import "react-vis/dist/style.css";
import axiosInstance from "./config/axiosConfig";

// List of antd components to consider for dynamic importing
const antdComponents = [
  "Affix",
  "Anchor",
  "AutoComplete",
  "Alert",
  "Avatar",
  "BackTop",
  "Badge",
  "Breadcrumb",
  "Button",
  "Calendar",
  "Card",
  "Collapse",
  "Carousel",
  "Cascader",
  "Checkbox",
  "Col",
  "Comment",
  "ConfigProvider",
  "DatePicker",
  "Descriptions",
  "Divider",
  "Dropdown",
  "Drawer",
  "Empty",
  "Form",
  "Input",
  "InputNumber",
  "Layout",
  "List",
  "message",
  "Menu",
  "Mentions",
  "Modal",
  "Statistic",
  "notification",
  "PageHeader",
  "Pagination",
  "Popconfirm",
  "Popover",
  "Progress",
  "Radio",
  "Rate",
  "Result",
  "Row",
  "Select",
  "Skeleton",
  "Slider",
  "Space",
  "Spin",
  "Steps",
  "Switch",
  "Table",
  "Transfer",
  "Tree",
  "TreeSelect",
  "Tabs",
  "Tag",
  "TimePicker",
  "Timeline",
  "Tooltip",
  "Typography",
  "Upload",
];

const { Panel } = Collapse;
const { Paragraph, Text } = Typography;

// List of antd icons to consider for dynamic importing
const antdIcons = Object.keys(Icons).filter((name) =>
  name.endsWith("Outlined")
);

// Function to identify required antd components
const getRequiredAntdComponents = (componentString) => {
  return antdComponents.filter((component) =>
    componentString.includes(component)
  );
};

// Function to identify required antd icons
const getRequiredAntdIcons = (componentString) => {
  return antdIcons.filter((icon) => componentString.includes(icon));
};

// Function to dynamically import antd components
const importAntdComponents = async (components) => {
  const imports = await Promise.all(
    components.map((component) => import(`antd/es/${component.toLowerCase()}`))
  );
  const importedComponents = {};
  components.forEach((component, index) => {
    importedComponents[component] = imports[index].default;
  });
  return importedComponents;
};

// Function to dynamically import antd icons
const importAntdIcons = async (icons) => {
  const imports = await Promise.all(
    icons.map((icon) => import(`@ant-design/icons/es/icons/${icon}`))
  );
  const importedIcons = {};
  icons.forEach((icon, index) => {
    importedIcons[icon] = imports[index].default;
  });
  return importedIcons;
};

const ActionLoader = ({ action, context }) => {
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const componentString = decodeURIComponent(escape(window.atob(action)));
        console.debug("Decoded Component String:", componentString);

        const requiredAntdComponents =
          getRequiredAntdComponents(componentString);
        const requiredAntdIcons = getRequiredAntdIcons(componentString);

        const [importedComponents, importedIcons] = await Promise.all([
          importAntdComponents(requiredAntdComponents),
          importAntdIcons(requiredAntdIcons),
        ]);

        // Transform JSX to JavaScript
        let transpiledCode = transform(componentString, {
          presets: ["react"],
        }).code;
        console.debug("Transpiled Code:", transpiledCode);

        // Remove the last semicolon
        const lastSemicolonIndex = transpiledCode.lastIndexOf(";");
        if (lastSemicolonIndex !== -1) {
          transpiledCode = transpiledCode.slice(0, lastSemicolonIndex);
        }

        // Create the component function
        const createComponent = new Function(
          "React",
          "useEffect",
          "useState",
          "Panel",
          "Paragraph",
          "Text",
          "XYPlot",
          "LineSeries",
          "XAxis",
          "YAxis",
          "HorizontalGridLines",
          "VerticalGridLines",
          "axiosInstance",
          ...requiredAntdComponents,
          ...requiredAntdIcons,
          `return (${transpiledCode})`
        );
        const component = createComponent(
          React,
          useEffect,
          useState,
          Panel,
          Paragraph,
          Text,
          XYPlot,
          LineSeries,
          XAxis,
          YAxis,
          HorizontalGridLines,
          VerticalGridLines,
          axiosInstance,
          ...requiredAntdComponents.map(
            (component) => importedComponents[component]
          ),
          ...requiredAntdIcons.map((icon) => importedIcons[icon])
        );
        console.debug("Component Function:", component);

        setComponent(() => component);
      } catch (error) {
        console.error("Error creating component:", error);
      }
    };

    loadComponent();
  }, [action]);

  if (!Component) {
    return <div>Loading...</div>;
  }

  return <Component context={context} />;
};

export default ActionLoader;
