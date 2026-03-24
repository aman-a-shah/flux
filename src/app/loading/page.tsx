"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import LoadingPage from "@/components/LoadingPage";

function LoadingContent() {
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

export default function LoadingRoute() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-white flex items-center justify-center">Loading...</div>}>
      <LoadingContent />
    </Suspense>
  );
}