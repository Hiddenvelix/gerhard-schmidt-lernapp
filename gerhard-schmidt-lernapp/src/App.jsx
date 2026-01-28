import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, AlertTriangle, ArrowRight, ArrowLeft, X, Lock, FileCheck, Scale, Users, History, Activity, Loader, Cpu, Database, Stamp, FileText, ChevronRight, BookOpen, Quote, HeartPulse, ScrollText } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";


const apiKey = "";

const term = (key, text) =>
  `<span class="term-link border-b border-dotted border-gray-600 font-bold text-gray-800 cursor-pointer" data-term="${key}">${text}</span>`;

// =====================
// GLOSSARY (neu, reduziert, notwendig)
// =====================
const GLOSSARY = {
  aktion_t4: {
    title: "Aktion T4",
    text: "Zentral organisierte Phase der NS-Krankenmorde ab 1939. Entscheidungen über Leben und Tod erfolgten anhand von Meldebögen, ohne persönliche Untersuchung der Betroffenen."
  },
  kinder_euthanasie: {
    title: "„Kinder-Euthanasie“",
    text: "Systematische Tötung von Kindern mit Behinderungen oder Erkrankungen. Häufig verschleiert durch medizinische Begriffe und Einweisungen in spezielle Abteilungen."
  },
  tarnsprache: {
    title: "Tarnsprache",
    text: "Verwendung medizinisch oder administrativ harmlos klingender Begriffe, um tödliche Maßnahmen zu verschleiern."
  },
  meldebogen: {
    title: "Meldebogen",
    text: "Standardisiertes Formular zur Erfassung von Patientendaten. Diente als Grundlage zentraler Entscheidungen im Rahmen der Aktion T4."
  },
  hungertod: {
    title: "Hungertod",
    text: "Tötungsmethode durch systematische Unterversorgung mit Nahrung, häufig kombiniert mit Sedierung, um den Tod als natürlichen Verlauf erscheinen zu lassen."
  }
};

// =====================
// INTRO SLIDES (angepasst, ohne unnötige Fachwörter)
// =====================
const INTRO_SLIDES = [
  {
    title: "Vorwort",
    subtitle: "Realismus und Quellenbasis der Simulation",
    icon: <img src="https://i.imgur.com/M6SFiVU.jpeg" alt="Dr. Gerhard Schmidt" className="w-full h-full object-cover opacity-80" />,
    text: `Diese Lernsimulation basiert auf Inhalten aus Gerhard Schmidts Selektion in der Heilanstalt 1939–1945 (Neuausgabe 2022) und seinen Zeugenaussagen von 1946. Szenarien und Zitate sind teils rekonstruiert und didaktisch zugespitzt; sie sind nicht immer als wörtlich dokumentierte Einzelfälle zu verstehen, orientieren sich aber an der historischen Quellenlage. [Bild: KI-Generiert basierend auf Gerhard Schmidt]`,
    stamp: "Seminar 25/26"
  },
  {
    title: "Perspektive",
    subtitle: "Leitung & Aufarbeitung (Nachkriegsphase)",
    icon: <img src="https://i.imgur.com/M6SFiVU.jpeg" alt="Dr. Gerhard Schmidt" className="w-full h-full object-cover opacity-80" />,
    text:
      `Du leitest eine psychiatrische Einrichtung in der unmittelbaren Nachkriegszeit. Dein Alltag ist Verwaltung – aber du stößt auf Hinweise, dass die Klinik Teil der ${term("ns_krankenmorde","NS-Krankenmorde")} war. Du entscheidest, wie du vorgehst: sichern, fragen, eskalieren oder still rekonstruieren.`,
    stamp: "Seminar 25/26"
  },
  {
    title: "Spielziel",
    subtitle: "Plausibilität statt Heldengeschichte",
    icon: <img src="https://i.imgur.com/M6SFiVU.jpeg" alt="Dr. Gerhard Schmidt" className="w-full h-full object-cover opacity-80" />,
    text:
      `Ziel ist die Sicherung von Beweismitteln, um rechtliche Konsequenzen für die an den Krankenmorden beteiligten Personen zu ermöglichen. Dabei müssen Verwaltungswege, ${term("tarnsprache","Tarnsprache")}, systematisches Schweigen sowie die Logik hinter ${term("verlegung","Verlegungen")} berücksichtigt werden. In jedem Szenario existiert mindestens eine Option, die das tatsächliche Vorgehen Gerhard Schmidts möglichst realitätsnah widerspiegelt.`,
    stamp: "von Felix F."
  },
  {
    title: "Mechanik",
    subtitle: "Stabilität vs. Erkenntnis",
    icon: <img src="https://i.imgur.com/M6SFiVU.jpeg" alt="Dr. Gerhard Schmidt" className="w-full h-full object-cover opacity-80" />,
    text:
      `Jede Entscheidung hat konkrete Konsequenzen: Sie beeinflusst sowohl den Widerstand des Personals als auch die Beweislast. Nach jeder Entscheidung erhältst du eine Rückmeldung, wie nah das gewählte Vorgehen an der historischen Realität liegt.`,
    stamp: "Viel Erfolg"
  }
];

// =====================
// NEWS / CONTEXT FEED (ästhetisch, datiert, grob stimmig 45/46)
// =====================
const NEWS_HEADLINES = [
  "08.05.1945 — Kapitulation: Behörden im Umbruch, Versorgungslage instabil, Aktenbestände zerstreut.",
  "20.11.1945 — Öffentliche Debatten über Verbrechen beginnen zögerlich; viele Stellen reagieren defensiv.",
  "01.01.1946 — Entnazifizierung läuft an: Zuständigkeiten bleiben widersprüchlich, Verfahren stocken.",
  "28.03.1946 — Ermittlungsdruck steigt: Aussagen werden gesammelt, viele Beteiligte weichen aus.",
  "Sommer 1946 — Stimmung kippt: Aufklärung vs. „Schlussstrich“-Wunsch, öffentliche Aufmerksamkeit schwankt."
];

// =====================
// EVIDENCE FACTORY
// =====================
const evidence = {
  note: (text) => ({
    type: "note",
    content: text.replace(/\n/g, "<br/>"),
    rot: `${Math.floor(Math.random() * 7) - 3}deg`
  }),
  doc: (title, body) => ({
    type: "paper",
    content: `<b>${title}</b><br/><br/>${body.replace(/\n/g, "<br/>")}`,
    rot: `${Math.floor(Math.random() * 7) - 3}deg`
  })
};

