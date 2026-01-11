import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, AlertTriangle, ArrowRight, ArrowLeft, X, Lock, FileCheck, Scale, Users, History, Activity, Loader, Cpu, Database, Stamp, FileText, ChevronRight, BookOpen, Quote, HeartPulse, ScrollText } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ==================================================================================
   SECTION 1: CONFIG & CONTENT
   ================================================================================== */

const apiKey = ""; // Environment handles this

const GLOSSARY = {
  "ekost": {
    title: "E-Kost (Entzugskost)",
    text: "Eine von Dr. Pfannmüller entwickelte 'Sonderdiät' (fettfreier Gemüsebrei). Sie hatte fast keinen Nährwert und führte bei Patienten binnen weniger Monate zum qualvollen Tod durch Entkräftung."
  },
  "pfannmueller": {
    title: "Dr. Hermann Pfannmüller",
    text: "Anstaltsdirektor (1938-1945). Überzeugter Nationalsozialist. Er lehnte Gaskammern ab und propagierte das 'natürliche' Sterbenlassen durch Nahrungsentzug als 'humanere' Tötungsmethode."
  },
  "luminal": {
    title: "Luminal (Phenobarbital)",
    text: "Ein starkes Beruhigungsmittel. In der 'Kinderfachabteilung' wurde es in massiver Überdosis verwendet, um Kinder über Tage hinweg zu vergiften."
  },
  "hungerhaus": {
    title: "Hungerhäuser",
    text: "Die Stationen 17 und 18 in Eglfing-Haar. Hier wurden arbeitsunfähige Patienten isoliert und systematisch mit der E-Kost zu Tode gehungert."
  },
  "kinderfachabteilung": {
    title: "Kinderfachabteilung",
    text: "Tarnbezeichnung für Stationen, auf denen behinderte Kinder im Rahmen des 'Reichsausschussverfahrens' erfasst, beobachtet und meist ermordet wurden."
  },
  "igfarben": {
    title: "I.G. Farben",
    text: "Der größte Chemiekonzern der Welt (u.a. Bayer, BASF). Produzierte Medikamente wie Luminal, aber auch das Giftgas Zyklon B."
  },
  "persilschein": {
    title: "Persilschein",
    text: "Umgangssprachlich für ein Entlastungszeugnis im Entnazifizierungsverfahren. Täter baten oft unbelastete Kollegen um Bestätigung ihrer 'Unschuld'."
  },
  "displaced": {
    title: "Displaced Persons (DPs)",
    text: "Zivilisten, die durch den Krieg ihren Wohnsitz verloren hatten (Zwangsarbeiter, KZ-Häftlinge). Die US-Armee beschlagnahmte oft deutsche Einrichtungen für sie."
  }
};

// --- INTRO BASED ON "SELEKTION IN DER HEILANSTALT" ---
const INTRO_SLIDES = [
    {
        title: "DER ARZT",
        subtitle: "Dr. Gerhard Schmidt (41)",
        icon: <User size={64} className="text-gray-700" />,
        text: `„Ich stehe hier nicht als Richter. Ich stehe hier als Arzt.<br/><br/>
        Mein Vorgänger sah sich als 'biologischer Soldat', als Vollstrecker einer Ideologie. Ich sehe mich als Diener des Lebens. Die Medizin hat nur einen einzigen, unverhandelbaren Zweck: Heilung. Wo Heilung nicht möglich ist: Linderung.<br/><br/>
        Ein Arzt, der tötet, ist eine Unmöglichkeit. Er ist ein Widerspruch in sich selbst. Wer das vergisst, hat seinen Beruf verraten.“`,
        stamp: "IDENTITÄT"
    },
    {
        title: "ÜBER EUTHANASIE",
        subtitle: "Die Lüge vom 'Guten Tod'",
        icon: <HeartPulse size={64} className="text-red-900" />,
        text: `„Das Wort 'Euthanasie' bedeutete einst den 'schönen Tod' – den ärztlichen Beistand im Sterben. Die Machthaber haben dieses Wort gestohlen.<br/><br/>
        Sie haben es benutzt, um Massenmord als medizinische Handlung zu tarnen. Es ging nie um Erlösung von Leid. Es ging um kalte, ökonomische Nützlichkeit. Der Staat maßte sich an, über den Wert eines Lebens zu urteilen.<br/><br/>
        Doch Leben ist nicht verfügbar. Es ist heilig. Jedes Leben.“`,
        stamp: "ETHIK"
    },
    {
        title: "DIE SELEKTION",
        subtitle: "Der bürokratische Mord",
        icon: <ScrollText size={64} className="text-blue-900" />,
        text: `„Das Verbrechen begann nicht mit der Spritze. Es begann auf dem Papier. Mit der 'Selektion'.<br/><br/>
        Man teilte Menschen ein: Hier die 'Nützlichen', dort die 'Unnützen'. Sobald ein Arzt beginnt, den Wert eines Lebens gegen seine Kosten aufzurechnen, öffnet er das Tor zur Hölle.<br/><br/>
        Meine Aufgabe ist es nun, diese Logik umzukehren. Ich werde nicht rechnen. Ich werde nicht selektieren. Ich werde dokumentieren.“`,
        stamp: "PRINZIP"
    }
];

