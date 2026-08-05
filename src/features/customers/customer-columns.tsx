import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import type { Customer } from '@/lib/api'

function BankStatusBadge({ status }: { status?: Customer['bankStatus'] }) {
  switch (status) {
    case 'pending':
      return <Badge variant='outline'>🟡 รอตรวจสอบ</Badge>
    case 'approved':
      return <Badge variant='default'>🟢 ผ่าน</Badge>
    case 'rejected':
      return <Badge variant='destructive'>🔴 ไม่ผ่าน</Badge>
    default:
      return <Badge variant='secondary'>—</Badge>
  }
}

export interface CustomerRowActions {
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export const customerColumns: (
  actions: CustomerRowActions,
) => ColumnDef<Customer>[] = (actions) => [
  {
    accessorKey: 'code',
    header: 'รหัสลูกค้า',
    cell: ({ row }) => {
      const code = row.original.code
      return code ?? '-'
    },
  },
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },
  {
    accessorKey: 'lastName',
    header: 'Last Name',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.original.email
      return email ?? '—'
    },
  },
  {
    accessorKey: 'bankStatus',
    header: 'Bank Status',
    cell: ({ row }) => <BankStatusBadge status={row.original.bankStatus} />,
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'registeredAt',
    header: 'Registered At',
    cell: ({ row }) => {
      const date = new Date(row.original.registeredAt)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  },
  {
    id: 'actions',
    header: 'จัดการ',
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div
          className='flex items-center gap-1'
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant='ghost'
            size='icon'
            title='แก้ไข'
            onClick={() => actions.onEdit(customer)}
          >
            <Pencil className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            title='ลบ'
            className='text-destructive hover:text-destructive'
            onClick={() => actions.onDelete(customer)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      )
    },
  },
]
