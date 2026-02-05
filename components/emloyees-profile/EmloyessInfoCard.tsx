"use client";

import { UserSourceChartPieDonut } from "../chart/UserSourceChartPieDonut";
import { User } from "@clerk/backend";
import { ChartLine } from "../chart/ChartLine";
import { useUsers } from "@/hooks/useUsers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar22 } from "../datePicker/Calendar22";

const RateColor = ({ rate }: { rate: number }) => {
  const getColorClass = () => {
    if (rate >= 70) return "text-green-500"
    if (rate >= 50) return "text-blue-500"
    if (rate < 30) return "text-red-500"
    return "text-yellow-500"
  }

  return <span className={`${getColorClass()} font-bold`}>({rate}%)</span>
}

const UsersIntereactiveByRange = ({ emloyees, start, end }: { emloyees: User, start: number, end: number }) => {
  const { getUsersByClerkId, getInteractionStats, getInteractiveUsersByRange } = useUsers()
  const userIntereactiveByRange = getInteractiveUsersByRange(start, end)
  // Giữ khách cũ (createdAt <= end), loại khách mới hơn khoảng đang xem
  const users = getUsersByClerkId(emloyees.id).filter((user) => user.createdAt <= end)
  const userInteract = getInteractionStats(emloyees.id, userIntereactiveByRange)

  return (
    <div className="flex gap-5">
      <div className="flex-1 gap-5 flex flex-col">
        <UserSourceChartPieDonut clerkId={emloyees.id} />
        <div>
          <h3 className="">
            Báo Cáo Hôm Nay:
          </h3>
          <ul className="list-decimal list-inside dark:text-gray-400 text-grap-800">
            <li>
              Tỷ Lệ Tỷ lệ Tương Tác: <span className="dark:text-white">{userInteract.totalUsers.count}/{users.length} <RateColor rate={userInteract.totalUsers.rate} /></span>
            </li>
            <li>
              Tỷ Lệ gọi điện:  <span className="dark:text-white">{userInteract.callMade.count}/{users.length} <RateColor rate={userInteract.callMade.rate} /></span>
            </li>
            <li>
              Tỷ Lệ Nhắn Tin: <span className="dark:text-white">{userInteract.messageSent.count}/{users.length} <RateColor rate={userInteract.messageSent.rate} /></span>
            </li>
            <li>
              Tỷ Lệ Trả Lời: <span className="dark:text-white">{userInteract.hasResponse.count}/{users.length} <RateColor rate={userInteract.hasResponse.rate} /></span>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex-3">
        <ChartLine clerkId={emloyees.id} />
      </div>
    </div>
  )
}

export default function EmloyessInfoCard({ emloyees }: { emloyees: User }) {

  const { getUsersByClerkId, getInteractionStats } = useUsers()
  const users = getUsersByClerkId(emloyees.id)
  const userInteract = getInteractionStats(emloyees.id)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfDay = today.getTime()
  const endOfDay = today.getTime() + 24 * 60 * 60 * 1000

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const startOfYesterday = yesterday.getTime()
  const endOfYesterday = yesterday.getTime() + 24 * 60 * 60 * 1000

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Tổng Quan
          </h4>
          <div>
            <Tabs defaultValue="today" onValueChange={(value) => {
              console.log(value);
            }} >
              <TabsList className="bg-transparent border">
                <TabsTrigger value="today">Hôm Nay</TabsTrigger>
                <TabsTrigger value="yesterday">Hôm qua</TabsTrigger>
                <TabsTrigger value="customRange">
                  Tùy Chọn
                </TabsTrigger>
              </TabsList>
              <TabsContent value="today" >
                <UsersIntereactiveByRange
                  emloyees={emloyees}
                  start={startOfDay}
                  end={endOfDay}
                />
              </TabsContent>
              <TabsContent value="yesterday">
                <UsersIntereactiveByRange
                  emloyees={emloyees}
                  start={startOfYesterday}
                  end={endOfYesterday}
                />
              </TabsContent>
              <TabsContent value="customRange">
                <Calendar22
                  onSelect={() => { }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