const NEWS_HEADLINES = [
  "+++ 12.11.1945: NÜRNBERGER PROZESSE GEGEN 24 HAUPTKRIEGSVERBRECHER STEHEN KURZ VOR ERÖFFNUNG +++ VERSORGUNGSLAGE KRITISCH +++",
  "+++ 30.11.1945: ENTLASSUNGSWELLE IN BEHÖRDEN: MILITÄRREGIERUNG VERSCHÄRFT EN TNAZIFIZIERUNG +++",
  "+++ 05.01.1946: SPURCHKAMMERN NEHMEN ARBEIT AUF +++ EXTREME KÄLTEWELLE LEGT VERKEHR LAHM +++",
  "+++ 14.02.1946: US-ARMEE BESCHLAGNAHMT WOHNRAUM FÜR 'DISPLACED PERSONS' +++ SPANNUNGEN IN MÜNCHEN +++",
  "+++ 10.04.1946: LEBENSMITTELRATIONEN IN BRITISCHER ZONE AUF 1000 KALORIEN GESENKT +++",
  "+++ 20.12.1946: DER HÄRTESTE WINTER SEIT JAHRZEHNTEN +++ KOHLENMANGEL BEDROHT KRANKENHÄUSER +++",
  "+++ 15.03.1947: ALLIIERTE FORDERN BERICHTE ÜBER 'EUTHANASIE'-VERBRECHEN AN +++"
];

const term = (key, text) => `<span class="term-link border-b border-dotted border-gray-600 font-bold text-gray-800 cursor-pointer" data-term="${key}">${text}</span>`;

const evidence = {
    note: (text) => ({ type: 'note', content: `<p class="font-handwriting text-lg leading-tight">${text}</p>`, rot: Math.random() * 10 - 5 + 'deg' }),
    doc: (title, body) => ({ type: 'paper', content: `<h3 class="font-bold border-b border-black mb-2">${title}</h3><div class="text-[10px] leading-snug font-serif-custom">${body}</div>`, rot: Math.random() * 6 - 3 + 'deg' })
};

