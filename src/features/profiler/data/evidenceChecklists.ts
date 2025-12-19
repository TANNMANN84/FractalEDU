
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
            'Use of graphic organizers'
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
    }
};

export const EXTEND_CHECKLIST = Object.values(EVIDENCE_DOMAINS.hpge).reduce((acc, val) => acc.concat(val), [] as string[]);
export const ASSIST_CHECKLIST = Object.values(EVIDENCE_DOMAINS.assist).reduce((acc, val) => acc.concat(val), [] as string[]);
export const CULTURAL_CHECKLIST = Object.values(EVIDENCE_DOMAINS.cultural).reduce((acc, val) => acc.concat(val), [] as string[]);