// =====================
// GAME SCENARIOS (5 Stück, chronologisch)
// =====================
const GAME_SCENARIOS = [

  // =====================
  // SZENARIO 1 – AKTION T4
  // =====================
  {
    id: "S1_T4",
    title: "Zentrale Entscheidungen ohne Untersuchung",
    date: "1940–1941",
    description:
      `In den Akten findest du Hinweise auf eine zentral gesteuerte Entscheidungslogik, wie sie für die ${term("aktion_t4","Aktion T4")} typisch ist. Patienten wurden erfasst, bewertet und verlegt, ohne dass eine persönliche Untersuchung stattfand.`,

    evidence: [
      evidence.doc(
        "Ausgefüllter Meldebogen",
        `Patient: Nr. 2714\nDiagnose: „Schwachsinn“\nArbeitsfähigkeit: „nein“\nAnmerkung: „Dauerpflegefall“\n→ Weitergeleitet an zentrale Stelle`
      ),
      evidence.doc(
        "Rückanweisung",
        `Vermerk: „Verlegung empfohlen“\nUnterschrift unleserlich\nDatum: 12.03.1941`
      )
    ],

    choices: [
      {
        text: "Du rekonstruierst die Entscheidungslogik anhand der Formulare und Rückanweisungen.",
        effects: { res: +12, ev: +22 },
        stamp: "Systemnachweis",
        type: "procedural",
        outcome:
          "Du kannst zeigen, dass Entscheidungen formalisiert und entpersonalisiert getroffen wurden.",
        historical:
          "Historisch exakt: Entscheidungen basierten auf Aktenlage, nicht auf persönlicher Untersuchung. (Fn2)"
      },
      {
        text: "Du suchst gezielt nach einzelnen verantwortlichen Ärzten.",
        effects: { res: +6, ev: +8 },
        stamp: "Personalisierung",
        type: "risk",
        outcome:
          "Du findest Namen, aber der strukturelle Ablauf bleibt schwer belegbar.",
        historical:
          "Plausibel, aber unvollständig: Das System war wichtiger als Einzelpersonen. (Fn2)"
      },
      {
        text: "Du dokumentierst nur die steigenden Todeszahlen.",
        effects: { res: +2, ev: +4 },
        stamp: "Statistik",
        type: "passive",
        outcome:
          "Die Zahlen wirken auffällig, erklären aber den Mechanismus nicht.",
        historical:
          "Zu schwach für einen belastbaren Nachweis. (Fn2)"
      }
    ]
  },

  // =====================
  // SZENARIO 2 – KINDER-EUTHANASIE
  // =====================
  {
    id: "S2_CHILDREN",
    title: "Spezialabteilung für Kinder",
    date: "1941–1943",
    description:
      `Mehrere Akten betreffen Kinder. Die Einweisungen sind mit medizinisch harmlosen Begriffen versehen – ein Muster, das auf die ${term("kinder_euthanasie","„Kinder-Euthanasie“")} hindeutet.`,

    evidence: [
      evidence.doc(
        "Einweisungsverfügung",
        `Kind: H., 6 Jahre\nGrund: „Behandlung mit special modern therapy“\nAbteilung: Sonderstation\nTodesdatum: 14 Tage nach Einweisung`
      ),
      evidence.note(
        "Mehrere gleichlautende Formulierungen bei unterschiedlichen Kindern."
      )
    ],

    choices: [
      {
        text: "Du sammelst mehrere Kinderfälle und legst sie als zusammenhängendes Muster vor.",
        effects: { res: +14, ev: +24 },
        stamp: "Seriennachweis",
        type: "procedural",
        outcome:
          "Aus Einzelfällen wird ein belegbares System.",
        historical:
          "Historisch sehr nah an Schmidts Vorgehen bei Kinderfällen. (Fn3)"
      },
      {
        text: "Du behandelst jeden Fall einzeln, ohne sie zu verbinden.",
        effects: { res: +4, ev: +10 },
        stamp: "Einzelfall",
        type: "procedural",
        outcome:
          "Die Belege bleiben angreifbar.",
        historical:
          "Plausibel, aber deutlich schwächer als eine Serienanalyse. (Fn3)"
      },
      {
        text: "Du vermeidest Kinderfälle wegen der emotionalen Brisanz.",
        effects: { res: -6, ev: -18 },
        stamp: "Vermeidung",
        type: "passive",
        outcome:
          "Ein zentraler Beweisstrang geht verloren.",
        historical:
          "Historisch ungünstig: Gerade diese Fälle sind gut belegbar. (Fn3)"
      }
    ]
  },

  // =====================
  // SZENARIO 3 – HUNGERTOTE
  // =====================
  {
    id: "S3_STARVATION",
    title: "Unauffällige Todesursachen",
    date: "1942–1944",
    description:
      `Die Sterbeakten zeigen eine Häufung von Todesursachen wie „Entkräftung“ oder „Lungenentzündung“. In Verbindung mit Rationsplänen deutet dies auf systematischen ${term("hungertod","Hungertod")} hin.`,

    evidence: [
      evidence.doc(
        "Essensplan",
        `Tagesration Station C:\nFrüh: Kaffeeersatz\nMittag: dünne Suppe\nAbend: entfällt`
      ),
      evidence.doc(
        "Medikationsliste",
        `Verabreicht: Luminal (Barbiturat)\nDosierung: regelmäßig`
      )
    ],

    choices: [
      {
        text: "Du verbindest Rationspläne, Medikation und Todesursachen.",
        effects: { res: +18, ev: +26 },
        stamp: "Methodennachweis",
        type: "procedural",
        outcome:
          "Du kannst zeigen, dass der Tod gezielt herbeigeführt wurde.",
        historical:
          "Historisch belegt: Kombination aus Unterernährung und Sedierung. (Fn4)"
      },
      {
        text: "Du dokumentierst nur die Todesursachen aus den Akten.",
        effects: { res: +6, ev: +8 },
        stamp: "Teilnachweis",
        type: "procedural",
        outcome:
          "Die Ursachen wirken medizinisch erklärbar.",
        historical:
          "Unvollständig ohne Kontext der Versorgung. (Fn4)"
      },
      {
        text: "Du verzichtest auf diesen Nachweis wegen fehlender direkter Befehle.",
        effects: { res: -4, ev: -12 },
        stamp: "Zurückhaltung",
        type: "passive",
        outcome:
          "Ein zentraler Tötungsmechanismus bleibt verborgen.",
        historical:
          "Historisch ungünstig: Genau hier setzte Schmidt an. (Fn4)"
      }
    ]
  },

  // =====================
  // SZENARIO 4 – VERSCHLEIERUNG
  // =====================
  {
    id: "S4_COVER",
    title: "Sprache als Werkzeug",
    date: "1941–1944",
    description:
      `Die Akten verwenden durchgehend medizinisch harmlose Begriffe. Diese ${term("tarnsprache","Tarnsprache")} sorgt dafür, dass Todesfälle nach außen unauffällig erscheinen.`,

    evidence: [
      evidence.doc(
        "Sterbeurkunde",
        `Todesursache: „natürlicher Verlauf der Grunderkrankung“`
      ),
      evidence.note(
        "Gleiche Formulierungen bei sehr unterschiedlichen Patienten."
      )
    ],

    choices: [
      {
        text: "Du weist nach, dass die Sprache systematisch zur Verschleierung genutzt wurde.",
        effects: { res: +20, ev: +20 },
        stamp: "Enttarnung",
        type: "procedural",
        outcome:
          "Die Akten verlieren ihre Unschuld.",
        historical:
          "Zentraler Bestandteil der Rekonstruktion bei Schmidt. (Fn4)"
      },
      {
        text: "Du akzeptierst die Begriffe als zeittypische Medizin.",
        effects: { res: -2, ev: -10 },
        stamp: "Naivität",
        type: "passive",
        outcome:
          "Die Dokumente bleiben unangetastet.",
        historical:
          "Historisch nicht haltbar. (Fn4)"
      },
      {
        text: "Du vermutest Verschleierung, belegst sie aber nicht.",
        effects: { res: +6, ev: +2 },
        stamp: "Vermutung",
        type: "risk",
        outcome:
          "Angreifbar wegen fehlender Belege.",
        historical:
          "Ohne Nachweis bleibt es Spekulation. (Fn4)"
      }
    ]
  },

  // =====================
  // SZENARIO 5 – GESAMTBEWERTUNG
  // =====================
  {
    id: "S5_SYNTHESIS",
    title: "System oder Einzelfälle?",
    date: "1945–1946",
    description:
      "Du musst entscheiden, wie du die gesammelten Beweise präsentierst: als vereinzelte Verfehlungen oder als geschlossenes System.",

    evidence: [
      evidence.doc(
        "Zusammenfassung",
        "Formulare, Verlegungen, Kinderfälle, Unterernährung und Sprachregelungen ergeben ein konsistentes Gesamtbild."
      )
    ],

    choices: [
      {
        text: "Du präsentierst alles als zusammenhängendes System.",
        effects: { res: +25, ev: +30 },
        stamp: "Gesamtnachweis",
        type: "procedural",
        outcome:
          "Maximale Beweislast – massiver Widerstand.",
        historical:
          "Entspricht Schmidts tatsächlichem Vorgehen. (Fn1–Fn7)"
      },
      {
        text: "Du beschränkst dich auf die am besten belegten Teilaspekte.",
        effects: { res: +10, ev: +14 },
        stamp: "Kompromiss",
        type: "procedural",
        outcome:
          "Solide, aber nicht vollständig.",
        historical:
          "Plausibel, aber weniger durchschlagskräftig."
      },
      {
        text: "Du stellst alles als ungeklärte Einzelfälle dar.",
        effects: { res: -10, ev: -20 },
        stamp: "Relativierung",
        type: "passive",
        outcome:
          "Die Aufarbeitung scheitert.",
        historical:
          "Historisch falsch und quellenwidrig."
      }
    ]
  }
];

