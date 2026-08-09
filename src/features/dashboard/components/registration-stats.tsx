import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth } from 'date-fns'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker'
import { getRegistrationStats, type RegistrationPeriod } from '@/lib/api'

type PresetKey = 'today' | '7d' | '30d' | 'custom'
type SummaryPeriod = 'daily' | 'weekly' | 'monthly'

function fmt(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function RegistrationStats() {
  const [period, setPeriod] = useState<RegistrationPeriod>('daily')
  const [fromDate, setFromDate] = useState<Date>(() => subDays(new Date(), 29))
  const [toDate, setToDate] = useState<Date>(() => new Date())
  const [preset, setPreset] = useState<PresetKey>('30d')
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>('daily')

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

  // Separate query for summary — always covers current year, independent of date picker
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const { data: summaryRaw } = useQuery({
    queryKey: ['customer-stats-summary', fmt(yearStart), fmt(now)],
    queryFn: () => getRegistrationStats('daily', fmt(yearStart), fmt(now)),
  })

  const chartData = useMemo(
    () =>
      (data?.data ?? []).map((d) => ({
        name: d.key,
        count: d.count,
      })),
    [data],
  )

  // Summary calculations based on selected summary period
  const summaryData = useMemo(() => {
    const now = new Date()
    
    if (summaryPeriod === 'daily') {
      // Show today, this week, this month
      const todayKey = fmt(now)
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      const monthStart = startOfMonth(now)
      
      let todayCount = 0
      let weekCount = 0
      let monthCount = 0
      
      for (const d of summaryRaw?.data ?? []) {
        const dDate = new Date(d.key)
        if (d.key === todayKey) todayCount += d.count
        if (dDate >= weekStart && dDate <= weekEnd) weekCount += d.count
        if (dDate >= monthStart) monthCount += d.count
      }
      
      return {
        period1: { label: 'วันนี้', count: todayCount, sublabel: fmt(now) },
        period2: { label: 'สัปดาห์นี้', count: weekCount, sublabel: `${fmt(weekStart)} → ${fmt(weekEnd)}` },
        period3: { label: 'เดือนนี้', count: monthCount, sublabel: format(now, 'MMMM yyyy') },
      }
    } else if (summaryPeriod === 'weekly') {
      // Show this week, last 4 weeks, this month
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      const fourWeeksAgo = subWeeks(now, 4)
      const monthStart = startOfMonth(now)
      
      let thisWeekCount = 0
      let fourWeeksCount = 0
      let monthCount = 0
      
      for (const d of summaryRaw?.data ?? []) {
        const dDate = new Date(d.key)
        if (dDate >= weekStart && dDate <= weekEnd) thisWeekCount += d.count
        if (dDate >= fourWeeksAgo) fourWeeksCount += d.count
        if (dDate >= monthStart) monthCount += d.count
      }
      
      return {
        period1: { label: 'สัปดาห์นี้', count: thisWeekCount, sublabel: `${fmt(weekStart)} → ${fmt(weekEnd)}` },
        period2: { label: '4 สัปดาห์', count: fourWeeksCount, sublabel: `${fmt(fourWeeksAgo)} → ${fmt(now)}` },
        period3: { label: 'เดือนนี้', count: monthCount, sublabel: format(now, 'MMMM yyyy') },
      }
    } else {
      // monthly - Show this month, last 3 months, this year
      const monthStart = startOfMonth(now)
      const threeMonthsAgo = subMonths(now, 3)
      const yearStart = new Date(now.getFullYear(), 0, 1)
      
      let thisMonthCount = 0
      let threeMonthsCount = 0
      let yearCount = 0
      
      for (const d of summaryRaw?.data ?? []) {
        const dDate = new Date(d.key)
        if (dDate >= monthStart) thisMonthCount += d.count
        if (dDate >= threeMonthsAgo) threeMonthsCount += d.count
        if (dDate >= yearStart) yearCount += d.count
      }
      
      return {
        period1: { label: 'เดือนนี้', count: thisMonthCount, sublabel: format(now, 'MMMM yyyy') },
        period2: { label: '3 เดือน', count: threeMonthsCount, sublabel: `${format(threeMonthsAgo, 'MMM yyyy')} → ${format(now, 'MMM yyyy')}` },
        period3: { label: 'ปีนี้', count: yearCount, sublabel: String(now.getFullYear()) },
      }
    }
  }, [summaryRaw, summaryPeriod])

  const totalInRange = data?.total ?? 0

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

  const summaryPeriodOptions: { value: SummaryPeriod; label: string }[] = [
    { value: 'daily', label: 'รายวัน' },
    { value: 'weekly', label: 'รายสัปดาห์' },
    { value: 'monthly', label: 'รายเดือน' },
  ]

  return (
    <div className='space-y-4'>
      {/* Summary Period Selector */}
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium'>สรุปแบบ:</span>
        <Select
          value={summaryPeriod}
          onValueChange={(v) => setSummaryPeriod(v as SummaryPeriod)}
        >
          <SelectTrigger className='h-8 w-40'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {summaryPeriodOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{summaryData.period1.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summaryData.period1.count.toLocaleString('th-TH')}</div>
            <p className='text-xs text-muted-foreground'>{summaryData.period1.sublabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{summaryData.period2.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summaryData.period2.count.toLocaleString('th-TH')}</div>
            <p className='text-xs text-muted-foreground'>{summaryData.period2.sublabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{summaryData.period3.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summaryData.period3.count.toLocaleString('th-TH')}</div>
            <p className='text-xs text-muted-foreground'>{summaryData.period3.sublabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>รวม (ช่วงที่เลือก)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {totalInRange.toLocaleString('th-TH')}
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
