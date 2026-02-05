
'use client'
import SelectComponent from "@/components/form/SelectComponent";
import { useSidebar } from "@/context/SidebarContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useCampaign } from "@/hooks/useCampaign";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRedux } from "@/hooks/useRedux";
import { useUsers } from "@/hooks/useUsers";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { selectDatabaseName, setDatabaseName, setTeamId } from "@/lib/redux/features/firebase/firebaseSlice";
import { fetchPagesAsync, selectBootstrapDone, warmTokensAsync } from "@/lib/redux/features/messages/messagesSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { initFirestore } from "@/utils/shared/firebase";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { getUser, getUserCount } = useUsers()
  const { isLeader, isAdmin } = useCurrentUser()
  const { getClerkUserList, clerkUsers } = useAdmin()
  const { getCampaign, getReportAdsToDay } = useCampaign()
  const { getAnalyticPosts, getShortVideoPosts, getActions } = useRedux()
  const dispatch = useAppDispatch()
  const bootstrapDone = useAppSelector(selectBootstrapDone)
  const database = useAppSelector(selectDatabaseName);
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[260px]"
      : "lg:ml-[72px]";

  const databases = Array.from(
    new Map(
      clerkUsers
        .map((user) => user.publicMetadata)
        .map((db) => ({ label: db.team_id as string, value: db.db as string }))
        .filter((db) => db.label && db.value)
        .map((db) => [db.value, db])
    ).values()
  );

  const handleChangeTeamId = (dbName: string) => {
    dispatch(setDatabaseName(dbName))
    dispatch(setTeamId(databases.find((db) => db.value === dbName)?.label || ""))
  }

  React.useEffect(() => {
    getUser()
    getUserCount()
    getCampaign()
    getReportAdsToDay()
    // getActions()
  }, [database])

  React.useEffect(() => {
    if (isLeader) {
      getClerkUserList()
      getAnalyticPosts()
      getShortVideoPosts()
    }
  }, [isLeader, database])

  React.useLayoutEffect(() => {
    if (isAdmin) {
      initFirestore(database);
    }
  }, [database, isAdmin])

  // React.useEffect(() => {
  //   if (!bootstrapDone) {
  //     const timer = setTimeout(() => {
  //       dispatch(fetchPagesAsync({ apiBaseUrl: "" }))
  //       dispatch(warmTokensAsync({ apiBaseUrl: "" }))
  //     }, 2000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [bootstrapDone, dispatch])

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AppHeader />
        {
          isAdmin &&
          <div className="p-2 mx-auto max-w-(--breakpoint-2xl) md:p-3">
            <div className="w-fit">
              <SelectComponent
                options={databases}
                placeholder="Chọn Tổ"
                onChange={handleChangeTeamId}
                defaultValue={database || "(default)"}
              />
            </div>
          </div>
        }
        <div className="p-2 mx-auto max-w-(--breakpoint-2xl) md:p-3">
          {children}
        </div>
      </div>
    </div>
  );
}


