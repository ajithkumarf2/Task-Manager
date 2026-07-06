import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { assets } from "../assets/assets";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function UserDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="flex items-center focus:outline-none">
                <img src={assets.profile_img_a} alt="User Avatar" className="size-7 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded shadow-lg top-full right-0 mt-2">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user?.name || "User Name"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                            {user?.email || "user@example.com"}
                        </p>
                    </div>


                    <div className="p-2">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-left">
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserDropdown;
