// ─── HerNest Core Types ───────────────────────────────────────────

export interface Kid {
  name: string;
  age?: string;
  bday?: string; // "MM/DD" format
}

export interface Person {
  name: string;
  role?: string;
  bday?: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  city: string;
  role: string;
  kids: Kid[];
  partner: string;
  parents: Person[];
  inlaws: Person[];
  siblings?: Person[];
  friends?: Person[];
  priorities: string[];
  tripGoal: string;
  fitnessGoal: string;
  savingsGoal: string;
  challenge: string;
  soloParent?: boolean;
  energyPattern?: string;
  fitnessLevel?: string;
  diet?: string;
  dresscode?: string;
  styleVibe?: string;
  favColours?: string[];
  styleBudget?: string;
  clothingSize?: string;
  height?: string;
  bodyShape?: string;
  _onboardingStep?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  allDay: boolean;
}

export interface Task {
  text: string;
  tag: "Work" | "Family" | "Me" | "Home" | "Travel" | "School";
  priority: "high" | "medium" | "low";
  done?: boolean;
  dueDay?: number;
}

export interface Expense {
  id: number;
  cat: string;
  amount: number;
  note: string;
  date: string;
}

export interface BudgetCategory {
  lb: string;
  spent: number;
  budget: number;
  c: string;
}

export interface SavingsGoal {
  name: string;
  target: number;
  saved: number;
}

export interface WellnessMood {
  weekStart: string;
  value: number;
  label: string;
}

export interface WeeklyScore {
  score: number;
  headline: string;
  wins: string[];
  focus: string;
  affirmation: string;
  weekStart: string;
  generatedAt: string;
}

export interface MemoryFact {
  id: string;
  fact: string;
  type: "dietary" | "medical" | "family" | "preference" | "goal" | "schedule" | "event" | "temporary";
  confidence: number;
  createdAt: string;
  expiresAt: string | null;
  useCount: number;
  source?: string;
  updatedAt?: string;
}

export interface AppContext {
  wellness?: {
    isStruggling?: boolean;
    isThriving?: boolean;
    sleepDebt?: boolean;
    habitsDone?: number;
  };
  calendar?: {
    eventsToday?: CalendarEvent[];
  };
  tasks?: {
    todayCount?: number;
    urgentCount?: number;
  };
  budget?: {
    savingsGoal?: SavingsGoal;
  };
  trips?: {
    nextTrip?: { dest?: string; destination?: string };
    daysUntilNext?: number;
    estimatedCost?: number;
  };
  school?: {
    hasParentMeeting?: boolean;
    events?: unknown[];
  };
  time?: {
    isWeekend?: boolean;
  };
  soloParent?: boolean;
}

export interface ClaudeError {
  error: true;
  code: string;
  message?: string;
}

export type ClaudeResponse = string | ClaudeError;
