import { ComponentType, FailureReport, FailureCategory } from "../types";

const MANUFACTURERS = ["AL", "Tata Motors", "Mahindra", "Eicher", "Force Motors", "Swaraj", "Escorts"];
const CUSTOMERS = ["JSW", "Reliance", "Adani", "BHEL", "L&T", "TVS", "Sundaram"];
const COMPONENT_TYPES: ComponentType[] = ["Bolt", "Nut", "Crankshaft", "Piston", "Sheet Metal", "Engine Block", "Connecting Rod"];
const FAILURE_CATEGORIES: FailureCategory[] = ["Fatigue", "Wear", "Corrosion", "Manufacturing Defect"];

const MICROSTRUCTURES = ["Martensite", "Pearlite", "Ferrite", "Austenite", "Bainite", "Martensite with RA", "Fine Pearlite"];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

function generateReport(index: number): FailureReport {
  const componentName = COMPONENT_TYPES[getRandomInt(0, COMPONENT_TYPES.length - 1)];
  const manufacturer = MANUFACTURERS[getRandomInt(0, MANUFACTURERS.length - 1)];
  const customer = CUSTOMERS[getRandomInt(0, CUSTOMERS.length - 1)];
  const date = getRandomDate(new Date(2015, 0, 1), new Date(2025, 4, 1));
  
  // Base spec values based on component type
  let specHardnessCore = 50;
  let specHardnessCase = 60;
  let specCaseDepth = 2.0;
  
  if (componentName === "Crankshaft") {
    specHardnessCore = 60;
    specHardnessCase = 70;
    specCaseDepth = 3.5;
  } else if (componentName === "Piston") {
    specHardnessCore = 40;
    specHardnessCase = 45;
    specCaseDepth = 1.5;
  }

  const metSpec = Math.random() > 0.3; // 70% chance of passing
  
  const observedHardnessCore = metSpec ? specHardnessCore + getRandomInt(-2, 2) : specHardnessCore - getRandomInt(5, 10);
  const observedHardnessCase = metSpec ? specHardnessCase + getRandomInt(-2, 2) : specHardnessCase - getRandomInt(5, 12);
  const observedCaseDepth = metSpec ? (specCaseDepth + (Math.random() * 0.4 - 0.2)).toFixed(1) : (specCaseDepth - (Math.random() * 1.5)).toFixed(1);

  const microSpec = MICROSTRUCTURES[getRandomInt(0, MICROSTRUCTURES.length - 1)];
  const microObserved = metSpec ? microSpec : `${microSpec} with RA / Defects`;

  const compBase = "Fe 98, C 1.9, Si 0.1";

  const failureCategory: FailureCategory = metSpec ? "None" : FAILURE_CATEGORIES[getRandomInt(0, FAILURE_CATEGORIES.length - 1)];

  const analysisOptions = {
    "Fatigue": "Cyclic loading caused crack initiation at surface imperfections. Stress fracture confirmed.",
    "Wear": "Excessive abrasive interaction resulted in material loss exceeding design tolerances.",
    "Corrosion": "Environmental exposure led to oxidation and pitting, reducing structural integrity.",
    "Manufacturing Defect": "Pores or inclusions detected in microstructure suggesting casting/forging anomaly.",
    "None": "Component meets all specified parameters. No failure detected in early testing."
  };
  
  return {
    id: `rep-${index}`,
    reportId: `FA-${2024}-${(index + 1000).toString().padStart(4, '0')}`,
    componentName,
    manufacturer,
    customer,
    date,
    spec: {
      hardnessCore: `${specHardnessCore} HRc`,
      hardnessCase: `${specHardnessCase} HRc`,
      caseDepth: `${specCaseDepth}mm`,
      microstructure: microSpec,
      composition: compBase,
    },
    observed: {
      hardnessCore: `${observedHardnessCore} HRc`,
      hardnessCase: `${observedHardnessCase} HRc`,
      caseDepth: `${observedCaseDepth}mm`,
      microstructure: microObserved,
      composition: compBase,
    },
    metSpec,
    failureCategory,
    failureAnalysis: analysisOptions[failureCategory],
  };
}

export const REPORTS: FailureReport[] = Array.from({ length: 1000 }, (_, i) => generateReport(i));
