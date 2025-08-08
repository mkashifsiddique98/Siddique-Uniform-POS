"use client"
import { useEffect } from "react";
import { toggleFullScreen } from "./screenUtils";

const Fullscreen: React.FC = () => {
    useEffect(() => {
      toggleFullScreen();
      
    }, []);
  
    return null;
  };
  
  export default Fullscreen;