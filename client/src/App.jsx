import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Hotels from "./pages/Hotels";
import Rooms from "./pages/Rooms";
import HotelDetails from "./pages/HotelDetails";
import RoomDetails from "./pages/RoomDetails";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import HotelReg from "./components/HotelReg";
import Navbar from "./components/Navbar";
import OwnerLayout from "./pages/hotelOwner/Layout";
import Dashboard from "./pages/hotelOwner/Dashboard";
import AddRoom from "./pages/hotelOwner/AddRoom";
import ListRoom from "./pages/hotelOwner/ListRoom";
import EditRoom from "./pages/hotelOwner/EditRoom";
import ManageHotel from "./pages/hotelOwner/ManageHotel";
import OwnerBookings from "./pages/hotelOwner/OwnerBookings";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";
import { useAppContext } from "./context/AppContext";

const App=()=>{const {showHotelReg}=useAppContext();return <>
<Toaster position="top-right"/>
{showHotelReg&&<HotelReg/>}
<Navbar/>
<Routes>
<Route path="/" element={<Home/>}/><Route path="/hotels" element={<Hotels/>}/><Route path="/rooms" element={<Rooms/>}/><Route path="/hotels/:id" element={<HotelDetails/>}/><Route path="/rooms/:id" element={<RoomDetails/>}/><Route path="/my-bookings" element={<MyBookings/>}/><Route path="/profile" element={<Profile/>}/>
<Route path="/owner" element={<OwnerLayout/>}><Route index element={<Dashboard/>}/><Route path="dashboard" element={<Dashboard/>}/><Route path="add-room" element={<AddRoom/>}/><Route path="list-room" element={<ListRoom/>}/><Route path="edit-room/:id" element={<EditRoom/>}/><Route path="hotel" element={<ManageHotel/>}/><Route path="bookings" element={<OwnerBookings/>}/></Route>
<Route path="*" element={<NotFound/>}/>
</Routes>
<Footer/>
</>};
export default App;
