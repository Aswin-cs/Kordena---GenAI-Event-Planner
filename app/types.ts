export interface BudgetItem {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  notes: string;
  iconName?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  category: "Venue" | "Catering" | "Guests" | "Program" | "Decor";
  deadline: string;
  completed: boolean;
  priority: "High" | "Medium" | "Low";
  assignee?: string;
}

export interface CalendarAlert {
  id: string;
  title: string;
  date: string;
  daysRemaining: number;
  severity: "urgent" | "upcoming" | "scheduled";
  description: string;
  completed: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  priceTier: "$$" | "$$$" | "$$$$";
  contactPerson: string;
  email: string;
  status: "Shortlisted" | "Contacted" | "Booked";
  aiMatchScore: number;
  notes: string;
}

export interface TimelineScheduleItem {
  id: string;
  time: string;
  title: string;
  duration: string;
  responsible: string;
  status: "Pending" | "In-Progress" | "Completed";
}

export interface EventPlan {
  id: string;
  title: string;
  tagline: string;
  eventType: string;
  date: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  aiVibeSummary: string;
  paletteDescription: string;
  tasks: TaskItem[];
  budget: BudgetItem[];
  alerts: CalendarAlert[];
  vendors: Vendor[];
  schedule: TimelineScheduleItem[];
  aiSuggestions: string[];
}
