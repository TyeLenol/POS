export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
  totalOrders: number;
  joinedAt: string;
}

export interface ReceiptLineItem {
  name: string;
  qty: number;
  price: number;
}

export interface CustomerReceipt {
  id: string;
  customerId: string;
  date: string;
  items: ReceiptLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

export const MOCK_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Ama Asante",    phone: "0244123456", email: "ama@email.com",   totalSpent: 450.00, totalOrders: 12, joinedAt: "2025-01-15" },
  { id: "c2", name: "Kofi Mensah",   phone: "0551234567", email: "kofi@gmail.com",  totalSpent: 230.50, totalOrders: 7,  joinedAt: "2025-03-22" },
  { id: "c3", name: "Abena Osei",    phone: "0271234567", email: "abena@yahoo.com", totalSpent: 890.75, totalOrders: 21, joinedAt: "2024-11-05" },
  { id: "c4", name: "Kwame Boateng", phone: "0201234567", email: "",                totalSpent: 125.00, totalOrders: 4,  joinedAt: "2025-04-01" },
  { id: "c5", name: "Yaa Frimpong",  phone: "0241234567", email: "yaa@hotmail.com", totalSpent: 670.25, totalOrders: 15, joinedAt: "2024-09-18" },
  { id: "c6", name: "Nana Darko",    phone: "0301234567", email: "nana@gmail.com",  totalSpent: 180.00, totalOrders: 5,  joinedAt: "2025-02-10" },
  { id: "c7", name: "Efua Mensah",   phone: "0261234567", email: "",                totalSpent: 52.50,  totalOrders: 2,  joinedAt: "2025-04-18" },
  { id: "c8", name: "Akosua Darko",  phone: "0541234567", email: "akosua@gmail.com",totalSpent: 1205.00,totalOrders: 34, joinedAt: "2024-06-20" },
];

export const MOCK_CUSTOMER_RECEIPTS: CustomerReceipt[] = [
  { id: "RC-20260420-0012", customerId: "c1", date: "2026-04-20 14:32",
    items: [{ name: "Chocolate Frogs", qty: 2, price: 6.50 }, { name: "Butterbeer (Draft)", qty: 1, price: 8.00 }],
    subtotal: 21.00, tax: 1.68, total: 22.68, paymentMethod: "Cash" },
  { id: "RC-20260415-0008", customerId: "c1", date: "2026-04-15 10:15",
    items: [{ name: "Pumpkin Pasties", qty: 3, price: 5.50 }, { name: "Every Flavour Beans", qty: 1, price: 4.00 }],
    subtotal: 20.50, tax: 1.54, total: 22.04, paymentMethod: "Mobile Money" },
  { id: "RC-20260408-0031", customerId: "c1", date: "2026-04-08 16:44",
    items: [{ name: "Felix Felicis (Vial)", qty: 1, price: 150.00 }],
    subtotal: 150.00, tax: 11.25, total: 161.25, paymentMethod: "Card" },

  { id: "RC-20260419-0007", customerId: "c2", date: "2026-04-19 11:22",
    items: [{ name: "Butterbeer (Draft)", qty: 2, price: 8.00 }, { name: "Cauldron Cakes", qty: 2, price: 7.00 }],
    subtotal: 30.00, tax: 2.25, total: 32.25, paymentMethod: "Cash" },
  { id: "RC-20260410-0014", customerId: "c2", date: "2026-04-10 09:05",
    items: [{ name: "Sugar Quills", qty: 5, price: 2.50 }, { name: "Exploding Bonbons", qty: 2, price: 5.00 }],
    subtotal: 22.50, tax: 1.69, total: 24.19, paymentMethod: "Cash" },

  { id: "RC-20260421-0003", customerId: "c3", date: "2026-04-21 13:00",
    items: [{ name: "Licorice Wands", qty: 4, price: 3.50 }, { name: "Pumpkin Pasties", qty: 2, price: 5.50 }],
    subtotal: 25.00, tax: 1.88, total: 26.88, paymentMethod: "Mobile Money" },
  { id: "RC-20260418-0022", customerId: "c3", date: "2026-04-18 15:30",
    items: [{ name: "Felix Felicis (Vial)", qty: 1, price: 150.00 }, { name: "Butterbeer (Draft)", qty: 3, price: 8.00 }],
    subtotal: 174.00, tax: 13.05, total: 187.05, paymentMethod: "Card" },
  { id: "RC-20260412-0019", customerId: "c3", date: "2026-04-12 12:15",
    items: [{ name: "Chocolate Frogs", qty: 6, price: 6.50 }, { name: "Every Flavour Beans", qty: 3, price: 4.00 }],
    subtotal: 51.00, tax: 3.83, total: 54.83, paymentMethod: "Cash" },

  { id: "RC-20260417-0011", customerId: "c4", date: "2026-04-17 17:20",
    items: [{ name: "Cauldron Cakes", qty: 2, price: 7.00 }, { name: "Gillywater", qty: 1, price: 3.00 }],
    subtotal: 17.00, tax: 1.28, total: 18.28, paymentMethod: "Cash" },

  { id: "RC-20260422-0001", customerId: "c5", date: "2026-04-22 09:45",
    items: [{ name: "Butterbeer (Draft)", qty: 4, price: 8.00 }, { name: "Pumpkin Pasties", qty: 2, price: 5.50 }],
    subtotal: 43.00, tax: 3.23, total: 46.23, paymentMethod: "Card" },
  { id: "RC-20260414-0009", customerId: "c5", date: "2026-04-14 14:10",
    items: [{ name: "Exploding Bonbons", qty: 3, price: 5.00 }, { name: "Sugar Quills", qty: 8, price: 2.50 }],
    subtotal: 35.00, tax: 2.63, total: 37.63, paymentMethod: "Mobile Money" },

  { id: "RC-20260416-0018", customerId: "c6", date: "2026-04-16 11:30",
    items: [{ name: "Chocolate Frogs", qty: 3, price: 6.50 }, { name: "Every Flavour Beans", qty: 4, price: 4.00 }],
    subtotal: 35.50, tax: 2.66, total: 38.16, paymentMethod: "Cash" },

  { id: "RC-20260420-0027", customerId: "c7", date: "2026-04-20 16:55",
    items: [{ name: "Pumpkin Pasties", qty: 1, price: 5.50 }, { name: "Butterbeer (Draft)", qty: 1, price: 8.00 }],
    subtotal: 13.50, tax: 1.01, total: 14.51, paymentMethod: "Cash" },

  { id: "RC-20260422-0002", customerId: "c8", date: "2026-04-22 08:15",
    items: [{ name: "Felix Felicis (Vial)", qty: 2, price: 150.00 }, { name: "Butterbeer (Draft)", qty: 2, price: 8.00 }],
    subtotal: 316.00, tax: 23.70, total: 339.70, paymentMethod: "Card" },
  { id: "RC-20260419-0015", customerId: "c8", date: "2026-04-19 19:40",
    items: [{ name: "Chocolate Frogs", qty: 10, price: 6.50 }, { name: "Sugar Quills", qty: 12, price: 2.50 }],
    subtotal: 95.00, tax: 7.13, total: 102.13, paymentMethod: "Mobile Money" },
  { id: "RC-20260413-0033", customerId: "c8", date: "2026-04-13 13:25",
    items: [{ name: "Cauldron Cakes", qty: 5, price: 7.00 }, { name: "Pumpkin Pasties", qty: 4, price: 5.50 }, { name: "Every Flavour Beans", qty: 6, price: 4.00 }],
    subtotal: 81.50, tax: 6.11, total: 87.61, paymentMethod: "Cash" },
];
