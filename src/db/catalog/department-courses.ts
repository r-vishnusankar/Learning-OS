import type { DepartmentId, Difficulty, LearningLevel } from "@/types";
import {
  buildCoreConceptsMarkdown,
  buildPracticeMarkdown,
} from "@/db/catalog/lesson-content";
import { TOPIC_VIDEO } from "@/db/catalog/topic-video-map";

export type CatalogLesson = {
  title: string;
  type: "video" | "article" | "external_link";
  content: string;
  durationMinutes: number;
  isPreview?: boolean;
  learningObjectives?: string[];
};

export type CatalogCourse = {
  slug: string;
  title: string;
  description: string;
  departmentId: DepartmentId;
  level: LearningLevel;
  difficulty: Difficulty;
  durationMinutes: number;
  xpReward: number;
  tags: string[];
  thumbnailUrl: string;
  expectedVideoUrl: string;
  lessons: CatalogLesson[];
};

/** Department fallback if a topic is missing from TOPIC_VIDEO (should not happen). */
const DEPT_FALLBACK_VIDEO: Record<DepartmentId, string> = {
  development: "https://www.youtube.com/embed/30LWjhZzg50",
  qa: "https://www.youtube.com/embed/BBmA5Qp6Ghk",
  ba: "https://www.youtube.com/embed/UBVzucVpG7k",
  hr: "https://www.youtube.com/embed/A2HFusWQIeE",
  marketing: "https://www.youtube.com/embed/nU-IIXBWlS4",
  uiux: "https://www.youtube.com/embed/FTFaQWZBqQ8",
  devops: "https://www.youtube.com/embed/3c-iBn73dDE",
};

function videoForCourse(title: string, dept: DepartmentId): string {
  return TOPIC_VIDEO[title] ?? DEPT_FALLBACK_VIDEO[dept];
}

/** Expected intro video embed for a catalog course title (source of truth for audits). */
export function getExpectedVideoUrlForCourse(title: string, departmentId: DepartmentId): string {
  return videoForCourse(title, departmentId);
}

/** First video lesson content from a built catalog course. */
export function getExpectedIntroVideoFromLessons(lessons: CatalogLesson[]): string {
  const intro = lessons.find((l) => l.type === "video");
  return intro?.content ?? "";
}

