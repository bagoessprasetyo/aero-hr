"use client"

import React from "react"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { useSidebar } from "./sidebar-provider"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SidebarToggle() {
  const { isMobileOpen, toggleMobile } = useSidebar()

  return (
    <SidebarTrigger
      onClick={toggleMobile}
      className="lg:hidden"
      aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isMobileOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isMobileOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </motion.div>
    </SidebarTrigger>
  )
}

export function DesktopSidebarToggle() {
  const { isExpanded, toggleExpanded } = useSidebar()

  return (
    <SidebarTrigger
      onClick={toggleExpanded}
      className="hidden lg:flex"
      aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      <Menu className="h-4 w-4" />
    </SidebarTrigger>
  )
}