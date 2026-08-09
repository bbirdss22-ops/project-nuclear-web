import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Loader2, SearchIcon } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import {
  getCustomers,
  searchCustomers,
  deleteCustomer,
  type Customer,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Main } from '@/components/layout/main'
import { customerColumns } from './customer-columns'
import { EditCustomerDialog } from './edit-customer-dialog'

export function Customers() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [bankFilter, setBankFilter] = useState<string>('all')

  const isSearching = debouncedSearch.trim().length > 0

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: isSearching
      ? ['customers', 'search', debouncedSearch, page, pageSize]
      : ['customers', page, pageSize, bankFilter],
    queryFn: () =>
      isSearching
        ? searchCustomers(debouncedSearch.trim(), page, pageSize)
        : getCustomers(
            page,
            pageSize,
            bankFilter === 'all' ? undefined : bankFilter,
          ),
  })

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingCustomer) return
    setDeleting(true)
    try {
      await deleteCustomer(deletingCustomer.id)
      toast.success('ลบลูกค้าแล้ว')
      setDeletingCustomer(null)
      refetch()
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'ลบไม่สำเร็จ')
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo(
    () =>
      customerColumns({
        onEdit: (c) => setEditingCustomer(c),
        onDelete: (c) => setDeletingCustomer(c),
      }),
    [],
  )

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? 0,
  })

  const totalItems = data?.totalItems ?? 0
  const totalPages = data?.totalPages ?? 0

  return (
    <Main>
      <div className='mb-2 flex items-center justify-between space-y-2'>
        <h1 className='text-2xl font-bold tracking-tight'>Customers</h1>
      </div>

      {/* Search + filter */}
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <div className='relative w-full max-w-sm'>
          <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search code / name / phone / email...'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className='pl-10'
          />
        </div>
        <Select
          value={bankFilter}
          onValueChange={(value) => {
            setBankFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className='h-9 w-44'>
            <SelectValue placeholder='Bank status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>ทั้งหมด</SelectItem>
            <SelectItem value='pending'>รอตรวจสอบ</SelectItem>
            <SelectItem value='approved'>ผ่าน</SelectItem>
            <SelectItem value='rejected'>ไม่ผ่าน</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-32 text-center'
                >
                  <Loader2 className='mx-auto h-6 w-6 animate-spin text-muted-foreground' />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-32 text-center text-muted-foreground'
                >
                  {error
                    ? 'Failed to load customers. Please try again.'
                    : 'No customers found.'}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.original.id}
                  className='cursor-pointer'
                  onClick={() =>
                    navigate({
                      to: '/customers/$customerId',
                      params: { customerId: row.original.id },
                    })
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className='flex items-center justify-between mt-4'>
          <p className='text-sm text-muted-foreground'>
            Showing{' '}
            {totalItems > 0 ? (page - 1) * pageSize + 1 : 0}-
            {Math.min(page * pageSize, totalItems)} of {totalItems} customers
          </p>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <p className='text-sm text-muted-foreground'>Rows per page</p>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className='h-8 w-16'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className='px-2 text-sm text-muted-foreground'>
                Page {page} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <EditCustomerDialog
        customer={editingCustomer}
        onOpenChange={(open) => {
          if (!open) setEditingCustomer(null)
        }}
        onSaved={refetch}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deletingCustomer}
        onOpenChange={(open) => {
          if (!open) setDeletingCustomer(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบลูกค้า</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบลูกค้า "{deletingCustomer?.firstName}{' '}
              {deletingCustomer?.lastName}" หรือไม่? การลบนี้จะไม่สามารถยกเลิกได้
              (ลูกค้าจะถูกทำเครื่องหมายเป็นลบ และจะไม่แสดงในรายการ)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : null}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  )
}
