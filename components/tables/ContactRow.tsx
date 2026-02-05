import React from 'react'
import { TypeAssign, TypeUser } from '@/types/firebase'
import { TableCell, TableRow } from '../ui/table'
import { PrimaryTooltip } from '../common/PrimaryTooltip'
import PhoneCell from './PhoneCell'
import DailyReportButton from '../ui/button/DailyReportButton'
import DeleteContact from '../ui/button/DeleteContact'
import EditContact from '../ui/button/EditContact'
import PushFloatingUser from '../ui/button/PushFloatingUser'
import DetailContact from '../ui/button/DetailContact'

type UserWithLastAssign = TypeUser & (TypeAssign extends Array<infer U> ? U : never)

interface ContactRowProps {
    user: UserWithLastAssign
    style?: React.CSSProperties
}

const Time = React.memo(({ timeStamp, highlight }: { timeStamp?: number; highlight?: boolean }) => {
    const [now, setNow] = React.useState(() => Date.now())
    // React.useEffect(() => {
    //     // Update every minute for relative time accuracy
    //     const interval = setInterval(() => {
    //         setNow(Date.now())
    //     }, 60000) // 60 seconds

    //     return () => clearInterval(interval)
    // }, [])

    if (!timeStamp) return <div className="flex flex-col gap-1 text-gray-400">(Không có)</div>

    const time = new Date(timeStamp)
    const pad2 = (n: number) => String(n).padStart(2, '0')


    const diffMs = Math.max(0, now - timeStamp)
    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    let ago = ''
    if (seconds < 60) {
        ago = `Vài giây trước`
    } else if (minutes < 60) {
        ago = `${minutes} phút trước`
    } else if (hours < 24) {
        const remMinutes = minutes - hours * 60
        ago = `${hours} giờ${remMinutes > 0 ? ` ${remMinutes} phút` : ''} trước`
    } else {
        const daysOnly = days
        const remHours = hours - daysOnly * 24
        ago = `${daysOnly} ngày${remHours > 0 ? ` ${remHours} giờ` : ''} trước`
    }

    const timeText = `${pad2(time.getHours())}:${pad2(time.getMinutes())}:${pad2(time.getSeconds())}`
    const dateText = `${pad2(time.getDate())}/${pad2(time.getMonth() + 1)}/${String(time.getFullYear()).slice(-2)}`

    const timeMutedClass = 'text-xs text-gray-500 dark:text-gray-400'
    let agoClass = 'text-xs text-gray-500 dark:text-gray-400'
    if (highlight) {
        if (minutes < 60) {
            agoClass = 'text-sm font-semibold text-green-600 dark:text-green-400'
        } else if (hours < 24) {
            agoClass = 'text-sm font-semibold text-brand-500 dark:text-brand-400'
        } else {
            agoClass = 'text-sm font-semibold text-red-500 dark:text-red-500'
        }
    }

    return (
        <div className="flex flex-col gap-0.5" title={time.toLocaleString()}>
            {highlight ? (
                <div className={agoClass}>{ago}</div>
            ) : (
                <div className={timeMutedClass}>
                    {timeText} <span className="mx-1">—</span> {dateText}
                </div>
            )}
            <div className={highlight ? timeMutedClass : 'text-xs text-gray-400 dark:text-gray-500'}>
                {!highlight ? ago : `${timeText} — ${dateText}`}
            </div>
        </div>
    )
})

Time.displayName = 'Time'

const Employee = React.memo(({ assign }: { assign: TypeAssign }) => {
    const currentEmployee = assign[assign.length - 1]
    return <p>{currentEmployee.employeeName}</p>
})

Employee.displayName = 'Employee'

const ContactRow = React.memo(({ user }: ContactRowProps) => {
    return (
        <TableRow key={user.id} >
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                <Time timeStamp={user.assignAt} highlight={false} />
            </TableCell>
            <TableCell className="px-5 py-4 sm:px-6 text-start">{user.name}</TableCell>
            <TableCell className="flex gap-1 px-3 py-2 text-gray-500 text-start text-sm dark:text-gray-400">
                <PhoneCell phone={user.phone} />
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                <Employee assign={user.assign} />
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                <Time timeStamp={user.lasteUpadteAt} highlight={true} />
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                {user.status}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                {user.source}
            </TableCell>
            <TableCell className="flex gap-1 px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                <PrimaryTooltip content="Chỉnh Sửa">
                    <div>
                        <EditContact docId={user.id} />
                    </div>
                </PrimaryTooltip>
                <PrimaryTooltip content="Chi Tiết">
                    <div>
                        <DetailContact docId={user.id} />
                    </div>
                </PrimaryTooltip>
                <PrimaryTooltip content="Xóa Liên Hệ">
                    <div>
                        <DeleteContact docId={user.id} />
                    </div>
                </PrimaryTooltip>
                <PrimaryTooltip content="Thả Trôi Liên Hệ Này">
                    <div>
                        <PushFloatingUser docId={user.id} />
                    </div>
                </PrimaryTooltip>
                <PrimaryTooltip content="Báo Cáo Hằng Ngày">
                    <div>
                        <DailyReportButton docId={user.id} />
                    </div>
                </PrimaryTooltip>
            </TableCell>
        </TableRow>
    )
})

ContactRow.displayName = 'ContactRow'

export default ContactRow
