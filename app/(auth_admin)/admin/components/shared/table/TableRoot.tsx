"use client";

import { ReactNode, useRef } from "react";
import useStickyColumnOffsets from "../../hooks/useStickyColumnOffsets";

type TableRootProps = {
  className?: string;
  stickyRightColumns?: number;
  children: ReactNode;
};

const TableRoot = ({ className, stickyRightColumns = 0, children }: TableRootProps) => {
  const ref = useRef<HTMLTableElement>(null);

  useStickyColumnOffsets(ref, stickyRightColumns);

  return (
    <table ref={ref} className={className}>
      {children}
    </table>
  );
};

export default TableRoot;
