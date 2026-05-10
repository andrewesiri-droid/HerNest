import React from "react";
export function Step4({data, onChange, onFinish, onNext, onBack}) {
  const done = onFinish || onNext;
  React.useEffect(()=>{ if(done) done(); }, []);
  return null;
}
