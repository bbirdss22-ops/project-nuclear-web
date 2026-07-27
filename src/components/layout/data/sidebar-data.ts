import {
  LayoutDashboard,
  Command,
  Contact,
  Lock,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Project Nuclear',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Customers',
          url: '/customers',
          icon: Contact,
        },
        {
          title: 'Change Password',
          url: '/change-password',
          icon: Lock,
        },
      ],
    },
  ],
}
