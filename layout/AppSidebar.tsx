"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaCalendarCheck, FaCaretDown, FaChartBar, FaLayerGroup, FaRegNewspaper, FaTrashAlt, FaUserFriends } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { useSidebar } from "../context/SidebarContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { HiDotsHorizontal } from "react-icons/hi";
import { FaMeta, FaPeopleGroup } from "react-icons/fa6";
import { MdGroup, MdOndemandVideo } from "react-icons/md";
import { GrDocumentPerformance, GrDocumentSound } from "react-icons/gr";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  isLeaderOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    icon: <IoGridOutline />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <GrDocumentPerformance />,
    name: "Hiệu Quả Công Việc",
    path: "/daily-tasks/work-efficiency",
  },
  {
    icon: <GrDocumentSound />,
    name: "Hiệu Quả Quảng Cáo",
    path: "/daily-tasks/ads-efficiency",
  },
  {
    icon: <MdGroup />,
    name: "Khách hàng",
    path: "/contacts",
  },
  {
    icon: <FaLayerGroup />,
    name: "Dữ Liệu Thả Nổi",
    path: "/free-contact",
  },
];

const othersItems: NavItem[] = [
  {
    name: "Meta Business Suite",
    icon: <FaMeta />,
    isLeaderOnly: true,
    subItems: [
      {
        name: "Login Meta",
        path: "/facebook-integration/login",
      },
      {
        name: "Danh Sách Liên hệ",
        path: "/facebook-integration/contacts",
      },
      {
        name: "Tin Nhắn",
        path: "/facebook-integration/messages",
      },
    ],
  },
  {
    name: "Quảng Cáo",
    icon: <FaChartBar />,
    isLeaderOnly: true,
    path: "/ads",

  },
  {
    name: "Nhân Viên",
    icon: <FaPeopleGroup />,
    isLeaderOnly: true,
    path: "/employees",

  },
  {
    icon: <FaTrashAlt />,
    name: "Thùng Rác",
    path: "/trash",
    isLeaderOnly: true,
  },
];

const webToolsItems: NavItem[] = [
  {
    name: "Bài Phân Tích",
    icon: <FaRegNewspaper />,
    path: "/analytic-posts",
    isLeaderOnly: true,
  },
  {
    name: "Videos Ngắn",
    icon: <MdOndemandVideo />,
    path: "/short-videos",
    isLeaderOnly: true,
  },
]

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { isLeader, isAdmin } = useCurrentUser();
  const pathname = usePathname();

  // Filter navItems based on admin status
  const filteredNavItems = navItems.filter(item => {
    if (item.isLeaderOnly) {
      return isLeader;
    }
    return true;
  });

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others" | "webTools";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  const derivedOpenSubmenu = React.useMemo(() => {
    for (const menuType of ["main", "others"] as ("main" | "others")[]) {
      const items = menuType === "main" ? navItems : othersItems;
      for (let index = 0; index < items.length; index++) {
        const nav = items[index];
        if (nav.subItems) {
          for (const subItem of nav.subItems) {
            if (isActive(subItem.path)) {
              return { type: menuType, index } as {
                type: "main" | "others";
                index: number;
              };
            }
          }
        }
      }
    }
    return null;
  }, [isActive]);

  const finalOpenSubmenu = openSubmenu ?? derivedOpenSubmenu;

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others" | "webTools"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => {
        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group  ${finalOpenSubmenu?.type === menuType && finalOpenSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                  } cursor-pointer ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                  }`}
              >
                <span
                  className={` ${finalOpenSubmenu?.type === menuType && finalOpenSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (

                  <FaCaretDown
                    className={`ml-auto w-5 h-5 transition-transform duration-200  ${finalOpenSubmenu?.type === menuType &&
                      finalOpenSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                      }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                >
                  <span
                    className={`${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text`}>{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    finalOpenSubmenu?.type === menuType && finalOpenSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                          }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  );


  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (finalOpenSubmenu !== null) {
      const key = `${finalOpenSubmenu.type}-${finalOpenSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [finalOpenSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others" | "webTools") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[260px]"
          : isHovered
            ? "w-[260px]"
            : "w-[70px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex gap-4 items-center">
              <Image
                className=""
                src="/images/logo/logo.webp"
                alt="Logo"
                width={50}
                height={50}
              />
              <div className="text-2xl font-bold bg-linear-to-br from-[#FF6F61] to-[#FF8E53] bg-clip-text text-transparent">
                ALPHA NET
              </div>
            </div>
          ) : (
            <Image
              src="/images/logo/logo.webp"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HiDotsHorizontal />
                )}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>
            {
              isLeader && (
                <div className="">
                  <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                      }`}
                  >
                    {isExpanded || isHovered || isMobileOpen ? (
                      "ADMIN TOOLS"
                    ) : (
                      <HiDotsHorizontal />
                    )}
                  </h2>
                  {renderMenuItems(othersItems, "others")}
                </div>
              )
            }
            {
              isAdmin && (
                <div className="">
                  <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                      }`}
                  >
                    {isExpanded || isHovered || isMobileOpen ? (
                      "WEB TOOLS"
                    ) : (
                      <HiDotsHorizontal />
                    )}
                  </h2>
                  {renderMenuItems(webToolsItems, "webTools")}
                </div>
              )
            }

          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