// =====================
// FOOTNOTES (unchanged content; still only at the end)
// =====================
const FOOTNOTES = {
  Fn1:
    "Schmidt, Gerhard: Schmidt Testimony on the Euthanasia Program, Affidavit (28 March 1946), PDF-S. 1: „open secret“ / „could not give any official answer“.",
  Fn2:
    "Schmidt, Gerhard: Schmidt Testimony on the Euthanasia Program, Affidavit (28 March 1946), PDF-S. 1: Fragebögen → zentrale Stelle Berlin → Rückorder/Verlegung; Tötung häufig durch Injektionen.",
  Fn3:
    "Schmidt, Gerhard: Schmidt Testimony on the Euthanasia Program, Affidavit (28 March 1946), PDF-S. 1: Kinderfälle / „special modern therapy“; Verknüpfung mit Tötung.",
  Fn4:
    "Schmidt, Gerhard: Schmidt Testimony on the Euthanasia Program, Affidavit (28 March 1946), PDF-S. 2: slow starvation; Konferenz Ende 1942 im Bavarian Ministry of the Interior; Tarnung als „natural death“.",
  Fn5:
    "Schmidt, Gerhard: Schmidt Testimony on the Euthanasia Program, Affidavit (28 March 1946), PDF-S. 2: Viele Getötete wären zu einfacher Arbeit fähig gewesen („able to perform … simple work“).",
  Fn6:
    "Jaspers, Karl: Geleitwort, in: Schmidt, Gerhard: Selektion in der Heilanstalt 1939–1945 (Neuausgabe, hrsg. von Frank Schneider), PDF-S. 10–11: Bedeutung der Dokumentation/Übergangszeit 1945.",
  Fn7:
    "Schneider, Frank: Geleitwort, in: Schmidt, Gerhard: Selektion in der Heilanstalt 1939–1945 (Neuausgabe, hrsg. von Frank Schneider), PDF-S. 5–6: frühe öffentliche Thematisierung; Publikationswiderstände."
};



