"use client";
import { useAdmin } from "@/hooks/useAdmin";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUsers } from '@/hooks/useUsers';
import { fetchContactCandidatesAsync } from "@/lib/redux/features/contacts/contactsSlice";
import { useAppDispatch } from "@/lib/redux/hooks";
import { TypeAddNewUserData, TypeAddNewUserFormData } from "@/types/form";
import { timeStamp } from '@/utils/shared/common';
import { useUser } from '@clerk/nextjs';
import React from 'react';
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { FaAngleDown } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import { toast } from 'react-toastify';
import ComponentCard from "../common/ComponentCard";
import { labels } from "./EditContactForm";
import Label from "./Label";
import MultiSelect from "./MultiSelect";
import Select from "./Select";
import Input from "./input/InputField";
import TextArea from "./input/TextArea";
import { Button } from "../ui/button";

const rules = {
    name: {
        required: "Vui lòng Nhập Tên !!",
        minLength: { value: 2, message: "Tên Ít nhất phải có 2 ký tự" },
        validate: (v: string) =>
            !/^\d+$/.test(v.trim()) || "Tên không thể chỉ là số",
    },
    phone: {
        required: "Vui lòng nhập số điện thoại !!",
        pattern: {
            value: /^(\+\d{1,3}[- ]?)?\d{7,15}$/,
            message: "Vui lòng nhập đúng Số điện thoại !!",
        },
    },
    email: {
        pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
            message: "email Không đúng định dạng !!",
        },
    },
    source: {
        minLength: { value: 2, message: "Ít nhất phải có 2 ký tự" },
        required: "Vui lòng Nguồn Khách !!",
    },
    status: {
        minLength: { value: 2, message: "Ít nhất phải có 2 ký tự" },
        required: "Vui lòng chọn Tình Trạng !!",
    }
} as const;

interface NewContactFormProps {
    initialPhone?: string
    initialCustomerName?: string
    initialSource?: string
    isFloating?: boolean,

}

export default function NewContactForm({ initialPhone = '', initialCustomerName = '', initialSource = '', isFloating = false }: NewContactFormProps) {
    const form = useForm<TypeAddNewUserFormData>({
        defaultValues: {
            phone: initialPhone,
            name: initialCustomerName,
            source: initialSource
        }
    })
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = form

    const currentUser = useUser()
    const { clerkUsers } = useAdmin()
    const { isLeader } = useCurrentUser()
    const { addUser } = useUsers()

    const options = React.useMemo(() => {
        return clerkUsers.map((user) => {
            return {
                value: user.id,
                label: user.username
            }
        })
    }, [clerkUsers])

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
                    isFloating: isFloating,
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
                    isFloating: isFloating,
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
            reset()

            // Reload contacts list
            dispatch(fetchContactCandidatesAsync())

            // Close dialog
            const event = new KeyboardEvent("keydown", { key: "Escape" });
            window.dispatchEvent(event);
        } catch (error) {
            toast.info("Lỗi, Vui Lòng Liên Hệ Dev !!")
            console.log(error)
        }
    }

    return (
        <ComponentCard title="Thông tin cơ bản">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                    <div>
                        <Label>Tên</Label>
                        <Input
                            type="text"
                            error={!!(errors.name)}
                            {...register("name", rules.name)}
                        />
                        {
                            errors.name && <div className='flex justify-start items-center gap-1 text-sm text-red-500 mx-1 capitalize'>
                                <IoIosWarning /> {errors.name.message}
                            </div>
                        }
                    </div>
                    <div>
                        <Label>Số Điện Thoại</Label>
                        <Input
                            type="text"
                            error={!!(errors.phone)}
                            {...register("phone", rules.phone)}
                        />
                        {
                            errors.phone && <div className='flex justify-start items-center gap-1 text-sm text-red-500 mx-1 capitalize'>
                                <IoIosWarning /> {errors.phone.message}
                            </div>
                        }
                    </div>
                    <div>
                        <Label>UID</Label>
                        <Input
                            type="text"
                            {...register("uid")}
                        />
                    </div>
                    <div>
                        <Label>Tình Trạng</Label>
                        <Input
                            type="text"
                            error={!!(errors.status)}
                            {...register("status")}
                        />
                    </div>
                    {
                        errors.status && <div className='flex justify-start items-center gap-1 text-sm text-red-500 mx-1 capitalize'>
                            <IoIosWarning /> {errors.status.message}
                        </div>
                    }
                    <div>
                        <Label>Nhãn</Label>
                        <Controller
                            control={form.control}
                            name="labels"
                            render={({ field }) => (
                                <MultiSelect
                                    placeholder="(Chưa Có Nhãn)"
                                    options={labels}
                                    value={field.value ?? []}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                />
                            )}
                        />
                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="text"
                            error={!!(errors.email)}
                            {...register("email", rules.email)}
                        />
                        {
                            errors.email && <div className='flex justify-start items-center gap-1 text-sm text-red-500 mx-1 capitalize'>
                                <IoIosWarning /> {errors.email.message}
                            </div>
                        }
                    </div>
                    <div>
                        <Label>Nguồn Khách</Label>
                        <Input
                            type="text"
                            error={!!(errors.source)}
                            {...register("source", rules.source)}
                        />
                        {
                            errors.source && <div className='flex justify-start items-center gap-1 text-sm text-red-500 mx-1 capitalize'>
                                <IoIosWarning /> {errors.source.message}
                            </div>
                        }
                    </div>
                    {
                        isLeader &&
                        <div>
                            <Label>Chỉ Định</Label>
                            <div className="relative">
                                <Select
                                    options={options}
                                    placeholder="Chọn Người Chăm Sóc"
                                    className="dark:bg-dark-900"
                                    {...register("assignId")}
                                />
                                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                    <FaAngleDown />
                                </span>
                                {
                                    errors.assignId && <div className='flex justify-start items-center gap-1 text-sm text-red-500 mx-1 capitalize'>
                                        <IoIosWarning /> {errors.assignId.message}
                                    </div>
                                }
                            </div>
                        </div>
                    }
                    <div className="space-y-6">
                        <div>
                            <Label>Ghi Chú</Label>
                            <TextArea
                                {...register("note")}
                            />
                        </div>

                    </div>
                    <div className='flex gap-3'>
                        <Button className='w-full flex-1' variant='outline' onClick={() => {
                            const event = new KeyboardEvent("keydown", { key: "Escape" });
                            window.dispatchEvent(event);
                        }}
                        >
                            Huỷ Bỏ
                        </Button>
                        <Button className='w-full flex-1'>
                            Thêm Mới
                        </Button>
                    </div>
                </div>

            </form>
        </ComponentCard >
    );
}
