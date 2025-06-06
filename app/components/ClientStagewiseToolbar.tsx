"use client";

import dynamic from "next/dynamic";

const StagewiseToolbar = dynamic(
  () => import("./StagewiseToolbar"),
  { ssr: false }
);

export default function ClientStagewiseToolbar() {
  return <StagewiseToolbar />;
} 