import {
  LayoutDashboard,
  Contact,
  Lock,
  UserCog,
} from 'lucide-react'
import { LogoImage } from '@/assets/logo'
import { type SidebarData } from '../types'

export function getSidebarData(role?: string | null): SidebarData {
  const isSuperadmin = role === 'superadmin'

  const navGroups: SidebarData['navGroups'] = [
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
        ...(isSuperadmin
          ? [
              {
                title: 'Users',
                url: '/users',
                icon: UserCog,
              },
            ]
          : []),
        {
          title: 'Change Password',
          url: '/change-password',
          icon: Lock,
        },
      ],
    },
  ]

  return {
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
    navGroups,
  }
}
