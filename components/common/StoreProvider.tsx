"use client";
import { AppStore, makeStore } from "@/lib/redux/store";
import { setupListeners } from "@reduxjs/toolkit/query";
import type { ReactNode } from "react";
import React, { useState } from "react";
import { Provider } from "react-redux";

interface Props {
  readonly children: ReactNode;
}

export const StoreProvider = ({ children }: Props) => {
  const [store] = useState<AppStore>(() => makeStore());

  React.useEffect(() => {
    // configure listeners using the provided defaults
    // optional, but required for `refetchOnFocus`/`refetchOnReconnect` behaviors
    const unsubscribe = setupListeners(store.dispatch);
    return unsubscribe;
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
};
