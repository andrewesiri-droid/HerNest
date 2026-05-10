// ─── Screen Registry ─────────────────────────────────────────────
// All screen imports and the screens map live here.
// App.jsx imports { getScreens } and stays clean.

import React from "react";
import { HomeScreen }     from "./HomeScreen";
import { NoraScreen }     from "./NoraScreen";
import { BriefingScreen } from "./BriefingScreen";
import { PlanScreen }     from "./PlanScreen";
import { CalendarScreen } from "./CalendarScreen";
import { TripsScreen }    from "./TripsScreen";
import { BudgetScreen }   from "./BudgetScreen";
import { StyleScreen }    from "./StyleScreen";
import { CircleScreen }   from "./CircleScreen";
import { WellnessScreen } from "./WellnessScreen";
import { ProfileScreen }  from "./ProfileScreen";

class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={hasError:false};}
  static getDerivedStateFromError(){return{hasError:true};}
  componentDidCatch(error,info){console.error("Screen error:",error,info);}
  render(){
    if(this.state.hasError){
      return(
        <div style={{padding:"24px 20px",textAlign:"center",borderRadius:20,margin:"12px 0"}}>
          <p style={{fontSize:18,margin:"0 0 8px"}}>Something went quiet ✦</p>
          <button onClick={()=>this.setState({hasError:false})} style={{background:"#2E1F14",color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",cursor:"pointer"}}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const wrap = (screen, key) => <ErrorBoundary key={key}>{screen}</ErrorBoundary>;

export function getScreens({ setTab, aiTasks, profile, streak, calConnected, connectCalendar, calEvents, appContext, onTasks, uid, onSaveProfile, onSignOut, user }) {
  return {
    home:     wrap(<HomeScreen go={setTab} aiTasks={aiTasks} profile={profile} streak={streak} calConnected={calConnected} connectCalendar={connectCalendar} calEvents={calEvents} appContext={appContext}/>, "home"),
    nora:     wrap(<NoraScreen onTasks={onTasks} profile={profile} calEvents={calEvents} onAddTask={onTasks} uid={uid}/>, "nora"),
    brief:    wrap(<BriefingScreen profile={profile} appContext={appContext}/>, "brief"),
    plan:     wrap(<PlanScreen aiTasks={aiTasks} profile={profile} uid={uid} calEvents={calEvents}/>, "plan"),
    trips:    wrap(<TripsScreen uid={uid} profile={profile}/>, "trips"),
    budget:   wrap(<BudgetScreen uid={uid} appContext={appContext}/>, "budget"),
    style:    wrap(<StyleScreen profile={profile} uid={uid} appContext={appContext}/>, "style"),
    circle:   wrap(<CircleScreen profile={profile} uid={uid} appContext={appContext}/>, "circle"),
    wellness: wrap(<WellnessScreen profile={profile} uid={uid}/>, "wellness"),
    profile:  wrap(<ProfileScreen profile={profile} onChange={(k,v)=>onSaveProfile({...profile,[k]:v})} onSave={onSaveProfile} onSignOut={onSignOut} user={user}/>, "profile"),
  };
}
