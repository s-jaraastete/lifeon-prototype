"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";
import { Subscription } from "@/types/admin";
import SubscriptionDetailPanel from "./SubscriptionDetailPanel";
import UserDetailPanel from "./UserDetailPanel";
import OrganizationDetailPanel from "./OrganizationDetailPanel";

type DetailView = "subscription" | "user" | "organization";

type SelectedDetail = {
  view: DetailView;
  subscription: Subscription;
} | null;

type DetailContextValue = {
  openDetail: (subscription: Subscription) => void;
  openUserDetail: (subscription: Subscription) => void;
  openOrganizationDetail: (subscription: Subscription) => void;
};

type SubscriptionDetailProviderProps = {
  children: ReactNode;
};

const DetailContext = createContext<DetailContextValue | undefined>(undefined);

export const useSubscriptionDetail = () => useContext(DetailContext);

const SubscriptionDetailProvider = ({
  children,
}: SubscriptionDetailProviderProps) => {
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail>(null);

  const closeDetail = () => setSelectedDetail(null);

  return (
    <DetailContext.Provider
      value={{
        openDetail: (subscription) =>
          setSelectedDetail({ view: "subscription", subscription }),
        openUserDetail: (subscription) =>
          setSelectedDetail({ view: "user", subscription }),
        openOrganizationDetail: (subscription) =>
          setSelectedDetail({ view: "organization", subscription }),
      }}
    >
      {children}
      <SubscriptionDetailPanel
        open={selectedDetail?.view === "subscription"}
        subscription={
          selectedDetail?.view === "subscription"
            ? selectedDetail.subscription
            : null
        }
        onClose={closeDetail}
      />
      <UserDetailPanel
        open={selectedDetail?.view === "user"}
        subscription={
          selectedDetail?.view === "user" ? selectedDetail.subscription : null
        }
        onClose={closeDetail}
      />
      <OrganizationDetailPanel
        open={selectedDetail?.view === "organization"}
        subscription={
          selectedDetail?.view === "organization"
            ? selectedDetail.subscription
            : null
        }
        onClose={closeDetail}
      />
    </DetailContext.Provider>
  );
};

export default SubscriptionDetailProvider;
