"use client";
import { useAdmin } from "@/hooks/useAdmin";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUsers } from '@/hooks/useUsers';
import { getUserByDocId } from "@/lib/redux/features/firebase/firebaseAPI";
import { TypeUser } from '@/types/firebase';
import { TypeEdiUserFormData } from "@/types/form";
import { useUser } from '@clerk/nextjs';
import React from 'react';
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { FaAngleDown } from 'react-icons/fa';
import { IoIosWarning } from "react-icons/io";
import { toast } from 'react-toastify';
import ComponentCard from "../common/ComponentCard";
import Input from "./input/InputField";
import TextArea from "./input/TextArea";
import Label from "./Label";
import MultiSelect from './MultiSelect';
import Select from './Select';
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
        // VN numbers: 0xxxxxxxxx or +84xxxxxxxxx, prefixes 3/5/7/8/9
        pattern: {
            value: /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/,
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
        required: "Vui lòng Nguồn Khách !!",
    }
} as const;

type Props = {
    docId: string,
    isDisable?: boolean
}

export const labels = [
    {
        value: "Chưa Trả Lời",
        text: "Chưa Trả Lời",
    },
    {
        value: "Khách Tiềm Năng",
        text: "Khách Tiềm Năng",
    },
    {
        value: "Từ Chối",
        text: "Từ Chối",
    },
    {
        value: "Hẹn Lại",
        text: "Hẹn Lại",
    },
    {
        value: "Hứa Hẹn",
        text: "Hứa Hẹn",
    },
    {
        value: "Sắp Lên Vốn",
        text: "Sắp Lên Vốn",
    },
    {
        value: "Đang Giao Dịch",
        text: "Đang Giao Dịch",
    },
    {
        value: "Đã Đăng Ký",
        text: "Đã Đăng Ký",
    },
    {
        value: "Block",
        text: "Block",
    },
    {
        value: "Chờ Kết Bạn",
        text: "Chờ Kết Bạn",
    },
    {
        value: "Khách Chết",
        text: "Khách Chết",
    },
]

export default function EditContactForm({ docId, isDisable = false }: Props) {
    const form = useForm<TypeEdiUserFormData>({ defaultValues: { labels: [] } })
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = form
    const currentUser = useUser()

    const { clerkUsers } = useAdmin()
    const { isLeader } = useCurrentUser()
    const { updateUserByDocId } = useUsers()

    const options = React.useMemo(() => {
        return clerkUsers.map((user) => {
            return {
                value: user.id,
                label: user.username
            }
        })
    }, [clerkUsers])

    const onSubmit: SubmitHandler<TypeEdiUserFormData> = async (data) => {
        try {
            if (!currentUser.user) return Error()
            const payload: TypeEdiUserFormData = { ...data, labels: (data.labels ?? []).map(l => String(l ?? "").trim()) }
            updateUserByDocId({
                docId, data: payload,
                action: {
                    action: "edit_contact",
                    note: "Chinh Sửa Thông Tin Liên Hệ",
                }

            })
            toast.success("Thành Công")
            reset(payload)
        } catch (error) {
            toast.info("Lỗi, Vui Lòng Liên Hệ Dev !!")
            console.log(error)
        }
    }

    React.useEffect(() => {
        (async () => {
            try {
                const res = await getUserByDocId(docId)
                reset(res as TypeUser)
            } catch (error) {
                console.log(error);
            }
        })()
    }, [docId, reset])

    return (
        <ComponentCard >
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                    <div>
                        <Label>Tên</Label>
                        <Input
                            type="text"
                            error={!!(errors.name)}
                            disabled={isDisable}
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
                            disabled={isDisable}
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
                            disabled={isDisable}
                            {...register("uid")}
                        />
                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="text"
                            error={!!(errors.email)}
                            disabled={isDisable}
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
                            disabled={isDisable}
                            {...register("source", rules.source)}
                        />
                        {
                            errors.source && <div className='flex justify-start items-center gap-1 text-sm text-red-500 mx-1 capitalize'>
                                <IoIosWarning /> {errors.source.message}
                            </div>
                        }
                    </div>
                    <div>
                        <Label>Tình Trạng</Label>
                        <Input
                            type="text"
                            disabled={isDisable}
                            {...register("status")}
                        />
                    </div>
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
                                    disabled={isDisable}
                                />
                            )}
                        />
                    </div>
                    {
                        isLeader &&
                        <div>
                            <Label>Chỉ Định</Label>
                            <div className="relative">
                                <Select
                                    disabled={isDisable}
                                    options={options}
                                    placeholder="Chọn Người Chăm Sóc"
                                    className="dark:bg-dark-900"
                                />
                                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                    <FaAngleDown />
                                </span>
                            </div>
                        </div>
                    }
                    <div className="space-y-6">
                        <div>
                            <Label>Ghi Chú</Label>
                            <TextArea
                                disabled={isDisable}
                                {...register("note")}
                            />
                        </div>

                    </div>
                    {
                        !isDisable && <div className='flex gap-3'>
                            <Button type="button" className='flex-1' variant='outline'>
                                Huỷ Bỏ
                            </Button>
                            <Button className='flex-1' type="submit">
                                Cập Nhật
                            </Button>
                        </div>
                    }

                </div>
            </form>
        </ComponentCard >
    );
}
