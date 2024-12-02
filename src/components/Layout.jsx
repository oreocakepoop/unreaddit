import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, 
  HashtagIcon, 
  BellIcon, 
  UserIcon, 
  SwatchIcon, 
  SunIcon, 
  MoonIcon, 
  SparklesIcon, 
  BeakerIcon, 
  HeartIcon, 
  RocketLaunchIcon, 
  ComputerDesktopIcon, 
  PaintBrushIcon, 
  CloudIcon, 
  FireIcon, 
  GlobeAsiaAustraliaIcon,
  WrenchScrewdriverIcon, 
  CommandLineIcon, 
  CakeIcon, 
  BoltIcon, 
  StarIcon,
  CodeBracketIcon,
  BuildingOfficeIcon,
  MusicalNoteIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  CubeTransparentIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  BookmarkIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  UsersIcon,
  UserGroupIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import SimpleBrandLogo from './SimpleBrandLogo';
import { subscribeToStats } from '../services/statsService';
import { getPostsCount } from '../services/postService';
import CountUp from './CountUp';
import NotificationCenter from './NotificationCenter';

const navItems = [
  { icon: HomeIcon, label: 'Home', path: '/' },
  { icon: HashtagIcon, label: 'Explore', path: '/explore' },
  { icon: BellIcon, label: 'Notifications', path: '/notifications' },
  { icon: UserIcon, label: 'Profile', path: '/profile' },
];