function thumbnailFor(index: number, slug: string): string {
  // Deterministic unique image per course (picsum seed = slug).
  // Host allowlisted in next.config.ts
  void index;
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/800/450`;
}

const LEVELS: LearningLevel[] = [
  "beginner",
  "associate",
  "intermediate",
  "advanced",
  "senior",
  "lead",
  "architect",
  "expert",
];

/** Three topic titles per department × level. */
const TOPICS: Record<DepartmentId, Record<LearningLevel, [string, string, string]>> = {
  development: {
    beginner: ["Programming Fundamentals", "Git & Team Collaboration", "HTML CSS & Web Basics"],
    associate: ["JavaScript Essentials", "Intro to Databases", "Debugging & Code Quality"],
    intermediate: ["TypeScript for Apps", "React Component Patterns", "REST API Design"],
    advanced: ["System Design Essentials", "Performance Optimization", "Testing Strategies"],
    senior: ["Distributed Systems", "Domain-Driven Design", "Secure Coding Practices"],
    lead: ["Tech Leadership Craft", "Architecture Decision Records", "Mentoring Engineers"],
    architect: ["Enterprise Architecture", "Event-Driven Systems", "Platform Reliability"],
    expert: ["Staff Engineer Impact", "Org-Wide Technical Strategy", "Innovation Lab Projects"],
  },
  qa: {
    beginner: ["QA Mindset & Bug Lifecycle", "Manual Test Case Design", "Exploratory Testing Basics"],
    associate: ["Test Plans & Traceability", "API Testing Basics", "Defect Reporting Excellence"],
    intermediate: ["Automation with Playwright", "API Automation Patterns", "Regression Strategy"],
    advanced: ["Performance Testing Foundations", "Security Testing Essentials", "CI Test Pipelines"],
    senior: ["Test Architecture", "Risk-Based Testing", "Quality Metrics & Dashboards"],
    lead: ["QA Leadership", "Release Gate Governance", "Cross-Team Quality Rituals"],
    architect: ["Quality Engineering Systems", "Observability for Testers", "Shift-Left Platforms"],
    expert: ["Enterprise QE Strategy", "AI-Assisted Testing Ops", "Quality Transformation"],
  },
  ba: {
    beginner: ["Business Analysis Fundamentals", "Stakeholder Interviews", "Requirements Writing 101"],
    associate: ["User Stories & Acceptance Criteria", "Process Mapping Basics", "Workshop Facilitation"],
    intermediate: ["Data Analysis for BAs", "BPMN & Process Design", "Prioritization Frameworks"],
    advanced: ["Solution Assessment", "Non-Functional Requirements", "Change Impact Analysis"],
    senior: ["Product Discovery Collaboration", "Domain Modeling", "Business Case Craft"],
    lead: ["BA Practice Leadership", "Portfolio Requirements Governance", "Coaching Analysts"],
    architect: ["Enterprise Requirements Architecture", "Capability Mapping", "Value Stream Design"],
    expert: ["Strategic BA Partnership", "Transformation Roadmaps", "Executive Decision Support"],
  },
  hr: {
    beginner: ["People Ops Fundamentals", "Workplace Policies Overview", "Employee Lifecycle Basics"],
    associate: ["Recruiting Essentials", "Onboarding Playbooks", "HRIS Data Hygiene"],
    intermediate: ["Performance Conversations", "Learning Needs Analysis", "Compensation Basics"],
    advanced: ["Talent Development Programs", "Workforce Planning", "Employee Relations"],
    senior: ["Org Design Fundamentals", "Leadership Assessment", "Culture Systems"],
    lead: ["HR Business Partnering", "People Analytics", "Manager Enablement"],
    architect: ["People Systems Architecture", "Total Rewards Strategy", "DEI Program Design"],
    expert: ["Enterprise People Strategy", "Transformation Change Mgmt", "CHRO Partnership"],
  },
  marketing: {
    beginner: ["Digital Marketing Foundations", "Brand Messaging Basics", "Content Writing 101"],
    associate: ["SEO Essentials", "Social Media Campaigns", "Email Marketing Basics"],
    intermediate: ["Analytics & Attribution", "Paid Media Fundamentals", "Landing Page Conversion"],
    advanced: ["Growth Experimentation", "Marketing Automation", "Funnel Optimization"],
    senior: ["Brand Strategy Systems", "Demand Gen Playbooks", "Lifecycle Marketing"],
    lead: ["Marketing Team Leadership", "Budget & Channel Mix", "Agency Collaboration"],
    architect: ["MarTech Architecture", "Data-Driven Brand Systems", "Omnichannel Design"],
    expert: ["Enterprise Growth Strategy", "Category Creation", "CMO Partnership"],
  },
  uiux: {
    beginner: ["Design Thinking Basics", "Visual Hierarchy", "Figma Foundations"],
    associate: ["Wireframing & Flows", "Usability Heuristics", "Design Critiques"],
    intermediate: ["Interaction Design", "Design Systems Intro", "Accessibility Fundamentals"],
    advanced: ["Complex Product UX", "Research Synthesis", "Prototyping at Speed"],
    senior: ["Service Design", "UX Metrics & Experiments", "Cross-Platform Patterns"],
    lead: ["Design Leadership", "Stakeholder Alignment", "Design Ops Rituals"],
    architect: ["Enterprise Design Systems", "Multi-Product UX Architecture", "Inclusive Design at Scale"],
    expert: ["Design Strategy", "Org Design Maturity", "Principal Designer Impact"],
  },
  devops: {
    beginner: ["DevOps Culture Basics", "Linux Command Line", "Version Control for Ops"],
    associate: ["CI Pipelines Intro", "Containers Fundamentals", "Monitoring Basics"],
    intermediate: ["Docker Deep Dive", "Infrastructure as Code", "GitHub Actions Mastery"],
    advanced: ["Kubernetes Foundations", "Cloud Networking", "Incident Response"],
    senior: ["SRE Principles", "Platform Engineering", "Cost & Capacity Planning"],
    lead: ["DevOps Leadership", "Reliability Governance", "Team Topologies for Ops"],
    architect: ["Multi-Cloud Architecture", "Security & Compliance Pipelines", "Internal Developer Platforms"],
    expert: ["Enterprise Reliability Strategy", "Org-Wide Platform Roadmaps", "CTO Ops Partnership"],
  },
};

const DEPT_PRACTICE_LINK: Record<DepartmentId, string> = {
  development: "https://developer.mozilla.org/en-US/docs/Learn",
  qa: "https://playwright.dev/docs/intro",
  ba: "https://www.iiba.org/business-analysis-body-of-knowledge/",
  hr: "https://www.shrm.org/topics-tools",
  marketing: "https://developers.google.com/analytics",
  uiux: "https://www.figma.com/resource-library/",
  devops: "https://docs.github.com/en/actions",
};

const DEPT_LABEL: Record<DepartmentId, string> = {
  development: "Development",
  qa: "Quality Assurance",
  ba: "Business Analyst",
  hr: "Human Resources",
  marketing: "Digital Marketing",
  uiux: "UI/UX Design",
  devops: "DevOps",
};

function difficultyFor(level: LearningLevel): Difficulty {
  if (level === "beginner" || level === "associate") return "beginner";
  if (level === "intermediate") return "intermediate";
  return "advanced";
}

function hoursFor(level: LearningLevel): number {
  const map: Record<LearningLevel, number> = {
    beginner: 6,
    associate: 8,
    intermediate: 10,
    advanced: 12,
    senior: 14,
    lead: 12,
    architect: 16,
    expert: 18,
  };
  return map[level];
}

function xpFor(level: LearningLevel, track: number): number {
  const base: Record<LearningLevel, number> = {
    beginner: 200,
    associate: 280,
    intermediate: 360,
    advanced: 480,
    senior: 600,
    lead: 700,
    architect: 850,
    expert: 1000,
  };
  return base[level] + track * 40;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildLessons(
  dept: DepartmentId,
  title: string,
  track: number,
  level: LearningLevel
): CatalogLesson[] {
  const video = videoForCourse(title, dept);
  const practiceBody = buildPracticeMarkdown(dept, level, title);
  const practiceWithLink =
    track === 2
      ? `${practiceBody}\n\n### Reference resource\n\nOpen and skim: ${DEPT_PRACTICE_LINK[dept]}\n`
      : practiceBody;

  return [
    {
      title: `Introduction: ${title}`,
      type: "video",
      content: video,
      durationMinutes: 20 + track * 5,
      isPreview: true,
      learningObjectives: [
        `Understand the vocabulary of ${title}`,
        `Map one example to your ${DEPT_LABEL[dept]} work`,
        "Continue to Core Concepts with notes ready",
      ],
    },
    {
      title: `${title} — Core Concepts`,
      type: "article",
      content: buildCoreConceptsMarkdown(dept, level, title),
      durationMinutes: 25,
      learningObjectives: [
        `Explain ${title} in plain language`,
        "Apply one framework from this lesson",
        "Complete the mini case before the Practice Lab",
      ],
    },
    {
      title: `${title} — Practice Lab`,
      type: "article",
      content: practiceWithLink,
      durationMinutes: 40,
      learningObjectives: [
        "Produce the level deliverable for this course",
        "Get peer or manager feedback",
        "Add the artifact to your learning portfolio",
      ],
    },
  ];
}

