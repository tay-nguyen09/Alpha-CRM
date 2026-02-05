import { useAdmin } from '@/hooks/useAdmin'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUsers } from '@/hooks/useUsers'
import { fetchContactCandidatesAsync } from '@/lib/redux/features/contacts/contactsSlice'
import { useAppDispatch } from '@/lib/redux/hooks'
import { TypeAddNewUserData, TypeAddNewUserFormData } from '@/types/form'
import { timeStamp } from '@/utils/shared/common'
import { useUser } from '@clerk/nextjs'
import { SubmitHandler, useForm } from 'react-hook-form'
import { IoPush } from 'react-icons/io5'
import { toast } from 'react-toastify'
import { Button } from '../button'

type Props = {
    initialPhone: string
    initialCustomerName: string
    initialSource: string
}

const PushFloatingUserFromCandidate = ({
    initialPhone = '',
    initialCustomerName = '',
    initialSource = '',
}: Props) => {
    const { addUser } = useUsers()
    const { isLeader } = useCurrentUser()
    const currentUser = useUser()
    const { clerkUsers } = useAdmin()
    const dispatch = useAppDispatch();

    const form = useForm<TypeAddNewUserFormData>({
        defaultValues: {
            phone: initialPhone,
            name: initialCustomerName,
            source: initialSource
        }
    })
    const {
        handleSubmit,
        formState: { errors },
    } = form

    const onSubmit: SubmitHandler<TypeAddNewUserFormData> = async (data) => {
        try {
            if (!currentUser.user) return Error()
            if (isLeader) {
                let employeeInfo;
                if (data.assignId) {
                    const employee = clerkUsers.find((order) => order.id === data.assignId)
                    if (!employee) return Error()
                    employeeInfo = {
                        employeeName: employee.username as string,
                        uid: employee.id as string
                    }
                } else {
                    employeeInfo = {
                        employeeName: currentUser.user.username as string,
                        uid: currentUser.user.id
                    }
                }
                const metadata: TypeAddNewUserData = {
                    ...data,
                    labels: (data.labels ?? []).map(l => String(l ?? "").trim()),
                    isFloating: true,
                    assign: [
                        {
                            assignAt: timeStamp(),
                            ...employeeInfo
                        }
                    ],
                }
                delete metadata.assignId
                addUser(metadata, {
                    action: "add_contact",
                    note: "Thêm mới liên hệ",
                })
            } else {
                const metadata: TypeAddNewUserData = {
                    ...data,
                    labels: (data.labels ?? []).map(l => String(l ?? "").trim()),
                    isFloating: true,
                    assign: [
                        {
                            assignAt: timeStamp(),
                            employeeName: currentUser.user.username as string,
                            uid: currentUser.user.id
                        }
                    ],
                }
                addUser(metadata, {
                    action: "add_contact",
                    note: "Thêm mới liên hệ",
                })
            }

            toast.success("Thành Công")

            dispatch(fetchContactCandidatesAsync())
        } catch (error) {
            toast.info("Lỗi, Vui Lòng Liên Hệ Dev !!")
            console.log(error)
        }
    }
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Button variant="outline" size='sm' type='submit'>
                <IoPush />
            </Button>
        </form>

    )
}

export default PushFloatingUserFromCandidate