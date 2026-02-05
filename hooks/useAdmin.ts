import { getClerkUsersAsync, selectClerkUsers } from "@/lib/redux/features/clerk/clerkSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useCurrentUser } from "./useCurrentUser";
import { useRedux } from "./useRedux";

export const useAdmin = () => {
    const dispatch = useAppDispatch()
    const { publicMetaData } = useCurrentUser()
    const { teamId } = useRedux()

    const getClerkUserList = () => dispatch(getClerkUsersAsync())
    const clerkUsers = useAppSelector(selectClerkUsers).filter((user) => publicMetaData.team_id ? user.publicMetadata.team_id === publicMetaData.team_id : true) || [];
    const allSales = clerkUsers.filter((user) => user.publicMetadata.role === "sale")
    const allLeader = clerkUsers.filter((user) => user.publicMetadata.role === "leader")
    const allAdmin = clerkUsers.filter((user) => user.publicMetadata.role === "admin")
    const allSalesCurrentTeam = allSales.filter((user) => teamId ? user.publicMetadata.team_id === teamId : true)

    return {
        getClerkUserList,
        clerkUsers,
        allSales,
        allLeader,
        allAdmin,
        allSalesCurrentTeam
    }
}