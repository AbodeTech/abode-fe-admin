import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        // The tracker outgrew its "2000 campaign" framing. Permanent so any
        // bookmark or saved link follows it to the new namespace.
        source: "/campaigns/2000associateprocampaign",
        destination: "/associate-pros/tracker",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
