import {
  LayoutDashboard,
  Command,
  Contact,
  Lock,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'ผู้ดูแลระบบ',
    email: 'admin@เกษตรนิวเคลียร์.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'เกษตรนิวเคลียร์',
      logo: Command,
      plan: 'ระบบบริหารสมาชิก',
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
