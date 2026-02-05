import React from 'react'

const SourceImgAndVideo = ({ url }: { url: string }) => {
    return url.match(/\.(mp4|webm|ogg)$/i) ? (
        <div className="flex justify-center items-center w-full">
            <video src={url} controls className="aspect-video w-full max-w-[400px] max-h-[300px] rounded-lg object-contain mb-4" />
        </div>
    ) : (
        <div className="flex justify-center items-center w-full">
            <img src={url} alt="Uploaded" className="aspect-square w-full max-w-[500px] max-h-[500px] rounded-lg object-contain mb-4" />
        </div>
    )
}

export default SourceImgAndVideo