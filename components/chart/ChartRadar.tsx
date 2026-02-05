"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

export const description = "A radar chart with dots"

const chartData = [
    { month: "Tổng Mess", amount: 186 },
    { month: "Mess Rác", amount: 305 },
    { month: "Mess Có Phản Hồi", amount: 237 },
    { month: "Khách Tham Khảo", amount: 273 },
    { month: "Đăng Ký Mới", amount: 209 },
    { month: "Nạp Đầu", amount: 214 },
]

const chartConfig = {
    amount: {
        label: "Số Lượng",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export function ChartRadarDots() {
    return (
        <Card className="bg-transparent border-0 shadow-none">
            <CardContent className="pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[350px] w-[350px]"
                >
                    <RadarChart data={chartData}>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarAngleAxis dataKey="month" />
                        <PolarGrid />
                        <Radar
                            dataKey="amount"
                            fill="var(--chart-1)"
                            fillOpacity={0.6}
                            dot={{
                                r: 4,
                                fillOpacity: 1,
                            }}
                        />
                    </RadarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground flex items-center gap-2 leading-none">
                    January - June 2024
                </div>
            </CardFooter>
        </Card>
    )
}
