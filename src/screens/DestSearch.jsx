import React, { useState, useEffect, useRef } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { claude } from "../utils/claude";
import { Card, H2, Pill, Tag, AIBadge, Tile, Spinner, Dots, FInput, ProgressBar } from "../components/shared";

export function DestSearch({value,onChange}){
  const POPULAR=["Bali, Indonesia","Tokyo, Japan","Paris, France","New York, USA","London, UK","Sydney, Australia","Maldives","Santorini, Greece","Dubai, UAE","Barcelona, Spain","Singapore","Phuket, Thailand","Rome, Italy","Bora Bora, French Polynesia","Cape Town, South Africa","Queenstown, New Zealand","Amalfi Coast, Italy","Kyoto, Japan","Hawaii, USA","Cancun, Mexico","Lisbon, Portugal","Amsterdam, Netherlands","Vienna, Austria","Prague, Czech Republic","Istanbul, Turkey","Bangkok, Thailand","Marrakech, Morocco","Petra, Jordan","Machu Picchu, Peru","Rio de Janeiro, Brazil","Buenos Aires, Argentina","Mexico City, Mexico","Toronto, Canada","Vancouver, Canada","Montreal, Canada","Edinburgh, Scotland","Dublin, Ireland","Athens, Greece","Mykonos, Greece","Florence, Italy","Venice, Italy","Budapest, Hungary","Dubrovnik, Croatia","Reykjavik, Iceland","Copenhagen, Denmark","Stockholm, Sweden","Oslo, Norway","Helsinki, Finland","Zurich, Switzerland","Porto, Portugal","Madrid, Spain","Cairo, Egypt","Nairobi, Kenya","Zanzibar, Tanzania","Mumbai, India","Delhi, India","Goa, India","Ho Chi Minh City, Vietnam","Hanoi, Vietnam","Siem Reap, Cambodia","Kuala Lumpur, Malaysia","Jakarta, Indonesia","Manila, Philippines","Taipei, Taiwan","Seoul, South Korea","Shanghai, China","Beijing, China","Hong Kong","Osaka, Japan","Auckland, New Zealand","Fiji","Los Angeles, USA","San Francisco, USA","Las Vegas, USA","Miami, USA","Chicago, USA","Orlando, USA","Seattle, USA","Tulum, Mexico","Cartagena, Colombia","Lima, Peru","Santiago, Chile","Sao Paulo, Brazil","Munich, Germany","Berlin, Germany","Krakow, Poland","Budapest, Hungary","Tbilisi, Georgia","Muscat, Oman","Doha, Qatar","Abu Dhabi, UAE","Tel Aviv, Israel","Addis Ababa, Ethiopia","Kigali, Rwanda","Johannesburg, South Africa","Perth, Australia","Melbourne, Australia","Brisbane, Australia","Cairns, Australia"];
  const [suggestions,setSuggestions]=useState([]);
  const [open,setOpen]=useState(false);
  const handleChange=(val)=>{
    onChange(val);
    if(val.length>1){
      const filtered=POPULAR.filter(d=>d.toLowerCase().includes(val.toLowerCase())).slice(0,6);
      setSuggestions(filtered);setOpen(filtered.length>0);
    } else {setSuggestions([]);setOpen(false);}
  };
  return(
    <div style={{position:"relative"}}>
      <input value={value} onChange={e=>handleChange(e.target.value)} onFocus={()=>value.length>1&&setOpen(true)} placeholder="e.g. Bali, Indonesia" style={{width:"100%",fontFamily:FB,fontSize:15,padding:"12px 14px",borderRadius:12,border:`1.5px solid ${open?T.gold:T.linen}`,color:T.esp,background:"#fff"}}/>
      {open&&suggestions.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",borderRadius:12,border:`1.5px solid ${T.gold}`,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:100,overflow:"hidden",marginTop:4}}>
        {suggestions.map((s,i)=>(
          <div key={i} onClick={()=>{onChange(s);setSuggestions([]);setOpen(false);}} style={{padding:"11px 14px",fontFamily:FB,fontSize:13,color:T.esp,cursor:"pointer",borderBottom:i<suggestions.length-1?`1px solid ${T.linen}`:"none",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:16}}>✈️</span><span>{s}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}
