export interface PTPlanItem {
  name: string;
  price: number;
  durationInDays: number;
  sessions?: number;
  description: string;
}

export const STANDARD_PT_PLANS: PTPlanItem[] = [
  {
    name: "1 Month Personal Training",
    price: 6000,
    durationInDays: 30,
    description: "1 Month dedicated personal training package",
  },
  {
    name: "1 Month Personal Training (Intensive)",
    price: 10000,
    durationInDays: 30,
    description: "1 Month intensive daily personal training",
  },
  {
    name: "3 Months Personal Training",
    price: 16500,
    durationInDays: 90,
    description: "3 Months personal training package",
  },
  {
    name: "3 Months Personal Training (Intensive)",
    price: 28500,
    durationInDays: 90,
    description: "3 Months intensive personal training",
  },
  {
    name: "6 Months Personal Training",
    price: 30000,
    durationInDays: 180,
    description: "6 Months personal training package",
  },
  {
    name: "6 Months Personal Training (Intensive)",
    price: 54000,
    durationInDays: 180,
    description: "6 Months intensive personal training",
  },
  {
    name: "12 Months Personal Training",
    price: 54000,
    durationInDays: 365,
    description: "1 Year personal training package",
  },
  {
    name: "12 Months Personal Training (Intensive)",
    price: 102000,
    durationInDays: 365,
    description: "1 Year intensive personal training",
  },
  {
    name: "Single PT Starter / Trial",
    price: 1000,
    durationInDays: 30,
    description: "Starter PT trial package",
  },
  {
    name: "Group Training (Small Group)",
    price: 7500,
    durationInDays: 30,
    description: "Small group personal training package",
  },
];
