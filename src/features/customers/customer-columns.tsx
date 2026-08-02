import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
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

export const customerColumns: ColumnDef<Customer>[] = [
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
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  },
]
