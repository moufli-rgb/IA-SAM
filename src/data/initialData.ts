import { SamProjectData, MemoirStage, MemoirSection, DonaldProfile, BenchmarkThesis, ReferenceSource, ProjectTask, ValidatedDecision, WorkSessionLog } from '../types/sam';

export const initialStages: MemoirStage[] = [
  {
    id: 1,
    title: "1. Exploration des centres d'intérêt",
    category: "Cadrage",
    objective: "Identifier les thématiques architecturales, urbaines et socioculturelles qui passionnent Donald.",
    neededInfo: "Lectures marquantes, réalisations inspirantes, sensibilités personnelles (durabilité, matériaux biosourcés, climat tropical, habitat vernaculaire).",
    completedWork: "Première cartographie des intérêts : architecture bioclimatique adaptée au contexte subsaharien, réinterprétation de la terre crue et confort thermique passif.",
    associatedSources: ["Kéré Architecture - Approche bioclimatique", "Hassan Fathy - Construire avec le peuple"],
    validatedDecisions: ["Focalisation sur l'architecture durable et les matériaux géosourcés dans le contexte ouest-africain."],
    openQuestions: ["Faut-il privilégier un programme d'équipement public ou de logement collectif ?"],
    difficulties: ["Risque d'éparpillement entre dimension purement technique et dimension sociologique."],
    nextActions: ["Discuter avec SAM des problématiques urbaines locales à confronter."],
    status: "donald_validated",
    updatedAt: "2026-10-20"
  },
  {
    id: 2,
    title: "2. Identification d'un domaine de recherche",
    category: "Cadrage",
    objective: "Situer le travail dans un sous-champ disciplinaire précis de l'architecture.",
    neededInfo: "Champs théoriques (ambiances architecturales, typologie urbaine, sociologie de l'habiter, tectonique).",
    completedWork: "Domaine ciblé : Conception bioclimatique, valorisation des éco-matériaux (BTC / terre comprimée) et résilience thermique urbaine.",
    associatedSources: ["CRAterre - Traité de construction en terre"],
    validatedDecisions: ["Croisement entre ingénierie passive (ventilation traversante, inertie) et spatialités vernaculaires réinterprétées."],
    openQuestions: ["Quelle échelle d'impact : le bâtiment isolé ou l'îlot urbain ?"],
    difficulties: ["Manque de données météorologiques micro-locales précises."],
    nextActions: ["Formuler la première ébauche du diagnostic de contexte."],
    status: "donald_validated",
    updatedAt: "2026-10-21"
  },
  {
    id: 3,
    title: "3. Observation du contexte et des problèmes existants",
    category: "Cadrage",
    objective: "Documenter les dysfonctionnements réels observés sur le terrain.",
    neededInfo: "Données de terrain, photos de désordres constructifs, surconsommation énergétique due à la climatisation, perte d'identité architecturale.",
    completedWork: "Observation de la prolifération du béton armé et du verre inadaptés au climat chaud et humide/sahélien, créant des passoires thermiques et des surcoûts d'énergie massifs.",
    associatedSources: ["Rapports ONU-Habitat sur les villes africaines"],
    validatedDecisions: ["Ancrer la recherche dans un cas réel répondant à l'urgence climatique et économique locale."],
    openQuestions: ["Comment quantifier l'inconfort ressenti par les usagers ?"],
    difficulties: ["Accès aux données de consommation énergétique des bâtiments publics."],
    nextActions: ["Délimiter les indicateurs de confort thermique et d'accessibilité constructive."],
    status: "in_progress",
    updatedAt: "2026-10-22"
  },
  {
    id: 4,
    title: "4. Formulation de la problématique",
    category: "Cadrage",
    objective: "Construire la tension intellectuelle centrale qui structure tout le mémoire.",
    neededInfo: "Contradiction entre modernité architecturale standardisée et impératif bioclimatique/identitaire.",
    completedWork: "Ébauche : Comment concilier performance bioclimatique passive et contemporanéité formelle dans la conception d'équipements architecturaux en milieu tropical humide/sahélien, face à la standardisation du tout-béton ?",
    associatedSources: ["Revue Architecture Tropicale - Synthèse critique"],
    validatedDecisions: ["La problématique ne doit pas être un simple constat, mais un problème d'architecture avec des enjeux spatiaux et constructifs."],
    openQuestions: ["Faut-il insérer la dimension économique du coût global du bâtiment ?"],
    difficulties: ["Éviter la posture nostalgique du 'passé était meilleur' tout en critiquant le modernisme mal importé."],
    nextActions: ["Soumettre 3 variantes de formulation à l'encadrant et avec SAM."],
    status: "in_progress",
    updatedAt: "2026-10-23"
  },
  {
    id: 5,
    title: "5. Construction de la question principale et questions spécifiques",
    category: "Cadrage",
    objective: "Décliner la problématique en questions directrices opérationnelles.",
    neededInfo: "Question centrale + 3 sous-questions (techno-constructive, spatiale/typologique, et socioculturelle).",
    completedWork: "Sous-questions formulées : 1) Quelles caractéristiques thermo-physiques des matériaux locaux répondent au confort d'été ? 2) Quels dispositifs spatiaux permettent de s'affranchir de la climatisation artificielle ? 3) Comment ces choix redéfinissent-ils l'image contemporaine de l'édifice ?",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: ["Le jury attend-il une dimension prospective ou une vérification expérimentale ?"],
    difficulties: [],
    nextActions: ["Affiner l'ordonnancement logique des questions avec SAM."],
    status: "in_progress",
    updatedAt: "2026-10-23"
  },
  {
    id: 6,
    title: "6. Définition et validation du thème",
    category: "Cadrage",
    objective: "Fixer l'intitulé officiel du mémoire et du TPFE approuvé par l'école.",
    neededInfo: "Intitulé clair, rigoureux, sans emphase, localisé et délimité.",
    completedWork: "Titre de travail proposé : 'Architecture bioclimatique et réinterprétation constructive : vers un équipement résilient et sobre en milieu tropical urbain.'",
    associatedSources: [],
    validatedDecisions: ["Validation formelle du thème en attente du rendez-vous d'encadrement."],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Présenter le thème à l'enseignant encadrant avec la fiche de synthèse préparée par SAM."],
    status: "in_progress",
    updatedAt: "2026-10-24"
  },
  {
    id: 7,
    title: "7. Formulation des hypothèses et des objectifs",
    category: "Théorie & Méthode",
    objective: "Poser les réponses anticipées et les buts mesurables de la recherche.",
    neededInfo: "Hypothèse principale et hypothèses secondaires testables par le projet architectural.",
    completedWork: "Hypothèse : L'association d'une enveloppe en terre comprimée stabilisée à double peau ventilée et d'un patio régulateur réduit de 65% le recours au conditionnement d'air actif tout en valorisant la filière artisanale locale.",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: ["Comment tester rigoureusement cette hypothèse sans logiciel de simulation dynamique lourd ?"],
    difficulties: [],
    nextActions: ["Définir les métriques de validation (degrés-heures d'inconfort, coût énergétique)."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 8,
    title: "8. Délimitation du champ d'étude",
    category: "Théorie & Méthode",
    objective: "Préciser les bornes géographiques, climatiques, temporelles et typologiques.",
    neededInfo: "Choix de la ville, zone climatique, type de programme architectural étudié.",
    completedWork: "Zone d'étude : Climat tropical de savane / littoral ouest-africain. Période contemporaine (2010-2026). Échelle : Bâtiment d'intérêt collectif / pôle de formation ou de culture.",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Cartographier les limites du périmètre d'intervention."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 9,
    title: "9. Élaboration de la revue de littérature",
    category: "Théorie & Méthode",
    objective: "Recenser et analyser l'état de l'art scientifique et architectural existant.",
    neededInfo: "Articles scientifiques indexés, thèses de doctorat en architecture et génie civil, monographies d'architectes.",
    completedWork: "Revue préliminaire sur la thermique de la brique de terre compressée (BTC) et les principes de ventilation naturelle selon Givoni et Szokolay.",
    associatedSources: ["Givoni (1998) - Climate Considerations in Building and Urban Design"],
    validatedDecisions: [],
    openQuestions: ["Trouver des études récentes (2020-2025) mesurant in situ les températures en climat tropical."],
    difficulties: ["Nombreux articles payants ou limités aux climats tempérés."],
    nextActions: ["Lancer des requêtes ciblées avec le module de recherche documentaire de SAM."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 10,
    title: "10. Construction du cadre conceptuel et théorique",
    category: "Théorie & Méthode",
    objective: "Définir les concepts clés et les grilles d'analyse mobilisées.",
    neededInfo: "Concepts : Vernaculaire critique (Frampton), biomimétisme passif, tectonique architecturale, résilience urbaine.",
    completedWork: "",
    associatedSources: ["Kenneth Frampton - Pour un régionalisme critique"],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Rédiger la note théorique avec SAM."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 11,
    title: "11. Élaboration de la méthodologie",
    category: "Théorie & Méthode",
    objective: "Détailler la démarche de recherche par le projet (research-by-design).",
    neededInfo: "Méthode mixte : analyse bibliographique, études de cas comparatives (benchmarking), relevés in situ, modélisation volumétrique et validation par le projet.",
    completedWork: "",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Établir le protocole d'observation des bâtiments témoins."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 12,
    title: "12. Collecte et analyse des données",
    category: "Diagnostic & Site",
    objective: "Compiler les données climatiques (vents dominants, trajectoire solaire, humidité) et sociologiques.",
    neededInfo: "Diagrammes de Sun-path, roses des vents, entretiens avec des maîtres d'ouvrage et usagers.",
    completedWork: "",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Préparer le guide d'entretien semi-directif."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 13,
    title: "13. Analyse du site et du contexte architectural",
    category: "Diagnostic & Site",
    objective: "Diagnostic urbain, paysager, morphologique et technique de la parcelle du TPFE.",
    neededInfo: "Topographie, réseaux, servitudes, vues, nuisances, histoire du lieu, accessibilité.",
    completedWork: "",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Réaliser les planches de diagnostic paysager et d'analyse des flux."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 14,
    title: "14. Définition du programme et des besoins",
    category: "Projet TPFE",
    objective: "Établir la programmation architecturale qualitative et quantitative.",
    neededInfo: "Tableau des surfaces, organigramme spatial, relations fonctionnelles et exigences techniques.",
    completedWork: "",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Rédiger l'organigramme fonctionnel."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 15,
    title: "15. Développement du concept architectural",
    category: "Projet TPFE",
    objective: "Traduire la problématique théorique en intentions spatiales et parti pris volumétrique.",
    neededInfo: "Croquis de concept, métaphores formelles, principes de ventilation naturelle (effet Venturi, cheminées thermiques).",
    completedWork: "",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Générer les premières maquettes d'études volumétriques."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 16,
    title: "16. Conception et évolution du projet (TPFE)",
    category: "Projet TPFE",
    objective: "Développer le projet complet : plans, coupes bioclimatiques, façades, détails constructifs à l'échelle.",
    neededInfo: "Échelles 1/200, 1/100 et détails au 1/20 sur la mise en œuvre de la terre et des brise-soleil.",
    completedWork: "",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Dessiner les coupes techniques de principe."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 17,
    title: "17. Rédaction progressive du document",
    category: "Finalisation",
    objective: "Rédiger chapitre par chapitre selon le protocole rigoureux en 8 étapes.",
    neededInfo: "Synthèses des étapes précédentes, fiches de lecture, iconographie annotée.",
    completedWork: "",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Rédiger le premier jet de l'introduction générale avec SAM."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 18,
    title: "18. Révision scientifique, rédactionnelle et formelle",
    category: "Finalisation",
    objective: "Chasser les répétitions, affirmations non justifiées, vérifier la cohérence logique globale.",
    neededInfo: "Relecture croisée, contrôle de syntaxe, conformité avec le guide méthodologique de l'établissement.",
    completedWork: "",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Activer l'audit de cohérence de SAM sur les chapitres 1 et 2."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 19,
    title: "19. Vérification des références, annexes et illustrations",
    category: "Finalisation",
    objective: "Standardiser la bibliographie (norme APA/ISO 690), crédits photos et tables des matières.",
    neededInfo: "Vérification des DOI, numérotation des figures, légendes architecturales.",
    completedWork: "",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Générer l'export bibliographique standardisé."],
    status: "not_started",
    updatedAt: "2026-10-24"
  },
  {
    id: 20,
    title: "20. Préparation de la version finale et de la soutenance",
    category: "Finalisation",
    objective: "Mise en page finale, diaporama de soutenance, planches de présentation TPFE et simulation des questions du jury.",
    neededInfo: "Supports graphiques de soutenance, timing de présentation (20 min), argumentaire de défense.",
    completedWork: "",
    associatedSources: [],
    validatedDecisions: [],
    openQuestions: [],
    difficulties: [],
    nextActions: ["Simuler un oral blanc avec SAM."],
    status: "not_started",
    updatedAt: "2026-10-24"
  }
];

export const initialSections: MemoirSection[] = [
  {
    id: "sec-intro",
    code: "INTRO",
    title: "Introduction Générale & Contexte",
    chapter: "Introduction",
    targetWordCount: 2000,
    currentStep: 2,
    outline: "1. Contexte d'émergence des métropoles tropicales et vulnérabilité climatique\n2. Le paradoxe constructif contemporain : hégémonie du béton versus ressources locales\n3. Énoncé de la problématique et questions de recherche\n4. Objectifs et hypothèse directrice\n5. Annonce du plan du mémoire et articulation avec le TPFE",
    missingData: ["Chiffres officiels récents sur la consommation électrique du secteur tertiaire local"],
    draftContent: `L'urbanisation rapide des métropoles subsahariennes contemporaines confronte la discipline architecturale à un défi sans précédent : comment répondre à la demande massive en infrastructures et en équipements publics sans reproduire les modèles énergivores et standardisés importés des pays tempérés ?

Depuis plusieurs décennies, le recours quasi-systématique au béton armé et aux parois vitrées non protégées a engendré une rupture manifeste avec les principes séculaires d'adaptation au climat tropical. À l'intérieur de ces édifices, la température ressentie dépasse fréquemment les seuils de confort physiologique, imposant une dépendance coûteuse et écologiquement préjudiciable aux systèmes mécaniques de climatisation.

Face à cette impasse, notre recherche s'attache à réexaminer les potentialités d'une architecture bioclimatique contemporaine fondée sur la revalorisation raisonnée des matériaux géo-sourcés, en particulier la terre crue compressée et stabilisée. Loin d'une simple réminiscence nostalgique des traditions vernaculaires, il s'agit d'articuler physique du bâtiment, ingénierie de la ventilation passive et composition spatiale novatrice pour imaginer un équipement public d'excellence, sobre et ancré dans son territoire.`,
    usedReferences: ["Givoni (1998)", "CRAterre (2018)", "Frampton (1983)"],
    verificationPoints: ["Vérifier la validité des chiffres de surchauffe thermique", "Éviter tout ton péremptoire"],
    donaldValidationNote: "Bonne amorce. Le paragraphe 2 pose bien le problème du tout-béton.",
    isValidatedByDonald: false,
    versions: [
      {
        version: 1,
        timestamp: "2026-10-24T14:30:00Z",
        content: "Première ébauche de l'introduction générale.",
        notes: "Jet initial généré avec l'assistance de SAM selon les consignes de Donald."
      }
    ],
    updatedAt: "2026-10-24"
  },
  {
    id: "sec-lit-rev",
    code: "REVUE-LIT",
    title: "Revue de Littérature & Cadre Conceptuel",
    chapter: "Partie 1 : Fondements Théoriques",
    targetWordCount: 4500,
    currentStep: 1,
    outline: "1. Évolution historique des théories climatiques en architecture (Givoni, Olgyay, Szokolay)\n2. La tectonique de la terre : comportements thermo-physiques et inertie\n3. Le régionalisme critique appliqué aux typologies subsahariennes\n4. Analyse critique des réalisations contemporaines pionnières",
    missingData: ["Comparatif détaillé des conductivités thermiques lambda du BTC vs parpaing creux"],
    draftContent: "",
    usedReferences: [],
    verificationPoints: [],
    donaldValidationNote: "",
    isValidatedByDonald: false,
    versions: [],
    updatedAt: "2026-10-22"
  },
  {
    id: "sec-methodo",
    code: "METHODO",
    title: "Démarche Méthodologique & Protocole",
    chapter: "Partie 1 : Fondements Théoriques",
    targetWordCount: 2500,
    currentStep: 1,
    outline: "1. Position épistémologique : la recherche par le projet (Research by Design)\n2. Protocole de sélection des cas d'étude de référence\n3. Méthodes de diagnostic du site et relevés environnementaux\n4. Critères d'évaluation de la performance passive du projet TPFE",
    missingData: [],
    draftContent: "",
    usedReferences: [],
    verificationPoints: [],
    donaldValidationNote: "",
    isValidatedByDonald: false,
    versions: [],
    updatedAt: "2026-10-22"
  },
  {
    id: "sec-site-tpfe",
    code: "SITE-PROJET",
    title: "Diagnostic du Site, Programmation & Concept Architectural",
    chapter: "Partie 2 : Du Diagnostic au Projet",
    targetWordCount: 5000,
    currentStep: 1,
    outline: "1. Insertion urbaine, topographie et données micro-climatiques du site\n2. Définition du programme d'équipement et organigramme spatial\n3. Parti architectural : morphologie, patios d'ombrage et faîtes ventilés\n4. Système constructif : filière BTC, ossature bois/métal et toiture thermo-réfléchissante",
    missingData: ["Plan cadastral géoréférencé avec courbes de niveau"],
    draftContent: "",
    usedReferences: [],
    verificationPoints: [],
    donaldValidationNote: "",
    isValidatedByDonald: false,
    versions: [],
    updatedAt: "2026-10-22"
  }
];

export const initialProfile: DonaldProfile = {
  name: "Donald",
  degree: "Master en Architecture",
  topic: "Architecture bioclimatique et valorisation des matériaux locaux en milieu tropical",
  subTopic: "Conception d'un équipement public résilient en terre crue stabilisée et ventilation passive",
  contextLocation: "Afrique de l'Ouest (Cotonou / Littoral)",
  supervisor: "Pr. K. Mensah (Architecte & Enseignant-Chercheur)",
  university: "École Africaine des Métiers de l'Architecture et de l'Urbanisme (EAMAU)",
  defenseDate: "2026-12-18",
  availableHoursPerWeek: 25,
  preferredTone: "direct_chaleureux",
  isPinLocked: false,
  pinCode: ""
};

export const initialSources: ReferenceSource[] = [
  {
    id: "src-1",
    title: "Man, Climate and Architecture",
    authors: "Givoni, Baruch",
    year: "1969 / 1998",
    type: "livre",
    doiOrUrl: "ISBN: 978-0442226701",
    summary: "Ouvrage séminal posant le diagramme bioclimatique de Givoni, définissant les zones de confort thermique et les stratégies passives (ventilation nocturne, inertie, ombrage).",
    architecturalRelevance: "Fondement méthodologique pour justifier les choix de ventilation traversante et la masse thermique des parois.",
    keyQuotes: ["'En climat chaud et humide, la vitesse de l'air est le facteur primordial pour rétablir la sensation de confort sans refroidissement mécanique.'"],
    verified: true,
    theme: "Bioclimatique & Confort thermique",
    createdAt: "2026-10-21"
  },
  {
    id: "src-2",
    title: "Traité de construction en terre",
    authors: "Houben, Hugo & Guillaud, Hubert (CRATerre)",
    year: "2006",
    type: "livre",
    doiOrUrl: "ISBN: 978-2863640708",
    summary: "Référence mondiale sur les caractéristiques physiques, mécaniques et constructives du matériau terre (adobe, pisé, BTC, bauge).",
    architecturalRelevance: "Données techniques fiables sur la capacité thermique volumique, la régulation hygrométrique et la résistance mécanique du BTC.",
    keyQuotes: ["'La terre crue n'est pas un matériau du passé, mais un régulateur hygrométrique dynamique idéal pour les climats à forte amplitude ou à humidité variable.'"],
    verified: true,
    theme: "Matériaux locaux & Tectonique",
    createdAt: "2026-10-22"
  },
  {
    id: "src-3",
    title: "Towards a Critical Regionalism: Six Points for an Architecture of Resistance",
    authors: "Frampton, Kenneth",
    year: "1983",
    type: "article",
    doiOrUrl: "Hal Foster (ed.), The Anti-Aesthetic",
    summary: "Manifeste plaidant pour une architecture ancrée dans la lumière locale, la topographie, la tectonique et le climat, en résistance à la standardisation consumériste.",
    architecturalRelevance: "Cadre théorique et philosophique justifiant le refus du pastiche néo-traditionnel et de la boîte de verre moderne sans contexte.",
    keyQuotes: ["'Le régionalisme critique ne cherche pas à imiter le folklore vernaculaire, mais à déconstruire les technologies universelles par les spécificités du lieu.'"],
    verified: true,
    theme: "Théorie architecturale",
    createdAt: "2026-10-23"
  }
];

export const initialBenchmarks: BenchmarkThesis[] = [
  {
    id: "bench-1",
    title: "Habiter l'air et la terre : Équipement culturel bioclimatique à Ouagadougou",
    author: "Kaboré, Aristide",
    university: "EAMAU - Mention Très Bien avec Félicitations du Jury",
    year: "2024",
    gradeOrMention: "18.5/20 - Félicitations",
    generalPlan: "Partie 1 : Diagnostic territorial et bilan énergétique du bâti sahélien.\nPartie 2 : Cadre théorique et modélisation thermique du BTC.\nPartie 3 : Démarche projective et détails constructifs au 1/20.",
    problemStatementMethod: "Part d'un paradoxe frappant : la ville moderne sahélienne dépense 70% de son électricité dans la climatisation d'immeubles calqués sur l'Europe. Construit une démonstration chiffrée irréfutable avant de proposer la solution architecturale.",
    theoreticalFramework: "Vernaculaire critique + physique du bâtiment (modèle de Fanger adapté aux tropiques).",
    architecturalIntegration: "Le mémoire ne reste pas théorique : chaque principe physique trouve sa transcription graphique immédiate dans une coupe constructive du projet TPFE.",
    strengths: [
      "Clarté didactique des schémas d'ambiances et des flux aérauliques",
      "Écriture sobre, sans jargon superflu, rigueur scientifique irréprochable",
      "Parfaite continuité entre la problématique écrite et les planches graphiques"
    ],
    weaknesses: [
      "Revue de littérature un peu courte sur les aspects économiques de la filière",
      "Manque d'analyse des retours d'expérience sur la durabilité des enduits"
    ],
    lessonsForDonald: [
      "Toujours associer une affirmation thermique à un schéma ou une coupe de principe",
      "Rédiger l'introduction en partant d'un constat chiffré incontestable",
      "Conserver une typographie sobre avec une hiérarchie stricte des sous-titres"
    ],
    addedAt: "2026-10-22"
  }
];

export const initialTasks: ProjectTask[] = [
  {
    id: "tsk-1",
    title: "Finaliser la formulation de la problématique avec SAM",
    description: "Confronter les 3 variantes de formulation rédigées pour retenir celle qui servira de fil conducteur au mémoire et au TPFE.",
    priority: "haute",
    dueDate: "2026-10-28",
    estimatedHours: 4,
    actualHours: 2,
    status: "en_cours",
    stageId: 4,
    reminders: ["2026-10-27"],
    createdAt: "2026-10-24"
  },
  {
    id: "tsk-2",
    title: "Synthétiser 5 articles sur le confort thermique en climat tropical",
    description: "Extraire les valeurs d'inconfort thermique et les comparer aux recommandations de Givoni et Szokolay.",
    priority: "moyenne",
    dueDate: "2026-10-31",
    estimatedHours: 6,
    status: "a_faire",
    stageId: 9,
    reminders: ["2026-10-30"],
    createdAt: "2026-10-24"
  },
  {
    id: "tsk-3",
    title: "Enregistrer la séance de travail et générer le script TikTok #1",
    description: "Documenter la démarche du choix du sujet pour la série de vlogs académiques.",
    priority: "moyenne",
    dueDate: "2026-10-29",
    estimatedHours: 2,
    status: "a_faire",
    stageId: 1,
    reminders: [],
    createdAt: "2026-10-24"
  },
  {
    id: "tsk-4",
    title: "Rendez-vous préparatoire avec l'encadrant",
    description: "Présenter la fiche d'avancement des étapes 1 à 6 et valider officiellement le thème du mémoire.",
    priority: "urgente",
    dueDate: "2026-11-04",
    estimatedHours: 3,
    status: "a_faire",
    stageId: 6,
    reminders: ["2026-11-02", "2026-11-03"],
    createdAt: "2026-10-24"
  }
];

export const initialDecisions: ValidatedDecision[] = [
  {
    id: "dec-1",
    date: "2026-10-21",
    stageName: "2. Identification d'un domaine de recherche",
    decisionText: "Focalisation sur l'architecture bioclimatique et les éco-matériaux locaux (terre crue / BTC) comme réponse centrale au confort d'été.",
    justification: "Nécessité de répondre à la crise énergétique et à la perte d'identité des villes ouest-africaines.",
    impactOnProject: "Définit le matériau principal de l'enveloppe du projet TPFE et oriente toute la revue de littérature vers la physique des parois poreuses et lourdes."
  },
  {
    id: "dec-2",
    date: "2026-10-23",
    stageName: "4. Formulation de la problématique",
    decisionText: "Rejet de la climatisation artificielle comme solution première ; adoption du rafraîchissement passif par ventilation nocturne et effet cheminée.",
    justification: "Cohérence avec la posture écologique et les contraintes économiques réelles des futurs usagers.",
    impactOnProject: "Impose des hauteurs sous plafond généreuses (> 3.80m), des coursives d'ombrage et des cheminées thermiques en toiture."
  }
];

export const initialSessions: WorkSessionLog[] = [
  {
    id: "sess-1",
    date: "2026-10-24",
    rawInput: "Aujourd'hui, j'ai travaillé pendant 3 heures sur la clarification de mon thème et la critique des bâtiments en verre à Cotonou. J'ai constaté que les bureaux climatisés dépensent une fortune alors qu'avec une double peau en brique de terre et une bonne orientation Est-Ouest, on gagne 5 degrés sans clim. J'hésite encore sur la taille exacte de l'équipement public, mais je valide la terre crue comme matériau dominant.",
    durationMinutes: 180,
    relatedStageId: 4,
    academicJournal: {
      context: "Séance de cadrage conceptuel et analyse comparative des typologies constructives en milieu tropical humide.",
      objectives: "Établir les fondements argumentaires de la critique du tout-béton et poser la faisabilité de l'enveloppe en terre comprimée.",
      actionsDone: "Analyse des données d'ambiances de deux édifices contemporains à Cotonou ; comparaison des écarts thermiques intérieur/extérieur ; confrontation avec les règles bioclimatiques de Givoni.",
      resultsAchieved: "Démonstration qualitative de l'inadéquation des façades rideaux vitrées en climat subéquatorial ; estimation d'un différentiel thermique potentiel de 5°C grâce à l'inertie de la BTC et à la protection solaire.",
      validatedDecisions: "Validation définitive du matériau d'enveloppe : blocs de terre comprimée (BTC) stabilisés avec double peau ventilée. Refus du recours systématique à la climatisation mécanique.",
      difficultiesAndLimits: "Incertitude persistante sur le dimensionnement programmatique précis de l'équipement (équipement métropolitain ou de quartier).",
      nextSteps: "Arrêter les limites parcellaires du site et formaliser la fiche de proposition pour l'encadrant."
    },
    socialScripts: {
      tiktok30s: {
        title: "Pourquoi nos villes africaines construisent des fours en verre ?",
        hook: "Pourquoi on continue de construire des tours en verre à 35°C à l'ombre en Afrique de l'Ouest ?",
        script: "Aujourd'hui, sur mon mémoire de Master en architecture, je me suis plongé dans les chiffres. Une façade en verre non protégée ici, c'est jusqu'à 70% de la facture électrique avalée par la climatisation. Pourtant, à quelques kilomètres, nos ancêtres utilisaient la terre crue pour maintenir 24°C constants à l'intérieur. Mon objectif de TPFE : prouver qu'on peut faire une architecture contemporaine, magnifique et fraîche sans allumer un seul climatiseur. Abonne-toi pour suivre la conception étape par étape !",
        keyTakeaway: "La terre crue n'est pas archaïque : c'est la haute technologie passive du futur.",
        hashtags: ["#ArchitectureEtudiante", "#MasterArchi", "#Bioclimatique", "#AfriqueDurable", "#TerreCrue"],
        estimatedDuration: "35 secondes"
      },
      vlog60s: {
        title: "Vlog Mémoire Archi #1 - Trouver sa problématique sans se mentir",
        hook: "Jour 14 de mon mémoire de fin d'études en architecture : le moment où tout se joue.",
        script: "Salut c'est Donald ! Si vous faites des études d'archi, vous connaissez cette sensation de blocage quand l'encadrant vous demande : 'Mais au fond Donald, c'est quoi ton problème d'architecture ?'. Aujourd'hui avec SAM, mon assistante de recherche, on a déblayé le terrain. J'avais peur de m'éparpiller. En observant les nouveaux quartiers d'affaires de ma ville, j'ai eu le déclic : on importe des boîtes climatisées alors qu'on a sous nos pieds la terre et au-dessus de nos têtes les brises marines. J'ai validé ma première décision majeure : mon projet sera en BTC ventilé. Prochaine étape : aller mesurer les températures réelles sur site. Dites-moi en commentaire si vous avez déjà ressenti cette sensation d'étouffement dans un bâtiment moderne !",
        visualNotes: "Plan face caméra dans l'atelier, plans de coupe sur les croquis de terre crue et l'écran de travail.",
        keyTakeaway: "Une problématique forte part d'une indignation réelle observée sur le terrain.",
        hashtags: ["#VlogEtudiant", "#Architecture", "#TPFE", "#MasterThesis"],
        estimatedDuration: "60 secondes"
      },
      podcastEpisode: {
        title: "Épisode 1 : Le piège de la modernité importée - Carnet de bord d'un futur architecte",
        hook: "Bienvenue dans ce carnet de bord sonore. Je m'appelle Donald, je suis étudiant en Master d'architecture, et pendant les prochains mois, je vous emmène dans les coulisses intégrales de mon projet de fin d'études.",
        script: `Bienvenue à tous. Aujourd'hui, je pose la première pierre de ce journal de recherche. 

Quand on arrive en fin de cycle de Master en architecture, on a envie de tout faire : une tour emblématique, des formes spectaculaires, des rendus 3D clinquants. Mais en regardant ma propre ville, Cotonou, et en discutant avec les habitants, une question m'a frappé de plein fouet. Pourquoi construisons-nous des édifices qui nécessitent des générateurs et des compresseurs bruyants jour et nuit simplement pour qu'un être humain puisse y travailler sans transpirer ?

Le mémoire d'architecture n'est pas un exercice de style livresque. C'est le moment où l'on choisit quel architecte on veut devenir. Dans cette première séance de travail, j'ai voulu confronter les théories bioclimatiques de Givoni avec la réalité des chantiers contemporains. Le verdict est sans appel : nous avons confondu progrès technique et dépendance énergétique.

En réhabilitant la brique de terre comprimée, en repensant les patios et les cheminées de tirage d'air, je ne cherche pas à faire du passéisme. Je veux concevoir un édifice qui respire avec le climat, qui respecte les moyens de sa population et qui offre une dignité spatiale.

Dans le prochain épisode, je vous emmènerai sur le site potentiel de mon projet pour confronter ces idées à la topographie et aux vents dominants. Merci de m'accompagner dans cette aventure.`,
        keyTakeaway: "L'architecture doit retrouver son bon sens climatique avant de chercher la virtuosité formelle.",
        estimatedDuration: "3 min 30"
      }
    }
  }
];

export const defaultProjectData: SamProjectData = {
  profile: initialProfile,
  stages: initialStages,
  chatHistory: [
    {
      id: "msg-init-1",
      sender: "SAM",
      content: `Bonjour Donald. Je suis SAM, ton assistante personnelle dédiée à la réussite de ton Mémoire et de ton TPFE de Master en architecture.

Nous formons un binôme de travail rigoureux et complice : tu es le concepteur, le chercheur et le seul maître à bord de tes décisions académiques. De mon côté, je suis là pour structurer ta pensée, rechercher des sources vérifiées, disséquer les meilleurs mémoires de référence, t'épauler dans la rédaction section par section, garder la mémoire infaillible de tes choix et transformer chaque séance en journal de bord et en scripts pour tes réseaux.

Comment te sens-tu aujourd'hui par rapport à ton sujet et par quoi souhaites-tu que nous commencions notre séance de travail ?`,
      timestamp: "2026-10-24T09:00:00Z"
    }
  ],
  sources: initialSources,
  benchmarks: initialBenchmarks,
  sections: initialSections,
  sessions: initialSessions,
  tasks: initialTasks,
  decisions: initialDecisions,
  lastSaved: new Date().toISOString()
};

/** Projet vierge pour un nouveau compte : même parcours en 20 étapes et mêmes sections, sans les données de Donald. */
export function starterProject(email?: string): SamProjectData {
  const raw = (email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  const name = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Toi';
  const now = new Date().toISOString();
  return {
    profile: {
      ...initialProfile,
      name,
      topic: '',
      subTopic: '',
      contextLocation: '',
      supervisor: '',
      university: '',
      defenseDate: '',
      isPinLocked: false,
      pinCode: '',
    },
    stages: initialStages.map((s) => ({
      ...s,
      completedWork: '',
      associatedSources: [],
      validatedDecisions: [],
      openQuestions: [],
      difficulties: [],
      nextActions: [],
      status: 'not_started',
      updatedAt: now,
    })),
    chatHistory: [],
    archivedChats: [],
    sources: [],
    benchmarks: [],
    sections: initialSections.map((s) => ({
      ...s,
      currentStep: 1,
      outline: '',
      missingData: [],
      draftContent: '',
      usedReferences: [],
      verificationPoints: [],
      donaldValidationNote: '',
      isValidatedByDonald: false,
      versions: [],
      updatedAt: now,
    })),
    sessions: [],
    tasks: [],
    decisions: [],
    lastSaved: now,
  };
}
