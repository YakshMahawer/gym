export interface PTPlanItem {
  name: string;
  price: number;
  durationInDays: number;
  sessions: number;
  description: string;
}

export const STANDARD_PT_PLANS: PTPlanItem[] = [
  {
    name: "1 Month PT (12 Sessions)",
    price: 6000,
    durationInDays: 30,
    sessions: 12,
    description: "12 One-on-one personal training sessions in 1 month",
  },
  {
    name: "1 Month PT (24 Sessions)",
    price: 10000,
    durationInDays: 30,
    sessions: 24,
    description: "24 One-on-one personal training sessions in 1 month (Daily)",
  },
  {
    name: "3 Months PT (36 Sessions)",
    price: 16500,
    durationInDays: 90,
    sessions: 36,
    description: "36 One-on-one sessions across 3 months",
  },
  {
    name: "3 Months PT (72 Sessions)",
    price: 28500,
    durationInDays: 90,
    sessions: 72,
    description: "72 One-on-one sessions across 3 months",
  },
  {
    name: "6 Months PT (72 Sessions)",
    price: 30000,
    durationInDays: 180,
    sessions: 72,
    description: "72 One-on-one sessions across 6 months",
  },
  {
    name: "6 Months PT (144 Sessions)",
    price: 54000,
    durationInDays: 180,
    sessions: 144,
    description: "144 One-on-one sessions across 6 months",
  },
  {
    name: "12 Months PT (144 Sessions)",
    price: 54000,
    durationInDays: 365,
    sessions: 144,
    description: "144 One-on-one sessions across 1 year",
  },
  {
    name: "12 Months PT (288 Sessions)",
    price: 102000,
    durationInDays: 365,
    sessions: 288,
    description: "288 One-on-one sessions across 1 year",
  },
  {
    name: "Single PT Starter / Trial",
    price: 1000,
    durationInDays: 30,
    sessions: 1,
    description: "Starter PT trial session",
  },
  {
    name: "Group Training (3 Persons 12 Sessions)",
    price: 7500,
    durationInDays: 30,
    sessions: 12,
    description: "Small group training (3 athletes) 12 sessions",
  },
];
