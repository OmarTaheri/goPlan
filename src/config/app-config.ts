import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "GoPlan",
  version: packageJson.version,
  copyright: `© ${currentYear}, Al Akhawayn University.`,
  meta: {
    title: "GoPlan - Al Akhawayn University Degree Planner",
    description:
      "GoPlan is a degree planning application for Al Akhawayn University. Plan your academic journey, track your progress, and get advisor approval for your courses.",
  },
};
