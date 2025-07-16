"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import AccountCircle from "@mui/icons-material/AccountCircle"
import NotificationsIcon from "@mui/icons-material/Notifications"
import { useRouter } from "next/router"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { io } from "socket.io-client"

interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: string
}

const Header = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const { data: session } = useSession()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [socket, setSocket] = useState<any>(null)

  useEffect(() => {
    if (session?.user?.email) {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001")
      setSocket(newSocket)

      newSocket.emit("join", session.user.email)

      newSocket.on("notification", (notification: Notification) => {
        setNotifications((prevNotifications) => [notification, ...prevNotifications])
        setUnreadCount((prevCount) => prevCount + 1)
      })

      return () => {
        newSocket.off("notification")
        newSocket.disconnect()
      }
    }
  }, [session?.user?.email])

  useEffect(() => {
    loadHeaderNotifications()
  }, [session])

  const loadHeaderNotifications = async () => {
    if (session?.user?.email) {
      try {
        const response = await fetch(`/api/notifications?email=${session.user.email}`)
        if (response.ok) {
          const data = await response.json()
          setNotifications(data)
          setUnreadCount(data.filter((notification: Notification) => !notification.read).length)
        } else {
          // console.error('Failed to load notifications:', response.status);
        }
      } catch (error) {
        // console.error('Error loading notifications:', error);
      }
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }),
      })

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          ),
        )
        setUnreadCount((prevCount) => prevCount - 1)
      } else {
        // console.error('Failed to mark as read:', response.status);
      }
    } catch (error) {
      // console.error('Error marking as read:', error);
    }
  }

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setMobileMenuAnchorEl(null)
  }

  const handleSignOut = async () => {
    handleClose()
    await signOut({ redirect: false })
    router.push("/")
  }

  const menuId = "primary-search-account-menu"
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={Boolean(anchorEl)}
      onClose={handleClose}
    >
      <MenuItem onClick={handleClose}>Profile</MenuItem>
      <MenuItem onClick={handleClose}>My account</MenuItem>
      <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
    </Menu>
  )

  const mobileMenuId = "primary-search-account-menu-mobile"
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={Boolean(mobileMenuAnchorEl)}
      onClose={handleClose}
    >
      <MenuItem>
        <IconButton size="large" aria-label="show 0 new notifications" color="inherit">
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <p>Notifications</p>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <p>Profile</p>
      </MenuItem>
    </Menu>
  )

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="open drawer" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ display: { xs: "none", sm: "block" } }}>
            <Link href="/" style={{ textDecoration: "none", color: "white" }}>
              My App
            </Link>
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
            <IconButton
              size="large"
              aria-label={`show ${unreadCount} new notifications`}
              color="inherit"
              onClick={(e) => {
                handleMobileMenuOpen(e)
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </Box>
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="show more"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMobileMenu}
      {renderMenu}
      <Menu
        id="notification-menu"
        anchorEl={mobileMenuAnchorEl}
        open={Boolean(mobileMenuAnchorEl)}
        onClose={handleClose}
      >
        {notifications.map((notification) => (
          <MenuItem key={notification.id} onClick={() => handleMarkAsRead(notification.id)}>
            <Typography style={{ fontWeight: notification.read ? "normal" : "bold" }}>
              {notification.message} - {new Date(notification.createdAt).toLocaleString()}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default Header
