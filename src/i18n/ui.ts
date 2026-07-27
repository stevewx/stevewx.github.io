/**
 * UI string dictionary. Every user-facing string that is NOT long-form blog
 * prose lives here, keyed by locale. The `zh` object is typed against the `en`
 * object, so a missing or misnamed key fails the build instead of silently
 * falling back to English.
 *
 * Convention: technical terms (PPO, GRPO, DAPO, MoE, Verl, vLLM, SGLang, …),
 * product names, and org names stay in English even in the zh copy — that is
 * how these are written in Chinese ML/engineering practice. Prose around them
 * is translated.
 */
import type { Locale } from "./config";

const en = {
  site: {
    name: "Xuan Wang",
    mark: "xuanwang",
    title: "Xuan Wang — ML Engineer, LLM & RL Post-Training",
    description:
      "Machine Learning Engineer focused on LLM & RL post-training. I bring the latest post-training research into production frameworks and make frontier-scale RL training fast and reliable. Recently: async RL & agentic model training.",
    tagline: "ML Engineer · LLM & RL Post-Training",
  },

  nav: {
    home: "Home",
    about: "About",
    blog: "Blog",
  },

  socials: {
    github: "GitHub",
    linkedin: "LinkedIn",
  },

  a11y: {
    primaryNav: "Primary",
    toggleTheme: "Toggle color theme",
    toggleThemeTitle: "Toggle light / dark",
    switchLanguage: "Switch language",
    filterByCategory: "Filter by category",
    filterByTag: "Filter by tag",
  },

  hero: {
    whoami: "whoami",
    // Split into parts so the emphasized spans keep their styling.
    leadPre: "I'm a ",
    roleEmph: "Machine Learning Engineer",
    leadMid: " working on ",
    topicEmph: "LLM & RL post-training",
    leadPost:
      ". I bring the latest post-training research into production training frameworks — and make frontier-scale RL training ",
    fastEmph: "fast",
    and: " and ",
    reliableEmph: "reliable",
    leadEnd: ".",
    recently:
      "// recently: async agentic RL training · training-framework optimization",
    maintainedBy:
      "This site is maintained by my coding agent, who occasionally publishes a technical digest tracking the latest tech and research.",
    readBlog: "Read the blog →",
    aboutMe: "About me",
  },

  about: {
    kicker: "// about",
    title: "Research-aware. Ships at scale.",
    metaTitle: "About",
    metaDescription:
      "ML Engineer focused on LLM & RL post-training. Research-aware, ships at scale: async RL, agentic training, and training-framework optimization behind frontier model releases.",
    p1: "I'm an ML Engineer focused on LLM & RL post-training. My work lives at the seam between research and production: I track the latest post-training literature and translate it into working, fast, reliable training-framework code that ships behind real frontier model releases.",
    p2: "At Amazon, my work has followed the arc of LLM post-training itself: from enabling RL text and multimodal DPO training, to leading interleaved and async RL optimization, to leading the ground-up build of the post-training infrastructure behind our SFT-to-RL pipelines. Most recently I've been researching and building async agentic RL solutions — pushing scale and throughput to strengthen models' agentic capabilities.",
    p3: "On the side, I contribute to open-source training frameworks and inference engines — and whatever fun projects catch my interest.",
    skillsKicker: "// skills",
    workKicker: "// selected work",
    eduKicker: "// education",
  },

  blog: {
    kicker: "// writeups",
    title: "Blog",
    intro:
      "Deep-dives on what I've built and why — LLM & RL post-training, async training, and an occasional agent-driven tech digest.",
    all: "All",
    tags: "Tags",
    more: "more",
    less: "less",
    empty: "No posts match this filter.",
    none: "No posts yet — first writeups are in progress.",
    metaTitle: "Blog — Work & Digest",
    metaDescription:
      "Technical writeups on LLM & RL post-training: async RL, partial rollout, MoE checkpointing, and agentic training — plus an occasional agent-driven tech digest.",
  },

  post: {
    allWriteups: "← all writeups",
    by: "by",
    updated: "updated",
    references: "// references",
    repo: "↗ repo",
    asideQuestion:
      "Spotted something off, or want to compare notes on RL post-training? I'd genuinely like to hear it — ",
    asideReachLink: "reach out on LinkedIn",
    asideShare:
      "Sharing and reposting are welcome — a link back to the original is all I ask.",
  },

  categories: {
    work: "Work",
    digest: "Digest",
  },

  footer: {
    builtWith: "built with",
  },

  notFound: {
    cmd: "$ cat /dev/null",
    title: "404",
    body: "This route returned no trajectories. The page doesn't exist (or moved).",
    back: "← back home",
    metaTitle: "404 — Not found",
  },
};

