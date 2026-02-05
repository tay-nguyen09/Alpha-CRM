
export type TypeTimestamp = number

export type TypeAssign = Array<{
    assignAt: TypeTimestamp,
    employeeName: string
    uid: string
}>


export type TypeDailyReport = {
    updatedAt: TypeTimestamp
    callMade?: boolean
    messageSent?: boolean
    hasResponse?: boolean
    progress?: string
    note?: string
    createdBy?: string
    createdAt?: TypeTimestamp
}

export type TypeUser = {
    id: string,
    createdAt: TypeTimestamp,
    name: string
    phone: string
    email: string
    source: string
    labels: Array<string>
    assign: TypeAssign
    lasteUpadteAt: TypeTimestamp
    status: string
    note: string
    isFloating: boolean
    uid: string
    dailyReports?: TypeDailyReport[]
    isDelete?: boolean
}
