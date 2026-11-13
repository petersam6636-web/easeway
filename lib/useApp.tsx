import { useContext } from "react";
import { appcontext } from "./appContext";
export default function useApp(){
    const context = useContext(appcontext);
    if(!context) throw new Error('Content not found');
    return context
}