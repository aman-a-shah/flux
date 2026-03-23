"use client";

import { useSearchParams } from "next/navigation";
import LoadingPage from "@/components/LoadingPage";

export default function LoadingRoute() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const modes = searchParams.get('modes')?.split(',') || [];
  const topic = searchParams.get('topic') || '';

  return (
    <LoadingPage
      sessionId={sessionId}
      selectedModes={modes}
      topic={topic}
    />
  );
}