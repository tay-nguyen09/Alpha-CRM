"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useUsers } from "@/hooks/useUsers"

export const description = "A donut chart with text"

const COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
    "#F8B739",
    "#52C41A",
    "#FA541C",
    "#13A8D8",
    "#EB2F96",
    "#722ED1",
    "#FA8C16",
    "#1890FF",
    "#52C41A",
    "#FF4D4F",
    "#A0D911",
    "#176ECC",
]

export function UserSourceChartPieDonut({ clerkId }: { clerkId: string }) {
    const { getUsersByClerkId } = useUsers()
    const users = getUsersByClerkId(clerkId)

    // Lọc và chuyển đổi dữ liệu sources từ users
    const chartData = React.useMemo(() => {
        const sourceMap = new Map<string, number>()

        // Đếm số lượng khách theo source
        users.forEach((user) => {
            const source = user.source || "Không Rõ"
            sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
        })

        // Chuyển đổi sang dạng dữ liệu cho chart
        const data = Array.from(sourceMap.entries()).map(
            ([source, count], index) => ({
                browser: source,
                customers: count,
                fill: COLORS[index % COLORS.length],
            })
        )

        return data.length > 0 ? data : []
    }, [users])

    const totalCustomers = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.customers, 0)
    }, [chartData])

    return (
        <Card className="flex flex-col bg-transparent">
            <CardHeader className="items-center pb-0">
                <CardTitle>Nguồn Khách Hàng</CardTitle>
                <CardDescription>Số Khách Trên Từng Nguồn</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={{}}
                    className="mx-auto aspect-square max-h-62.5"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="customers"
                            nameKey="browser"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {totalCustomers.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    Khách
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
