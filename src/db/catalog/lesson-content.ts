import type { DepartmentId, LearningLevel } from "@/types";

const DEPT_LABEL: Record<DepartmentId, string> = {
  development: "Development",
  qa: "Quality Assurance",
  ba: "Business Analyst",
  hr: "Human Resources",
  marketing: "Digital Marketing",
  uiux: "UI/UX Design",
  devops: "DevOps",
};

const LEVEL_LABEL: Record<LearningLevel, string> = {
  beginner: "Beginner",
  associate: "Associate",
  intermediate: "Intermediate",
  advanced: "Advanced",
  senior: "Senior",
  lead: "Lead",
  architect: "Architect",
  expert: "Expert",
};

type Playbook = {
  mission: string;
  principles: string[];
  tools: string[];
  metrics: string[];
  stakeholders: string[];
};

const PLAYBOOKS: Record<DepartmentId, Playbook> = {
  development: {
    mission: "Ship reliable software that creates business value with sustainable engineering practices.",
    principles: [
      "Prefer clarity over cleverness",
      "Automate repetitive verification",
      "Design for change with small, reversible steps",
      "Own production outcomes, not only code merges",
    ],
    tools: ["TypeScript", "Git", "CI pipelines", "Observability dashboards", "Code review"],
    metrics: ["Lead time", "Change failure rate", "MTTR", "Code review turnaround"],
    stakeholders: ["Product managers", "QA", "DevOps", "Support"],
  },
  qa: {
    mission: "Protect customer trust by finding risk early and making quality measurable.",
    principles: [
      "Risk-based coverage beats exhaustive busywork",
      "Bugs are communication — write them for fixers",
      "Automate regression; explore for discovery",
      "Quality is a team sport with clear release gates",
    ],
    tools: ["Test plans", "Playwright", "API clients", "Defect trackers", "CI test reports"],
    metrics: ["Escape defects", "Automation stability", "Cycle time to verify", "Flaky test rate"],
    stakeholders: ["Developers", "Product", "Release managers", "Support"],
  },
  ba: {
    mission: "Translate business intent into clear, testable requirements that teams can deliver.",
    principles: [
      "Outcomes over feature lists",
      "Make assumptions visible and validated",
      "Write for implementers and testers",
      "Facilitate decisions; do not hide trade-offs",
    ],
    tools: ["User stories", "Process maps", "Workshops", "Acceptance criteria", "Traceability matrices"],
    metrics: ["Requirement churn", "Story readiness", "Defects from ambiguity", "Time-to-decision"],
    stakeholders: ["Business owners", "Product", "Engineering", "Compliance"],
  },
  hr: {
    mission: "Build people systems that attract, grow, and retain talent fairly and effectively.",
    principles: [
      "Policy must be clear and consistently applied",
      "Manager enablement multiplies HR impact",
      "Data informs; conversations decide",
      "Employee experience is a product",
    ],
    tools: ["HRIS", "Performance frameworks", "Learning plans", "Surveys", "Career ladders"],
    metrics: ["Time-to-fill", "Engagement", "Internal mobility", "Manager effectiveness"],
    stakeholders: ["Employees", "Managers", "Leadership", "Legal/Compliance"],
  },
  marketing: {
    mission: "Create demand and brand preference with measurable, ethical growth loops.",
    principles: [
      "Message-market fit before channel scale",
      "Instrument everything you intend to improve",
      "Experiments beat opinions",
      "Brand consistency compounds trust",
    ],
    tools: ["Analytics", "CMS", "Email platforms", "Paid media", "CRM"],
    metrics: ["CAC", "Conversion rate", "Pipeline influence", "Retention/LTV"],
    stakeholders: ["Sales", "Product", "Brand", "Finance"],
  },
  uiux: {
    mission: "Design usable, accessible experiences that reduce friction and increase clarity.",
    principles: [
      "Evidence over taste debates",
      "Accessibility is a baseline, not a phase",
      "Systems scale craft",
      "Prototype to learn, not to impress",
    ],
    tools: ["Figma", "Design systems", "Usability tests", "Journey maps", "Prototypes"],
    metrics: ["Task success", "Time-on-task", "Accessibility score", "Design debt"],
    stakeholders: ["Product", "Engineering", "Customers", "Support"],
  },
  devops: {
    mission: "Enable fast, safe delivery through platforms, automation, and operational excellence.",
    principles: [
      "You build it, you run it — with platform support",
      "Automation over tribal knowledge",
      "Observability before heroics",
      "Security and reliability are continuous",
    ],
    tools: ["CI/CD", "Containers", "IaC", "Cloud", "Incident tooling"],
    metrics: ["Deployment frequency", "MTTR", "Error budgets", "Platform adoption"],
    stakeholders: ["Developers", "Security", "SRE", "Leadership"],
  },
};

