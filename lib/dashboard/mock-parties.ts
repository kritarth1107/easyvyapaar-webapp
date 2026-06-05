export const WALK_IN_PARTY_ID = "10";

export type Party = {
  id: string;
  name: string;
  phone?: string;
  balance: number;
};

export const MOCK_PARTIES: Party[] = [
  { id: "1", name: "MR. AJIT PAIKRA", phone: "9876501234", balance: 0 },
  { id: "2", name: "AJAY KUMAR", phone: "9123405678", balance: 0 },
  { id: "3", name: "Rahul Mobiles", phone: "9876543210", balance: 12500 },
  { id: "4", name: "Sharma Electronics", phone: "9123456780", balance: 24838 },
  { id: "5", name: "Patel Traders", balance: 14691 },
  { id: "6", name: "Mehta & Sons", phone: "9988001122", balance: 0 },
  { id: "7", name: "Kumar General Store", balance: 0 },
  { id: "8", name: "Singh Appliances", phone: "9012345678", balance: 5899 },
  { id: "9", name: "Gupta Mobile Point", phone: "9988776655", balance: 47198 },
  { id: "10", name: "Walk-in Customer", balance: 0 },
];
