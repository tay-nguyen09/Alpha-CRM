import { TypeUser } from "@/types/firebase";

type TypeSortType = "asc" | "des"

export function orderBy<T>(arr: T[], sortType: TypeSortType, key: keyof T): T[] {
    return [...arr].sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (typeof valA === "string" && typeof valB === "string") {
            return sortType === "asc"
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }

        if (typeof valA === "number" && typeof valB === "number") {
            return sortType === "asc" ? valA - valB : valB - valA;
        }

        return 0;
    });
}


export const selectUsersByRange = (arr: Array<TypeUser>, { start, end }: { start: number, end: number }) => {
    return arr.filter((user) => user.createdAt >= start && user.createdAt < end)
}

export const selectUserslasteUpdateByRange = (arr: Array<TypeUser>, { start, end }: { start: number, end: number }) => {
    return arr.filter((user) => user.lasteUpadteAt >= start && user.lasteUpadteAt < end)
}

// New: select users that have at least one daily report within the time range
export const selectUsersHasReportByRange = (
    arr: Array<TypeUser>,
    { start, end }: { start: number; end: number }
) => {
    return arr.filter((user) =>
        Array.isArray(user.dailyReports) &&
        user.dailyReports.some((r) => typeof r.updatedAt === 'number' && r.updatedAt >= start && r.updatedAt < end)
    );
};