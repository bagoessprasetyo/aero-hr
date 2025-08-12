"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useSidebar } from "./sidebar-provider"
import {
  Sidebar as SidebarPrimitive,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
  SidebarNavGroup,
  SidebarNavGroupTitle,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  Users,
  Calculator,
  Receipt,
  Building,
  Settings,
  Home,
  BarChart3,
  FileText,
  HelpCircle,
  LogOut,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"

// Navigation items configuration
const navigationItems = [
  {
    id: 'main',
    title: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
      { id: 'employees', label: 'Employees', icon: Users, href: '/employees' },
      { id: 'payroll', label: 'Payroll', icon: Calculator, href: '/payroll' },
    ]
  },
  {
    id: 'management',
    title: 'Management',
    items: [
      { id: 'bulk-operations', label: 'Bulk Operations', icon: Receipt, href: '/bulk-operations' },
      { id: 'admin', label: 'Admin', icon: Settings, href: '/admin' },
      { id: 'tax', label: 'Tax Reports', icon: FileText, href: '/tax' },
    ]
  },
  {
    id: 'insights',
    title: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    ]
  }
]

// User profile dropdown component for sidebar
interface SidebarUserProfileProps {
  isExpanded: boolean
  user?: {
    name: string
    email: string
    avatar: string
    initials: string
    role: string
  }
  onAction?: (action: string) => void
}

const SidebarUserProfile: React.FC<SidebarUserProfileProps> = ({
  isExpanded,
  user = {
    name: "HR Admin",
    email: "admin@aero-hr.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    initials: "A",
    role: "Admin"
  },
  onAction = () => {}
}) => {
  if (!isExpanded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center p-2">
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="p-3">
            <div className="space-y-1">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="text-xs">{user.role}</Badge>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors w-full text-left"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Avatar className="h-8 w-8 border-2 border-primary/20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.role}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-2" align="end" side="top">
        <div className="flex items-center gap-3 p-3 mb-2 bg-accent/50 rounded-lg">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              {user.role}
            </Badge>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAction('profile')} className="cursor-pointer">
            <Users className="h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('settings')} className="cursor-pointer">
            <Settings className="h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('notifications')} className="cursor-pointer">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAction('help')} className="cursor-pointer">
            <HelpCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={() => onAction('logout')} 
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Navigation item component
interface NavItemProps {
  item: {
    id: string
    label: string
    icon: React.ComponentType<any>
    href: string
  }
  isActive: boolean
  isExpanded: boolean
  onClick?: () => void
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, isExpanded, onClick }) => {
  const Icon = item.icon

  if (!isExpanded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarNavItem
              asChild
              variant={isActive ? "active" : "default"}
              className="justify-center w-full"
              onClick={onClick}
            >
              <Link href={item.href}>
                <Icon className="h-5 w-5" />
              </Link>
            </SidebarNavItem>
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <SidebarNavItem
      asChild
      variant={isActive ? "active" : "default"}
      className="w-full justify-start"
      onClick={onClick}
    >
      <Link href={item.href}>
        <Icon className="h-5 w-5" />
        <span>{item.label}</span>
      </Link>
    </SidebarNavItem>
  )
}

// Main sidebar component
export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { isExpanded, isMobileOpen, toggleExpanded, setMobileOpen } = useSidebar()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleUserAction = (action: string) => {
    if (action === 'logout') {
      handleSignOut()
    } else {
      console.log('User action:', action)
    }
  }

  const handleItemClick = () => {
    // Close mobile sidebar when navigating
    if (isMobileOpen) {
      setMobileOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isExpanded ? 256 : 64,
          x: 0, // Always show on desktop, mobile positioning handled by CSS classes
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-background border-r border-border lg:relative",
          // Mobile: hidden by default, shown when isMobileOpen is true
          "translate-x-[-100%] lg:translate-x-0",
          isMobileOpen && "translate-x-0"
        )}
      >
        <SidebarPrimitive className="h-full" size={isExpanded ? "default" : "icon"}>
          {/* Header */}
          <SidebarHeader className={cn("relative", !isExpanded && "px-3 py-4")}>
            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-2 h-6 w-6 rounded-md hover:bg-accent flex items-center justify-center lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Logo and Brand */}
            <div className={cn(
              "flex items-center gap-3",
              !isExpanded && "justify-center"
            )}>
              <Link href="/dashboard" className="flex items-center gap-3" onClick={handleItemClick}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  HR
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div>
                        <h1 className="text-lg font-semibold text-foreground whitespace-nowrap">Aero HR</h1>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">Human Resources</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </div>

            {/* Desktop Toggle Button */}
            <motion.button
              onClick={toggleExpanded}
              className={cn(
                "absolute -right-3 top-6 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background hover:bg-accent transition-colors",
                !isExpanded && "right-2 top-4"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isExpanded ? (
                <ChevronLeft className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </motion.button>
          </SidebarHeader>

          {/* Navigation Content */}
          <SidebarContent className={cn(!isExpanded && "px-2")}>
            <SidebarNav>
              {navigationItems.map((group) => (
                <SidebarNavGroup key={group.id}>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SidebarNavGroupTitle>{group.title}</SidebarNavGroupTitle>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavItem
                        key={item.id}
                        item={item}
                        isActive={pathname?.startsWith(item.href) || false}
                        isExpanded={isExpanded}
                        onClick={handleItemClick}
                      />
                    ))}
                  </div>
                </SidebarNavGroup>
              ))}
            </SidebarNav>
          </SidebarContent>

          {/* User Profile Footer */}
          <SidebarFooter className={cn(!isExpanded && "px-2 py-3")}>
            <SidebarUserProfile 
              isExpanded={isExpanded} 
              onAction={handleUserAction}
            />
          </SidebarFooter>
        </SidebarPrimitive>
      </motion.aside>
    </>
  )
}