export type Question = {
  id: number;
  page: number;
  prompt: string;
  options?: string[];
  answer: string;
  concise: string;
  standard: string;
  detailed: string;
  hint: string;
  topic: string;
};

export type DemoSet = {
  subject: string;
  title: string;
  questions: Question[];
};

/**
 * Dummy data used by the prototype. In the real product this comes back from
 * an LLM that reads the uploaded source file.
 */
export const DEMO_SETS: DemoSet[] = [
  {
    subject: "Physics",
    title: "Physics · Motion & Forces",
    questions: [
      {
        id: 1,
        page: 4,
        topic: "Kinematics",
        prompt:
          "A 2.0 kg object is released from rest. What is its speed after 3.0 s of free fall, ignoring air resistance?",
        answer: "29.4 m/s",
        concise: "v = u + at = 0 + 9.8 × 3.0 = 29.4 m/s.",
        standard:
          "Using v = u + at with u = 0, a = 9.8 m/s², t = 3.0 s gives v = 29.4 m/s. The object accelerates at g the whole fall.",
        detailed:
          "The object starts at rest, so u = 0. In free fall the only acceleration is gravity, a = g = 9.8 m/s², and it stays constant because air resistance is ignored. Applying v = u + at gives v = 0 + (9.8)(3.0) = 29.4 m/s. Note the 2.0 kg mass is irrelevant — in free fall all masses accelerate identically.",
        hint: "Apply the constant-acceleration equation",
      },
      {
        id: 2,
        page: 6,
        topic: "Newton's laws",
        prompt: "A 15 N force acts on a 3 kg block. Calculate the resulting acceleration.",
        answer: "5.0 m/s²",
        concise: "a = F/m = 15/3 = 5.0 m/s².",
        standard:
          "Newton's second law: a = F / m = 15 / 3 = 5.0 m/s². Direction matches the applied force.",
        detailed:
          "Newton's second law states F = ma, so a = F/m. Substituting F = 15 N and m = 3 kg gives a = 5.0 m/s². Because acceleration is a vector, it points along the same line as the net force. If friction were present you would first subtract it from the 15 N to find the net force.",
        hint: "Rearrange F = ma",
      },
      {
        id: 3,
        page: 9,
        topic: "Uniform motion",
        prompt: "A car travels 60 m at a constant 12 m/s. How long does the journey take?",
        answer: "5.0 s",
        concise: "t = d/v = 60/12 = 5.0 s.",
        standard: "At constant speed, t = d / v = 60 / 12 = 5.0 s. No acceleration is involved.",
        detailed:
          "Constant speed means the distance–time graph is a straight line, so d = vt with no acceleration term. Rearranging, t = d/v = 60 m ÷ 12 m/s = 5.0 s. Always check units cancel: metres ÷ (metres per second) leaves seconds.",
        hint: "Use t = distance / speed",
      },
      {
        id: 4,
        page: 11,
        topic: "Energy",
        prompt:
          "Which quantity is conserved for an isolated system with no external work done on it?",
        options: ["Momentum only", "Total mechanical energy", "Velocity", "Applied force"],
        answer: "Total mechanical energy",
        concise: "Total mechanical energy is conserved.",
        standard:
          "With no external work and no dissipative forces, the sum of kinetic and potential energy stays constant, so total mechanical energy is conserved.",
        detailed:
          "An isolated system exchanges no energy with its surroundings. Without external work or friction, energy only moves between kinetic and potential forms: KE + PE = constant. Velocity is not conserved (it changes as energy converts), and force is not a conserved quantity at all. Momentum is also conserved here, but the question asks about the quantity tied to work, which is energy.",
        hint: "Think about work–energy transfer across the system boundary",
      },
      {
        id: 5,
        page: 12,
        topic: "Circular motion",
        prompt:
          "A 0.5 kg ball moves in a circle of radius 2.0 m at 4.0 m/s. Find the centripetal force.",
        answer: "4.0 N",
        concise: "F = mv²/r = 0.5 × 16 / 2 = 4.0 N.",
        standard:
          "Centripetal force F = mv²/r = (0.5)(4.0²)/2.0 = 4.0 N, directed toward the centre of the circle.",
        detailed:
          "Circular motion at constant speed still involves acceleration because direction changes. That centripetal acceleration is a = v²/r = 16/2.0 = 8.0 m/s². Multiplying by mass gives F = ma = 0.5 × 8.0 = 4.0 N. The force always points to the centre and is provided by a real agent — tension, friction or gravity depending on the setup.",
        hint: "Centripetal acceleration is v² / r",
      },
    ],
  },
  {
    subject: "Biology",
    title: "Biology · Cells & Genetics",
    questions: [
      {
        id: 1,
        page: 2,
        topic: "Cell structure",
        prompt:
          "Explain the primary difference between prokaryotic and eukaryotic cells regarding genetic material storage.",
        answer: "Nucleoid vs membrane-bound nucleus",
        concise: "Prokaryotes keep DNA in a nucleoid; eukaryotes keep it inside a nucleus.",
        standard:
          "Prokaryotic cells store DNA in a non-membrane-bound region called the nucleoid, while eukaryotic cells enclose DNA in a double-membrane nucleus.",
        detailed:
          "Prokaryotic DNA sits free in the cytoplasm in a region called the nucleoid, usually as a single circular chromosome. Eukaryotic DNA is linear, wrapped around histones, and sealed inside a double-membrane nucleus pierced by nuclear pores. That compartmentalisation separates transcription from translation and allows far more sophisticated gene regulation, including RNA splicing.",
        hint: "Focus on whether a membrane surrounds the DNA",
      },
      {
        id: 2,
        page: 5,
        topic: "Organelles",
        prompt: "Which organelle is primarily responsible for ATP production via aerobic respiration?",
        options: ["Ribosome", "Mitochondrion", "Golgi apparatus", "Lysosome"],
        answer: "Mitochondrion",
        concise: "The mitochondrion.",
        standard:
          "Mitochondria carry out the Krebs cycle and oxidative phosphorylation, producing most of the cell's ATP.",
        detailed:
          "Aerobic respiration finishes inside mitochondria. Pyruvate from glycolysis enters the matrix for the Krebs cycle, and the electron transport chain on the inner membrane builds a proton gradient that ATP synthase converts into ATP. The folded cristae maximise surface area. Ribosomes build proteins, the Golgi packages them, and lysosomes digest waste — none of them generate ATP.",
        hint: "Look for the organelle with folded inner membranes",
      },
      {
        id: 3,
        page: 8,
        topic: "Genetics",
        prompt:
          "Two heterozygous parents (Aa × Aa) cross. What fraction of offspring is expected to show the recessive phenotype?",
        answer: "1/4",
        concise: "1 in 4, or 25%.",
        standard:
          "A Punnett square for Aa × Aa gives AA : Aa : aa in a 1:2:1 ratio, so 1/4 of offspring are aa and show the recessive phenotype.",
        detailed:
          "Each parent produces A and a gametes in equal proportion. Combining them gives four equally likely outcomes: AA, Aa, aA, aa. Only aa expresses the recessive phenotype, giving 1/4 = 25%. The genotypic ratio is 1:2:1 while the phenotypic ratio is 3:1, a classic Mendelian monohybrid result.",
        hint: "Draw a 2×2 Punnett square",
      },
      {
        id: 4,
        page: 10,
        topic: "Transport",
        prompt: "Define osmosis and state the direction of water movement.",
        answer: "Water moves to the more concentrated solution",
        concise:
          "Osmosis is water diffusing across a semi-permeable membrane from high to low water potential.",
        standard:
          "Osmosis is the net movement of water molecules across a partially permeable membrane, from a region of higher water potential (dilute) to lower water potential (concentrated).",
        detailed:
          "Osmosis is passive: no ATP is required. Water moves down its own potential gradient across a partially permeable membrane, which means from the dilute side toward the concentrated solute side, until potentials equalise or pressure opposes further flow. In plant cells this creates turgor pressure; in animal cells excess influx can lyse the cell.",
        hint: "Think water potential, not solute movement",
      },
    ],
  },
];

export function pickDemoSet(fileName: string): DemoSet {
  const lower = fileName.toLowerCase();
  const match = DEMO_SETS.find((s) => lower.includes(s.subject.toLowerCase()));
  if (match) return match;
  const sum = [...fileName].reduce((a, c) => a + c.charCodeAt(0), 0);
  return DEMO_SETS[sum % DEMO_SETS.length]!;
}
