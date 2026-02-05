import React from "react";

interface ComponentCardProps {
  title?: React.ReactNode | string; // Title can be a string or a React node
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
  button?: React.ReactNode
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  button,
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 ${className}`}
    >
      {/* Card Header */}
      {
        title ? <div className="px-6 py-5">
          <h3 className="text-3xl font-medium text-gray-800 dark:text-white/90 flex justify-between">
            {title}
            {button ? button : <></>}
          </h3>
          {desc && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {desc}
            </p>
          )}
        </div>
          : <></>
      }

      {/* Card Body */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
