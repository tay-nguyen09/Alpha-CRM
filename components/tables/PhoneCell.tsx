"use client"
import React from 'react'
import { FaEye, FaPhone } from 'react-icons/fa'
import { IoIosCopy } from 'react-icons/io'
import { LuEyeClosed } from 'react-icons/lu'
import { PrimaryTooltip } from '../common/PrimaryTooltip'
import { Button } from '../ui/button'

interface PhoneCellProps {
    phone?: string
}

const PhoneCell = React.memo(({ phone }: PhoneCellProps) => {
    const [isHidden, setIsHidden] = React.useState(true)

    const toggleHiddenPhone = () => {
        setIsHidden(!isHidden)
    }
    const maskPhone = (p?: string) => {
        if (!p) return ""
        const s = String(p)
        const last3 = s.slice(-3)
        const masked = "*".repeat(Math.max(0, s.length - 3)) + last3
        return masked
    }

    const copyToClipboard = async (text?: string) => {
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
        } catch (e) {
            console.error(e)
        }
    }

    const callPhone = (number?: string) => {
        if (!number) return
        try {
            window.open(`tel:${number}`)
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="flex flex-col items-center gap-1">
            <span className="block font-medium text-gray-800 text-sm dark:text-white/90 truncate max-w-[140px]">
                {isHidden ? maskPhone(phone) : phone}
            </span>
            <div className="flex gap-1">
                <PrimaryTooltip content={isHidden ? "Hiện Số Điện Thoại" : "Ẩn Số Điện Thoại"}>
                    <Button
                        aria-label={isHidden ? "Hiện số" : "Ẩn số"}
                        size="xs"
                        variant="outline"
                        className="w-7 h-7"
                        onClick={toggleHiddenPhone}
                    >
                        {isHidden ? <FaEye size={14} /> : <LuEyeClosed size={14} />}
                    </Button>
                </PrimaryTooltip>
                <PrimaryTooltip content="Sao Chép Số Điện Thoại">
                    <Button
                        aria-label="Sao chép số"
                        size="xs"
                        variant="outline"
                        className="w-7 h-7"
                        onClick={() => copyToClipboard(phone)}
                    >
                        <IoIosCopy size={14} />
                    </Button>
                </PrimaryTooltip>
                <PrimaryTooltip content="Gọi Số Điện Thoại">
                    <Button
                        aria-label="Gọi số"
                        size="xs"
                        variant="outline"
                        className="w-7 h-7"
                        onClick={() => callPhone(phone)}
                    >
                        <FaPhone size={14} />
                    </Button>
                </PrimaryTooltip>
            </div>
        </div>
    )
})

PhoneCell.displayName = 'PhoneCell'

export default PhoneCell
