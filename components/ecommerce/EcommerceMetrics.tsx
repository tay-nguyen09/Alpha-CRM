"use client";
import { useUsers } from "@/hooks/useUsers";
import { selectUsersByRange, selectUsersHasReportByRange } from "@/utils/shared/array";
import { AiFillInteraction } from "react-icons/ai";
import { FaLongArrowAltDown, FaLongArrowAltUp } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import Badge from "../ui/badge/Badge";
import React from "react";

const Grow = ({ percent }: { percent: number | null }) => {

  if (percent === null) {
    return (
      <Badge color="light">
        —
      </Badge>
    )
  }

  if (percent > 0) {
    return (
      <Badge color="success">
        <FaLongArrowAltUp />
        {percent.toFixed(2)}%
      </Badge>
    )
  }
  if (percent === 0) {
    return (
      <Badge color="light">
        {percent.toFixed(2)}%
      </Badge>
    )
  }

  return (
    <Badge color="error">
      <FaLongArrowAltDown className="text-error-500" />
      {percent.toFixed(2)}%
    </Badge>
  )
}

export const EcommerceMetrics = () => {
  const { users } = useUsers()
  const oneDayMilisecond = 24 * 60 * 60 * 1000
  const [timeState, setTimeState] = React.useState({ now: 0, startOfTodayMs: 0, startOfYesterdayMs: 0 })

  React.useEffect(() => {
    const now = Date.now()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfTodayMs = startOfToday.getTime()
    const startOfYesterdayMs = startOfTodayMs - oneDayMilisecond
    setTimeState({ now, startOfTodayMs, startOfYesterdayMs })
  }, [])

  // Users interacted today: based on whether they have any dailyReports today
  const usersInteractToDay = selectUsersHasReportByRange(users, {
    start: timeState.startOfTodayMs,
    end: timeState.now
  })

  const usersInteractYesterDay = selectUsersHasReportByRange(users, {
    start: timeState.startOfYesterdayMs,
    end: timeState.startOfTodayMs
  })

  const newUsersToDay = selectUsersByRange(users, {
    start: timeState.startOfTodayMs,
    end: timeState.now
  })

  const newUsersYesterday = selectUsersByRange(users, {
    start: timeState.startOfYesterdayMs,
    end: timeState.startOfTodayMs
  })

  const percentChange = (oldValue: number, newValue: number): number | null => {
    // If no previous data and no new data, zero change
    if (oldValue === 0 && newValue === 0) return 0
    // If no previous data but there is new data, represent as "new"
    if (oldValue === 0 && newValue > 0) return null
    return ((newValue - oldValue) / oldValue) * 100;
  };

  const newUserComparison = percentChange(newUsersYesterday.length, newUsersToDay.length)
  const interactUserComparison = percentChange(usersInteractYesterDay.length, usersInteractToDay.length)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <FaUserGroup className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng Khách Hàng
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {users.length}
            </h4>
          </div>
          <Grow percent={newUserComparison} />
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <AiFillInteraction className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Được Tương Tác Hôm Nay
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {usersInteractToDay.length}
            </h4>
          </div>
          <Grow percent={interactUserComparison} />
        </div>
      </div>
    </div>
  );
};