const LEVEL_FOCUS: Record<LearningLevel, { outcome: string; depth: string; deliverable: string }> = {
  beginner: {
    outcome: "Build foundational vocabulary and safe first practices.",
    depth: "Focus on definitions, examples, and guided steps.",
    deliverable: "A one-page summary of concepts + one small practice artifact.",
  },
  associate: {
    outcome: "Apply standard playbooks with light supervision.",
    depth: "Connect concepts to templates and day-to-day workflows.",
    deliverable: "A completed template used on a real or sample scenario.",
  },
  intermediate: {
    outcome: "Own end-to-end tasks and improve existing processes.",
    depth: "Trade-offs, tooling choices, and measurable outcomes.",
    deliverable: "A proposal or implementation plan with success metrics.",
  },
  advanced: {
    outcome: "Handle ambiguous problems and coach peers.",
    depth: "Edge cases, failure modes, and cross-team coordination.",
    deliverable: "A reviewed design/decision record with risks and mitigations.",
  },
  senior: {
    outcome: "Set technical/practice direction for a domain area.",
    depth: "Systems thinking, standards, and long-horizon impact.",
    deliverable: "A standards draft or roadmap slice for the team.",
  },
  lead: {
    outcome: "Lead people and rituals that raise team capability.",
    depth: "Coaching, prioritization, and operating cadence.",
    deliverable: "A team operating plan (rituals, ownership, KPIs).",
  },
  architect: {
    outcome: "Design durable systems spanning products and teams.",
    depth: "Interfaces, constraints, and multi-year evolution paths.",
    deliverable: "An architecture/capability map with decision options.",
  },
  expert: {
    outcome: "Shape org-wide strategy and executive partnerships.",
    depth: "Portfolio trade-offs, narrative for leadership, and transformation bets.",
    deliverable: "An executive brief with options, costs, and recommended path.",
  },
};