export function buildDepartmentCourseCatalog(): CatalogCourse[] {
  const departments = Object.keys(TOPICS) as DepartmentId[];
  const courses: CatalogCourse[] = [];
  let index = 0;
  const missingVideos: string[] = [];

  for (const dept of departments) {
    for (const level of LEVELS) {
      const topics = TOPICS[dept][level];
      topics.forEach((topic, track) => {
        if (!TOPIC_VIDEO[topic]) missingVideos.push(`${dept}/${level}: ${topic}`);
        const slug = `${dept}-${level}-${slugify(topic)}`;
        courses.push({
          slug,
          title: topic,
          description: `${topic} for the ${DEPT_LABEL[dept]} track at ${level} level. Structured lessons with video, reading, and practice.`,
          departmentId: dept,
          level,
          difficulty: difficultyFor(level),
          durationMinutes: hoursFor(level) * 60,
          xpReward: xpFor(level, track),
          tags: [DEPT_LABEL[dept], level, topic.split(" ")[0]],
          thumbnailUrl: thumbnailFor(index, slug),
          expectedVideoUrl: videoForCourse(topic, dept),
          lessons: buildLessons(dept, topic, track, level),
        });
        index += 1;
      });
    }
  }

  if (missingVideos.length > 0) {
    console.warn(
      `[catalog] ${missingVideos.length} courses missing TOPIC_VIDEO (using dept fallback):\n` +
        missingVideos.slice(0, 10).join("\n")
    );
  }

  return courses;
}

export function catalogSummary() {
  const courses = buildDepartmentCourseCatalog();
  const byDept: Record<string, Record<string, string[]>> = {};
  for (const c of courses) {
    byDept[c.departmentId] ??= {};
    byDept[c.departmentId][c.level] ??= [];
    byDept[c.departmentId][c.level].push(c.title);
  }
  return { total: courses.length, byDept };
}