export default function App() {
  const [screen, setScreen] = useState('bio'); 
  const [resistance, setResistance] = useState(10);
  const [evidenceScore, setEvidence] = useState(0);
  const [history, setHistory] = useState([]);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [introStep, setIntroStep] = useState(0); 
  
  const [resDelta, setResDelta] = useState(null);
  const [evDelta, setEvDelta] = useState(null);
  const [shake, setShake] = useState(false);
  const [stamp, setStamp] = useState(null); 
  const [transitioning, setTransitioning] = useState(false);
  const [showScoreOverlay, setShowScoreOverlay] = useState(false);
  const [animateBars, setAnimateBars] = useState(false); 

  const [activeGlossary, setActiveGlossary] = useState(null);
  const [docModalContent, setDocModalContent] = useState(null);
  const [outcomeModalData, setOutcomeModalData] = useState(null);

  const lastDiffs = useRef({ res: 0, ev: 0 });

  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentScenario = GAME_SCENARIOS[scenarioIndex];

  const shuffledChoices = useMemo(() => {
    const choices = [...currentScenario.choices];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
  }, [currentScenario]);

  const currentDescription = useMemo(() => {
    if (currentScenario.description) return currentScenario.description;
    if (currentScenario.descVariants) {
      const prevChoice = history[scenarioIndex - 1];
      const mod = prevChoice?.nextMod || "neutral";
      return currentScenario.descVariants[mod] || currentScenario.descVariants.neutral;
    }
    return "Keine Beschreibung verfügbar.";
  }, [currentScenario, history, scenarioIndex]);

  const evidencePositions = useMemo(() => {
    return currentScenario.evidence.map(() => ({
      left: Math.random() * 50 + 10,
      top: Math.random() * 40 + 10,
      rot: Math.random() * 10 - 5 + 'deg'
    }));
  }, [scenarioIndex, currentScenario]);

  const handleGlobalClick = (e) => {
    const termLink = e.target.closest('.term-link');
    if (termLink) {
      e.preventDefault(); e.stopPropagation();
      const termKey = termLink.getAttribute('data-term');
      if (GLOSSARY[termKey]) {
          setActiveGlossary({ ...GLOSSARY[termKey], key: Date.now() });
      }
    }
  };

  const handleModalClick = (e) => {
    const termLink = e.target.closest('.term-link');
    if (termLink) {
        const termKey = termLink.getAttribute('data-term');
        if (GLOSSARY[termKey]) {
            setActiveGlossary({ ...GLOSSARY[termKey], key: Date.now() });
        }
        return; 
    }
    e.stopPropagation();
  };

  const handleEvidenceClick = (e, content) => {
    if (e.target.closest('.term-link')) return; 
    setDocModalContent(content);
  };

  const handleChoice = (choice) => {
    setStamp({ text: choice.stamp || "GEWÄHLT", type: choice.type });
    
    setTimeout(() => {
        const oldRes = resistance;
        const oldEv = evidenceScore;
        const newRes = Math.max(0, Math.min(100, resistance + choice.effects.res));
        const newEv = Math.max(0, Math.min(100, evidenceScore + choice.effects.ev));
        
        if (choice.effects.res > 20) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }

        setResistance(newRes);
        setEvidence(newEv);
        setHistory([...history, choice]);

        const rDiff = newRes - oldRes;
        const eDiff = newEv - oldEv;
        
        lastDiffs.current = { res: rDiff, ev: eDiff };

        setResDelta({ val: rDiff, key: Date.now() });
        setEvDelta({ val: eDiff, key: Date.now() });
        setTimeout(() => { setResDelta(null); setEvDelta(null); }, 1500);

        setOutcomeModalData({
            title: "Konsequenz",
            text: choice.outcome,
            reality: choice.historical,
            diffRes: rDiff,
            diffEv: eDiff
        });
        
        setStamp(null);
    }, 600);
  };

  const handleNext = () => {
    setOutcomeModalData(null);
    setActiveGlossary(null); 
    
    setShowScoreOverlay(true);
    setAnimateBars(false); 
    
    setTimeout(() => setAnimateBars(true), 100);
    
    setTimeout(() => {
        setShowScoreOverlay(false);
        setTransitioning(true);
        setTimeout(() => {
            if (scenarioIndex < GAME_SCENARIOS.length - 1) {
                setScenarioIndex(scenarioIndex + 1);
            } else {
                triggerEndGame();
            }
            setTransitioning(false);
        }, 500);
    }, 2500);
  };

  const handleIntroNext = () => {
      if (introStep < INTRO_SLIDES.length - 1) {
          setIntroStep(prev => prev + 1);
      } else {
          setScreen('start');
      }
  };

  const handleIntroPrev = () => {
      if (introStep > 0) {
          setIntroStep(prev => prev - 1);
      }
  };

  const triggerEndGame = async () => {
    setScreen('end');
    setIsGenerating(true);

    const getQualitativeRes = (val) => {
        if (val > 80) return "Belegschaft im offenen Aufruhr / Streik";
        if (val > 50) return "Massive passive Obstruktion / Aktenvernichtung";
        if (val > 25) return "Spürbare Zurückhaltung / Misstrauen";
        return "Kooperativ / Unter Kontrolle";
    };

    const getQualitativeEv = (val) => {
        if (val > 80) return "Lückenlose Indizienkette (Statistisch & Materiell)";
        if (val > 50) return "Substanziell aber lückenhaft";
        if (val > 25) return "Fragmentarisch / Nur Einzelindizien";
        return "Juristisch wertlos / Hörensagen";
    };

    const narrativePath = history.map((h, i) => `Schritt ${i+1}: ${h.text}`).join(" -> ");
    const fallbackReport = getFallbackReport(evidenceScore, resistance);
    let finalReport = fallbackReport;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });
        const prompt = `
        Role: Historian specializing in post-war German medical ethics (Eglfing-Haar 1945).
        Task: Write a clinical, scientific, and concise "Final Report" based on the specific decisions taken by the player (Dr. Schmidt).
        CONTEXT:
        The player has navigated a simulation of 1945-1947. 
        - Real History: Dr. Schmidt was bureaucratic, non-violent, and used statistics to prove murders without triggering a revolt.
        - Player's Path: ${narrativePath}
        OUTCOME DATA (INTERPRETED):
        - Evidence Secured: ${getQualitativeEv(evidenceScore)}
        - Internal Resistance: ${getQualitativeRes(resistance)}
        INSTRUCTIONS:
        1. Analyze the "Player's Path". If they chose violence, describe the chaos. If they chose compromise, describe the moral failure.
        2. Do NOT mention percentages. Use the context to describe the situation.
        OUTPUT FORMAT (JSON ONLY):
        {
            "legal": "Juristische Konsequenz (Max 2 sentences)",
            "social": "Soziale Auswirkungen für Angehörige (Max 2 sentences)",
            "history": "Historisches Urteil über Dr. Schmidt (Max 2 sentences)",
            "internal": "Interner Status der Klinik (Max 2 sentences)",
            "grade": "ONE WORD RATING (EXEMPLARISCH, ERFOLGREICH, ZWIESPÄLTIG, BLOCKIERT, or GESCHEITERT)"
        }
        `;

        const fetchWithRetry = async (retries = 3, delay = 1000) => {
            try {
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                const cleanJson = text.replace(/```json|```/g, '').trim();
                return JSON.parse(cleanJson);
            } catch (err) {
                if (retries > 0) {
                    await new Promise(res => setTimeout(res, delay));
                    return fetchWithRetry(retries - 1, delay * 2);
                }
                throw err;
            }
        };

        const aiData = await fetchWithRetry();
        let gradeColor = "text-gray-400";
        if (aiData.grade === "EXEMPLARISCH") gradeColor = "text-green-900";
        else if (aiData.grade === "ERFOLGREICH") gradeColor = "text-green-700";
        else if (aiData.grade === "ZWIESPÄLTIG") gradeColor = "text-yellow-800";
        else gradeColor = "text-red-900";

        finalReport = { ...aiData, gradeColor, stats: { ev: evidenceScore, res: resistance }, isApi: true };
    } catch (error) {
        console.error("Gemini API failed, using fallback.", error);
        finalReport.isApi = false; 
    } finally {
        setReportData(finalReport);
        setIsGenerating(false);
    }
  };

