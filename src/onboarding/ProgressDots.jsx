import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function ProgressDots({total,current}){return <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:28}}>{Array.from({length:total},(_,i)=><div key={i} style={{height:4,borderRadius:4,transition:"all .3s",background:i===current?T.gold:i<current?T.sage:T.linen,width:i===current?24:8}}/>)}</div>;}
