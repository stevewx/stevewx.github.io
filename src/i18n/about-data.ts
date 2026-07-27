/**
 * Structured About-page content (skills, selected work, education) per locale.
 * Kept separate from ui.ts because it is array/record data rather than flat
 * strings. The `zh` value is typed against `en`, so the two stay in lockstep.
 *
 * Numbers/stat values, product names, org names, framework names, and metric
 * units stay verbatim across locales; only prose labels are translated.
 */
import type { Locale } from "./config";

interface Stat {
  value: string;
  label: string;
}
interface Work {
  role: string;
  org: string;
  period: string;
  summary: string;
  stats: Stat[];
  points: string[];
}
interface SkillGroup {
  group: string;
  items: string[];
}
interface Education {
  school: string;
  period: string;
  detail: string;
}
interface AboutData {
  skillGroups: SkillGroup[];
  work: Work[];
  education: Education[];
}

const en: AboutData = {
  skillGroups: [
    {
      group: "Post-Training",
      items: [
        "RL algorithms: PPO, GRPO, RLOO, DAPO",
        "RL architectures: colocated, separate stages",
        "SFT & Multi-modal DPO (AnyRes)",
        "Async RL",
        "Agentic RL training",
        "Offline & on-policy distillation",
      ],
    },
    {
      group: "Training Frameworks & Infra",
      items: ["Verl", "slime", "NeMo-Aligner / NeMo-RL", "Megatron-LM", "Ray", "PyTorch"],
    },
    {
      group: "Inference & Serving",
      items: ["vLLM", "SGLang", "NVIDIA Triton", "TensorRT"],
    },
    {
      group: "Systems & Ops",
      items: [
        "Distributed checkpointing",
        "Nsys profiling",
        "Docker / Kubernetes",
        "NATS JetStream",
        "AWS (EC2, ECR, Batch, Lambda)",
      ],
    },
  ],
  work: [
    {
      role: "MLE · Amazon Ads, Agentic Post-Training",
      org: "Amazon · Ads",
      period: "Feb 2026 — now",
      summary: "Engineering tech lead for post-training infrastructure.",
      stats: [],
      points: [],
    },
    {
      role: "MLE · Stores Foundational AI, Post-Training",
      org: "Amazon · Rufus",
      period: "Jan 2025 — Feb 2026",
      summary:
        "Engineering tech lead on asynchronous RL training and training-framework optimization for Amazon Rufus RL releases.",
      stats: [
        { value: "8×", label: "cumulative RL training efficiency" },
        { value: "2×", label: "throughput from async partial rollout" },
        { value: ">500B", label: "MoE params trained on Verl" },
        { value: "30%", label: "less GPU idle time" },
      ],
      points: [
        "Authored colocated hybrid-engine async RL via partial rollout — 2× throughput on DAPO at comparable quality; recipe being upstreamed to Verl.",
        "Enabled Verl to train >500B-param MoE models — 3× throughput over NeMo-Aligner; built async S3 checkpointing & automated resumption.",
        "Designed interleaved rollout/training for NeMo-Aligner — cut GPU idle time 30%.",
      ],
    },
    {
      role: "MLE · AGI Foundations, Post-Training",
      org: "Amazon · Nova & Titan",
      period: "Sep 2023 — Jan 2025",
      summary:
        "Key contributor on MM-DPO (Amazon Nova) and PPO (Titan Text Premier) workstreams on AWS Bedrock.",
      stats: [
        { value: "PB-scale", label: "multimodal DPO data pipeline" },
        { value: "2×", label: "faster PPO iteration (auto-eval)" },
        { value: "75×", label: "runtime reduction, 100B+ models" },
      ],
      points: [
        "Built unified Any-Res multimodal data caching enabling MM-DPO at petabyte scale.",
        "Automated checkpoint evaluation during PPO — 2× faster iteration; 75× runtime reduction for 100B+ models.",
      ],
    },
    {
      role: "SDE · Alexa AI",
      org: "Amazon · Alexa",
      period: "Feb 2021 — Sep 2023",
      summary:
        "Multimodal functionality for Alexa Let's Chat (LLM-powered Alexa); Alexa skill-traffic unification.",
      stats: [
        { value: "2M+", label: "monthly traffic migrated" },
        { value: "50%", label: "backend operating cost cut" },
        { value: "2B", label: "daily traffic, tier-1 service" },
      ],
      points: [
        "Backend multimodal ingress + access control; migrated 2M+ monthly traffic across platforms.",
        "Cut critical backend operating cost 50% via compression; tier-1 service at 2B daily traffic.",
      ],
    },
  ],
  education: [
    {
      school: "Northeastern University",
      period: "2018 — 2020",
      detail: "M.S. Computer Science · GPA 3.99/4.0",
    },
    {
      school: "University of Minnesota — Twin Cities",
      period: "2013 — 2018",
      detail: "B.S. & M.S. Applied Economics",
    },
  ],
};