// --- FINAL AUTHOR SCENARIOS I-VII ---
const GAME_SCENARIOS = [
  {
    id: "diet",
    title: "Die Ernährungstabellen",
    date: "12. Nov 1945",
    description: `
    Spätherbst 1945. Die Klinik arbeitet weiter, als sei nichts geschehen.
    Doch in den Unterlagen der Küche tauchen systematische Abweichungen auf.
    Bestimmte Stationen erhalten seit Monaten eine sogenannte ${term('ekost', 'E-Kost')}.<br/><br/>
    Die Sterbezahlen dieser Stationen steigen gleichmäßig, ohne Seuchenausbruch,
    ohne akute Krankheit, ohne medizinische Intervention.
    Das Personal reagiert nervös. Einzelne Akten verschwinden.<br/><br/>
    Wenn hier getötet wurde, dann nicht durch Gewalt – sondern durch Verwaltung.
    `,
    evidence: [
      evidence.doc(
        "Küchenabrechnung – Oktober 1944",
        `
        Station 17 / 18<br/>
        Verpflegung: „Gemüseeintopf fettfrei“<br/>
        Geschätzter Tageswert: unter 500 kcal<br/><br/>
        Anordnung gegengezeichnet von: 
        <span style="font-family:cursive">${term('pfannmueller', 'Pfannmüller')}</span>
        `
      ),
      evidence.doc(
        "Sterbeliste – Vergleichsauszug",
        `
        Zeitraum: Jan–Okt 1944<br/>
        Station 17: +38% Mortalität<br/>
        Vergleichsstationen: keine Abweichung<br/><br/>
        Vermerk: „natürlicher Verlauf“
        `
      ),
      evidence.note(
        "Schwester G. hat heute früh Listen aus dem Küchenbüro geholt. Ziel: Heizkeller."
      )
    ],
    choices: [
      {
        text: "Stillen Aktenabgleich durchführen (Sterbezahlen, Rationen, Stationen)",
        effects: { res: 5, ev: 35 },
        stamp: "DOKUMENTIERT",
        type: "procedural",
        outcome: `
        Sie arbeiten nachts. Keine Befragungen, keine Anordnungen.
        Nur Zahlen, Zeitreihen, Unterschriften.
        Das Muster ist eindeutig: Unterversorgung als Dauerzustand,
        parallel steigende Mortalität auf exakt definierten Stationen.<br/><br/>
        Es ist kein Versagen. Es ist Methode.
        `,
        historical: "Schmidt nutzte Statistik und Verwaltungslogik, um Mord als System sichtbar zu machen."
      },
      {
        text: "Personal direkt zur Rede stellen",
        effects: { res: 20, ev: 0 },
        stamp: "KONFRONTIERT",
        type: "naive",
        outcome: `
        Sie stellen Fragen. Am nächsten Tag fehlen Ordner.
        Niemand bestreitet etwas – aber niemand erinnert sich.
        „Kriegschaos“, „Verlegung“, „nicht zuständig“.<br/><br/>
        Die Zahlen sind weg. Die Praxis bleibt.
        `,
        historical: "Offene Konfrontation führte häufig zu Beweisvernichtung."
      },
      {
        text: "US-Militärregierung um sofortige Durchsuchung bitten",
        effects: { res: 35, ev: 10 },
        stamp: "ESKALIERT",
        type: "risk",
        outcome: `
        Bewaffnete Durchsuchung der Küche.
        Das Personal blockiert, Unterlagen werden hektisch aussortiert.
        Die Amerikaner sichern wenig Verwertbares und verlieren das Interesse.<br/><br/>
        Sie haben Lärm erzeugt – aber keine Beweise.
        `,
        historical: "Gewaltsame Eingriffe führten selten zu belastbaren Akten."
      }
    ]
  },
  {
    id: "staff",
    title: "Die 'Alte Garde'",
    date: "30. Nov 1945",
    description: `
    Die Klinik funktioniert noch immer nach alten Routinen.
    Stationsleitungen, Oberschwestern, Verwaltungsangestellte – viele waren während der NS-Zeit nicht nur Mitläufer, sondern Ausführende.<br/><br/>
    Ohne sie bricht Organisation zusammen.
    Mit ihnen bleibt das Verbrechen im Haus.<br/><br/>
    Entnazifizierung ist kein Schalter. Sie ist ein Eingriff am offenen Betrieb.
    `,
    evidence: [
        evidence.doc("Personalakte (Auszug)", "Beurteilung 1944: 'Politisch zuverlässig, durchsetzungsstark, bewährt im Umgang mit schwierigen Pflegefällen'."),
        evidence.note("Neue Kräfte nicht verfügbar. Ohne Stationsleitung keine Medikamentenausgabe.")
    ],
    choices: [
      {
        text: "Belassen, aber entmachten (Dokumentationspflicht)",
        effects: { res: 20, ev: 35 },
        stamp: "KONTROLLIERT",
        type: "procedural",
        outcome: "Der Betrieb bleibt stabil. Die Betroffenen sabotieren leise, aber sie müssen schreiben: Pflegeberichte, Übergaben, Medikation. Papier entsteht. Und Papier lügt schlecht.",
        historical: "Das war Schmidts realistischster Weg. Er nutzte die Bürokratie zur Kontrolle."
      },
      {
        text: "Sofortige Entlassung",
        effects: { res: 30, ev: 10 },
        stamp: "ENTLASSEN",
        type: "risk",
        outcome: "Chaos. Übergaben fehlen. Patienten liegen ungepflegt. Moralisch konsequent – praktisch tödlich.",
        historical: "Entnazifizierung ohne Ersatzpersonal erzeugte oft neue Opfer."
      },
      {
        text: "Persilscheine für Kooperation ausstellen",
        effects: { res: -15, ev: -40 },
        stamp: "AMNESTIE",
        type: "naive",
        outcome: "Ruhe. Lächeln. Loyalität. Und ein Verfahren, das später niemand mehr ernst nimmt.",
        historical: "So entstanden Nachkriegslegenden von der 'sauberen' Belegschaft."
      }
    ]
  },
  {
    id: "luminal",
    title: "Die Luminal-Bücher",
    date: "05. Jan 1946",
    description: `
    In der Apotheke tauchen ungewöhnliche Bestellmengen auf.
    ${term('luminal', 'Luminal')} ist kein Gift – aber jede Substanz ist es in der falschen Dosis.<br/><br/>
    Niemand spricht von Mord.
    Es spricht nur der Verbrauch.
    `,
    evidence: [
        evidence.doc("Bestellübersicht", "50-facher Jahresbedarf an Phenobarbital."),
        evidence.doc("Ausgabebuch", "Diagnose stets: 'Sedierung'"),
        evidence.note("Wenn heute nicht kopiert, morgen neu gebunden.")
    ],
    choices: [
      {
        text: "Therapiebedarf vs. Verbrauch berechnen",
        effects: { res: 10, ev: 40 },
        stamp: "ANALYSE",
        type: "procedural",
        outcome: "Die Zahlen passen nicht. Nicht zu Epilepsie. Nicht zu Unruhe. Nicht zu Medizin. Die Statistik wird zur Anklage.",
        historical: "Schmidt nutzte Statistik als primäres Beweismittel."
      },
      {
        text: "Apotheke versiegeln",
        effects: { res: 25, ev: 25 },
        stamp: "VERSIEGELT",
        type: "risk",
        outcome: "Material gesichert, Fronten verhärtet. Ab jetzt ist jede Handlung im Haus ein Machtkampf.",
        historical: "Harte Maßnahmen führten zu Blockaden."
      },
      {
        text: "Informellen Deal anbieten",
        effects: { res: -5, ev: 20 },
        stamp: "HANDEL",
        type: "naive",
        outcome: "Sie bekommen Namen. Und verlieren saubere Verfahren.",
        historical: "Deals beschädigten die Rechtsstaatlichkeit."
      }
    ]
  },
  {
    id: "certs",
    title: "Der Totenschein",
    date: "10. Apr 1946",
    description: `
    Ein Kind stirbt heute.
    Die Vorbehandlung war auffällig.
    Die Todesminute liegt in Ihrer Amtszeit.<br/><br/>
    Der Totenschein ist kein Formular.
    Er ist eine Entscheidung.
    `,
    evidence: [
        evidence.doc("Todesanzeige (Entwurf)", "Standarddiagnose: Lungenentzündung."),
        evidence.note("Pflegebericht: Sedierung ohne Begründung. Mutter wartet draußen.")
    ],
    choices: [
      {
        text: "Standarddiagnose übernehmen",
        effects: { res: -5, ev: -25 },
        stamp: "BESTÄTIGT",
        type: "naive",
        outcome: "Ruhe. Und ein Mord, der verwaltet wird.",
        historical: "Die bürokratische Kontinuität des Schweigens."
      },
      {
        text: "Autopsie anordnen",
        effects: { res: 15, ev: 30 },
        stamp: "UNTERSUCHT",
        type: "procedural",
        outcome: "Beweise gesichert. Die Mutter bekommt keine Antworten – nur Zeit.",
        historical: "Verzögerungstaktik zur Beweissicherung."
      },
      {
        text: "Intoxikation eintragen",
        effects: { res: 35, ev: 40 },
        stamp: "BEZEUGT",
        type: "risk",
        outcome: "Ab jetzt sind Sie Feind im eigenen Haus.",
        historical: "Offene Wahrheiten waren gefährlich."
      }
    ]
  },
  {
    id: "us_army",
    title: "Besuch vom Major",
    date: "14. Feb 1946",
    description: `
    Die US-Militärregierung will Gebäude für ${term('displaced', 'Displaced Persons')}.
    Patienten gelten als verschiebbar.<br/><br/>
    Für den Major ist es Logistik.
    Für Sie ist es Seuchengefahr.
    `,
    evidence: [
        evidence.doc("Requisitionsbefehl", "Sofortige Räumung Haus 12."),
        evidence.doc("Hygienegutachten", "Überbelegung = Typhusgefahr.")
    ],
    choices: [
      {
        text: "Verweigern mit Seuchenschutzargument",
        effects: { res: 10, ev: 10 },
        stamp: "ABGEWEHRT",
        type: "procedural",
        outcome: "Der Major zieht ab. Nicht aus Einsicht, sondern aus Eigenschutz.",
        historical: "Schmidt nutzte die Angst vor Seuchen als Schutzschild."
      },
      {
        text: "Teilräumung anbieten (Zeit gewinnen)",
        effects: { res: 5, ev: 5 },
        stamp: "VERZÖGERT",
        type: "naive",
        outcome: "Bürokratie als Schild. Ein Kompromiss, der niemanden zufriedenstellt.",
        historical: "Zeitgewinn war oft die einzige Strategie."
      },
      {
        text: "Befehl ausführen",
        effects: { res: -5, ev: 0 },
        stamp: "AUSGEFÜHRT",
        type: "naive",
        outcome: "Niemand tötet. Trotzdem sterben Menschen durch die Enge.",
        historical: "Gehorsam führte oft zu indirektem Tod."
      }
    ]
  },
  {
    id: "winter",
    title: "Der Hungerwinter",
    date: "20. Dez 1946",
    description: `
    Kälte. Hunger. Mangel.
    Kein Mord – aber dieselbe Konsequenz.<br/><br/>
    Legalität schützt nicht vor Erfrierung.
    `,
    evidence: [
        evidence.note("Lagerstand: 2 Tage Nahrung."),
        evidence.doc("Angebot", "Kohle gegen Klinikmaterial (Morphium/Besteck).")
    ],
    choices: [
      {
        text: "Strikt legal bleiben",
        effects: { res: 0, ev: 0 },
        stamp: "LEGAL",
        type: "naive",
        outcome: "Ordnung. Tote.",
        historical: "Der legale Weg führte oft in den Tod."
      },
      {
        text: "Pragmatischer Tausch",
        effects: { res: 5, ev: 0 },
        stamp: "ORGANISIERT",
        type: "procedural",
        outcome: "Leben gerettet. Sie sind erpressbar.",
        historical: "Pragmatismus am Rande der Legalität war notwendig."
      },
      {
        text: "Rationierung nach Erfolgsaussicht",
        effects: { res: -10, ev: -50 },
        stamp: "SELEKTIERT",
        type: "risk",
        outcome: "Sie übernehmen exakt die Logik der Täter.",
        historical: "Ein Rückfall in die NS-Denkweise unter Stress."
      }
    ]
  },
  {
    id: "brains",
    title: "Die Gehirnpräparate",
    date: "15. Mär 1947",
    description: `
    Im Labor stehen Gläser.
    Kindergehirne. Nummeriert.<br/><br/>
    Forschung, sagen die Täter.
    Beweis, sagen Sie.
    Grab, sagen die Angehörigen.
    `,
    evidence: [
        evidence.doc("Inventarliste", "300 Präparate aus der Kinderfachabteilung."),
        evidence.note("Keine Einwilligungen dokumentiert.")
    ],
    choices: [
      {
        text: "Als Beweismittel sichern",
        effects: { res: 15, ev: 30 },
        stamp: "GESICHERT",
        type: "procedural",
        outcome: "Unerträglich. Notwendig.",
        historical: "Die Präparate dienten als stumme Zeugen."
      },
      {
        text: "Bestattung anordnen",
        effects: { res: -5, ev: -30 },
        stamp: "BEGRABEN",
        type: "naive",
        outcome: "Menschlich. Historisch fatal.",
        historical: "Die schnelle Bestattung hätte die Aufklärung behindert."
      },
      {
        text: "An Militärregierung übergeben",
        effects: { res: 0, ev: -5 },
        stamp: "ÜBERGEBEN",
        type: "naive",
        outcome: "Verantwortung abgegeben. Kontrolle verloren.",
        historical: "Verantwortung abzugeben war oft der schlechteste Weg."
      }
    ]
  }
];

