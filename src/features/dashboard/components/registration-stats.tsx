import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker'
import { getRegistrationStats, type RegistrationPeriod } from '@/lib/api'

type PresetKey = 'today' | '7d' | '30d' | 'custom'

function fmt(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function RegistrationStats() {
  const [period, setPeriod] = useState<RegistrationPeriod>('daily')
  const [fromDate, setFromDate] = useState<Date>(() => subDays(new Date(), 29))
  const [toDate, setToDate] = useState<Date>(() => new Date())
  const [preset, setPreset] = useState<PresetKey>('30d')

  const applyPreset = (key: PresetKey) => {
    const now = new Date()
    setPreset(key)
    if (key === 'today') {
      setFromDate(now)
      setToDate(now)
    } else if (key === '7d') {
      setFromDate(subDays(now, 6))
      setToDate(now)
    } else if (key === '30d') {
      setFromDate(subDays(now, 29))
      setToDate(now)
    } else {
      // custom — keep existing from/to
      setPreset('custom')
    }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer-stats', period, fmt(fromDate), fmt(toDate)],
    queryFn: () => getRegistrationStats(period, fmt(fromDate), fmt(toDate)),
  })

  const chartData = useMemo(
    () =>
      (data?.data ?? []).map((d) => ({
        name: d.key,
        count: d.count,
      })),
    [data],
  )

  // Summary buckets derived from per-key counts.
  const { todayCount, monthCount, yearCount } = useMemo(() => {
    const now = new Date()
    const todayKey = fmt(now)
    const monthKey = fmt(now).slice(0, 7)
    const yearKey = String(now.getFullYear())
    let todayCount = 0
    let monthCount = 0
    let yearCount = 0
    for (const d of data?.data ?? []) {
      if (d.key === todayKey) todayCount += d.count
      if (d.key.slice(0, 7) === monthKey) monthCount += d.count
      if (d.key.slice(0, 4) === yearKey) yearCount += d.count
    }
    return { todayCount, monthCount, yearCount }
  }, [data])

  const presetButtons: { key: PresetKey; label: string }[] = [
    { key: 'today', label: 'วันนี้' },
    { key: '7d', label: '7 วัน' },
    { key: '30d', label: '30 วัน' },
    { key: 'custom', label: 'กำหนดเอง' },
  ]

  const periodOptions: { value: RegistrationPeriod; label: string }[] = [
    { value: 'daily', label: 'รายวัน' },
    { value: 'monthly', label: 'รายเดือน' },
    { value: 'yearly', label: 'รายปี' },
  ]

  return (
    <div className='space-y-4'>
      {/* Stat cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>ลูกค้าวันนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{todayCount.toLocaleString('th-TH')}</div>
            <p className='text-xs text-muted-foreground'>สมัครวันนี้</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>ลูกค้าเดือนนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{monthCount.toLocaleString('th-TH')}</div>
            <p className='text-xs text-muted-foreground'>สมัครเดือนนี้</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>ลูกค้าปีนี้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{yearCount.toLocaleString('th-TH')}</div>
            <p className='text-xs text-muted-foreground'>สมัครปีนี้</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>รวม (ช่วงที่เลือก)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(data?.total ?? 0).toLocaleString('th-TH')}
            </div>
            <p className='text-xs text-muted-foreground'>
              {data ? `${data.from} → ${data.to}` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className='flex flex-wrap items-center gap-2'>
        {presetButtons.map((b) => (
          <Button
            key={b.key}
            size='sm'
            variant={preset === b.key ? 'default' : 'outline'}
            onClick={() => applyPreset(b.key)}
          >
            {b.label}
          </Button>
        ))}
        {preset === 'custom' && (
          <>
            <DatePicker
              selected={fromDate}
              onSelect={(d) => d && setFromDate(d)}
              placeholder='จากวันที่'
            />
            <DatePicker
              selected={toDate}
              onSelect={(d) => d && setToDate(d)}
              placeholder='ถึงวันที่'
            />
          </>
        )}
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as RegistrationPeriod)}
        >
          <SelectTrigger className='h-8 w-32'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size='sm' variant='outline' onClick={() => refetch()}>
          รีเฟรช
        </Button>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>ยอดสมัครสมาชิก ({periodOptions.find((o) => o.value === period)?.label})</CardTitle>
          <CardDescription>
            จำนวนลูกค้าที่สมัครสมาชิกตามช่วงเวลา
          </CardDescription>
        </CardHeader>
        <CardContent className='ps-2'>
          {isLoading ? (
            <div className='flex h-[350px] items-center justify-center text-muted-foreground'>
              กำลังโหลดข้อมูล...
            </div>
          ) : isError ? (
            <div className='flex h-[350px] items-center justify-center text-muted-foreground'>
              โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่
            </div>
          ) : chartData.length === 0 ? (
            <div className='flex h-[350px] items-center justify-center text-muted-foreground'>
              ไม่มีข้อมูลในช่วงเวลาที่เลือก
            </div>
          ) : (
            <ResponsiveContainer width='100%' height={350}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey='name'
                  stroke='#888888'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval='preserveStartEnd'
                />
                <YAxis
                  stroke='#888888'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => [
                    Number(value ?? 0).toLocaleString('th-TH'),
                    'จำนวน',
                  ]}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                />
                <Bar
                  dataKey='count'
                  fill='currentColor'
                  radius={[4, 4, 0, 0]}
                  className='fill-primary'
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
