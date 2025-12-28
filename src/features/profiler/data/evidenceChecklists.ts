
export const EVIDENCE_DOMAINS = {
    hpge: {
        'Complexity & Content': [
            'Increase depth & complexity of tasks',
            'Sophisticated written/oral responses',
            'Provide complex/varied texts (primary sources)',
            'Compact curriculum for enrichment',
            'Introduce advanced terminology & nuances',
            'Synthesize skills & interdisciplinary links'
        ],
        'Pace & Autonomy': [
            'Allow in-depth exploration with flexible time',
            'Enable self-paced learning',
            'Facilitate student-led project timelines',
            'Accelerated pacing where mastery shown',
            'Advanced/self-directed homework'
        ],
        'Teaching Strategies': [
            'Higher-order questioning (analysis, synthesis)',
            'Introduce ambiguity & ethical dilemmas',
            'Facilitate exploration of real-world problems',
            'Socratic questioning / Seminar',
            'Explicit modelling of advanced skills'
        ],
        'Environment & Grouping': [
            'Facilitate mentorship (teacher, peer, expert)',
            'Cluster grouping with intellectual peers',
            'Flexible spaces for independent work',
            'Access to specialist equipment/programs'
        ]
    },
    assist: {
        'Adjustments to Assessment': [
            'Extra time to complete task',
            'Reduce number of questions',
            'Scribe / Speech-to-text',
            'Reader / Text-to-speech',
            'Separate supervision',
            'Split task into smaller chunks'
        ],
        'Instructional Scaffolding': [
            'Simplify language / Pre-teach vocabulary',
            'Visual supports / Pictorial directions',
            'Step-by-step written guides',
            'Concrete examples & modelling',
            'Sentence starters / Writing frames'
        ],
        'Environment': [
            'Strategic seating (front of room)',
            'Low-distraction work area',
            'Use of fidgets/sensory tools',
            'Predictable routine / Visual timetable',
            'Movement breaks'
        ],
        'Resources': [
            'Adjusted worksheets (font/layout)',
            'Use of calculator/manipulatives',
            'Digital text with accessibility features',
            'Cloze passages / Matching activities'
        ]
    },
    cultural: {
        '8 Ways of Learning': [
            'Story Sharing (Narrative-driven learning)',
            'Learning Maps (Visualising pathways)',
            'Non-verbal (Kinaesthetic/Hands-on)',
            'Symbols & Images (Metaphor)',
            'Land Links (Place-based learning)',
            'Non-linear (Holistic/Circular logic)',
            'Deconstruct/Reconstruct (Scaffolding)',
            'Community Links (Connecting to local context)'
        ],
        'Content Integration': [
            'Local Aboriginal perspectives',
            'Yarning circles for discussion',
            'Connection to Country',
            'Use of authentic cultural resources'
        ]
    },
    literacy: {
        'Reading': [
            'Phonics decoding strategies', 
            'Fluency practice', 
            'Comprehension strategies (prediction, summary)', 
            'Vocabulary instruction',
            'Visualising text'
        ],
        'Writing': [
            'Sentence construction (simple/compound)', 
            'Paragraph structuring (TEEL/PEEL)', 
            'Editing checklists', 
            'Scaffolded writing tasks',
            'Use of graphic organisers'
        ],
        'Spelling': [
            'Etymological focus', 
            'Phonological awareness', 
            'Morphology strategies',
            'Word banks'
        ]
    },
    numeracy: {
        'Number': [
            'Multiplicative strategies', 
            'Place value reinforcement', 
            'Fraction/Decimal equivalence',
            'Estimation strategies'
        ],
        'Problem Solving': [
            'Newman\'s error analysis', 
            'CUBES strategy', 
            'Visualising problems',
            'Working backwards'
        ],
        'Support': [
            'Concrete manipulatives', 
            'Calculator use', 
            'Reference sheet / Glossary'
        ]
    },
    behaviour: {
        'Positive Supports': ['Verbal praise', 'Token/Reward system', 'Positive phone call', 'Class privilege', 'Leadership role'],
        'Interventions': ['Non-verbal cue', 'Verbal redirection', 'Seating adjustment', 'Restorative conversation', 'Cool down break'],
        'Structure': ['Visual timetable', 'Predictable routine', 'Clear expectations', 'Transition warnings']
    },
    wellbeing: {
        'Check-ins': ['Morning greeting', 'Emotional check-in', 'Debrief after incident', 'End of day checkout'],
        'Supports': ['Sensory tools', 'Quiet space access', 'Peer buddy', 'Referral to counsellor'],
        'Communication': ['Parent/Carer contact', 'Wellbeing team update', 'External agency liaison']
    },
    nccd: {
        'Curriculum': ['Modified task', 'Differentiated content', 'Alternative format', 'Scaffolded instruction'],
        'Assessment': ['Extra time', 'Scribe/Reader', 'Separate supervision', 'Adjusted criteria'],
        'Environment': ['Physical access', 'Sensory adjustment', 'Specialized equipment', 'Seating plan'],
        'Social/Emotional': ['Social skills program', 'Structured break time', 'Crisis management plan', 'Check-in support'],
        'Consultation': ['Parent meeting', 'Specialist review', 'Case conference', 'Email communication']
    }
};

export const EXTEND_CHECKLIST = Object.values(EVIDENCE_DOMAINS.hpge).reduce((acc, val) => acc.concat(val), [] as string[]);
export const ASSIST_CHECKLIST = Object.values(EVIDENCE_DOMAINS.assist).reduce((acc, val) => acc.concat(val), [] as string[]);
export const CULTURAL_CHECKLIST = Object.values(EVIDENCE_DOMAINS.cultural).reduce((acc, val) => acc.concat(val), [] as string[]);
export const LITERACY_CHECKLIST = Object.values(EVIDENCE_DOMAINS.literacy).reduce((acc, val) => acc.concat(val), [] as string[]);
export const NUMERACY_CHECKLIST = Object.values(EVIDENCE_DOMAINS.numeracy).reduce((acc, val) => acc.concat(val), [] as string[]);
export const BEHAVIOUR_CHECKLIST = Object.values(EVIDENCE_DOMAINS.behaviour).reduce((acc, val) => acc.concat(val), [] as string[]);
export const WELLBEING_CHECKLIST = Object.values(EVIDENCE_DOMAINS.wellbeing).reduce((acc, val) => acc.concat(val), [] as string[]);
export const NCCD_CHECKLIST = Object.values(EVIDENCE_DOMAINS.nccd).reduce((acc, val) => acc.concat(val), [] as string[]);

export const NCCD_LEVELS = {
    'QDTP': [
        'Quality differentiated teaching',
        'Explicit instruction',
        'Visual supports',
        'Flexible grouping',
        'Scaffolded tasks',
        'Alternative representation'
    ],
    'Supplementary': [
        'Adjusted assessment conditions',
        'Regular check-ins',
        'Modified homework/tasks',
        'Social skills support',
        'Sensory breaks',
        'Scribe / Reader support',
        'Separate supervision'
    ],
    'Substantial': [
        'Significant curriculum modification',
        'Frequent individual support (SLSO)',
        'Specialized equipment/technology',
        'Regular health support procedures',
        'Detailed risk management plan',
        'Social playground support'
    ],
    'Extensive': [
        'Constant 1:1 support',
        'Alternative communication systems',
        'Full personal care support',
        'Highly specialized curriculum',
        'Therapy delivered in school'
    ]
};
