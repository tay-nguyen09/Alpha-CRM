import { addUsersAsync, deleteUserPermanentlyAsync, getUserCountAsync, getUsersAsync, selectDeletedUsers, selectUsers, selectUsersCount, updateUsersAsync } from '@/lib/redux/features/firebase/firebaseSlice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { TypeActionForm, TypeAddNewUserData, UpdateData } from '@/types/form'
import { useCurrentUser } from './useCurrentUser'
import { selectUsersHasReportByRange } from '@/utils/shared/array'
import { TypeUser } from '@/types/firebase'

export const useUsers = () => {
    const { isLeader, userId, userName } = useCurrentUser()
    const dispatch = useAppDispatch();

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfDay = today.getTime()
    const endOfDay = today.getTime() + 24 * 60 * 60 * 1000

    const getUser = () => {
        dispatch(getUsersAsync())
    }
    const getUserCount = () => {
        dispatch(getUserCountAsync())
    }
    const updateUserByDocId = ({ docId, data, action, }: { docId: string, data: UpdateData, action: TypeActionForm, }) => {
        dispatch(updateUsersAsync({
            docId, data, action: {
                userDocId: docId,
                actionById: userId,
                actionByName: userName,
                ...action
            }
        }))
    }
    const addUser = (data: TypeAddNewUserData, action: TypeActionForm) => {
        dispatch(addUsersAsync({
            data, action: {
                userDocId: "",
                actionById: userId,
                actionByName: userName,
                ...action
            }
        }))
    }

    const allUsers = useAppSelector(selectUsers)
    const deletedUsers = useAppSelector(selectDeletedUsers)
    const userCount = useAppSelector(selectUsersCount)
    const users = allUsers.filter(doc => !doc.isFloating).filter((doc) => isLeader ? doc : doc.assign[doc.assign.length - 1].uid === userId);
    const floatingUser = allUsers.filter((doc) => doc.isFloating);

    const deleteUserPermanently = (docId: string) => {
        dispatch(deleteUserPermanentlyAsync(docId))
    }

    const getUsersByClerkId = (clerkId: string, arr: TypeUser[] = users) => arr.filter((doc) => doc.assign[doc.assign.length - 1].uid === clerkId)

    // Tính tỷ lệ tương tác dựa trên timestamp trong ngày
    const getInteractionRate = (user: typeof users[0]) => {
        if (!user.dailyReports || user.dailyReports.length === 0) {
            return 0
        }

        // Lấy thời gian bắt đầu và kết thúc của hôm nay


        // Lọc báo cáo từ hôm nay
        const todayReports = user.dailyReports.filter((report) => {
            const reportTime = report.createdAt || report.updatedAt || 0
            return reportTime >= startOfDay && reportTime < endOfDay
        })

        // Nếu có báo cáo hôm nay = có tương tác
        return todayReports.length
    }

    const interactiveUsersToDay = selectUsersHasReportByRange(users, {
        start: startOfDay,
        end: endOfDay
    })

    const getInteractiveUsersByRange = (start: number, end: number) => {
        return selectUsersHasReportByRange(users, {
            start,
            end
        })
    }

    // Tính toán thống kê callMade, messageSent, hasResponse
    const getInteractionStats = (clerkId: string, interactiveUsers = interactiveUsersToDay) => {
        const userList = getUsersByClerkId(clerkId, interactiveUsers)
        const users = getUsersByClerkId(clerkId)

        let callMadeCount = 0
        let messageSentCount = 0
        let hasResponseCount = 0
        let usersWithCall = 0
        let usersWithMessage = 0
        let usersWithResponse = 0
        let usersWithInteraction = 0

        userList.forEach((user) => {
            if (!user.dailyReports) return

            let userHasCall = false
            let userHasMessage = false
            let userHasResponse = false
            let userHasAnyInteraction = false

            user.dailyReports.forEach((report) => {
                const reportTime = report.createdAt || report.updatedAt || 0
                const isToday = reportTime >= startOfDay && reportTime < endOfDay

                if (isToday) {
                    if (report.callMade) {
                        callMadeCount++
                        userHasCall = true
                        userHasAnyInteraction = true
                    }
                    if (report.messageSent) {
                        messageSentCount++
                        userHasMessage = true
                        userHasAnyInteraction = true
                    }
                    if (report.hasResponse) {
                        hasResponseCount++
                        userHasResponse = true
                        userHasAnyInteraction = true
                    }
                }
            })

            if (userHasCall) usersWithCall++
            if (userHasMessage) usersWithMessage++
            if (userHasResponse) usersWithResponse++
            if (userHasAnyInteraction) usersWithInteraction++
        })

        const usersWithoutInteraction = userList.length - usersWithInteraction
        return {
            totalUsers: {
                count: userList.length,
                rate: userList.length > 0 ? Math.round((userList.length / users.length) * 100) : 0,
            },
            interacted: {
                count: usersWithInteraction,
                rate: userList.length > 0 ? Math.round((usersWithInteraction / users.length) * 100) : 0,
            },
            notInteracted: {
                count: usersWithoutInteraction,
                rate: userList.length > 0 ? Math.round((usersWithoutInteraction / users.length) * 100) : 0,
            },
            callMade: {
                count: callMadeCount,
                usersCount: usersWithCall,
                rate: userList.length > 0 ? Math.round((usersWithCall / users.length) * 100) : 0,
            },
            messageSent: {
                count: messageSentCount,
                usersCount: usersWithMessage,
                rate: userList.length > 0 ? Math.round((usersWithMessage / users.length) * 100) : 0,
            },
            hasResponse: {
                count: hasResponseCount,
                usersCount: usersWithResponse,
                rate: userList.length > 0 ? Math.round((usersWithResponse / users.length) * 100) : 0,
            },
        }
    }

    // Lọc users có tương tác

    return {
        users,
        floatingUser,
        userCount,
        deletedUsers,
        allUsers,
        interactiveUsersToDay,

        addUser,
        getUser,
        updateUserByDocId,
        deleteUserPermanently,
        getUserCount,
        getUsersByClerkId,
        getInteractionRate,
        getInteractionStats,
        getInteractiveUsersByRange
    }
}

