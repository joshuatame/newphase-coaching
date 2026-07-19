// Default content used when the API returns no data yet.
// Fitness copy is generic/brand-safe — NOT fake client testimonials.

import type { Faq, Package } from "@/types/newphase";

export const NEWPHASE_WAY = [
  {
    title: "Assess",
    body: "We start with your real starting point — training history, lifestyle, recovery and goals. No guesswork, no templates.",
    index: "01",
  },
  {
    title: "Architect",
    body: "A program engineered around your body and calendar. Training, nutrition and habits built to fit the life you actually live.",
    index: "02",
  },
  {
    title: "Adapt",
    body: "Weekly check-ins and data keep the plan honest. As you change, the program changes with you.",
    index: "03",
  },
  {
    title: "Ascend",
    body: "Momentum compounds. Strength, physique and confidence move into a new phase — and we set the next one.",
    index: "04",
  },
];

export const EXPERIENCE_GRID = [
  {
    title: "1:1 Programs",
    body: "Individually written training blocks updated to your recovery and progress — never a copy-paste plan.",
  },
  {
    title: "Nutrition Systems",
    body: "Flexible, sustainable nutrition frameworks that flex with your week instead of ruling it.",
  },
  {
    title: "Weekly Check-Ins",
    body: "Structured reviews of your data, photos and feedback with clear adjustments every single week.",
  },
  {
    title: "Direct Access",
    body: "Message your coach directly. Real answers from a real human, not a chatbot.",
  },
  {
    title: "Habit Coaching",
    body: "We build the behaviours that make results permanent — sleep, steps, stress and consistency.",
  },
  {
    title: "The App",
    body: "Every session, macro and metric in one place. Log it, track it, watch the phase shift.",
  },
];

export const PERSONALISATION_POINTS = [
  "Training split matched to your schedule",
  "Load & volume auto-adjusted weekly",
  "Nutrition targets tuned to your body",
  "Recovery & sleep tracked and coached",
  "Progress reviewed against your goals",
];

export const FALLBACK_PACKAGES: Package[] = [
  {
    id: "essential",
    name: "Foundation",
    tier: "Entry",
    tagline: "Structure, accountability and a plan that finally fits.",
    priceLabel: "From $149",
    interval: "/mo",
    features: [
      { label: "Personalised training program", included: true },
      { label: "Nutrition guidelines", included: true },
      { label: "Monthly check-in", included: true },
      { label: "In-app messaging", included: true },
      { label: "Weekly 1:1 check-in", included: false },
      { label: "Custom macro coaching", included: false },
    ],
    highlights: ["Best for getting started with structure"],
    ctaLabel: "Start Foundation",
    order: 1,
  },
  {
    id: "signature",
    name: "Signature",
    tier: "Most Popular",
    tagline: "Full-service coaching for people serious about the next phase.",
    priceLabel: "From $299",
    interval: "/mo",
    featured: true,
    features: [
      { label: "Personalised training program", included: true },
      { label: "Custom nutrition system", included: true },
      { label: "Weekly 1:1 check-in", included: true },
      { label: "Direct coach messaging", included: true },
      { label: "Habit & lifestyle coaching", included: true },
      { label: "Priority support", included: false },
    ],
    highlights: ["Everything you need to transform"],
    ctaLabel: "Start Signature",
    order: 2,
  },
  {
    id: "elite",
    name: "Elite",
    tier: "Premium",
    tagline: "Highest-touch coaching with priority access and full customisation.",
    priceLabel: "From $549",
    interval: "/mo",
    features: [
      { label: "Fully bespoke training & nutrition", included: true },
      { label: "Weekly 1:1 video calls", included: true },
      { label: "Daily coach access", included: true },
      { label: "Advanced macro & peak coaching", included: true },
      { label: "Habit & lifestyle coaching", included: true },
      { label: "Priority support", included: true },
    ],
    highlights: ["For maximum results and accountability"],
    ctaLabel: "Apply for Elite",
    order: 3,
  },
];

export const FALLBACK_FAQS: Faq[] = [
  {
    id: "f1",
    question: "How does online coaching actually work?",
    answer:
      "After you apply, we build a program around your goals, schedule and equipment. You train using the app, log your sessions and check in each week. Your coach reviews everything and adjusts the plan so it keeps working.",
    order: 1,
  },
  {
    id: "f2",
    question: "Do I need a gym membership?",
    answer:
      "No. We tailor your program to whatever you have access to — a full gym, a home setup or minimal equipment. The plan is built around your reality.",
    order: 2,
  },
  {
    id: "f3",
    question: "What if I'm a complete beginner?",
    answer:
      "Perfect. Every program starts from your current level with clear coaching on technique and progression. You'll never be left guessing.",
    order: 3,
  },
  {
    id: "f4",
    question: "Can I switch packages later?",
    answer:
      "Absolutely. Many clients start with Foundation and move up as their goals evolve. You can change your plan at any check-in.",
    order: 4,
  },
  {
    id: "f5",
    question: "How soon will I see results?",
    answer:
      "Most clients feel stronger and more consistent within a few weeks. Visible physique changes typically follow within the first couple of months when adherence is high.",
    order: 5,
  },
];

export const CLIENT_CATEGORIES = [
  "All",
  "Fat Loss",
  "Muscle Gain",
  "Strength",
  "Recomposition",
];
