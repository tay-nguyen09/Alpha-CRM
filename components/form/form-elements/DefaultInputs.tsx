"use client";
import ComponentCard from '../../common/ComponentCard';
import Label from '../Label';
import Input from '../input/InputField';
import { useForm, SubmitHandler } from "react-hook-form"
import { IoIosWarning } from "react-icons/io";
import TextArea from '../input/TextArea';
import React from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { firebaseFireStore } from '@/utils/shared/firebase';
import { toast } from 'react-toastify';
import { useUser } from '@clerk/nextjs';
import { timeStamp } from '@/utils/shared/common';
import { Button } from '@/components/ui/button';

type Inputs = {
  name: string
  phone: string
  email: string
  source: string
  note: string
}

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

export default function DefaultInputs() {
  const [isLoading, setIsLoading] = React.useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<Inputs>()
  const currentUser = useUser()

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      if (!currentUser.user) return Error()
      setIsLoading(true)
      const metadata = {
        ...data,
        createdAt: timeStamp(),
        actions: [],
        assign: [
          {
            assignAt: timeStamp(),
            employeeName: currentUser.user.fullName,
            uid: currentUser.user.id
          }
        ],
        label: [],
        lasteUpadteAt: timeStamp(),
        status: "Mới"
      }
      await addDoc(collection(firebaseFireStore, "users"), metadata)
      toast.success("Thành Công")
      setIsLoading(false)
      reset()
    } catch (error) {
      setIsLoading(false)
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
          <div className="space-y-6">
            <div>
              <Label>Ghi Chú</Label>
              <TextArea
                {...register("note")}
              />
            </div>

          </div>
          <div className='flex gap-3'>
            <Button className='w-full' variant='outline'>
              Huỷ Bỏ
            </Button>
            <Button className='w-full'>
              Thêm Mới
            </Button>
          </div>
        </div>

      </form>
    </ComponentCard >
  );
}
