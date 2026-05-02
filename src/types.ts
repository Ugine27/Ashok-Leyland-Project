export type ComponentType = "Bolt" | "Nut" | "Crankshaft" | "Piston" | "Sheet Metal" | "Engine Block" | "Connecting Rod";

export type FailureCategory = "Fatigue" | "Wear" | "Corrosion" | "Manufacturing Defect" | "None";

export interface MeasurementSet {
  hardnessCore: string;
  hardnessCase: string;
  caseDepth: string;
  microstructure: string;
  composition: string;
}

export interface FailureReport {
  id: string;
  reportId: string;
  componentName: ComponentType;
  manufacturer: string;
  customer: string;
  date: string;
  spec: MeasurementSet;
  observed: MeasurementSet;
  metSpec: boolean;
  failureCategory: FailureCategory;
  failureAnalysis: string;
}
