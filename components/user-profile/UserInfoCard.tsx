"use client";

import { useRedux } from "@/hooks/useRedux";
import { TypeUser } from "@/types/firebase";
import { emptyData } from "@/utils/shared/string";

export default function UserInfoCard({ userDoc }: { userDoc: TypeUser }) {
  const lastAssign = userDoc.assign[userDoc.assign.length - 1];
  const { actions } = useRedux()
  const actionsOnThisContact = actions.filter(a => a.userDocId === userDoc.id);
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Thông tin cá nhân
          </h4>
          <div className="flex gap-10 w-full">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32 w-full">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Tên
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {emptyData(userDoc.name)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Số Điện Thọai
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {emptyData(userDoc.phone)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  UID
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {emptyData(userDoc.uid)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {emptyData(userDoc.email)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Tình Trạng
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {emptyData(userDoc.status)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Người Chăm Sóc
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">

                  {userDoc.isDelete || userDoc.isDeleted ? "Nằm trong thùng rác" : userDoc.isFloating ? "Dữ Liệu Thả Nổi" : emptyData(lastAssign.employeeName)}
                </p>
              </div>

              <div className="col-span-2">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Nhãn
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 flex flex-wrap ">
                  {userDoc.labels.length <= 0 ? "-" : userDoc.labels.map((i: string, index: number) => {
                    return (
                      <div key={i + index} className="bg-gray-400 px-3 py-1 rounded-md inline-block mr-2">
                        {i}
                      </div>
                    )
                  })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32 w-full">
              <div>
                {userDoc.assign.map((assign, index) => (
                  <div key={assign.uid + index} className="mb-4">
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      {!index ? "Nguời Tạo" : `Lịch Sử Tiếp Nhận ${index}`}
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {assign.employeeName} - {new Date(assign.assignAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  Lịch Sử Tương Tác:
                </div>
                <div className="relative">
                  <div className="max-h-96 overflow-y-scroll hidden-scroll-bar">
                    {actionsOnThisContact.map((i, index) => (
                      <div key={i.actionById + index} className="mb-4 text-sm bg-gray-700 p-3 rounded-md">
                        <div>
                          {i.note}
                        </div>
                        <p className="text-sm text-gray-500 space-x-2">
                          <span>
                            [{new Date(i.createdAt).toLocaleDateString()}-{new Date(i.createdAt).toLocaleTimeString()}]
                          </span>
                          <span>
                            {i.actionByName}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                  {actionsOnThisContact.length > 3 && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none flex items-end justify-center pb-2">
                      <span className="text-xs text-gray-400 animate-bounce">↓ Cuộn để xem thêm</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
