import {
  LayoutDashboard,
  Contact,
  Lock,
} from 'lucide-react'
import { LogoImage } from '@/assets/logo'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'ผู้ดูแลระบบ',
    email: 'admin@เกษตรนิวเคลียร์.com',
    avatar: '/avatars/01.png',
  },
  teams: [
    {
      name: 'เกษตรนิวเคลียร์',
      logo: LogoImage,
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
