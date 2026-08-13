import type { DepartmentId } from "@/types";

export type DepartmentInstructor = {
  name: string;
  title: string;
  bio: string;
};

/**
 * Skillrr faculty shown on course cards, keyed by course department.
 */
export const DEPARTMENT_INSTRUCTORS: Record<DepartmentId, DepartmentInstructor> = {
  development: {
    name: "Riju Thomas",
    title: "Technical Architect · Development",
    bio: "Leads Skillrr development learning tracks and mentoring for engineers.",
  },
  qa: {
    name: "Vishnu Sankar",
    title: "QA Lead · Quality Assurance",
    bio: "Owns Skillrr QA curriculum, quality practice, and assessment standards.",
  },
  ba: {
    name: "Vishnu Sankar",
    title: "BA Lead · Business Analysis",
    bio: "Guides Skillrr business analysis learning paths and stakeholder practice.",
  },
  devops: {
    name: "Madhulal",
    title: "DevOps Lead",
    bio: "Leads Skillrr DevOps learning across delivery, reliability, and automation.",
  },
  hr: {
    name: "Aju Joseph",
    title: "Assistant Manager · HR",
    bio: "Owns Skillrr people and HR learning programs.",
  },
  marketing: {
    name: "Kevin Millet",
    title: "Digital Marketing Executive",
    bio: "Leads Skillrr digital marketing courses and campaign practice.",
  },
  uiux: {
    name: "Vishnuprasad P S",
    title: "UI Lead · Design",
    bio: "Leads Skillrr UI/UX learning tracks and design craft.",
  },
};

export function instructorAvatar(name: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}