// The Chinese dictionary MUST match en's shape (compile error otherwise). No
// `as const` on `en`: we want widened `string` fields so the zh translations
// (different strings) satisfy the same type. Keys/structure must still match.
type UIStrings = typeof en;

const zh: UIStrings = {
  site: {
    name: "王烜",
    mark: "xuanwang",
    title: "王烜 — 机器学习工程师，LLM 与 RL 后训练",
    description:
      "机器学习工程师，专注于 LLM 与 RL 后训练。我把最新的后训练研究落地到生产级训练框架中，让前沿规模的 RL 训练既快又稳。近期方向：异步 RL 与 agentic 模型训练。",
    tagline: "机器学习工程师 · LLM 与 RL 后训练",
  },

  nav: {
    home: "首页",
    about: "关于",
    blog: "博客",
  },

  socials: {
    github: "GitHub",
    linkedin: "LinkedIn",
  },

  a11y: {
    primaryNav: "主导航",
    toggleTheme: "切换主题配色",
    toggleThemeTitle: "切换浅色 / 深色",
    switchLanguage: "切换语言",
    filterByCategory: "按分类筛选",
    filterByTag: "按标签筛选",
  },

  hero: {
    whoami: "whoami",
    leadPre: "",
    roleEmph: "机器学习工程师",
    leadMid: "，专注于",
    topicEmph: "LLM 与 RL 后训练",
    leadPost:
      "。我把最新的后训练研究落地到生产级训练框架中——让前沿规模的 RL 训练既",
    fastEmph: "快",
    and: "又",
    reliableEmph: "稳",
    leadEnd: "。",
    recently:
      "// 近期：异步 agentic RL 训练 · 训练框架优化",
    maintainedBy:
      "这个站点由 coding agent 维护，偶尔更新一篇技术摘要，追踪最新的技术与研究进展。",
    readBlog: "阅读博客 →",
    aboutMe: "关于我",
  },

  about: {
    kicker: "// 关于",
    title: "紧跟研究，规模落地。",
    metaTitle: "关于",
    metaDescription:
      "专注于 LLM 与 RL 后训练的机器学习工程师。紧跟研究、规模落地：异步 RL、agentic 训练，以及支撑前沿模型发布的训练框架优化。",
    p1: "我是一名专注于 LLM 与 RL 后训练的机器学习工程师。我的工作处在研究与生产的接缝处：我持续跟踪最新的后训练文献，并把它们转化为能真正跑起来、又快又稳、支撑真实前沿模型发布的训练框架代码。",
    p2: "在 Amazon，我的工作也顺着 LLM 后训练本身的脉络一路走来：从最初支持 RL 文本训练与多模态 DPO 训练，到主导 interleaved 与异步 RL 的优化，再到从零搭建支撑 SFT-to-RL 全流程的后训练基础设施。最近，我在研究并落地大规模、高吞吐的异步 agentic RL 方案，进一步增强模型的 agentic 能力。",
    p3: "工作之余，我也会给开源的训练框架、inference 服务，以及各种有意思的项目做点贡献。",
    skillsKicker: "// 技能",
    workKicker: "// 精选经历",
    eduKicker: "// 教育背景",
  },

  blog: {
    kicker: "// 技术文章",
    title: "博客",
    intro:
      "关于我做过什么、为什么这样做的深入剖析——LLM 与 RL 后训练、异步训练，以及由 coding agent 偶尔更新的技术摘要。",
    all: "全部",
    tags: "标签",
    more: "更多",
    less: "收起",
    empty: "没有符合该筛选条件的文章。",
    none: "还没有文章——首批技术文章正在撰写中。",
    metaTitle: "博客 — 工作与技术摘要",
    metaDescription:
      "关于 LLM 与 RL 后训练的技术文章：异步 RL、partial rollout、MoE checkpointing、agentic 训练，以及由 coding agent 偶尔更新的技术摘要。",
  },

  post: {
    allWriteups: "← 返回全部文章",
    by: "作者",
    updated: "更新于",
    references: "// 参考文献",
    repo: "↗ 代码仓库",
    asideQuestion:
      "发现了什么问题，或者想聊聊 RL 后训练？欢迎",
    asideReachLink: "在 LinkedIn 上找我",
    asideShare: "欢迎分享与转载，烦请注明原文出处。",
  },

  categories: {
    work: "工作",
    digest: "技术摘要",
  },

  footer: {
    builtWith: "构建于",
  },

  notFound: {
    cmd: "$ cat /dev/null",
    title: "404",
    body: "这条路由没有返回任何轨迹。页面不存在（或已迁移）。",
    back: "← 返回首页",
    metaTitle: "404 — 页面未找到",
  },
};

export const UI: Record<Locale, UIStrings> = { en, zh };

export function t(locale: Locale): UIStrings {
  return UI[locale];
}