const themeInfo = {
  light: { icon: SunIcon, color: 'text-yellow-500' },
  dark: { icon: MoonIcon, color: 'text-slate-800' },
  cupcake: { icon: CakeIcon, color: 'text-pink-300' },
  bumblebee: { icon: BoltIcon, color: 'text-yellow-400' },
  emerald: { icon: SparklesIcon, color: 'text-emerald-500' },
  corporate: { icon: BuildingOfficeIcon, color: 'text-blue-800' },
  synthwave: { icon: MusicalNoteIcon, color: 'text-purple-500' },
  retro: { icon: ComputerDesktopIcon, color: 'text-amber-500' },
  cyberpunk: { icon: RocketLaunchIcon, color: 'text-yellow-400' },
  valentine: { icon: HeartIcon, color: 'text-pink-500' },
  halloween: { icon: FireIcon, color: 'text-orange-500' },
  garden: { icon: CloudIcon, color: 'text-green-500' },
  forest: { icon: GlobeAsiaAustraliaIcon, color: 'text-green-700' },
  aqua: { icon: BeakerIcon, color: 'text-cyan-500' },
  lofi: { icon: PaintBrushIcon, color: 'text-gray-600' },
  pastel: { icon: SwatchIcon, color: 'text-pink-200' },
  fantasy: { icon: StarIcon, color: 'text-purple-400' },
  wireframe: { icon: CodeBracketIcon, color: 'text-gray-700' },
  black: { icon: MoonIcon, color: 'text-gray-900' },
  luxury: { icon: StarIcon, color: 'text-yellow-600' },
  dracula: { icon: FireIcon, color: 'text-purple-600' },
  cmyk: { icon: CubeTransparentIcon, color: 'text-blue-400' },
  autumn: { icon: GlobeAsiaAustraliaIcon, color: 'text-orange-500' },
  business: { icon: BuildingOfficeIcon, color: 'text-gray-700' },
  acid: { icon: BeakerIcon, color: 'text-green-400' },
  lemonade: { icon: CloudIcon, color: 'text-yellow-200' },
  night: { icon: MoonIcon, color: 'text-indigo-500' },
  coffee: { icon: FireIcon, color: 'text-amber-700' },
  winter: { icon: CloudIcon, color: 'text-blue-200' },
  dim: { icon: MoonIcon, color: 'text-gray-400' },
  nord: { icon: CloudIcon, color: 'text-blue-300' }
};

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3); // Example count
  const [stats, setStats] = useState({
    posts: { total: 0, monthly: 0, percentage: 0, trend: 'neutral' },
    users: { total: 0, monthly: 0, percentage: 0, trend: 'neutral' },
    active: { total: 0, percentage: 0, trend: 'neutral' }
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Add keyboard shortcut for search
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "/" && e.target.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    console.log('Setting up stats subscription...');
    const unsubscribe = subscribeToStats((statsData) => {
      console.log('Received real-time stats update:', statsData);
      if (statsData) {
        // Ensure all numbers are valid
        const validatedStats = {
          posts: {
            total: Number(statsData.posts?.total) || 0,
            monthly: Number(statsData.posts?.monthly) || 0,
            percentage: Number(statsData.posts?.percentage) || 0,
            trend: statsData.posts?.trend || 'neutral'
          },
          users: {
            total: Number(statsData.users?.total) || 0,
            monthly: Number(statsData.users?.monthly) || 0,
            percentage: Number(statsData.users?.percentage) || 0,
            trend: statsData.users?.trend || 'neutral'
          },
          active: {
            total: Number(statsData.active?.total) || 0,
            percentage: Number(statsData.active?.percentage) || 0,
            trend: statsData.active?.trend || 'neutral'
          }
        };
        console.log('Validated stats:', validatedStats);
        setStats(validatedStats);
        setIsLoadingStats(false);
      }
    });

    return () => {
      console.log('Cleaning up stats subscription...');
      unsubscribe();
    };
  }, []);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  // Navbar item animation variants
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const ThemeSelector = () => {
    const [isOpen, setIsOpen] = useState(false);

    const container = {
      hidden: { 
        opacity: 0,
        scale: 0.95,
        transition: {
          scale: { duration: 0.2 },
          opacity: { duration: 0.2 }
        }
      },
      show: {
        opacity: 1,
        scale: 1,
        transition: {
          scale: { duration: 0.2 },
          opacity: { duration: 0.2 },
          staggerChildren: 0.02
        }
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
          scale: { duration: 0.2 },
          opacity: { duration: 0.2 }
        }
      }
    };

    const item = {
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 10 }
    };

    return (
      <div className="dropdown dropdown-end">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          tabIndex={0}
          role="button"
          className="btn btn-ghost btn-circle"
          onClick={() => setIsOpen(!isOpen)}
        >
          {themeInfo[theme]?.icon && (
            <div className={themeInfo[theme].color}>
              {React.createElement(themeInfo[theme].icon, {
                className: "w-5 h-5"
              })}
            </div>
          )}
        </motion.div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              tabIndex={0}
              initial="hidden"
              animate="show"
              exit="exit"
              variants={container}
              className="dropdown-content z-[1] shadow-lg bg-base-200 rounded-box fixed mt-2"
              style={{ width: "250px", right: "0" }}
            >
              <div className="h-96 overflow-y-auto overflow-x-hidden">
                <motion.ul className="menu menu-sm p-2">
                  {Object.entries(themeInfo).map(([themeName, { icon: Icon, color }]) => (
                    <motion.li 
                      key={themeName} 
                      variants={item}
                      className="w-full"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setTheme(themeName);
                          setIsOpen(false);
                        }}
                        className={`flex items-center gap-2 capitalize w-full ${theme === themeName ? 'active bg-base-300' : ''}`}
                      >
                        <div className={color}>
                          {React.createElement(Icon, {
                            className: "w-4 h-4"
                          })}
                        </div>
                        <span className="flex-1 text-left">{themeName}</span>
                      </motion.button>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const SearchBar = () => (
    <div className="relative w-full max-w-md">
      <motion.div 
        className={`relative flex items-center ${searchFocused ? 'w-full' : 'w-48'}`}
        animate={{ width: searchFocused ? "100%" : "12rem" }}
        transition={{ duration: 0.2 }}
      >
        <input
          id="search-input"
          type="text"
          placeholder="Search Unreddit... /"
          className="input input-bordered w-full pr-10"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 text-base-content/50" />
      </motion.div>
    </div>
  );

  const NotificationsDropdown = () => (
    <div className="dropdown dropdown-end">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="btn btn-ghost btn-circle"
      >
        <div className="indicator">
          <BellIcon className="w-5 h-5" />
          {notificationCount > 0 && (
            <motion.span 
              className="badge badge-sm badge-primary indicator-item"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {notificationCount}
            </motion.span>
          )}
        </div>
      </motion.div>
      <div className="dropdown-content z-[1] menu shadow-lg bg-base-200 rounded-box w-80">
        <div className="px-4 py-3 text-sm border-b border-base-300">
          <div className="font-semibold">Notifications</div>
        </div>
        <div className="px-2 py-2">
          <motion.a
            className="flex items-start gap-3 p-3 hover:bg-base-300 rounded-lg"
            whileHover={{ x: 4 }}
          >
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img src="https://i.pravatar.cc/100" alt="User avatar" />
              </div>
            </div>
            <div>
              <p className="font-medium">John Doe liked your post</p>
              <p className="text-sm text-base-content/60">2 minutes ago</p>
            </div>
          </motion.a>
        </div>
      </div>
    </div>
  );

  const UserDropdown = () => {
    const handleSignOut = async () => {
      try {
        const result = await logout();
        if (result.success) {
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to sign out:', error);
      }
    };

    return (
      <div className="dropdown dropdown-end">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="btn btn-ghost btn-circle avatar"
        >
          <div className="w-10 rounded-full">
            <img 
              src={currentUser?.photoURL || `https://api.dicebear.com/6.x/avataaars/svg?seed=${currentUser?.email}`} 
              alt="User avatar" 
            />
          </div>
        </motion.div>
        <div className="dropdown-content z-[1] menu shadow-lg bg-base-200 rounded-box w-52">
          <div className="px-4 py-3 text-sm border-b border-base-300">
            <div className="font-semibold">{currentUser?.displayName || 'Anonymous User'}</div>
            <div className="text-base-content/60">{currentUser?.email}</div>
          </div>
          <ul className="menu menu-sm">
            <li>
              <Link to="/profile" className="flex items-center gap-3 py-3">
                <UserIcon className="w-4 h-4" />
                Profile
              </Link>
            </li>
            <li>
              <Link to="/settings" className="flex items-center gap-3 py-3">
                <Cog6ToothIcon className="w-4 h-4" />
                Settings
              </Link>
            </li>
            <li>
              <Link to="/saved" className="flex items-center gap-3 py-3">
                <BookmarkIcon className="w-4 h-4" />
                Saved Posts
              </Link>
            </li>
            <li>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-3 py-3 text-error"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      
      <div className="drawer-content flex flex-col">
        {/* Navbar - visible on all screens */}
        <div className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-50 border-b border-base-300">
          {/* Mobile menu button */}
          <div className="flex-none lg:hidden">
            <label htmlFor="my-drawer" className="btn btn-square btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </label>
          </div>
          
          {/* Logo - visible on mobile */}
          <div className="flex-1 lg:hidden">
            <Link to="/" className="px-2">
              <SimpleBrandLogo />
            </Link>
          </div>

          {/* Search bar - centered on desktop */}
          <div className="flex-1 px-2 hidden lg:flex justify-center">
            <SearchBar />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <SearchBar />
            {currentUser && <NotificationCenter />}
            <ThemeSelector />
            <UserDropdown />
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="p-4 lg:hidden">
          <SearchBar />
        </div>

        {/* Main content */}
        <main className="flex-1 min-h-screen p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <div className="menu p-4 w-80 min-h-full bg-base-200">
          {/* Logo and theme selector */}
          <div className="flex justify-between items-center mb-8">
            <Link to="/" className="px-2">
              <SimpleBrandLogo />
            </Link>
          </div>
          
          {/* Navigation items */}
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <motion.li
                key={item.path}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-base-300 transition-colors ${
                    location.pathname === item.path ? 'bg-primary text-primary-content' : ''
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span>{item.label}</span>
                </Link>
              </motion.li>
            ))}
          </ul>

          {/* Stats Card */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="stats stats-vertical shadow bg-base-200 w-full">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <DocumentTextIcon className="w-8 h-8" />
                </div>
                <div className="stat-title">Total Posts</div>
                <div className="stat-value">
                  <CountUp value={stats.posts.total} />
                </div>
                <div className="stat-desc flex items-center gap-1">
                  <span>{stats.posts.percentage}% this month</span>
                  {stats.posts.trend === 'up' && <ArrowUpIcon className="w-4 h-4 text-success" />}
                  {stats.posts.trend === 'down' && <ArrowDownIcon className="w-4 h-4 text-error" />}
                  {stats.posts.trend === 'neutral' && <ArrowRightIcon className="w-4 h-4" />}
                </div>
              </div>

              <div className="stat">
                <div className="stat-figure text-secondary">
                  <UsersIcon className="w-8 h-8" />
                </div>
                <div className="stat-title">Total Users</div>
                <div className="stat-value">
                  <CountUp value={stats.users.total} />
                </div>
                <div className="stat-desc flex items-center gap-1">
                  <span>{stats.users.percentage}% active this month</span>
                  {stats.users.trend === 'up' && <ArrowUpIcon className="w-4 h-4 text-success" />}
                  {stats.users.trend === 'down' && <ArrowDownIcon className="w-4 h-4 text-error" />}
                  {stats.users.trend === 'neutral' && <ArrowRightIcon className="w-4 h-4" />}
                </div>
              </div>

              <div className="stat">
                <div className="stat-figure text-accent">
                  <UserGroupIcon className="w-8 h-8" />
                </div>
                <div className="stat-title">Currently Active</div>
                <div className="stat-value">
                  <CountUp value={stats.active.total} />
                </div>
                <div className="stat-desc flex items-center gap-1">
                  <span>{stats.active.percentage}% of users</span>
                  {stats.active.trend === 'up' && <ArrowUpIcon className="w-4 h-4 text-success" />}
                  {stats.active.trend === 'down' && <ArrowDownIcon className="w-4 h-4 text-error" />}
                  {stats.active.trend === 'neutral' && <ArrowRightIcon className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
