"use client";
import { useUsers } from "@/hooks/useUsers";
import { User } from "@clerk/backend";
import { FaUserAlt } from "react-icons/fa";


export default function EmloyessMetaCard({ emloyees }: { emloyees: User }) {
  const { getUsersByClerkId } = useUsers()
  const users = getUsersByClerkId(emloyees.id)
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex justify-center items-center ">
              <FaUserAlt
                className="text-2xl"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                User Name:  {emloyees.username}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tổ:     <span className="dark:text-white font-bold ">{emloyees.publicMetadata?.team_id as string || `_`}</span>
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Số khách hàng đang tiếp nhận: <span className="dark:text-white font-bold ">{users.length}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
