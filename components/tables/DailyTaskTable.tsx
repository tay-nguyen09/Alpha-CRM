"use client"
import React from 'react'
import { useUsers } from '@/hooks/useUsers'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { TypeDailyReport } from '@/types/firebase'
import DailyReportButton from '@/components/ui/button/DailyReportButton'
import { FaCheck, FaTimes } from 'react-icons/fa'
import PrimaryNavigation from '../navigation/PrimaryNavigation'
import PhoneCell from './PhoneCell'
import { PrimaryTooltip } from '../common/PrimaryTooltip'
import PushFloatingUser from '../ui/button/PushFloatingUser'

const startOfDay = (ts: number) => {
    const d = new Date(ts)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
}

const DailyTaskTable = () => {
    const { users } = useUsers()

    const [now, setNow] = React.useState<number>(() => Date.now())
    const [pagination, setPagination] = React.useState<{ pageIndex: number; pageSize: number }>({
        pageIndex: 1,
        pageSize: 10,
    })

    const today = startOfDay(now)

    const rows = React.useMemo(() => {
        const list = users
            .filter(u => !(u.labels || []).includes("Đang Giao Dịch"))
            .map(u => {
                const reports = u.dailyReports ?? []
                const latestDailyDate = reports.length ? reports.reduce((m, r) => Math.max(m, r?.updatedAt ?? 0), 0) : 0
                const lastUpdate = Math.max(u.lasteUpadteAt ?? 0, latestDailyDate)
                const daily = reports.find((r: TypeDailyReport) => startOfDay(r.updatedAt) === today)
                return { user: u, daily, lastUpdate }
            })
        list.sort((a, b) => (a.lastUpdate ?? 0) - (b.lastUpdate ?? 0))
        return list
    }, [users, today])

    const formatLastUpdate = (ts?: number) => {
        if (!ts) return <span className='text-gray-400'>Chưa có</span>
        const d = new Date(ts)
        const pad2 = (n: number) => String(n).padStart(2, "0")
        const timeText = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
        const dateText = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`

        const diffMs = Math.max(0, now - ts)
        const minutes = Math.floor(diffMs / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        let ago = "Vài giây trước"
        let agoClass = "text-xs text-gray-500 dark:text-gray-400"
        if (minutes < 60) {
            ago = `${minutes} phút trước`
            agoClass = "text-sm font-semibold text-green-600 dark:text-green-400"
        } else if (hours < 24) {
            const rem = minutes - hours * 60
            ago = `${hours} giờ${rem ? ` ${rem} phút` : ""} trước`
            agoClass = "text-sm font-semibold text-brand-500 dark:text-brand-400"
        } else {
            const remH = hours - days * 24
            ago = `${days} ngày${remH ? ` ${remH} giờ` : ""} trước`
            agoClass = "text-sm font-semibold text-red-500 dark:text-red-400"
        }

        return (
            <div className='flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-200'>
                <span className={agoClass}>{ago}</span>
                <span>{timeText} — {dateText}</span>
            </div>
        )
    }

    React.useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 60 * 1000)
        return () => clearInterval(t)
    }, [])

    return (
        <div className='overflow-hidden rounded-xl border border-gray-400 bg-white dark:border-white/5 dark:bg-white/3'>
            <div className='px-2'>
                <PrimaryNavigation
                    count={rows.length || 0}
                    onChange={(pageIndex, pageSize) => setPagination({ pageIndex, pageSize })}
                />
            </div>
            <div className='p-5'>
                <Table>
                    <TableHeader className='border-b border-gray-400 dark:border-white/5'>
                        <TableRow>
                            <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Tên</TableCell>
                            <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Nguời Chăm Sóc</TableCell>
                            <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Số Điện Thoại</TableCell>
                            <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Lần cập nhật cuối</TableCell>
                            <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Báo Cáo Hôm Nay</TableCell>
                            <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Tiến triển</TableCell>
                            <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Tùy chọn</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className='divide-y divide-gray-400 dark:divide-white/5'>
                        {rows.slice(pagination.pageSize * (pagination.pageIndex - 1), pagination.pageSize * pagination.pageIndex).map(({ user, daily, lastUpdate }) => (
                            <TableRow key={user.id}>
                                <TableCell className='px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>{user.name}</TableCell>
                                <TableCell className='px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>{user.assign[user.assign.length - 1].employeeName}</TableCell>
                                <TableCell className='px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>
                                    <PhoneCell
                                        phone={user.phone}
                                    />
                                </TableCell>
                                <TableCell className='px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>
                                    {formatLastUpdate(lastUpdate)}
                                </TableCell>
                                <TableCell className='px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>
                                    {daily ? (
                                        <div className='flex flex-wrap gap-3 items-center'>
                                            <div className='flex gap-1 items-center'>
                                                {daily.callMade ? <FaCheck className='text-green-600' /> : <FaTimes className='text-gray-400' />}
                                                <span className='text-sm'>{daily.callMade ? 'Có Gọi' : 'Chưa gọi'}</span>
                                            </div>
                                            <div className='flex gap-1 items-center'>
                                                {daily.messageSent ? <FaCheck className='text-green-600' /> : <FaTimes className='text-gray-400' />}
                                                <span className='text-sm'>{daily.messageSent ? 'Có nhắn' : 'Chưa nhắn'}</span>
                                            </div>
                                            <div className='flex gap-1 items-center'>
                                                {daily.hasResponse ? <FaCheck className='text-green-600' /> : <FaTimes className='text-gray-400' />}
                                                <span className='text-sm'>{daily.hasResponse ? 'Có phản hồi' : 'Không phản hồi'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className='text-gray-500 dark:text-gray-400'>Chưa có báo cáo</div>
                                    )}
                                </TableCell>
                                <TableCell className='px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>
                                    {daily?.progress ? (
                                        <div className='px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/80 text-sm max-w-xs wrap-break-word'>
                                            {daily.progress}
                                        </div>
                                    ) : (
                                        <span className='text-gray-400 dark:text-gray-500'>(Trống)</span>
                                    )}
                                </TableCell>
                                <TableCell className='flex gap-1 px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>
                                    <PrimaryTooltip content="Báo cáo">
                                        <div >
                                            <DailyReportButton docId={user.id} />
                                        </div>
                                    </PrimaryTooltip>
                                    <PrimaryTooltip content="Thả Trôi Liên Hệ Này">
                                        <div>
                                            <PushFloatingUser docId={user.id} />
                                        </div>
                                    </PrimaryTooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default DailyTaskTable
