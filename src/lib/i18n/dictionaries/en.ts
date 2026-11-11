import type { Dictionary } from "../types";

/**
 * English dictionary.
 *
 * It must mirror the Bangla dictionary exactly — the `Dictionary` type makes
 * a missing or extra key a compile-time error.
 */
export const en: Dictionary = {
  app: {
    name: "DevReaderHub",
    tagline: "Your daily developer news hub",
    description:
      "Curated developer technology news from reliable sources, organised by category with optional AI-powered Bangla analysis.",
  },
  nav: {
    overview: "Overview",
    latest: "Latest news",
    ai: "AI & Machine Learning",
    web: "Web Development",
    opensource: "GitHub & Open Source",
    security: "Cybersecurity",
    cloud: "Cloud & DevOps",
    industry: "Tech Industry",
    jobs: "Developer Jobs",
    saved: "Saved articles",
    history: "Reading history",
    settings: "Settings",
    sources: "Source management",
    groupNews: "News",
    groupMine: "You",
    groupAdmin: "Admin",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    primaryNav: "Main navigation",
    taglineHint: "Sources: RSS, APIs, CISA, NVD, GitHub",
  },
  common: {
    search: "Search",
    searchPlaceholder: "Search articles, tags or sources…",
    searchShort: "Search…",
    searchHint: "Type at least 2 characters.",
    searchNoResult: "No results found.",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    notifications: "Notifications",
    noNotifications: "No notifications yet.",
    markAllRead: "Mark all as read",
    theme: "Theme",
    themeDark: "Dark",
    themeLight: "Light",
    themeSystem: "System",
    themeChanged: "Theme updated.",
    profile: "Profile",
    loading: "Loading…",
    error: "Something went wrong",
    retry: "Try again",
    empty: "Nothing here yet",
    viewAll: "View all",
    loadMore: "Load more",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    filter: "Filter",
    sort: "Sort",
    clearFilters: "Clear filters",
    dateFrom: "From",
    dateTo: "To",
    all: "All",
    bookmark: "Save",
    unbookmark: "Remove bookmark",
    bookmarked: "Saved",
    source: "Source",
    published: "Published",
    importance: "Importance",
    login: "Sign in",
    signup: "Sign up",
    logout: "Sign out",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    delete: "Delete",
    test: "Test",
    sync: "Sync",
    today: "Today",
    details: "Details",
    originalArticle: "Original article",
    openArticle: "Open article",
    total: "Total",
    results: "results",
    skip: "Do this later",
    close: "Close",
    copy: "Copy",
    copied: "Copied.",
  },
  filters: {
    title: "Filters and sorting",
    searchLabel: "Search",
    searchPlaceholder: "Search in titles and descriptions…",
    from: "From (YYYY-MM-DD)",
    to: "To",
    sortLabel: "Sort by",
    sortLatest: "Newest first",
    sortOldest: "Oldest first",
    sortImportance: "By importance",
  },
  sort: {
    latest: "Newest first",
    oldest: "Oldest first",
    importance: "By importance",
  },
  dashboard: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    overviewTitle: "At a glance",
    overviewSubtitle:
      "What was collected in the last 24 hours, the stories that matter and this week's highlights",
    totalArticles: "Total articles",
    articlesCollected: "Articles collected so far",
    last24h: "Last 24 hours",
    last24hHint: "Published in the last 24 hours",
    last7d: "Last 7 days",
    last7dHint: "Published in the last 7 days",
    analyzed: "AI analysed",
    analyzedHint: "AI analysis completed",
    importantNews: "Important news",
    chronologicalFeed: "All news, newest first",
    categoryFilter: "Category",
    githubResults: "GitHub repositories",
    securityAlerts: "Security alerts",
    weeklyHighlights: "Weekly highlights",
    lastSync: "Last successful sync",
    neverSynced: "No sync has run yet.",
    noRunYet: "No ingestion run has happened yet.",
    runSummary:
      "Last run: {status} · {articles} new articles · {ok}/{total} sources",
    activeSources: "Active sources",
    refreshDone: "Refresh complete — {count} new articles from {ok} sources.",
    statsNote: "Every statistic is computed from collected records only.",
    intro: "The developer stories that matter, collected and organised for you.",
    anonymousTitle: "You are reading without signing in.",
    anonymousBody:
      "Sign in to keep bookmarks, a reading history and your own category preferences.",
  },
  empty: {
    articlesTitle: "No articles yet",
    articlesBody:
      "Nothing has been collected so far. Start a sync from the admin panel or run the command:",
    articlesAction: "How to run a sync",
    importantTitle: "No important articles yet",
    importantBody: "Important stories will appear here once a sync has run.",
    securityTitle: "No security alerts",
    securityBody: "Run a CISA KEV and NVD sync to populate this list.",
    highlightsTitle: "No highlights this week",
    highlightsBody:
      "Nothing important was found among the articles collected in the last 7 days.",
    reposTitle: "No repositories collected yet",
    reposBody:
      "Run a GitHub sync to see repositories and their DevReaderHub score here.",
    savedTitle: "No saved articles yet",
    savedBody: "Use the “Save” button on any article to keep it here.",
    savedAction: "Browse the latest news",
    historyTitle: "You have not read anything yet",
    historyBody: "Articles you open will be listed here.",
    historyAction: "Browse the latest news",
    vulnerabilitiesTitle: "No CVE data yet",
    vulnerabilitiesBody:
      "Run a CISA KEV and NVD sync to see verified vulnerability data here.",
    filterTitle: "No articles match these filters",
    filterBody:
      "Try different filters, or start a sync from the admin panel.",
    signInRequiredTitle: "Sign in to continue",
    signInRequiredBody:
      "Sign in to a DevReaderHub account to see your saved articles and reading history.",
  },
  article: {
    aiSummary: "AI analysis",
    whyItMatters: "Why it matters",
    developerImpact: "Impact on developers",
    practicalAction: "What to do next",
    confidence: "Confidence",
    factStatus: "Fact status",
    factsConfirmed: "Confirmed by the source",
    factsReported: "Reported",
    factsUnverified: "Unverified",
    notAnalyzed: "This article has not been analysed yet.",
    summary: "Summary",
    loadFailed: "The article could not be loaded.",
    loadFailedBody:
      "We could not reach the database. Please try again in a moment.",
    writtenBy: "Originally published by",
    importanceLabels: {
      "5": "Critical",
      "4": "Important",
      "3": "Notable",
      "2": "Minor",
      "1": "Low priority",
    },
  },
  github: {
    title: "GitHub repositories",
    description:
      "Repositories collected through the GitHub Search API. These are not GitHub Trending — DevReaderHub ranks them with its own score.",
    score: "DevReaderHub score",
    scoreTitle: "DevReaderHub trending score",
    stars: "Stars",
    forks: "Forks",
    language: "Language",
    license: "License",
    updated: "Updated",
    created: "Created",
    collectedAt: "Collected at",
    disclaimer:
      "These results come from the GitHub Search API and are not GitHub's official Trending ranking. Scoring method: docs/trending-score.md",
  },
  security: {
    title: "Security intelligence",
    description:
      "Verified CVE data from CISA Known Exploited Vulnerabilities and the NVD.",
    cve: "CVE",
    cvss: "CVSS score",
    severity: "Severity",
    affectedProduct: "Affected product",
    published: "Published",
    modified: "Modified",
    exploited: "Exploited in the wild (confirmed by CISA KEV)",
    notExploited: "Not in the KEV catalogue",
    references: "References",
    kevSource: "Source: CISA KEV catalogue",
    nvdSource: "Source: NVD",
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    unknown: "Unknown",
    exploitedCount: "{count} confirmed exploited by CISA KEV",
    sourceNote:
      "CVE identifiers, CVSS scores and references come from NVD. “Exploited in the wild” is only ever set from the CISA Known Exploited Vulnerabilities catalogue — never from inference or AI output.",
  },
  jobs: {
    title: "Developer jobs & careers",
    description:
      "Software engineering and developer openings collected from the public Remote OK, We Work Remotely and Arbeitnow APIs.",
  },
  auth: {
    loginTitle: "Sign in to DevReaderHub",
    loginSubtitle: "Sign in to see your saved articles and reading history.",
    signupTitle: "Create a DevReaderHub account",
    signupSubtitle: "Create an account to start personalising your feed.",
    email: "Email",
    password: "Password",
    fullName: "Full name",
    fullNamePlaceholder: "e.g. Rakibul Islam",
    emailPlaceholder: "you@example.com",
    noAccount: "No account?",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    signUp: "Sign up",
    signInWith: "Continue with {provider}",
    or: "or",
    forgotPassword: "Forgot your password?",
    forgotTitle: "Reset your password",
    forgotDescription:
      "Enter your email address and we will send you a reset link.",
    resetRequest: "Send reset link",
    resetSent:
      "If an account exists for that email, a reset link has been sent. Check your inbox and spam folder.",
    newPasswordTitle: "Set a new password",
    newPasswordDescription:
      "Your session was verified through the reset link. Choose a new password now.",
    newPassword: "New password",
    repeatPassword: "Repeat the new password",
    updatePassword: "Update password",
    passwordUpdated: "Your password has been updated.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    passwordRules: "Password rules",
    ruleLength: "At least 8 characters",
    ruleLetter: "One letter",
    ruleNumber: "One number",
    providerDisabled:
      "The {provider} provider is not enabled yet — sign in with email and password.",
    providerDisabledTitle:
      "The {provider} provider is not enabled in this Supabase project",
    publicAccess:
      "News and category pages are available without signing in. An account is only needed for saved articles, reading history and your preferences.",
    termsNote:
      "By creating an account you agree to the terms of service and the privacy policy.",
    terms: "Terms of service",
    privacy: "Privacy policy",
    browseNews: "Browse the news →",
    resetExpired:
      "This password reset link is no longer valid (it expired or was sent to the wrong address).",
    requestNewReset: "request a new reset link",
    pendingVerification:
      "Your account was created. We sent you a verification email — click the link, then sign in.",
    rememberMe: "Remember me",
    signInFailed: "We could not complete the sign-in. Please try again.",
    notConfigured:
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to .env.local and restart the server.",
  },
  onboarding: {
    title: "Welcome to DevReaderHub!",
    description:
      "Set your preferences in two steps — it only takes a moment and you can change them later in Settings.",
    categoriesTitle: "Which categories do you follow?",
    categoriesHint:
      "Leave everything unchecked to keep the full feed exactly as it is.",
    technologiesTitle: "Which technologies do you follow?",
    technologiesHint: "We use these to surface the stories that matter to you.",
    save: "Save preferences",
    saved: "Your preferences have been saved.",
    skipped: "You can set your preferences later.",
    bannerTitle:
      "Pick your favourite categories and technologies to make DevReaderHub more relevant.",
    bannerAction: "Set preferences",
  },
  settings: {
    title: "Settings",
    description:
      "Manage your account, your preferences and how DevReaderHub behaves.",
    profile: "Profile",
    appearance: "Appearance",
    preferences: "My preferences",
    preferencesHint:
      "Pick the categories and technologies you follow — they are shown first on the dashboard.",
    notifications: "Notifications",
    data: "Data",
    density: "Density",
    densityComfortable: "Comfortable",
    densityCompact: "Compact",
    emailDigest: "Email digest",
    emailDigestHint: "Receive a short daily summary by email.",
    clearHistory: "Clear reading history",
    clearHistoryHint: "Your reading history is removed permanently.",
    deleteAccount: "Delete account",
    deleteAccountHint:
      "Deleting your account permanently removes every saved article, history entry and preference (cascade delete).",
    deleteAccountConfirm: "Really delete your account?",
    deleteAccountWarning:
      "Deleting your account permanently removes your saved articles, reading history, preferences and notifications. This cannot be undone.",
    deleteAccountDone: "Your account has been deleted.",
    notificationsBody:
      "Important articles and sync results are shown as notifications in the bell menu.",
    supabaseConnected: "Supabase connected",
    supabaseMissing: "Not configured",
    emailHint: "Change your email address from the Supabase dashboard.",
    roleAdmin: "Admin",
    roleUser: "User",
    saved: "Settings saved.",
  },
  notifications: {
    title: "Notifications",
    newArticles: "{count} new articles collected",
    newArticlesBody:
      "The last sync added {count} new articles from {ok} sources.",
  },
  admin: {
    title: "Source management",
    description:
      "Add, edit, enable, test and manually sync the sources DevReaderHub collects from.",
    addSource: "New source",
    editSource: "Edit source",
    newSource: "Add a new source",
    editSourceTitle: "Edit source",
    sourceDescription:
      "Add a feed or API URL. If a source has no machine-readable feed, choose the index type — DevReaderHub never scrapes pages.",
    sourceName: "Name",
    sourceSlug: "Slug",
    sourceSlugPlaceholder: "example-news",
    sourceFeed: "Feed / API URL",
    sourceFeedPlaceholder: "https://example.com/feed.xml",
    sourceSite: "Website URL",
    sourceSitePlaceholder: "https://example.com",
    sourceCategory: "Category",
    sourceType: "Source type",
    sourceReliability: "Reliability",
    sourceInterval: "Fetch interval (minutes)",
    sourceNotes: "Notes",
    sourceNotesPlaceholder: "e.g. official feed, robots.txt respected",
    sourceActive: "Keep this source active",
    testSource: "Test the feed",
    syncSource: "Sync this source now",
    deleteSource: "Delete source",
    deleteConfirm: "Delete this source?",
    deleteWarning:
      "The source will be removed. Articles already collected stay, but they are no longer linked to a source.",
    syncAll: "Sync all sources",
    runNow: "Sync now",
    lastSuccess: "Last success",
    lastError: "Last error",
    errors: "Ingestion errors",
    runs: "Ingestion history",
    noErrors: "No ingestion errors.",
    noRuns: "No ingestion run has happened yet.",
    noFeed:
      "This source has no machine-readable feed. DevReaderHub does not scrape it — the link is only shown.",
    adminOnly: "Admin privileges required",
    adminOnlyBody:
      "Only accounts with the admin role can use this page. Update the user_profiles table to change your role.",
    typeRss: "RSS",
    typeAtom: "Atom",
    typeJson: "JSON API",
    typeIndex: "Index (no feed)",
    reliabilityOfficial: "Official",
    reliabilityTrusted: "Trusted",
    reliabilityCommunity: "Community",
  },
  setup: {
    title: "Setup required",
    description:
      "DevReaderHub needs Supabase and OpenAI configuration. Follow the steps below.",
    envTitle: "Variables required in .env.local",
    nextSteps: "Next steps",
    currentMode: "Current mode",
    modeNoDatabase: "no database",
    modeDatabase: "database configured",
    noDemoData: "No demo or fabricated data is shown.",
    schemaTitle: "The database schema is missing",
    schemaBody:
      "The application tables do not exist in your Supabase project yet, so no data can be shown. Run the two migration files in order in the Supabase SQL editor:",
    schemaHint:
      "Supabase Dashboard → SQL Editor → New query → paste the file content → Run.",
    missingTables: "Missing tables",
    presentTables: "Created",
    copySql: "Copy SQL",
    recheck: "Check again",
    schemaOk: "The schema was found — data will show up now.",
    schemaStillMissing: "The tables are still missing.",
  },
  errors: {
    generic:
      "An unexpected error occurred. Please try again in a moment.",
    dbRead: "The database could not be read",
    dbSchema:
      "The database schema is missing. Run the migrations in the Supabase SQL editor.",
    articlesLoad: "The articles could not be loaded.",
    dbUnavailable:
      "We could not reach the server. Please try again in a moment.",
    notFoundTitle: "Page not found",
    notFoundBody:
      "The page you are looking for was moved, removed or never existed.",
    backHome: "Back to the dashboard",
    errorDetails: "Error details",
  },
  language: {
    label: "Language",
    switchTo: "বাংলা",
    switchToAria: "Switch the interface to Bangla",
    current: "English",
    changed: "Language updated.",
  },
  footer: {
    tagline: "Your daily developer news hub",
    builtWith: "Collected from RSS, APIs, CISA, NVD and GitHub",
    rights: "DevReaderHub · All rights reserved.",
  },
  legal: {
    termsTitle: "Terms of service",
    termsDescription: "Please read these before using DevReaderHub.",
    privacyTitle: "Privacy policy",
    privacyDescription:
      "What DevReaderHub collects, stores and how it is used.",
    seePrivacy: "For privacy details, see the privacy policy.",
    seeTerms: "For the general terms, see the terms of service.",
    termsSections: [
      {
        title: "1. What the service is",
        body: "DevReaderHub is a developer technology news aggregator. It collects news from reliable sources, organises it by category and can add an optional AI-written Bangla analysis. The original article always stays with its publisher, and we always link back to the source.",
      },
      {
        title: "2. Accounts",
        body: "An account is required to use saved articles, reading history and personal preferences. Your password is your responsibility — we never store or publish it. By signing in you agree to these terms.",
      },
      {
        title: "3. AI-assisted analysis",
        body: "The Bangla summary, importance score and recommended actions are produced by a language model. They are supporting information: the original article is the only authoritative source. AI analysis can be wrong, so read the original before making important decisions.",
      },
      {
        title: "4. Acceptance and liability",
        body: "The service is provided 'as is'. We do not guarantee the accuracy, completeness or availability of any article. Publishers keep full ownership of their content.",
      },
      {
        title: "5. Changes",
        body: "These terms may change as the product evolves. Significant changes are announced inside the app.",
      },
    ],
    privacySections: [
      {
        title: "What we collect",
        body: "Account data: email address, full name (if you give it) and the time of your first sign-in. Usage data: your saved articles, your reading history and the categories and technologies you pick. We also keep ordinary server logs of page and API requests.",
      },
      {
        title: "How it is protected",
        body: "All personal data lives in Supabase with Row Level Security enabled — a signed-in user can only read and change their own rows. The server-side secret key is used only on the server and is never sent to the browser.",
      },
      {
        title: "Third-party services",
        body: "We use Supabase (accounts and database), OpenAI (article text is sent for analysis only) and Vercel (hosting). News collected from publisher feeds is stored in our own database.",
      },
      {
        title: "Your control",
        body: "You can clear your reading history, change your preferences and delete your account at any time. Deleting the account removes your saved articles, history, preferences and notifications immediately.",
      },
    ],
  },
  validation: {
    email: "Please enter a valid email address.",
    passwordShort: "The password must be at least 8 characters long.",
    nameShort: "The full name must be at least 2 characters long.",
    nameLong: "The full name can be at most 120 characters.",
    passwordWeak:
      "The password must contain at least one number and one letter.",
    passwordMismatch: "The two passwords do not match.",
    unknownProvider: "Unknown sign-in method.",
  },
  authErrors: {
    invalidCredentials: "The email or password is incorrect.",
    emailNotConfirmed:
      "Your email address has not been confirmed yet. Open the link we sent to your inbox (and the spam folder).",
    accountExists:
      "An account already exists for this email address. Sign in instead, or reset your password.",
    weakPassword:
      "That password is not strong enough. Use at least 8 characters with one number and one letter.",
    rateLimited: "Too many requests were sent. Please try again in a few minutes.",
    signupDisabled: "New sign-ups are disabled right now. Please try again later.",
    emailProviderDisabled:
      "Outgoing email is not enabled yet. Please contact an administrator.",
    providerNotEnabled:
      "Signing in with {provider} is not enabled yet. Sign in with email and password.",
    invalidEmail: "That email address is not valid.",
    expiredLink: "That sign-in link has expired. Please try again.",
    networkError:
      "We could not reach the server. Check your connection and try again.",
    serverUnavailable:
      "We could not reach the server. Please try again in a moment.",
    linkFailed: "The sign-in link could not be created. Please try again in a moment.",
    generic: "An unexpected error occurred. Please try again in a moment.",
    notConfigured:
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to .env.local and restart the server.",
  },
  categories: {
    ai: {
      label: "AI & Machine Learning",
      description:
        "The latest news and analysis on OpenAI, ChatGPT, Claude, Gemini, LLMs, AI agents, machine learning and AI coding.",
    },
    web: {
      label: "Web Development",
      description:
        "JavaScript, TypeScript, React, Next.js, Node.js, Express, CSS, HTML, Vue, Angular, Bun and Deno — frontend and backend development news.",
    },
    opensource: {
      label: "GitHub & Open Source",
      description:
        "Releases, repositories and community updates from GitHub, libraries, frameworks, developer tools and open-source projects.",
    },
    security: {
      label: "Cybersecurity",
      description:
        "CVEs, CISA, NVD, vulnerabilities, data breaches, OWASP and application security — verified security intelligence.",
    },
    cloud: {
      label: "Cloud & DevOps",
      description:
        "AWS, Azure, Google Cloud, Docker, Kubernetes, Terraform and CI/CD — infrastructure, platform and deployment news.",
    },
    industry: {
      label: "Tech Industry",
      description:
        "Google, Microsoft, Apple, Meta, OpenAI, Anthropic, startups and acquisitions — company and industry news.",
    },
    jobs: {
      label: "Developer Jobs",
      description:
        "Frontend, backend, full-stack, remote and software engineering job openings plus hiring trends.",
    },
  },
};
