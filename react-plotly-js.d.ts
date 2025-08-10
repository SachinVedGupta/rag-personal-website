// Type declaration for react-plotly.js
declare module "react-plotly.js" {
  import { Component } from "react";
  interface PlotProps {
    data: any[];
    layout: any;
    config?: any;
    style?: any;
  }
  export default class Plot extends Component<PlotProps> {}
}