"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Calendar22Props {
    value?: Date | undefined
    onSelect?: (date?: Date) => void
    placeholder?: string
}

export function Calendar22({ value, onSelect, placeholder = "Chọn ngày" }: Calendar22Props) {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(value)

    React.useEffect(() => {
        setDate(value)
    }, [value])

    const formatDateShort = (d?: Date) => {
        if (!d) return ""
        const dd = String(d.getDate()).padStart(2, "0")
        const mm = String(d.getMonth() + 1).padStart(2, "0")
        const yy = String(d.getFullYear()).slice(-2)
        return `${dd}/${mm}/${yy}`
    }

    return (
        <div className="flex flex-col gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className="w-48 justify-between font-normal"
                    >
                        {date ? formatDateShort(date) : placeholder}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value ?? date}
                        captionLayout="dropdown"
                        onSelect={(d) => {
                            setDate(d)
                            setOpen(false)
                            if (onSelect) onSelect(d)
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
