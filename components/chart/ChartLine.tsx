"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useUsers } from "@/hooks/useUsers"
import { selectUsersByRange, selectUsersHasReportByRange } from "@/utils/shared/array"
import React from "react"

export const description = "A line chart"


const chartConfig = {
    customer: {
        label: "Khách hàng",
        color: "var(--chart-1)",
    },
    interact: {
        label: "Tương tác",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

export function ChartLine({ clerkId }: { clerkId?: string }) {
    const { users: filteredUsers, getUsersByClerkId } = useUsers()

    const users = clerkId ? getUsersByClerkId(clerkId) : filteredUsers

    const startOfDay = (d: Date) => {
        const dt = new Date(d);
        dt.setHours(0, 0, 0, 0);
        return dt.getTime();
    }
    const endOfDay = (d: Date) => {
        const dt = new Date(d);
        dt.setHours(23, 59, 59, 999);
        return dt.getTime();
    }
    const pad2 = (n: number) => String(n).padStart(2, "0");

    const sevenDayUsers = React.useMemo(() => {
        const safeUsers = users ?? [];
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const day = new Date();
            day.setDate(day.getDate() - i);
            const start = startOfDay(day);
            const end = endOfDay(day);
            const usersToDay = selectUsersByRange(safeUsers, { start, end });
            const interactToDay = selectUsersHasReportByRange(safeUsers, { start, end });
            result.push({
                day: pad2(day.getDate()),
                customer: usersToDay.length,
                interact: interactToDay.length,
            });
        }
        return result;
    }, [users]);
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
            <CardHeader>
                <CardTitle>Số Lượng Khách Mới / Tương Tác Mỗi Ngày</CardTitle>
                <CardDescription>Lượng Khách Mới / Tương Tác Trong 7 Ngày Gần Nhất</CardDescription>
            </CardHeader>
            <CardContent className="py-5">
                <ChartContainer config={chartConfig}>
                    <LineChart
                        accessibilityLayer
                        data={sevenDayUsers}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            tickFormatter={(value) => `Ngày ${value}`}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent
                                labelFormatter={(value) => {
                                    return `Ngày ${value}`
                                }}
                            />}
                        />
                        <Line
                            dataKey="customer"
                            type="natural"
                            stroke="var(--color-customer)"
                            strokeWidth={3}
                            dot={true}
                        />
                        <Line
                            dataKey="interact"
                            type="natural"
                            stroke="var(--color-interact)"
                            strokeWidth={2}
                            dot={false}
                        />

                    </LineChart>
                </ChartContainer>
            </CardContent>
        </div>
    )
}