const getFallbackReport = (ev, res) => {
  // Grade
  let grade = "GESCHEITERT";
  let gradeColor = "text-red-900";

  if (ev >= 85 && res <= 45) { grade = "EXEMPLARISCH"; gradeColor = "text-green-900"; }
  else if (ev >= 70 && res <= 65) { grade = "ERFOLGREICH"; gradeColor = "text-green-700"; }
  else if (ev >= 45) { grade = "ZWIESPÄLTIG"; gradeColor = "text-yellow-800"; }
  else if (res >= 80) { grade = "BLOCKIERT"; gradeColor = "text-red-800"; }

  // Textbausteine (abhängig von ev/res, nicht stumpf negativ)
  const legal =
    ev >= 85 ? "Beweislage trägt strukturierte Ermittlungen; mehrere Verantwortungsstränge sind dokumentierbar." :
    ev >= 70 ? "Beweislage reicht für belastbare Verfahren, aber einzelne Kettenglieder bleiben angreifbar." :
    ev >= 45 ? "Beweislage ist fragmentarisch; Verfahren laufen Gefahr, an Lücken zu scheitern." :
               "Beweislage bleibt überwiegend Hörensagen; juristische Konsequenzen sind begrenzt.";

  const social =
    ev >= 70 ? "Angehörige erhalten erstmals eine nachvollziehbare Rekonstruktion; Unsicherheit nimmt ab." :
    ev >= 45 ? "Teilaufklärung entlastet einzelne Familien, lässt aber viele Fragen offen." :
               "Ungewissheit bleibt dominierend und wirkt über Generationen nach.";

  const history =
    (ev >= 85 && res >= 60) ? "Dokumentation ist stark, aber das Vorgehen polarisiert: Aufklärung gegen institutionelle Abwehr." :
    (ev >= 70) ? "Die Arbeit gilt als wichtiger Beitrag zur Aufarbeitung, trotz verbleibender Lücken." :
    (ev >= 45) ? "Historisch bleibt das Ergebnis ambivalent: richtige Richtung, aber zu wenig Durchschlagskraft." :
                 "Die Aufarbeitung verpufft; spätere Deutung wird von Fremdnarrativen geprägt.";

  const internal =
    res >= 80 ? "Klinikbetrieb ist durch offene Obstruktion gelähmt; Informationszugang bricht wiederholt weg." :
    res >= 60 ? "Altpersonal blockiert passiv: Verzögerungen, Schweigen, selektive Aktenzugänge." :
    res >= 40 ? "Kooperation ist wechselhaft; einzelne Bereiche arbeiten mit, andere ziehen sich zurück." :
                "Interner Widerstand bleibt kontrollierbar; Kooperation ist überwiegend vorhanden.";

  return {
    grade, gradeColor, stats: { ev, res },
    legal, social, history, internal,
    isApi: false
  };
};

  return (
    <div className={`h-screen w-screen flex flex-col bg-[#1a1a1a] text-[#333] font-courier overflow-hidden select-none ${shake ? 'animate-shake' : ''}`} onClick={handleGlobalClick}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Special+Elite&display=swap');
        .font-courier { font-family: 'Courier Prime', monospace; }
        .font-typewriter { font-family: 'Special Elite', cursive; }
        .font-serif-custom { font-family: 'Times New Roman', serif; }
        .bg-desk { 
            background-color: #2c241b; 
            background-image: repeating-linear-gradient(45deg, #282018 25%, transparent 25%, transparent 75%, #282018 75%, #282018), repeating-linear-gradient(45deg, #282018 25%, #2c241b 25%, #2c241b 75%, #282018 75%, #282018); 
            background-position: 0 0, 10px 10px; background-size: 20px 20px; 
            box-shadow: inset 0 0 150px #000; 
        }
        .crt-overlay {
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
        }
        @keyframes slideIn { from { transform: translateY(120vh) rotate(5deg) scale(0.9); opacity: 0; } to { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; } }
        .animate-slide-in { animation: slideIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes slideOut { from { transform: translateY(0) rotate(0deg); opacity: 1; } to { transform: translateY(-20px) rotate(-2deg); opacity: 0; } }
        .animate-slide-out { animation: slideOut 0.5s ease-in forwards; }
        @keyframes floatFade { 0% { opacity: 0; transform: translateY(10px) scale(0.8); } 20% { opacity: 1; transform: translateY(0px) scale(1.2); } 100% { opacity: 0; transform: translateY(-30px) scale(1); } }
        .animate-float-fade { animation: floatFade 1.5s ease-out forwards; }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-pop-in { animation: popIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px) rotate(-1deg); } 75% { transform: translateX(5px) rotate(1deg); } }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes stamp { 0% { opacity: 0; transform: scale(2) rotate(-10deg); } 50% { opacity: 1; transform: scale(1) rotate(0deg); } 70% { transform: scale(1.1) rotate(2deg); } 100% { transform: scale(1) rotate(0deg); } }
        .animate-stamp { animation: stamp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes ticker { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }
        .animate-ticker { animation: ticker 40s linear infinite; }
        @keyframes scorePop { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .animate-score-pop { animation: scorePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
      
      <div className="absolute inset-0 crt-overlay z-[90]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-40 pointer-events-none z-[85]"></div>

      {/* HEADER HUD */}
      <header className="bg-gray-900 text-gray-300 p-3 flex justify-between items-center z-[75] border-b border-gray-700 shadow-md relative">
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 p-2 rounded border border-gray-600">
            <User size={18} className="text-gray-400"/>
          </div>
          <div>
             <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500">Akteur</div>
             <div className="text-white font-serif-custom leading-none">Prof. Dr. Gerhard Schmidt</div>
          </div>
        </div>
        <div className="flex items-center gap-8">
           {/* Resistance Meter */}
           <div className="flex flex-col items-end relative group">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                Widerstand <Activity size={10}/>
            </div>
            <div className="flex items-center gap-2 relative">
              <div className="bg-[#000] border border-[#333] h-4 w-32 relative overflow-hidden rounded-sm shadow-inner">
                {/* Ghost Bar for animation */}
                <div className="absolute h-full bg-red-900 opacity-50 transition-all duration-1000 ease-out" style={{ width: `${resistance}%` }}></div>
                <div className={`h-full transition-all duration-300 ease-out ${resistance < 30 ? 'bg-green-600' : resistance < 60 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${resistance}%` }}></div>
              </div>
            </div>
            {resDelta && <div key={resDelta.key} className={`absolute -bottom-8 right-0 font-bold font-mono text-xl animate-float-fade z-50 drop-shadow-md ${resDelta.val > 0 ? 'text-red-500' : 'text-green-500'}`}>{resDelta.val > 0 ? `+${resDelta.val}` : resDelta.val}</div>}
          </div>
          {/* Evidence Meter */}
          <div className="flex flex-col items-end relative group">
             <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                Beweislast <Scale size={10}/>
            </div>
            <div className="flex items-center gap-2 relative">
              <div className="bg-[#000] border border-[#333] h-4 w-32 relative overflow-hidden rounded-sm shadow-inner">
                <div className="absolute h-full bg-blue-900 opacity-50 transition-all duration-1000 ease-out" style={{ width: `${evidenceScore}%` }}></div>
                <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${evidenceScore}%` }}></div>
              </div>
            </div>
            {evDelta && <div key={evDelta.key} className={`absolute -bottom-8 right-0 font-bold font-mono text-xl animate-float-fade z-50 drop-shadow-md ${evDelta.val > 0 ? 'text-green-400' : 'text-red-500'}`}>{evDelta.val > 0 ? `+${evDelta.val}` : evDelta.val}</div>}
          </div>
        </div>
        <div className="text-center ml-4 bg-black px-3 py-1 border border-gray-700 rounded">
          <div className="text-[9px] text-gray-500 uppercase">Akten-Datum</div>
          <div className="font-mono text-amber-500 text-sm tracking-widest">{screen === 'game' ? currentScenario.date : '1945'}</div>
        </div>
      </header>

      {/* MAIN GAME AREA */}
      <main className="relative flex-grow w-full overflow-hidden flex items-center justify-center p-4 mb-8 bg-desk">
        
        {/* Screen: BIO (3 Slides) */}
        {screen === 'bio' && (
          <div className="absolute z-40 max-w-3xl w-full bg-[#f4f1ea] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 animate-slide-in flex flex-col md:flex-row gap-8 border-t-8 border-gray-800 rotate-1">
            <div className="w-full md:w-1/3 flex flex-col items-center border-r-2 border-gray-300 pr-4 border-dashed justify-center">
              <div className="w-40 h-40 bg-gray-200 shadow-inner mb-4 flex items-center justify-center border-4 border-white transform rotate-2 relative overflow-hidden grayscale contrast-125 rounded-full">
                {INTRO_SLIDES[introStep].icon}
              </div>
              <div className="border-4 double border-[#8b0000] text-[#8b0000] rotate-[-5deg] p-2 font-bold uppercase tracking-widest font-typewriter opacity-80 mb-4 text-center text-sm">{INTRO_SLIDES[introStep].stamp}</div>
            </div>
            <div className="w-full md:w-2/3 flex flex-col">
              <h1 className="text-3xl font-bold mb-1 font-typewriter text-gray-900 tracking-tighter uppercase">{INTRO_SLIDES[introStep].title}</h1>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-400 pb-2">{INTRO_SLIDES[introStep].subtitle}</div>
              
              {/* DIARY TEXT STYLE */}
              <div className="relative p-2 h-56 overflow-y-auto pr-2 custom-scrollbar bg-white/50 border border-gray-200 shadow-inner rounded-sm">
                 <Quote size={24} className="absolute top-2 left-2 text-gray-300 transform -scale-x-100"/>
                 <p className="font-typewriter text-sm leading-relaxed text-gray-800 px-6 py-2" dangerouslySetInnerHTML={{ __html: INTRO_SLIDES[introStep].text }}></p>
                 <Quote size={24} className="absolute bottom-2 right-2 text-gray-300"/>
              </div>
              
              {/* Navigation */}
              <div className="mt-auto pt-6 flex justify-between items-center border-t border-gray-300">
                <div className="flex gap-1">
                    {INTRO_SLIDES.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === introStep ? 'bg-black' : 'bg-gray-300'}`}></div>
                    ))}
                </div>
                <div className="flex gap-2">
                    {introStep > 0 && (
                        <button onClick={handleIntroPrev} className="px-4 py-2 text-gray-600 hover:text-black font-bold font-mono text-xs flex items-center gap-1">
                            <ArrowLeft size={12}/> ZURÜCK
                        </button>
                    )}
                    {introStep < INTRO_SLIDES.length - 1 ? (
                        <button onClick={handleIntroNext} className="bg-gray-800 text-white px-4 py-2 hover:bg-black transition-all font-mono text-xs shadow-md flex items-center gap-2">
                            WEITER <ChevronRight size={12}/>
                        </button>
                    ) : (
                        <button onClick={() => setScreen('start')} className="bg-red-900 text-white px-6 py-2 hover:bg-red-800 transition-all font-mono text-xs shadow-md flex items-center gap-2 animate-pulse">
                            AKTE SCHLIEẞEN & STARTEN <BookOpen size={12}/>
                        </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screen: START */}
        {screen === 'start' && (
          <div className="absolute z-30 max-w-2xl w-full bg-[#f4f1ea] shadow-2xl p-10 rotate-1 animate-slide-in border border-gray-300">
            <h1 className="text-5xl font-bold mb-4 font-typewriter text-gray-900 text-center border-b-4 border-double border-gray-800 pb-4">VERWALTUNG DER VERGANGENHEIT</h1>
            <p className="mb-6 text-justify leading-relaxed font-serif-custom text-lg">Du übernimmst die Rolle von Dr. Schmidt. Jede Entscheidung hat Konsequenzen für die Beweislage in den Nürnberger Prozessen und den Widerstand in deiner Klinik.</p>
            <div className="flex justify-center">
              <button onClick={() => setScreen('game')} className="bg-red-900 text-white px-8 py-4 hover:bg-red-800 transition font-mono shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none font-bold text-xl flex items-center gap-2">
                <Stamp size={24}/> DIENST BEGINNEN
              </button>
            </div>
          </div>
        )}

        {/* Screen: GAME */}
        {screen === 'game' && !transitioning && (
          <div key={scenarioIndex} className="absolute z-20 max-w-6xl w-full h-[80vh] flex flex-col animate-slide-in">
            {/* Folder Tab */}
            <div className="ml-8 bg-[#dcbfa3] rounded-t-lg w-[200px] h-[35px] -mb-[1px] relative z-10 flex items-center justify-center text-gray-800 font-bold text-sm tracking-wider uppercase border border-gray-500 border-b-0 shadow-sm">
              <FileText size={14} className="mr-2 opacity-50"/> AKTE {["I", "II", "III", "IV", "V", "VI", "VII"][scenarioIndex]}
            </div>
            
            {/* Folder Body */}
            <div className="flex-grow bg-[#e8dcc5] rounded-r-lg rounded-b-lg shadow-[10px_20px_50px_rgba(0,0,0,0.6)] p-8 relative border border-gray-500 flex flex-col md:flex-row gap-8 border-t border-[#dcbfa3]">
              
              {/* STAMP OVERLAY ANIMATION */}
              {stamp && (
                  <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] border-8 px-10 py-4 font-black text-6xl rotate-[-15deg] animate-stamp mix-blend-multiply pointer-events-none whitespace-nowrap
                    ${stamp.type === 'risk' || stamp.type === 'aggressive' ? 'border-red-700 text-red-700' : 
                      stamp.type === 'procedural' || stamp.type === 'smart' ? 'border-blue-800 text-blue-800' : 
                      'border-gray-800 text-gray-800'}`}>
                      {stamp.text}
                  </div>
              )}

              {/* Left Column: Narrative */}
              <div className="w-full md:w-2/5 flex flex-col border-r-2 border-gray-400 pr-6 border-dotted relative">
                <div className="mb-4 flex justify-between items-center">
                  <span className="bg-red-800 text-white text-[10px] px-2 py-1 uppercase tracking-widest font-bold shadow-sm">Dringend</span>
                  {resistance > 50 && <span className="text-red-700 font-bold text-xs flex items-center gap-1 animate-pulse"><AlertTriangle size={14} /> Hohes Risiko</span>}
                </div>
                
                <h3 className="text-3xl font-bold mb-4 font-typewriter text-gray-900 leading-tight" dangerouslySetInnerHTML={{ __html: currentScenario.title }} />
                
                <div className="bg-white/50 p-4 border border-gray-300 shadow-inner mb-6 h-48 overflow-y-auto font-serif-custom text-base leading-relaxed text-gray-900 rounded" dangerouslySetInnerHTML={{ __html: currentDescription }} />
                
                <div className="mt-auto space-y-3">
                   {shuffledChoices.map((choice, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleChoice(choice)} 
                            className="group w-full text-left bg-[#f4f1ea] border border-gray-400 p-4 shadow-md hover:shadow-lg transition-all duration-200 flex justify-between items-center relative overflow-hidden transform hover:-translate-y-0.5"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-400 group-hover:bg-amber-600 transition-colors"></div>
                          <span className="font-bold text-sm text-gray-800 pl-3 group-hover:text-black">
                            <span className="text-xs text-gray-500 uppercase mr-2 font-mono group-hover:text-amber-700">Option {String.fromCharCode(65+i)}</span>
                            <br/>
                            <span dangerouslySetInnerHTML={{ __html: choice.text }} />
                          </span>
                          <Stamp size={16} className="text-gray-300 group-hover:text-amber-600 transform group-hover:rotate-12 transition-all"/>
                        </button>
                   ))}
                </div>
              </div>
              
              {/* Right Column: Desk/Evidence */}
              <div className="w-full md:w-3/5 relative bg-[#dcdcdc] rounded border border-gray-400 shadow-inner p-4 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cardboard.png')]">
                <div className="absolute top-2 right-2 text-gray-500 text-xs uppercase tracking-widest z-10 font-bold bg-white/80 px-2 py-1 rounded">Beweismittel</div>
                {currentScenario.evidence.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={(e) => handleEvidenceClick(e, item.content)}
                    className={`absolute shadow-lg border p-3 overflow-hidden cursor-pointer hover:z-50 hover:scale-105 transition-transform duration-300
                        ${item.type === 'note' ? 'bg-[#fff9c4] font-handwriting w-48 h-48 text-gray-800 rotate-2' : 'bg-white w-40 h-56 text-[10px] text-gray-900'}`}
                    style={{ 
                        left: `${evidencePositions[i].left}%`, 
                        top: `${evidencePositions[i].top}%`, 
                        transform: `rotate(${item.rot})` 
                    }}
                  >
                    {item.type === 'paper' && <div className="absolute top-0 left-0 w-full h-4 bg-gray-200 border-b border-gray-300"></div>}
                    <div className="opacity-90" dangerouslySetInnerHTML={{ __html: item.content }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODALS */}
        {activeGlossary && (
          <div key={activeGlossary.key} className="absolute top-24 right-12 w-72 p-6 bg-[#fffbf0] border-2 border-gray-300 shadow-2xl rotate-[-2deg] font-typewriter z-[110] animate-pop-in">
             <div className="flex justify-between items-start mb-2 border-b-2 border-gray-800 pb-1">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Karteikarte</span>
                <button onClick={() => setActiveGlossary(null)} className="text-red-800 hover:font-bold"><X size={20}/></button>
            </div>
            <h3 className="font-bold text-xl mb-3 text-black">{activeGlossary.title}</h3>
            <p className="text-sm text-gray-800 leading-relaxed font-serif-custom">{activeGlossary.text}</p>
          </div>
        )}

        {docModalContent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onClick={() => setDocModalContent(null)}>
            <div className="bg-white max-w-lg w-full p-10 shadow-2xl relative rotate-1 animate-slide-in cursor-default" onClick={handleModalClick}>
              <button onClick={() => setDocModalContent(null)} className="absolute top-2 right-2 text-gray-500 hover:text-red-600"><X size={24}/></button>
              <div className="font-serif-custom text-lg" dangerouslySetInnerHTML={{ __html: docModalContent }} />
            </div>
          </div>
        )}

        {/* UPDATED: SCORE OVERLAY WITH MAGNIFIED BARS */}
        {showScoreOverlay && (
             <div className="fixed inset-0 bg-black/95 z-[120] flex flex-col items-center justify-center pointer-events-none">
                 <div className="animate-score-pop flex flex-col gap-8 items-center w-full max-w-2xl px-8">
                     <h2 className="text-white text-4xl font-bold font-typewriter uppercase tracking-widest mb-2 border-b-2 border-white/20 pb-4">Auswirkungen</h2>
                     
                     {/* Magnified Resistance Bar */}
                     <div className="w-full">
                         <div className="flex justify-between text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">
                             <span>Widerstand der Belegschaft</span>
                             <span>{resistance}%</span>
                         </div>
                         <div className="h-8 bg-gray-900 w-full rounded border border-gray-700 relative overflow-hidden">
                             {/* Previous Value Background */}
                             <div 
                                className="absolute h-full bg-red-900/30 transition-all duration-1000" 
                                style={{ width: `${Math.max(0, resistance - lastDiffs.current.res)}%` }}
                             ></div>
                             {/* Animated Current Value */}
                             <div 
                                className={`h-full transition-all duration-1000 ease-out ${resistance < 30 ? 'bg-green-600' : resistance < 60 ? 'bg-yellow-600' : 'bg-red-600'}`} 
                                style={{ width: `${animateBars ? resistance : Math.max(0, resistance - lastDiffs.current.res)}%` }}
                             ></div>
                         </div>
                         <div className="text-right h-6">
                            {lastDiffs.current.res !== 0 && (
                                <span className={`font-mono font-bold text-lg animate-pulse ${lastDiffs.current.res > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {lastDiffs.current.res > 0 ? '+' : ''}{lastDiffs.current.res}
                                </span>
                            )}
                         </div>
                     </div>

                     {/* Magnified Evidence Bar */}
                     <div className="w-full">
                         <div className="flex justify-between text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">
                             <span>Juristische Beweislast</span>
                             <span>{evidenceScore}%</span>
                         </div>
                         <div className="h-8 bg-gray-900 w-full rounded border border-gray-700 relative overflow-hidden">
                             {/* Previous Value Background */}
                             <div 
                                className="absolute h-full bg-blue-900/30 transition-all duration-1000" 
                                style={{ width: `${Math.max(0, evidenceScore - lastDiffs.current.ev)}%` }}
                             ></div>
                             {/* Animated Current Value */}
                             <div 
                                className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
                                style={{ width: `${animateBars ? evidenceScore : Math.max(0, evidenceScore - lastDiffs.current.ev)}%` }}
                             ></div>
                         </div>
                         <div className="text-right h-6">
                            {lastDiffs.current.ev !== 0 && (
                                <span className={`font-mono font-bold text-lg animate-pulse ${lastDiffs.current.ev > 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                                    {lastDiffs.current.ev > 0 ? '+' : ''}{lastDiffs.current.ev}
                                </span>
                            )}
                         </div>
                     </div>

                     {(lastDiffs.current.res === 0 && lastDiffs.current.ev === 0) && (
                         <div className="text-2xl text-gray-500 font-typewriter italic mt-4">Status Quo Beibehalten</div>
                     )}
                 </div>
             </div>
        )}

        {/* OUTCOME MODAL */}
        {outcomeModalData && !showScoreOverlay && (
          <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
            <div className="bg-[#f4f1ea] max-w-2xl w-full p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative border-4 border-double border-gray-800 animate-slide-in">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 font-typewriter border-b border-gray-400 pb-2">{outcomeModalData.title}</h2>
              <div className="bg-[#e8e4dc] p-6 mb-6 rounded-sm italic border-l-4 border-gray-700 shadow-inner">
                <p className="text-lg text-gray-900 font-serif-custom leading-relaxed">{outcomeModalData.text}</p>
              </div>
              <div className="flex items-start gap-4 text-sm text-gray-600">
                <History className="mt-1 flex-shrink-0"/>
                <div>
                    <strong className="uppercase text-xs tracking-wider block mb-1">Historische Einordnung:</strong>
                    <p className="italic">{outcomeModalData.reality}</p>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={handleNext} className="bg-gray-900 text-white px-8 py-3 font-bold hover:bg-black transition shadow-lg flex items-center gap-2">
                    WEITER <ArrowRight size={16}/>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- END SCREEN --- */}
        {screen === 'end' && (
          <div className="fixed inset-0 bg-[#e8e4dc] z-[80] flex flex-col items-center justify-center text-gray-900 p-8 overflow-y-auto">
             <div className="max-w-5xl w-full bg-[#f4f1ea] shadow-2xl p-12 border-2 border-gray-400 relative overflow-hidden animate-slide-in">
                
                {isGenerating ? (
                    <div className="h-96 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                             <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                             <div className="absolute inset-0 flex items-center justify-center font-bold text-xs">AI</div>
                        </div>
                        <div className="font-typewriter text-xl animate-pulse text-gray-600">Bericht wird aus Berlin übermittelt...</div>
                    </div>
                ) : (
                    <>
                        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 border-8 ${reportData.gradeColor.replace('text', 'border')} p-4 rounded text-9xl font-black font-sans pointer-events-none whitespace-nowrap z-0 select-none opacity-10 animate-stamp`}>
                            {reportData.grade}
                        </div>

                        <div className="flex justify-between items-end border-b-4 border-double border-black pb-4 mb-8 relative z-10">
                            <div>
                                <div className="text-xs font-mono uppercase tracking-[0.3em] mb-2 text-gray-600">Militärregierung Deutschland</div>
                                <h1 className="text-5xl font-bold font-typewriter uppercase tracking-widest text-black">Abschlussbericht</h1>
                                <div className="text-sm font-courier mt-2 text-gray-800">Betr: Entnazifizierung Eglfing-Haar</div>
                            </div>
                            <div className="text-right">
                                <div className="border-4 border-red-800 text-red-800 px-6 py-2 font-bold text-2xl -rotate-2 inline-block font-typewriter bg-red-800/5 mb-2 shadow-sm uppercase">Streng Vertraulich</div>
                                <div className="font-mono text-xs text-gray-600">Ref: #45-EH-SCHMIDT</div>
                            </div>
                        </div>

                        <div className="flex gap-8 mb-8 bg-black/5 p-6 rounded border border-black/10 relative z-10">
                            <div className="flex-1">
                                <div className="text-xs uppercase font-bold text-gray-500 mb-2 flex items-center gap-2"><Scale size={14}/> Juristische Aufklärung</div>
                                <div className="h-4 bg-gray-300 w-full rounded-sm overflow-hidden border border-gray-400"><div className="h-full bg-blue-800" style={{width: `${reportData.stats.ev}%`}}></div></div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs uppercase font-bold text-gray-500 mb-2 flex items-center gap-2"><Activity size={14}/> Widerstand</div>
                                <div className="h-4 bg-gray-300 w-full rounded-sm overflow-hidden border border-gray-400"><div className={`h-full ${reportData.stats.res > 60 ? 'bg-red-700' : 'bg-green-700'}`} style={{width: `${reportData.stats.res}%`}}></div></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 relative z-10 font-serif-custom text-base leading-relaxed text-gray-900">
                            <div>
                                <h3 className="font-bold border-b-2 border-gray-400 mb-3 pb-1 flex items-center gap-2 uppercase text-xs tracking-wider text-gray-600"><FileCheck size={16}/> Rechtliche Konsequenz</h3>
                                <p className="text-justify">{reportData.legal}</p>
                            </div>
                            <div>
                                <h3 className="font-bold border-b-2 border-gray-400 mb-3 pb-1 flex items-center gap-2 uppercase text-xs tracking-wider text-gray-600"><Users size={16}/> Soziale Auswirkungen</h3>
                                <p className="text-justify">{reportData.social}</p> 
                            </div>
                            <div>
                                <h3 className="font-bold border-b-2 border-gray-400 mb-3 pb-1 flex items-center gap-2 uppercase text-xs tracking-wider text-gray-600"><History size={16}/> Historisches Urteil</h3>
                                <p className="text-justify">{reportData.history}</p>
                            </div>
                            <div>
                                <h3 className="font-bold border-b-2 border-gray-400 mb-3 pb-1 flex items-center gap-2 uppercase text-xs tracking-wider text-gray-600"><Lock size={16}/> Interner Status</h3>
                                <p className="text-justify italic text-gray-800">{reportData.internal}</p>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-black/20 flex justify-between items-end relative z-10">
                            <div className={`border-2 px-3 py-1 text-xs font-bold rotate-[-2deg] uppercase flex items-center gap-2 ${reportData.isApi ? 'border-green-700 text-green-700 bg-green-50' : 'border-red-600 text-red-600 bg-red-50'}`}>
                                {reportData.isApi ? <Cpu size={14}/> : <Database size={14}/>}
                                {reportData.isApi ? 'ANALYSE: GENERIERT' : 'ANALYSE: STATISCH'}
                            </div>
                            <div className="text-right">
                                <button onClick={() => window.location.reload()} className="bg-gray-900 text-white px-8 py-3 hover:bg-black uppercase text-xs tracking-[0.2em] font-bold shadow-lg transition-transform hover:-translate-y-1">
                                    Akte Schließen
                                </button>
                            </div>
                        </div>
                    </>
                )}
             </div>
          </div>
        )}

      </main>

      {/* FOOTER TICKER */}
      {screen !== 'end' && (
        <footer className="fixed bottom-0 left-0 w-full h-[32px] bg-[#0a0a0a] border-t-2 border-[#444] text-[#dcbfa3] font-typewriter text-[14px] flex items-center z-[100] overflow-hidden shadow-[0_-5px_10px_rgba(0,0,0,0.8)]">
          <div className="bg-[#8b0000] text-white px-4 h-full flex items-center font-bold text-xs tracking-widest z-[105] whitespace-nowrap shadow-md">DRAHTBERICHT</div>
          <div key={scenarioIndex} className="inline-block pl-[100%] animate-ticker whitespace-nowrap font-mono">{NEWS_HEADLINES[scenarioIndex] || "..."}</div>
        </footer>
      )}
    </div>
  );
}