/* ==================================================================================
   SECTION 2: GAME ENGINE (REACT)
   ================================================================================== */

export default function App() {
  const [screen, setScreen] = useState('bio'); 
  const [resistance, setResistance] = useState(10);
  const [evidenceScore, setEvidence] = useState(0);
  const [history, setHistory] = useState([]);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [introStep, setIntroStep] = useState(0); 
  
  // Visual & Feedback States
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

  // --- Logic: Descriptions & Positions ---
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

  // --- Logic: Interactions ---
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

  // --- ACTUAL GEMINI INTEGRATION ---
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
    let grade = "GESCHEITERT";
    let gradeColor = "text-red-900";
    if (ev > 80 && res < 40) { grade = "EXEMPLARISCH"; gradeColor = "text-green-900"; }
    else if (ev > 70) { grade = "ERFOLGREICH"; gradeColor = "text-green-700"; }
    else if (ev > 40) { grade = "ZWIESPÄLTIG"; gradeColor = "text-yellow-800"; }
    else if (res > 80) { grade = "BLOCKIERT"; gradeColor = "text-red-800"; }
    return {
      grade, gradeColor, stats: { ev, res },
      legal: "Beweislage reicht nur für Verfahren wegen Fahrlässigkeit.",
      social: "Ungewissheit belastet Angehörige generationenübergreifend.",
      history: "Legendenbildung dominiert den Diskurs.",
      internal: "Massive Obstruktion durch Altpersonal.",
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
                {/* Ghost Bar for animation feel */}
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
          <div key={introStep} className="absolute z-40 max-w-3xl w-full bg-[#f4f1ea] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 animate-slide-in flex flex-col md:flex-row gap-8 border-t-8 border-gray-800 rotate-1">
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
            <p className="mb-6 text-justify leading-relaxed font-serif-custom text-lg">Sie übernehmen die Rolle von Dr. Schmidt. Jede Entscheidung hat Konsequenzen für die Beweislage in den Nürnberger Prozessen und den Widerstand in Ihrer eigenen Klinik.</p>
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
                
                <h3 className="text-3xl font-bold mb-4 font-typewriter text-gray-900 leading-tight">{currentScenario.title}</h3>
                
                <div className="bg-white/50 p-4 border border-gray-300 shadow-inner mb-6 h-48 overflow-y-auto font-serif-custom text-base leading-relaxed text-gray-900 rounded" dangerouslySetInnerHTML={{ __html: currentDescription }} />
                
                <div className="mt-auto space-y-3">
                   {currentScenario.choices.map((choice, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleChoice(choice)} 
                            className="group w-full text-left bg-[#f4f1ea] border border-gray-400 p-4 shadow-md hover:shadow-lg transition-all duration-200 flex justify-between items-center relative overflow-hidden transform hover:-translate-y-0.5"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-400 group-hover:bg-amber-600 transition-colors"></div>
                          <span className="font-bold text-sm text-gray-800 pl-3 group-hover:text-black">
                            <span className="text-xs text-gray-500 uppercase mr-2 font-mono group-hover:text-amber-700">Option {String.fromCharCode(65+i)}</span>
                            <br/>
                            {choice.text}
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
                    {/* UPDATED: removed pointer-events-none to allow clicking inner terms */}
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