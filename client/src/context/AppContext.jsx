import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
const AppContext=createContext();
const symbol=code=>{try{return new Intl.NumberFormat(undefined,{style:"currency",currency:code}).formatToParts(0).find(p=>p.type==="currency")?.value||code.toUpperCase()}catch{return code.toUpperCase()}};

export function AppProvider({children}){
 const navigate=useNavigate(),{user}=useUser(),{getToken}=useAuth();
 const [currencyCode,setCurrencyCode]=useState("usd"),[isOwner,setIsOwner]=useState(false),[showHotelReg,setShowHotelReg]=useState(false),[searchedCities,setSearchedCities]=useState([]),[rooms,setRooms]=useState([]),[hotel,setHotel]=useState(null),[profile,setProfile]=useState(null);
 const authHeaders=async()=>({headers:{Authorization:`Bearer ${await getToken()}`}});
 const fetchUser=async()=>{try{const {data}=await axios.get("/api/user",await authHeaders());if(data.success){setIsOwner(data.role==="hotelOwner");setSearchedCities(data.recentSearchedCities||[]);setProfile({username:data.username,email:data.email,image:data.image})} }catch(e){if(e.response?.status!==404) console.warn(e.message)}};
 const fetchConfig=async()=>{try{const {data}=await axios.get("/api/config");if(data.currency)setCurrencyCode(data.currency)}catch{}};
 const fetchRooms=async()=>{try{const {data}=await axios.get("/api/rooms");if(data.success)setRooms(data.rooms)}catch(e){console.warn(e.message)}};
 const fetchHotel=async()=>{try{const {data}=await axios.get("/api/hotels/owner/me",await authHeaders());if(data.success)setHotel(data.hotel)}catch{}};
 useEffect(()=>{fetchConfig();fetchRooms()},[]);
 useEffect(()=>{if(user){fetchUser();fetchHotel()}else{setIsOwner(false);setHotel(null);setProfile(null)}},[user]);
 return <AppContext.Provider value={{currency:symbol(currencyCode),currencyCode,navigate,user,getToken,authHeaders,isOwner,setIsOwner,showHotelReg,setShowHotelReg,searchedCities,setSearchedCities,rooms,setRooms,fetchRooms,hotel,setHotel,fetchHotel,profile,setProfile,axios}}>{children}</AppContext.Provider>
}
export const useAppContext=()=>useContext(AppContext);
