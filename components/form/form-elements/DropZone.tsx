"use client";
import React from "react";
import ComponentCard from "../../common/ComponentCard";
import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import SourceImgAndVideo from "@/components/common/SourceImgAndVideo";

type Props = {
  title?: string;
  value?: string;
  onChange?: (url: string) => void;
};

const DropzoneComponent: React.FC<Props> = ({ title = "", value, onChange }) => {
  return (
    <ComponentCard title={title}>
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        onSuccess={(result: CloudinaryUploadWidgetResults) => {
          const url = (result?.info as { secure_url?: string })?.secure_url;
          if (url && onChange) onChange(url);
        }}
      >
        {({ open }) => (
          <button
            type="button"
            className="transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500 w-full p-7 lg:p-10 bg-gray-50 dark:bg-gray-900"
            onClick={e => {
              e.preventDefault();
              open();
            }}
          >
            {value ? (
              <SourceImgAndVideo url={value} />
            ) : (
              <div className="dz-message flex flex-col items-center m-0!">
                <div className="mb-[22px] flex justify-center">
                  <div className="flex h-[68px] w-[68px]  items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    <svg className="fill-current" width="29" height="28" viewBox="0 0 29 28" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z" />
                    </svg>
                  </div>
                </div>
                <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
                  Tải lên hoặc kéo & thả hình ảnh
                </h4>
                <span className=" text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
                  Kéo thả file PNG, JPG, WebP, SVG hoặc nhấn để chọn
                </span>
                <span className="font-medium underline text-theme-sm text-brand-500">
                  Chọn
                </span>
              </div>
            )}
          </button>
        )}
      </CldUploadWidget>
    </ComponentCard>
  );
};

export default DropzoneComponent;
