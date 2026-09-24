import { Link } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

const OwnerNavbar = () => {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 md:px-8">
      <Link to="/">
        <span className="text-xl font-semibold text-gray-800">QuickStay</span>
      </Link>
      <UserButton />
    </div>
  );
};

export default OwnerNavbar;