/** Topic-specific teaching points keyed by exact course title. */
const TOPIC_POINTS: Record<string, string[]> = {
  // Development
  "Programming Fundamentals": [
    "Variables, control flow, and functions as the core building blocks",
    "How types and naming reduce cognitive load",
    "Reading error messages and using a debugger",
    "Breaking a problem into small, testable steps",
  ],
  "Git & Team Collaboration": [
    "Commit messages as project history for teammates",
    "Branching strategies (trunk-based vs short-lived feature branches)",
    "Pull requests: intent, screenshots, and review etiquette",
    "Resolving conflicts without losing intent",
  ],
  "HTML CSS & Web Basics": [
    "Semantic HTML for accessibility and SEO",
    "Box model, layout (flex/grid), and responsive breakpoints",
    "Separation of structure, presentation, and behavior",
    "Browser DevTools for inspecting layout issues",
  ],
  "JavaScript Essentials": [
    "Closures, async/await, and the event loop at a practical level",
    "Immutable updates and avoiding shared mutable state",
    "Modules, packages, and dependency hygiene",
    "Defensive coding for null/undefined and API failures",
  ],
  "Intro to Databases": [
    "Relational vs document models and when each fits",
    "Primary keys, foreign keys, and basic normalization",
    "CRUD queries and indexes that matter for common reads",
    "Migrations as versioned schema change",
  ],
  "Debugging & Code Quality": [
    "Reproduce → isolate → fix → prevent recurrence",
    "Logging vs debugging vs tracing",
    "Linters, formatters, and code smells",
    "Writing regression tests for bugs you fixed",
  ],
  "TypeScript for Apps": [
    "Structural typing, unions, and narrowing",
    "Typing React props/hooks without `any`",
    "Zod (or similar) for runtime validation at boundaries",
    "Gradual adoption strategies in large codebases",
  ],
  "React Component Patterns": [
    "Composition over inheritance; container vs presentational thinking",
    "Controlled inputs and lifting state thoughtfully",
    "Effects: when not to use them",
    "Performance: memoization only with measured need",
  ],
  "REST API Design": [
    "Resource naming, status codes, and idempotency",
    "Pagination, filtering, and versioning strategies",
    "Authn/authz at the edge",
    "Contract testing and OpenAPI as living docs",
  ],
  "System Design Essentials": [
    "Latency, throughput, and consistency trade-offs",
    "Caching, queues, and load balancing roles",
    "Single points of failure and redundancy",
    "Drawing a request path end-to-end",
  ],
  "Performance Optimization": [
    "Measure first: profiles, Web Vitals, query plans",
    "N+1 queries, over-fetching, and payload size",
    "Caching layers and invalidation pain",
    "Budgets and performance regression gates in CI",
  ],
  "Testing Strategies": [
    "Unit vs integration vs e2e: the test pyramid in practice",
    "Test doubles and when fakes beat mocks",
    "Flaky tests as a reliability problem",
    "Coverage as a signal, not a goal",
  ],
  "Distributed Systems": [
    "Partitions, retries, and idempotent consumers",
    "CAP/PACELC as decision frames, not slogans",
    "Outbox/inbox patterns for reliable messaging",
    "Observability across service boundaries",
  ],
  "Domain-Driven Design": [
    "Bounded contexts and ubiquitous language",
    "Aggregates, invariants, and transaction boundaries",
    "Anti-corruption layers between systems",
    "Event storming for shared understanding",
  ],
  "Secure Coding Practices": [
    "OWASP Top 10 mapped to your stack",
    "Input validation, output encoding, secrets management",
    "Least privilege for tokens and roles",
    "Dependency scanning and patch cadence",
  ],
  "Tech Leadership Craft": [
    "Influencing without authority",
    "Making technical decisions legible to non-engineers",
    "Balancing roadmap delivery with engineering health",
    "Creating psychological safety in reviews",
  ],
  "Architecture Decision Records": [
    "When an ADR is worth writing",
    "Context → options → decision → consequences",
    "Keeping ADRs discoverable and alive",
    "Revisiting decisions without blame",
  ],
  "Mentoring Engineers": [
    "Goal setting and feedback loops",
    "Pairing vs reviewing vs shadowing",
    "Growth plans tied to real work",
    "Avoiding hero mentoring that creates bottlenecks",
  ],
  "Enterprise Architecture": [
    "Capability maps and integration styles",
    "Standards vs autonomy tension",
    "Reference architectures and exceptions process",
    "Tech radar for adoptable tools",
  ],
  "Event-Driven Systems": [
    "Events vs commands vs queries",
    "Schema evolution and consumer contracts",
    "At-least-once delivery realities",
    "Dead-letter queues and replay strategies",
  ],
  "Platform Reliability": [
    "SLIs/SLOs and error budgets",
    "Graceful degradation patterns",
    "Chaos and game days at sensible scale",
    "Runbooks that juniors can execute",
  ],
  "Staff Engineer Impact": [
    "Choosing high-leverage problems",
    "Writing that multiplies (RFCs, guides, talks)",
    "Unblocking teams across org boundaries",
    "Measuring impact beyond personal code output",
  ],
  "Org-Wide Technical Strategy": [
    "Aligning tech bets to business outcomes",
    "Portfolio view: invest / maintain / retire",
    "Sequencing migrations safely",
    "Communicating strategy in one narrative",
  ],
  "Innovation Lab Projects": [
    "Timeboxed experiments with clear kill criteria",
    "Prototype fidelity vs learning speed",
    "Graduation path from lab to product",
    "IP, security, and compliance early checks",
  ],

  // QA
  "QA Mindset & Bug Lifecycle": [
    "Quality as risk management, not gatekeeping",
    "Severity vs priority; customer impact language",
    "Bug lifecycle: new → triage → fix → verify → close",
    "Reproducing with environment and data notes",
  ],
  "Manual Test Case Design": [
    "Equivalence partitioning and boundary values",
    "Happy path vs negative vs edge cases",
    "Traceability from requirement to case",
    "Maintaining cases as living assets",
  ],
  "Exploratory Testing Basics": [
    "Charters and timeboxed sessions",
    "Note-taking that turns into bugs and ideas",
    "Touring techniques (feature, data, workflow)",
    "When exploration beats scripted cases",
  ],
  "Test Plans & Traceability": [
    "Scope, in/out, entry/exit criteria",
    "Risk heatmaps driving coverage",
    "Requirements ↔ cases ↔ defects links",
    "Sign-off evidence for audits",
  ],
  "API Testing Basics": [
    "Status codes, schemas, and contract checks",
    "Auth headers and negative auth cases",
    "Idempotency and pagination pitfalls",
    "Environment data setup for APIs",
  ],
  "Defect Reporting Excellence": [
    "Title that states the failure mode",
    "Steps, expected, actual, evidence",
    "Environment + build + user role",
    "Collaboration etiquette with developers",
  ],
  "Automation with Playwright": [
    "Stable selectors and user-facing assertions",
    "Page object vs fixture patterns",
    "Parallelism and CI integration",
    "Avoiding over-automation of volatile UI",
  ],
  "API Automation Patterns": [
    "Arrange-act-assert for HTTP",
    "Shared auth and data factories",
    "Contract tests vs end-to-end API journeys",
    "Flake control for network timing",
  ],
  "Regression Strategy": [
    "Smoke vs full regression suites",
    "Change-based selection of tests",
    "Release candidate gates",
    "Debt: pruning obsolete cases",
  ],
  "Performance Testing Foundations": [
    "Load, stress, soak — different questions",
    "Defining SLAs before scripts",
    "Bottleneck reading from metrics",
    "Avoiding misleading synthetic results",
  ],
  "Security Testing Essentials": [
    "AuthZ bypass and injection classes",
    "Sensitive data in logs and responses",
    "Dependency CVEs triage",
    "Partnering with AppSec for deep scans",
  ],
  "CI Test Pipelines": [
    "Fail-fast feedback under 15–20 minutes",
    "Quarantine vs fix for flaky tests",
    "Artifacts: reports, videos, traces",
    "Branch policies that protect main",
  ],
  "Test Architecture": [
    "Layers of test assets and ownership",
    "Shared libraries vs team autonomy",
    "Data strategy for reliable environments",
    "Scaling suites without linear cost",
  ],
  "Risk-Based Testing": [
    "Scoring likelihood × impact",
    "Focusing scarce time on critical journeys",
    "Communicating residual risk clearly",
    "Updating risk as product evolves",
  ],
  "Quality Metrics & Dashboards": [
    "Leading vs lagging quality indicators",
    "Escape analysis and root-cause themes",
    "Dashboard hygiene (no vanity metrics)",
    "Using metrics in retros, not blame",
  ],
  "QA Leadership": [
    "Hiring and leveling for QE skills",
    "Balancing speed pressure with quality",
    "Building partnerships with eng managers",
    "Career paths for SDETs and analysts",
  ],
  "Release Gate Governance": [
    "Mandatory checks vs advisory signals",
    "Exception process with time-bound waivers",
    "Evidence packs for go/no-go",
    "Post-release monitoring ownership",
  ],
  "Cross-Team Quality Rituals": [
    "Bug bashes, quality councils, triad reviews",
    "Shared definition of done",
    "Handoffs that don't drop context",
    "Celebrating prevention, not only detection",
  ],
  "Quality Engineering Systems": [
    "Platforms for test data, environments, reporting",
    "Self-serve quality tooling for squads",
    "Standards encoded as templates/linters",
    "Measuring adoption of QE platforms",
  ],
  "Observability for Testers": [
    "Logs, metrics, traces in defect evidence",
    "Synthetic monitors as continuous tests",
    "Using prod signals to prioritize suites",
    "Privacy constraints on test data",
  ],
  "Shift-Left Platforms": [
    "Unit/contract tests in developer workflow",
    "PR checks that teach, not only block",
    "Local environments that match prod enough",
    "Education content embedded in tooling",
  ],
  "Enterprise QE Strategy": [
    "Multi-year quality maturity model",
    "Central vs federated QE operating model",
    "Budgeting automation and environments",
    "Board-level quality narrative",
  ],
  "AI-Assisted Testing Ops": [
    "Where AI helps (case drafts, flake triage)",
    "Where humans stay accountable",
    "Prompting with domain context safely",
    "Evaluating AI suggestions before merge",
  ],
  "Quality Transformation": [
    "Diagnosing culture vs tooling gaps",
    "Change program with champions and milestones",
    "Quick wins that fund deeper change",
    "Sustaining practices after the program ends",
  ],

  // BA
  "Business Analysis Fundamentals": [
    "Problem framing before solutioning",
    "Stakeholder map and influence",
    "Current vs future state",
    "BABOK-aligned knowledge areas in practice",
  ],
  "Stakeholder Interviews": [
    "Interview guides and open questions",
    "Active listening and paraphrasing needs",
    "Separating wants from underlying jobs",
    "Capturing decisions and open questions",
  ],
  "Requirements Writing 101": [
    "Clear, testable, unambiguous statements",
    "Shall/should language and constraints",
    "Non-functional requirements early",
    "Versioning and change control basics",
  ],
  "User Stories & Acceptance Criteria": [
    "As a… I want… so that… with real value",
    "INVEST qualities",
    "Given/When/Then acceptance criteria",
    "Splitting stories without losing outcomes",
  ],
  "Process Mapping Basics": [
    "SIPOC and swimlanes",
    "Happy path vs exception paths",
    "Handoffs as defect hotspots",
    "Validating maps with operators",
  ],
  "Workshop Facilitation": [
    "Agendas, parking lots, and timeboxes",
    "Divergent then convergent techniques",
    "Managing dominant voices fairly",
    "Outputs that become backlog-ready",
  ],
  "Data Analysis for BAs": [
    "Asking measurable questions",
    "Basic metrics, cohorts, and funnels",
    "Avoiding correlation/causation traps",
    "Visuals that support decisions",
  ],
  "BPMN & Process Design": [
    "Events, gateways, and tasks",
    "Modeling as-is vs to-be",
    "Automation candidates in processes",
    "Governance of process ownership",
  ],
  "Prioritization Frameworks": [
    "RICE, MoSCoW, WSJF — pick with context",
    "Cost of delay thinking",
    "Facilitating trade-off conversations",
    "Re-prioritizing when evidence changes",
  ],
  "Solution Assessment": [
    "Fit-gap analysis for packages/build",
    "Constraints: cost, risk, compliance",
    "PoC design for critical unknowns",
    "Recommendation with options A/B/C",
  ],
  "Non-Functional Requirements": [
    "Performance, security, availability, usability",
    "Making NFRs measurable",
    "Tracing NFRs into tests and ops",
    "Negotiating NFR trade-offs explicitly",
  ],
  "Change Impact Analysis": [
    "People, process, technology, data impacts",
    "Communication and training needs",
    "Rollback and contingency thinking",
    "Measuring adoption after release",
  ],
  "Product Discovery Collaboration": [
    "Dual-track discovery/delivery",
    "Assumptions backlog and experiments",
    "Partnering with design and engineering",
    "Kill criteria for ideas",
  ],
  "Domain Modeling": [
    "Entities, relationships, and language",
    "Aligning model with bounded contexts",
    "Avoiding anemic requirement lists",
    "Using models in story writing",
  ],
  "Business Case Craft": [
    "Problem, options, benefits, costs, risks",
    "Financial and strategic benefit types",
    "Sensitivity analysis for key assumptions",
    "Executive-ready narrative structure",
  ],
  "BA Practice Leadership": [
    "Standards, templates, and coaching",
    "Quality bar for requirement packages",
    "Community of practice rituals",
    "Hiring and leveling BAs",
  ],
  "Portfolio Requirements Governance": [
    "Intake, triage, and demand shaping",
    "Dependency management across initiatives",
    "Traceability at portfolio scale",
    "Avoiding local optimization",
  ],
  "Coaching Analysts": [
    "Shadowing and feedback on artifacts",
    "Pairing on hard stakeholder situations",
    "Building facilitation confidence",
    "Career ladders for BA craft",
  ],
  "Enterprise Requirements Architecture": [
    "Requirement repositories and ownership",
    "Interfaces between programs",
    "Compliance and audit evidence",
    "Scaling BA capacity with tooling",
  ],
  "Capability Mapping": [
    "Business capabilities vs applications",
    "Heatmaps for investment decisions",
    "Linking capabilities to outcomes",
    "Avoiding org-chart-shaped maps",
  ],
  "Value Stream Design": [
    "End-to-end flow from request to value",
    "Wait time vs touch time",
    "Bottlenecks and policy constraints",
    "Designing future-state streams",
  ],
  "Strategic BA Partnership": [
    "Operating as a trusted advisor",
    "Framing choices for executives",
    "Aligning initiatives to strategy themes",
    "Ethics and transparency in analysis",
  ],
  "Transformation Roadmaps": [
    "Waves, dependencies, and change load",
    "Quick wins vs structural bets",
    "Measuring transformation outcomes",
    "Communication cadence for sponsors",
  ],
  "Executive Decision Support": [
    "One-page briefs and decision memos",
    "Options with trade-offs and recommendations",
    "Pre-wiring stakeholders before meetings",
    "Capturing decisions and owners",
  ],

  // HR
  "People Ops Fundamentals": [
    "Employee lifecycle stages",
    "Service mindset for people ops",
    "Confidentiality and fairness baselines",
    "Partnering with managers as customers",
  ],
  "Workplace Policies Overview": [
    "Policy purpose vs rule lists",
    "Consistent application and exceptions",
    "Communication and acknowledgment",
    "Keeping policies current with law",
  ],
  "Employee Lifecycle Basics": [
    "Join → grow → transition → exit",
    "Moments that matter for experience",
    "Handoffs between TA, HRBP, L&D",
    "Data accuracy across systems",
  ],
  "Recruiting Essentials": [
    "Intake briefs and scorecards",
    "Structured interviews to reduce bias",
    "Candidate experience SLAs",
    "Offer process and compliance checks",
  ],
  "Onboarding Playbooks": [
    "30-60-90 plans",
    "Role clarity and buddy systems",
    "Systems access and first-week rituals",
    "Measuring onboarding success",
  ],
  "HRIS Data Hygiene": [
    "Single sources of truth for people data",
    "Access controls and privacy",
    "Audit trails for changes",
    "Integrations that don't corrupt fields",
  ],
  "Performance Conversations": [
    "Continuous feedback vs annual-only",
    "Goal quality (OKRs/KPIs)",
    "Difficult conversations with respect",
    "Documentation that is fair and factual",
  ],
  "Learning Needs Analysis": [
    "Skill gaps vs motivation gaps",
    "Role-based curricula",
    "Manager input + self assessment",
    "Prioritizing L&D investments",
  ],
  "Compensation Basics": [
    "Bands, ranges, and equity hygiene",
    "Internal equity vs market",
    "Communicating pay decisions",
    "Compliance and confidentiality",
  ],
  "Talent Development Programs": [
    "High-potential vs high-performance",
    "Rotations, projects, and mentoring",
    "Measuring program ROI carefully",
    "Inclusion in selection criteria",
  ],
  "Workforce Planning": [
    "Demand forecasting by capability",
    "Build / buy / borrow talent options",
    "Scenario planning for growth/cuts",
    "Aligning headcount to strategy",
  ],
  "Employee Relations": [
    "Intake, investigation, and fairness",
    "Documentation standards",
    "Manager coaching for early issues",
    "Escalation paths and legal partnership",
  ],
  "Org Design Fundamentals": [
    "Spans, layers, and decision rights",
    "Designing for collaboration, not politics",
    "Change impacts of restructures",
    "Communicating org changes",
  ],
  "Leadership Assessment": [
    "Competency models and evidence",
    "360s and calibration hygiene",
    "Development plans for leaders",
    "Avoiding bias in ratings",
  ],
  "Culture Systems": [
    "Values → behaviors → rituals → rewards",
    "Measuring culture with care",
    "Manager as culture carrier",
    "Repairing culture after incidents",
  ],
  "HR Business Partnering": [
    "Diagnosing business people problems",
    "Influencing leaders with data + story",
    "Prioritizing scarce HR capacity",
    "Trusted advisor operating cadence",
  ],
  "People Analytics": [
    "Questions before dashboards",
    "Attrition, engagement, and mobility metrics",
    "Privacy-preserving analysis",
    "Turning insights into experiments",
  ],
  "Manager Enablement": [
    "Toolkits for 1:1s, feedback, hiring",
    "Just-in-time learning for managers",
    "Communities of practice for people leaders",
    "Measuring manager effectiveness",
  ],
  "People Systems Architecture": [
    "HR tech stack map and owners",
    "Integration patterns and identity",
    "Employee self-service journeys",
    "Vendor governance",
  ],
  "Total Rewards Strategy": [
    "Pay + benefits + recognition + growth",
    "Segmenting employee value props",
    "Cost modeling and trade-offs",
    "Communication of total rewards",
  ],
  "DEI Program Design": [
    "Goals, metrics, and accountability",
    "Inclusive hiring and advancement",
    "ERGs and psychological safety",
    "Avoiding performative initiatives",
  ],
  "Enterprise People Strategy": [
    "Multi-year people roadmap",
    "Linking people strategy to business strategy",
    "Board/CHRO narrative",
    "Capability building at scale",
  ],
  "Transformation Change Mgmt": [
    "ADKAR/Kotter as practical checklists",
    "Sponsor coalition and resistance handling",
    "Comms waves and training design",
    "Adoption metrics after go-live",
  ],
  "CHRO Partnership": [
    "What CHROs need from operators",
    "Risk, brand, and talent trade-offs",
    "Decision memos for people bets",
    "Crisis readiness for people issues",
  ],

  // Marketing
  "Digital Marketing Foundations": [
    "Awareness → consideration → conversion → loyalty",
    "Owned, earned, paid media",
    "Positioning and ICP clarity",
    "Ethics and privacy baselines",
  ],
  "Brand Messaging Basics": [
    "Value props and proof points",
    "Voice/tone guidelines",
    "Message hierarchy for channels",
    "Consistency without rigidity",
  ],
  "Content Writing 101": [
    "Audience jobs and reading level",
    "Headlines, scannability, CTAs",
    "SEO-aware writing without stuffing",
    "Editing for clarity and truth",
  ],
  "SEO Essentials": [
    "Intent matching and keyword themes",
    "On-page, technical, and authority factors",
    "Content briefs that help writers",
    "Measurement with Search Console",
  ],
  "Social Media Campaigns": [
    "Platform norms and creative formats",
    "Campaign briefs and calendars",
    "Community management basics",
    "Measuring reach vs meaningful engagement",
  ],
  "Email Marketing Basics": [
    "List hygiene and consent",
    "Lifecycle journeys vs blasts",
    "Subject lines, previews, and CTAs",
    "Deliverability fundamentals",
  ],
  "Analytics & Attribution": [
    "UTMs and event taxonomy",
    "Last-click limits; multi-touch options",
    "Dashboards for decisions",
    "Data quality and privacy constraints",
  ],
  "Paid Media Fundamentals": [
    "Campaign structure and budgets",
    "Creative testing loops",
    "Audience targeting responsibly",
    "ROAS/CAC interpretation",
  ],
  "Landing Page Conversion": [
    "Message match from ad to page",
    "Friction audit of forms",
    "Social proof and trust cues",
    "A/B test design basics",
  ],
  "Growth Experimentation": [
    "Hypothesis → metric → experiment → learn",
    "Sample size and duration caution",
    "ICE prioritization for experiments",
    "Documenting learnings in a wiki",
  ],
  "Marketing Automation": [
    "Triggers, segments, and journeys",
    "Lead scoring hygiene",
    "Sales handoff SLAs",
    "Avoiding spammy over-automation",
  ],
  "Funnel Optimization": [
    "Stage conversion diagnostics",
    "Leak analysis with qualitative insight",
    "Offer and friction experiments",
    "Full-funnel reporting cadence",
  ],
  "Brand Strategy Systems": [
    "Brand architecture and portfolio",
    "Guidelines that scale to agencies",
    "Brand health tracking",
    "Crisis and reputation basics",
  ],
  "Demand Gen Playbooks": [
    "Pipeline creation vs brand campaigns",
    "Integrated channel plans",
    "MQL definitions that sales accepts",
    "Quarterly planning rituals",
  ],
  "Lifecycle Marketing": [
    "Onboarding, activation, expansion, win-back",
    "Cohort views of retention",
    "Personalization with consent",
    "Product-marketing collaboration",
  ],
  "Marketing Team Leadership": [
    "Role clarity across brand/growth/content",
    "Creative quality bars",
    "Agency management",
    "Career paths for marketers",
  ],
  "Budget & Channel Mix": [
    "Zero-based vs incremental budgeting",
    "Diversification vs focus",
    "Scenario planning for spend cuts",
    "Finance partnership and forecasts",
  ],
  "Agency Collaboration": [
    "Briefs, SLAs, and feedback loops",
    "IP and brand safety",
    "Performance reviews of partners",
    "Insource vs outsource decisions",
  ],
  "MarTech Architecture": [
    "Stack map: data, engagement, analytics",
    "Identity resolution challenges",
    "Integration ownership",
    "Vendor evaluation scorecards",
  ],
  "Data-Driven Brand Systems": [
    "Brand + performance data together",
    "Creative insights from experiments",
    "Guardrails so data doesn't flatten brand",
    "Shared language with leadership",
  ],
  "Omnichannel Design": [
    "Consistent journeys across channels",
    "Orchestration vs channel silos",
    "Measurement across touchpoints",
    "Operational playbooks for handoffs",
  ],
  "Enterprise Growth Strategy": [
    "Growth model for the business",
    "North-star metric selection",
    "Portfolio of growth bets",
    "Executive storytelling with evidence",
  ],
  "Category Creation": [
    "Category narrative and education content",
    "Ecosystem partners and analysts",
    "Timing and proof requirements",
    "Risks of premature category claims",
  ],
  "CMO Partnership": [
    "What CMOs need weekly vs quarterly",
    "Brand risk and growth trade-offs",
    "Decision memos for big campaigns",
    "Aligning marketing to revenue goals",
  ],

  // UI/UX
  "Design Thinking Basics": [
    "Empathize → define → ideate → prototype → test",
    "Problem statements that invite solutions",
    "Divergent/convergent mindsets",
    "Bias awareness in research",
  ],
  "Visual Hierarchy": [
    "Size, contrast, spacing, and alignment",
    "F-pattern/Z-pattern scanning",
    "Typography scales",
    "Avoiding visual noise",
  ],
  "Figma Foundations": [
    "Frames, auto-layout, components",
    "Variants and properties",
    "Sharing and commenting workflows",
    "File hygiene for handoff",
  ],
  "Wireframing & Flows": [
    "Low-fi to communicate structure fast",
    "User flows vs screen inventories",
    "Happy path and error states",
    "Annotating for engineering",
  ],
  "Usability Heuristics": [
    "Nielsen heuristics as a review checklist",
    "Severity ratings for issues",
    "Heuristic review vs user testing",
    "Turning findings into backlog items",
  ],
  "Design Critiques": [
    "Critique goals and timeboxes",
    "Feedback that is specific and kind",
    "Separating taste from usability evidence",
    "Decision capture after critique",
  ],
  "Interaction Design": [
    "Affordances, feedback, and states",
    "Microcopy that reduces errors",
    "Progressive disclosure",
    "Motion with purpose",
  ],
  "Design Systems Intro": [
    "Tokens, components, patterns",
    "Contribution and governance models",
    "Documentation that engineers use",
    "Versioning and adoption metrics",
  ],
  "Accessibility Fundamentals": [
    "WCAG principles (POUR)",
    "Keyboard, contrast, alt text, labels",
    "Inclusive research participants",
    "Accessibility as acceptance criteria",
  ],
  "Complex Product UX": [
    "Information architecture for dense UIs",
    "Progressive complexity and empty states",
    "Permissions and role-aware UX",
    "Consistency across modules",
  ],
  "Research Synthesis": [
    "Affinity mapping and insights",
    "Evidence → opportunity areas",
    "Avoiding false consensus",
    "Sharing research that drives decisions",
  ],
  "Prototyping at Speed": [
    "Fidelity matching the learning goal",
    "Clickable prototypes for tests",
    "Wizard-of-Oz techniques",
    "Throwaway vs evolutionary prototypes",
  ],
  "Service Design": [
    "Journey maps and service blueprints",
    "Frontstage vs backstage work",
    "Pain points across channels",
    "Co-design with operations teams",
  ],
  "UX Metrics & Experiments": [
    "Success metrics for UX work",
    "Usability benchmarks",
    "A/B tests with design hypotheses",
    "Qual + quant triangulation",
  ],
  "Cross-Platform Patterns": [
    "Responsive vs adaptive strategies",
    "Native conventions vs brand system",
    "Shared components across surfaces",
    "QA collaboration for UI parity",
  ],
  "Design Leadership": [
    "Hiring and critiquing designers",
    "Protecting craft quality under deadlines",
    "Stakeholder management",
    "Design org models",
  ],
  "Stakeholder Alignment": [
    "Framing decisions with options",
    "Workshops that produce decisions",
    "Managing conflicting priorities",
    "Documenting agreed UX principles",
  ],
  "Design Ops Rituals": [
    "Intake, prioritization, and capacity",
    "Tooling and file standards",
    "Handoff checklists",
    "Measuring design ops health",
  ],
  "Enterprise Design Systems": [
    "Multi-product token architecture",
    "Federated contribution models",
    "Breaking changes and migration guides",
    "Executive sponsorship for systems",
  ],
  "Multi-Product UX Architecture": [
    "Shared navigation and identity",
    "Cross-product journeys",
    "Consistency vs product autonomy",
    "Platform UX governance",
  ],
  "Inclusive Design at Scale": [
    "Inclusive research pipelines",
    "Localization and cultural nuance",
    "Accessibility at component level",
    "Measuring inclusion outcomes",
  ],
  "Design Strategy": [
    "Linking experience strategy to business",
    "Experience principles as constraints",
    "Portfolio of UX investments",
    "Narrative for leadership buy-in",
  ],
  "Org Design Maturity": [
    "Maturity models for design orgs",
    "Diagnosing bottlenecks",
    "Capability building plans",
    "Partnering with product/eng leadership",
  ],
  "Principal Designer Impact": [
    "High-leverage design problems",
    "Mentoring across squads",
    "Systems and standards authorship",
    "Influence without becoming a bottleneck",
  ],

  // DevOps
  "DevOps Culture Basics": [
    "Collaboration over ticket-throwing",
    "Shared ownership of outcomes",
    "Blameless learning from incidents",
    "Automation as cultural force-multiplier",
  ],
  "Linux Command Line": [
    "Filesystem navigation and permissions",
    "Processes, logs, and package basics",
    "SSH and safe remote work habits",
    "Scripting small repeatable tasks",
  ],
  "Version Control for Ops": [
    "Infra as code in Git",
    "Reviewable changes for prod impact",
    "Tagging and release artifacts",
    "Secrets never in Git history",
  ],
  "CI Pipelines Intro": [
    "Build → test → package → publish",
    "Fail fast with clear logs",
    "Caching and runners",
    "Branch protections",
  ],
  "Containers Fundamentals": [
    "Images vs containers",
    "Layers, registries, and tagging",
    "Resource limits and healthchecks",
    "Security basics for base images",
  ],
  "Monitoring Basics": [
    "Golden signals (latency, traffic, errors, saturation)",
    "Alerts that are actionable",
    "Dashboards for on-call",
    "Avoiding alert fatigue",
  ],
  "Docker Deep Dive": [
    "Multi-stage builds",
    "Networking and volumes",
    "Compose for local stacks",
    "Image scanning and least privilege",
  ],
  "Infrastructure as Code": [
    "Declarative desired state",
    "Plan/apply review rituals",
    "Modules and environments",
    "Drift detection",
  ],
  "GitHub Actions Mastery": [
    "Workflows, jobs, and reusable actions",
    "Secrets and OIDC to cloud",
    "Matrix builds and environments",
    "Supply-chain hardening for workflows",
  ],
  "Kubernetes Foundations": [
    "Pods, deployments, services",
    "ConfigMaps/Secrets patterns",
    "Health probes and rollouts",
    "Namespace and RBAC basics",
  ],
  "Cloud Networking": [
    "VPC, subnets, and routing",
    "Load balancers and DNS",
    "Security groups / firewall intent",
    "Private connectivity patterns",
  ],
  "Incident Response": [
    "Severity, roles, and comms",
    "Mitigate first, then diagnose",
    "Timeline and status updates",
    "Blameless postmortems with actions",
  ],
  "SRE Principles": [
    "SLIs/SLOs/error budgets",
    "Toil reduction",
    "Reliability as a feature",
    "Balancing feature velocity and stability",
  ],
  "Platform Engineering": [
    "Internal developer platforms",
    "Golden paths over tickets",
    "Self-service with guardrails",
    "Measuring platform adoption",
  ],
  "Cost & Capacity Planning": [
    "Unit economics of compute",
    "Rightsizing and autoscaling",
    "Forecasting from demand signals",
    "FinOps partnership",
  ],
  "DevOps Leadership": [
    "Hiring for systems thinking",
    "On-call health and fairness",
    "Priority calls under pressure",
    "Building trust with product teams",
  ],
  "Reliability Governance": [
    "Error budget policies",
    "Change management for prod",
    "Risk acceptance process",
    "Executive reliability reporting",
  ],
  "Team Topologies for Ops": [
    "Platform, enabling, stream-aligned teams",
    "Avoiding ticket ops bottlenecks",
    "Clear interaction modes",
    "Evolving topology as the org scales",
  ],
  "Multi-Cloud Architecture": [
    "Portability vs native services trade-offs",
    "Identity and network across clouds",
    "Data residency constraints",
    "Operational complexity costs",
  ],
  "Security & Compliance Pipelines": [
    "Shift-left security scans",
    "Policy-as-code gates",
    "Evidence for auditors",
    "Secrets and SBOM practices",
  ],
  "Internal Developer Platforms": [
    "Paved roads for deploy/observe",
    "Product management for platforms",
    "DX metrics (time-to-10th PR)",
    "Support model for platform users",
  ],
  "Enterprise Reliability Strategy": [
    "Org-wide SLO framework",
    "Critical journey prioritization",
    "Investment roadmap for reliability",
    "Narrative for board/CTO",
  ],
  "Org-Wide Platform Roadmaps": [
    "Capability roadmap not tool shopping",
    "Migration waves and deprecations",
    "Stakeholder councils",
    "Success metrics per platform bet",
  ],
  "CTO Ops Partnership": [
    "What CTOs need from ops leaders",
    "Risk, cost, and velocity trade-offs",
    "Decision memos for platform bets",
    "Building a trusted operating cadence with the CTO",
  ],
};

