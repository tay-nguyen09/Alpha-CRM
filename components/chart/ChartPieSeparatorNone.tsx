"use client"

import { Pie, PieChart } from "recharts"

import {
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useUsers } from "@/hooks/useUsers"
import { useAdmin } from "@/hooks/useAdmin"

export const description = "A pie chart with no separator"

const chartData = [
    { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
    { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
    { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    { browser: "other", visitors: 90, fill: "var(--color-other)" },
]

const colors = [
    "#FF5733",
    "#FF8D1A",
    "#FFC300",
    "#4CAF50",
    "#00C853",
    "#00BFA5",
    "#00ACC1",
    "#0288D1",
    "#3949AB",
    "#5E35B1",
    "#8E24AA",
    "#D81B60",
    "#EC407A",
    "#F06292",
    "#795548",
    "#6D4C41",
    "#546E7A",
    "#90A4AE",
    "#FFCDD2",
    "#C8E6C9",
];


const chartConfig = {
    name: {
        label: "Tên",
    },
    count: {
        label: "Số Lượng",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export function ChartPieSeparatorNone() {
    const { users } = useUsers()

    const { allSalesCurrentTeam } = useAdmin()

    const chartData = allSalesCurrentTeam.map((user, index) => {
        const uid = user.id
        const usersIn = users.filter((item) => {
            return item.assign[item.assign.length - 1].uid === uid
        })
        return {
            name: user.username,
            count: usersIn.length,
            fill: colors[index]
        }
    })
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
            <CardHeader className="items-center pb-0">
                <CardTitle>Số Lượng Khách Hàng / Nhân Viên</CardTitle>
                <CardDescription>
                    {allSalesCurrentTeam.map((user, index) => {
                        return (
                            <div key={user.id} className="flex gap-1 items-center">
                                <div className="w-4 h-4" style={{ backgroundColor: colors[index] }}></div>
                                {user.username}
                            </div>
                        )
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[350px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="name"
                            stroke="0"
                            label
                        />

                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">

                <div className="text-muted-foreground leading-none">
                    Số Lượng Khách Hàng Mà Mỗi Nhân Viên Đang Chăm Sóc
                </div>
            </CardFooter>
        </div>
    )
}
