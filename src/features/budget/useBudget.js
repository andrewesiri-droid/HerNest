import { useState, useEffect } from "react";
import { saveData, loadData } from "../../utils/firebase";
import { Ic } from "../../constants/icons.jsx";
import { T } from "../../constants/theme";

export const CAT_META = {
  Groceries:     {IC:Ic.Bag,     c:T.sage,  budget:700},
  Kids:          {IC:Ic.Kids,    c:T.sky,   budget:400},
  Fitness:       {IC:Ic.Dumbbell,c:T.blush, budget:120},
  Travel:        {IC:Ic.Suitcase,c:T.teal,  budget:2000},
  Shopping:      {IC:Ic.Hanger,  c:T.lav,   budget:500},
  Dining:        {IC:Ic.Fork,    c:T.gold,  budget:300},
  Health:        {IC:Ic.Leaf,    c:T.sage,  budget:200},
  Transport:     {IC:Ic.Compass, c:T.sky,   budget:300},
  Entertainment: {IC:Ic.Star,    c:T.lav,   budget:200},
  Bills:         {IC:Ic.Budget,  c:T.bark,  budget:1000},
  Other:         {IC:Ic.Bag,     c:T.taupe, budget:200},
};

export const DEFAULT_CATS = [
  {lb:"Groceries",spent:0,budget:700, IC:Ic.Bag,     c:T.sage},
  {lb:"Kids",     spent:0,budget:400, IC:Ic.Kids,    c:T.sky},
  {lb:"Fitness",  spent:0,budget:120, IC:Ic.Dumbbell,c:T.blush},
  {lb:"Travel",   spent:0,budget:2000,IC:Ic.Suitcase,c:T.teal},
  {lb:"Shopping", spent:0,budget:500, IC:Ic.Hanger,  c:T.lav},
  {lb:"Dining",   spent:0,budget:300, IC:Ic.Fork,    c:T.gold},
];

export function useBudget(uid) {
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [categories, setCategories]       = useState(() => {
    try {
      const s = localStorage.getItem("hn_budget_cats");
      if (s) { const saved = JSON.parse(s); return saved.map(c => ({...c, IC:CAT_META[c.lb]?.IC||Ic.Bag})); }
    } catch (e) {}
    return DEFAULT_CATS;
  });
  const [expenses, setExpenses]           = useState([]);
  const [savingsGoal, setSavingsGoal]     = useState({name:"",target:0,saved:0});
  const [monthHistory, setMonthHistory]   = useState(() => {
    try { const s = localStorage.getItem("hn_month_history"); return s ? JSON.parse(s) : []; } catch (e) { return []; }
  });

  // Load from Firestore — source of truth
  useEffect(() => {
    if (!uid) { setBudgetLoading(false); return; }
    loadData(uid, "budget").then(d => {
      if (d?.expenses)   setExpenses(d.expenses);
      if (d?.categories) setCategories(d.categories.map(c => ({...c, IC:Ic[c.ICname]||Ic.Bag})));
      else               setCategories(DEFAULT_CATS);
      if (d?.savingsGoal) setSavingsGoal(d.savingsGoal);
      try { if (d?.expenses)   localStorage.setItem("hn_expenses",   JSON.stringify(d.expenses)); }   catch (e) {}
      try { if (d?.categories) localStorage.setItem("hn_budget_cats", JSON.stringify(d.categories)); } catch (e) {}
    }).catch(() => {}).finally(() => setBudgetLoading(false));
  }, [uid]);

  // Save to Firestore on change
  useEffect(() => {
    try { localStorage.setItem("hn_expenses",   JSON.stringify(expenses)); }   catch (e) {}
    try { localStorage.setItem("hn_budget_cats", JSON.stringify(categories.map(c => ({lb:c.lb,spent:c.spent,budget:c.budget,c:c.c})))); } catch (e) {}
    if (uid) saveData(uid, "budget", {
      expenses,
      categories: categories.map(c => ({...c, ICname:Object.keys(Ic).find(k=>Ic[k]===c.IC)||"Bag"})),
      savingsGoal,
    }).catch(() => {});
  }, [expenses, categories, savingsGoal, uid]);

  const totalBudget = categories.reduce((a, c) => a + c.budget, 0);
  const totalSpent  = categories.reduce((a, c) => a + c.spent,  0);

  const ensureCategory = (catName) => {
    setCategories(p => {
      if (p.find(c => c.lb === catName)) return p;
      const meta = CAT_META[catName] || {IC:Ic.Bag, c:T.taupe, budget:200};
      return [...p, {lb:catName, spent:0, budget:meta.budget, IC:meta.IC, c:meta.c}];
    });
  };

  const addExpense = (exp) => {
    setExpenses(p => [exp, ...p]);
    setCategories(p => p.map(c => c.lb === exp.cat ? {...c, spent: c.spent + exp.amount} : c));
  };

  const saveMonthSnapshot = () => {
    const month = new Date().toLocaleDateString("en-US", {month:"short",year:"numeric"});
    const snapshot = {month, categories:categories.map(c=>({lb:c.lb,spent:c.spent,budget:c.budget})), totalSpent, totalBudget};
    setMonthHistory(p => {
      const updated = [snapshot, ...p.filter(m => m.month !== month)].slice(0, 6);
      try { localStorage.setItem("hn_month_history", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  return {
    budgetLoading, categories, setCategories, expenses, setExpenses,
    savingsGoal, setSavingsGoal, monthHistory, totalBudget, totalSpent,
    ensureCategory, addExpense, saveMonthSnapshot,
  };
}