const zh: AboutData = {
  skillGroups: [
    {
      group: "后训练",
      items: [
        "RL 算法：PPO、GRPO、RLOO、DAPO",
        "RL 架构：colocated、separate stages",
        "SFT 与多模态 DPO（AnyRes）",
        "异步 RL",
        "Agentic RL 训练",
        "Offline 与 on-policy 蒸馏",
      ],
    },
    {
      group: "训练框架与基础设施",
      items: ["Verl", "slime", "NeMo-Aligner / NeMo-RL", "Megatron-LM", "Ray", "PyTorch"],
    },
    {
      group: "推理与部署",
      items: ["vLLM", "SGLang", "NVIDIA Triton", "TensorRT"],
    },
    {
      group: "系统与运维",
      items: [
        "分布式 checkpointing",
        "Nsys 性能剖析",
        "Docker / Kubernetes",
        "NATS JetStream",
        "AWS（EC2、ECR、Batch、Lambda）",
      ],
    },
  ],
  work: [
    {
      role: "MLE · Amazon Ads，Agentic 后训练",
      org: "Amazon · Ads",
      period: "2026 年 2 月 — 至今",
      summary: "后训练基础设施的工程技术负责人。",
      stats: [],
      points: [],
    },
    {
      role: "MLE · Stores Foundational AI，后训练",
      org: "Amazon · Rufus",
      period: "2025 年 1 月 — 2026 年 2 月",
      summary:
        "担任异步 RL 训练与训练框架优化的工程技术负责人，支撑 Amazon Rufus 的 RL 版本发布。",
      stats: [
        { value: "8×", label: "RL 训练效率累计提升" },
        { value: "2×", label: "异步 partial rollout 带来的吞吐提升" },
        { value: ">500B", label: "在 Verl 上训练的 MoE 参数量" },
        { value: "30%", label: "GPU 空闲时间下降" },
      ],
      points: [
        "设计并实现了基于 partial rollout 的 colocated 混合引擎异步 RL——在 DAPO 上以相当的质量实现 2× 吞吐；相关方案正在向 Verl 上游合入。",
        "让 Verl 能够训练 >500B 参数的 MoE 模型——吞吐较 NeMo-Aligner 提升 3×；构建了异步 S3 checkpointing 与自动恢复机制。",
        "为 NeMo-Aligner 设计了 rollout/训练交错调度——GPU 空闲时间下降 30%。",
      ],
    },
    {
      role: "MLE · AGI Foundations，后训练",
      org: "Amazon · Nova & Titan",
      period: "2023 年 9 月 — 2025 年 1 月",
      summary:
        "在 AWS Bedrock 上的 MM-DPO（Amazon Nova）与 PPO（Titan Text Premier）工作流中担任核心贡献者。",
      stats: [
        { value: "PB-scale", label: "多模态 DPO 数据流水线" },
        { value: "2×", label: "PPO 迭代提速（自动评估）" },
        { value: "75×", label: "100B+ 模型的运行时间缩减" },
      ],
      points: [
        "构建了统一的 Any-Res 多模态数据缓存，支撑 PB 级规模的 MM-DPO。",
        "在 PPO 过程中实现 checkpoint 自动评估——迭代提速 2×；100B+ 模型运行时间缩减 75×。",
      ],
    },
    {
      role: "SDE · Alexa AI",
      org: "Amazon · Alexa",
      period: "2021 年 2 月 — 2023 年 9 月",
      summary:
        "为 Alexa Let's Chat（LLM 驱动的 Alexa）开发多模态功能；统一 Alexa 技能流量。",
      stats: [
        { value: "2M+", label: "每月迁移的流量" },
        { value: "50%", label: "后端运营成本削减" },
        { value: "2B", label: "一级服务的日流量" },
      ],
      points: [
        "负责后端多模态入口与访问控制；跨平台迁移了每月 2M+ 的流量。",
        "通过压缩将关键后端运营成本削减 50%；支撑日流量达 2B 的一级服务。",
      ],
    },
  ],
  education: [
    {
      school: "Northeastern University",
      period: "2018 — 2020",
      detail: "计算机科学硕士 · GPA 3.99/4.0",
    },
    {
      school: "University of Minnesota — Twin Cities",
      period: "2013 — 2018",
      detail: "应用经济学学士与硕士",
    },
  ],
};

export const ABOUT: Record<Locale, AboutData> = { en, zh };
