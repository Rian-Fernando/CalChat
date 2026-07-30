"use client";

import dynamic from "next/dynamic";

/* `ssr: false` isn't allowed from a Server Component, and the landing page is
   one — so the dynamic import lives here, in the smallest possible client
   boundary. WebGL has nothing to render on the server anyway. */
const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), {
  ssr: false
});

export default function SceneBackground({ scrollScene = false }: { scrollScene?: boolean }) {
  return <ThreeBackground scrollScene={scrollScene} />;
}
