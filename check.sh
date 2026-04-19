#!/bin/bash
echo "Checking App.jsx for known issues..."
cd ~/Documents/GitHub/HerNest

ISSUES=0

if grep -q "onAuthStateChanged(auth,async" src/App.jsx; then
  echo "❌ async in onAuthStateChanged"
  ISSUES=$((ISSUES+1))
fi

if grep -q "await loadProfile\|await signInWithPopup" src/App.jsx; then
  echo "❌ await in auth flow"
  ISSUES=$((ISSUES+1))
fi

if grep -q "eval(" src/App.jsx; then
  echo "❌ eval() found"
  ISSUES=$((ISSUES+1))
fi

python3 -c "
import re
c = open('src/App.jsx').read()
used = set(re.findall(r'Ic\.(\w+)', c))
defined = set(re.findall(r'  (\w+):\s*p=><svg', c))
missing = used - defined
if missing: print('❌ Missing icons:', missing)
"

if [ $ISSUES -eq 0 ]; then
  echo "✅ All checks passed"
fi