function conceptsFor(title: string, dept: DepartmentId): string[] {
  const specific = TOPIC_POINTS[title];
  if (specific?.length) return specific;
  const pb = PLAYBOOKS[dept];
  return [
    `How ${title} supports: ${pb.mission}`,
    `Key practices used by strong ${DEPT_LABEL[dept]} teams`,
    `How to measure progress with: ${pb.metrics.slice(0, 2).join(", ")}`,
    `Collaboration touchpoints with: ${pb.stakeholders.slice(0, 3).join(", ")}`,
  ];
}

/** Public helper for assessment seeding — topic bullets keyed by course title. */
export function getTopicLearningPoints(title: string, dept: DepartmentId = "development"): string[] {
  return conceptsFor(title, dept);
}

export function buildCoreConceptsMarkdown(
  dept: DepartmentId,
  level: LearningLevel,
  title: string
): string {
  const deptName = DEPT_LABEL[dept];
  const levelName = LEVEL_LABEL[level];
  const pb = PLAYBOOKS[dept];
  const lf = LEVEL_FOCUS[level];
  const concepts = conceptsFor(title, dept);

  return `## ${title}

**Track:** ${deptName} · **Level:** ${levelName}

${pb.mission}

### Why this lesson matters

At the **${levelName}** level, your goal is: *${lf.outcome}*  
Learning depth: ${lf.depth}

**${title}** is a practical skill for ${deptName}. After this lesson you should be able to explain the topic to a teammate and apply it on a real work item.

### Learning objectives

1. Explain the core ideas behind **${title}** in plain language.
2. Apply at least one framework/tool from the ${deptName} toolkit.
3. Identify common failure modes and how to avoid them.
4. Produce the level deliverable: ${lf.deliverable}

### Core concepts

${concepts.map((c, i) => `${i + 1}. ${c}`).join("\n")}

### ${deptName} principles to apply

${pb.principles.map((p) => `- ${p}`).join("\n")}

### Tools & artifacts

Work with (as relevant): ${pb.tools.join(", ")}.

### Metrics that show you’re doing it well

Watch: ${pb.metrics.join(" · ")}.

### Common pitfalls

- Jumping to tools before clarifying the problem and success criteria
- Treating documentation as optional — future-you (and teammates) need it
- Optimizing locally while creating handoff pain for ${pb.stakeholders[0]}
- Measuring activity (hours, tickets) instead of outcomes

### Mini case

Imagine your team must improve outcomes related to **${title}** within one sprint.

1. Write a one-sentence problem statement.
2. List two options and one non-option (what you will *not* do).
3. Pick one metric from the list above to judge success in 2 weeks.
4. Name the stakeholders you must align with before starting.

### Knowledge check

- What would you teach a new hire in 3 bullets about **${title}**?
- Which principle from this lesson conflicts most often with delivery pressure — and how do you handle it?
- What evidence would convince a skeptical manager this work matters?

### Before you continue

Complete the **Practice Lab** next. Bring your notes from the mini case — you will turn them into a concrete artifact.
`;
}

