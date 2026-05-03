import React from "react";
import { T, FD, FB } from "../constants/theme";

class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){return{hasError:true,error};}
  componentDidCatch(error,info){console.error("HerNest screen error:",error,info);}
  render(){
    if(this.state.hasError){
      return(
        <div style={{padding:"24px 20px",textAlign:"center",background:"#FAF6EF",borderRadius:20,margin:"12px 0"}}>
          <div style={{fontSize:36,marginBottom:12}}>✦</div>
          <p style={{fontFamily:"'Cormorant Garamond','Georgia',serif",fontStyle:"italic",fontSize:18,color:"#2E1F14",margin:"0 0 8px"}}>Something went quiet</p>
          <p style={{fontFamily:"'DM Sans','Helvetica Neue',sans-serif",fontSize:13,color:"#B8A898",margin:"0 0 16px"}}>Nora hit a snag. Tap below to try again.</p>
          <button onClick={()=>this.setState({hasError:false,error:null})} style={{background:"#2E1F14",color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontFamily:"'DM Sans','Helvetica Neue',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
