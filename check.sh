#!/bin/bash
echo "Checking App.jsx for known issues..."
ISSUES=0

if grep -q "onAuthStateChanged(auth,async" src/App.jsx; then
  echo "❌ async in onAuthStateChanged"
  ISSUES=1
fi

if grep -q "const saved=await loadProfile" src/App.jsx; then
  echo "❌ await loadProfile in auth callback"
  ISSUES=1
fi

if grep -q "eval(" src/App.jsx; then
  echo "❌ eval() found"
  ISSUES=1
fi

python3 -c "
import re
c = open('src/App.jsx').read()
used = set(re.findall(r'Ic\.(\w+)', c))
defined = set(re.findall(r'  (\w+):\s*p=><svg', c))
missing = used - defined
if missing: print('Missing icons:', missing)
"

echo "✅ Done"