export function buildPracticeMarkdown(
  dept: DepartmentId,
  level: LearningLevel,
  title: string
): string {
  const deptName = DEPT_LABEL[dept];
  const levelName = LEVEL_LABEL[level];
  const lf = LEVEL_FOCUS[level];
  const pb = PLAYBOOKS[dept];

  return `## Practice Lab — ${title}

**Timebox:** 40–60 minutes · **Track:** ${deptName} (${levelName})

### Goal

Produce: **${lf.deliverable}** related to **${title}**.

### Instructions

1. **Context (10 min)**  
   Pick a real team scenario (or invent a realistic one for ${deptName}). Write:
   - Current state (2–3 sentences)
   - Desired state (2–3 sentences)
   - Constraints (time, tools, compliance, people)

2. **Design (15–20 min)**  
   Draft your approach using **${title}** concepts:
   - Steps you will take (numbered)
   - Tools from: ${pb.tools.slice(0, 4).join(", ")}
   - Risks / mitigations (at least two)

3. **Artifact (15–20 min)**  
   Create the deliverable for this level (${lf.deliverable}). Keep it crisp — one page is enough if clear.

4. **Review (5–10 min)**  
   Share with a peer or manager in ${deptName}. Ask:
   - What is unclear?
   - What would you change before trying this for real?

### Submission checklist

- [ ] Problem and outcome are explicit  
- [ ] Approach references **${title}** concepts from the Core Concepts lesson  
- [ ] Success metric is named  
- [ ] Stakeholder impact is considered (${pb.stakeholders.slice(0, 3).join(", ")})  
- [ ] Peer/manager feedback noted  

### Stretch (optional)

Turn your artifact into a team template others can reuse, and add it to your learning portfolio.
`;
}

export function buildIntroMarkdown(
  dept: DepartmentId,
  level: LearningLevel,
  title: string
): string {
  const deptName = DEPT_LABEL[dept];
  const levelName = LEVEL_LABEL[level];
  return `## Introduction — ${title}

Watch the video for **${title}**, then read the Core Concepts lesson.

**You are on:** ${deptName} · ${levelName}

### What to listen for

- Vocabulary you will reuse in the Core Concepts article
- One example you can map to your current team
- One practice you want to try this week

After the video, continue to **${title} — Core Concepts**.
`;
}
