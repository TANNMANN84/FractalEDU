export const wsOutcomes = {
    yr11: ["11-1", "11-2", "11-3", "11-4", "11-5", "11-6", "11-7"],
    yr12: ["12-1", "12-2", "12-3", "12-4", "12-5", "12-6", "12-7"],
};

export const syllabusData: { [key: string]: any } = {
    chemistry: {
        prefix: "CH",
        modules: [
            { name: 'Mod 1: Properties and Structure of Matter', contentAreas: ['Properties of Matter', 'Atomic structure and atomic mass', 'Periodicity', 'Bonding'], outcomes: ['11-8'] },
            { name: 'Mod 2: Introduction to Quantitative Chemistry', contentAreas: ['Mole Concept', 'Concentration and Molarity', 'Gas Laws'], outcomes: ['11-9'] },
            { name: 'Mod 3: Reactive Chemistry', contentAreas: ['Predicting Reactions of Metals', 'Rates of Reactions'], outcomes: ['11-10'] },
            { name: 'Mod 4: Drivers of Reactions', contentAreas: ['Energy Changes in Chemical Reactions', 'Enthalpy and Hess’s Law', 'Entropy and Gibbs Free Energy'], outcomes: ['11-11'] },
            { name: 'Mod 5: Equilibrium and Acid Reactions', contentAreas: ['Static and Dynamic Equilibrium', 'Factors Affecting Equilibrium', 'Calculating the Equilibrium Constant'], outcomes: ['12-12'] },
            { name: 'Mod 6: Acid/base Reactions', contentAreas: ['Properties of Acids and Bases', 'Using Brønsted-Lowry Theory', 'Quantitative Analysis'], outcomes: ['12-13'] },
            { name: 'Mod 7: Organic Chemistry', contentAreas: ['Nomenclature', 'Hydrocarbons', 'Alcohols', 'Reactions of Organic Compounds', 'Polymers'], outcomes: ['12-14'] },
            { name: 'Mod 8: Applying Chemical Ideas', contentAreas: ['Analysis of Inorganic Substances', 'Analysis of Organic Substances', 'Chemical Synthesis and Design'], outcomes: ['12-15'] }
        ]
    },
    physics: {
        prefix: "PHY",
        modules: [
            { name: 'Mod 1: Kinematics', contentAreas: ['Motion in a Straight Line', 'Motion on a Plane'], outcomes: ['11-8'] },
            { name: 'Mod 2: Dynamics', contentAreas: ['Forces', 'Force and Motion', 'Momentum, Energy and Simple Systems'], outcomes: ['11-9'] },
            { name: 'Mod 3: Waves and Thermodynamics', contentAreas: ['Wave Properties', 'Wave Behaviour', 'Sound Waves', 'Thermodynamics'], outcomes: ['11-10'] },
            { name: 'Mod 4: Electricity and Magnetism', contentAreas: ['Electrostatics', 'Electric Circuits', 'Magnetism'], outcomes: ['11-11'] },
            { name: 'Mod 5: Advanced Mechanics', contentAreas: ['Projectile Motion', 'Circular Motion', 'Motion in Gravitational Fields'], outcomes: ['12-12'] },
            { name: 'Mod 6: Electromagnetism', contentAreas: ['Charged Particles in Electric and Magnetic Fields', 'The Motor Effect', 'Electromagnetic Induction', 'Applications of the Motor Effect'], outcomes: ['12-13'] },
            { name: 'Mod 7: The Nature of Light', contentAreas: ['Electromagnetic Spectrum', 'Light: Wave Model', 'Light: Quantum Model', 'Light and Special Relativity'], outcomes: ['12-14'] },
            { name: 'Mod 8: From the Universe to the Atom', contentAreas: ['Origins of the Elements', 'Structure of the Atom', 'Quantum Mechanical Nature of the Atom', 'Properties of the Nucleus', 'Deep Inside the Atom'], outcomes: ['12-15'] }
        ]
    },
    biology: {
        prefix: "BIO",
        modules: [
            { name: 'Mod 1: Cells as the Basis of Life', contentAreas: ['Cell structure', 'Cell function'], outcomes: ['11-8'] },
            { name: 'Mod 2: Organisation of Living Things', contentAreas: ['Organisation of cells', 'Nutrient and gas requirements', 'Transport'], outcomes: ['11-9'] },
            { name: 'Mod 3: Biological Diversity', contentAreas: ['Effects of the environment on organisms', 'Adaptations', 'Theory of Evolution by Natural Selection'], outcomes: ['11-10'] },
            { name: 'Mod 4: Ecosystem Dynamics', contentAreas: ['Population dynamics', 'Past ecosystems', 'Future ecosystems'], outcomes: ['11-11'] },
            { name: 'Mod 5: Heredity', contentAreas: ['Reproduction', 'Cell Replication', 'DNA and Polypeptide Synthesis', 'Genetic Variation'], outcomes: ['12-12'] },
            { name: 'Mod 6: Genetic Change', contentAreas: ['Mutation', 'Biotechnology', 'Genetic Technologies'], outcomes: ['12-13'] },
            { name: 'Mod 7: Infectious Disease', contentAreas: ['Causes of Infectious Disease', 'Responses to Pathogens', 'Immunity', 'Prevention, Treatment and Control'], outcomes: ['12-14'] },
            { name: 'Mod 8: Non-infectious Disease and Disorders', contentAreas: ['Homeostasis', 'Causes and Effects', 'Epidemiology', 'Prevention', 'Technologies and Disorders'], outcomes: ['12-15'] }
        ]
    },
    investigating: {
        prefix: "INS",
        modules: [
            { name: 'Mod 1: Cause and Effect – Observing', contentAreas: ['Observations', 'Inferences and Generalisations'], outcomes: ['11-8'] },
            { name: 'Mod 2: Cause and Effect – Inferences and Generalisations', contentAreas: ['Collecting and Recording Data', 'Analysing Data'], outcomes: ['11-9'] },
            { name: 'Mod 3: Scientific Models', contentAreas: ['Developing Models', 'Using Models'], outcomes: ['11-10'] },
            { name: 'Mod 4: Theories and Laws', contentAreas: ['Developing Theories and Laws', 'Using Theories and Laws'], outcomes: ['11-11'] },
            { name: 'Mod 5: Scientific Investigations', contentAreas: ['Planning Investigations', 'Conducting Investigations'], outcomes: ['12-12'] },
            { name: 'Mod 6: Technologies', contentAreas: ['Development of Technologies', 'Application of Technologies'], outcomes: ['12-13'] },
            { name: 'Mod 7: Fact or Fallacy?', contentAreas: ['Evaluating Claims', 'Evidence-based Arguments'], outcomes: ['12-14'] },
            { name: 'Mod 8: Science and Society', contentAreas: ['Science and Decision-making', 'Influence of Science'], outcomes: ['12-15'] }
        ]
    },
    ees: {
        prefix: "EES",
        modules: [
            { name: 'Mod 1: Earth’s Resources', contentAreas: ['Structure of the Earth', 'Elements, Compounds and Mixtures', 'Water Resources', 'Soil Resources', 'Energy Resources'], outcomes: ['11-8'] },
            { name: 'Mod 2: Plate Tectonics', contentAreas: ['Plate Tectonic Supercycle', 'Evidence for Plate Tectonics', 'Hazards'], outcomes: ['11-9'] },
            { name: 'Mod 3: Energy Transformations', contentAreas: ['Renewable and Non-renewable Resources', 'Radiometric Dating', 'Energy from the Atom'], outcomes: ['11-10'] },
            { name: 'Mod 4: Human Impacts', contentAreas: ['Causes of Environmental Change', 'Measuring Environmental Change', 'Responding to Environmental Change'], outcomes: ['11-11'] },
            { name: 'Mod 5: Earth’s Processes', contentAreas: ['Rock Cycle', 'Water Cycle', 'Carbon Cycle', 'Atmospheric Processes'], outcomes: ['12-12'] },
            { name: 'Mod 6: Hazards', contentAreas: ['Volcanic Eruptions', 'Earthquakes', 'Tsunamis', 'Cyclones', 'Bushfires'], outcomes: ['12-13'] },
            { name: 'Mod 7: Climate Science', contentAreas: ['Natural Climate Variation', 'Evidence for Climate Change', 'Models and Drivers of Climate Change', 'Impacts of Climate Change'], outcomes: ['12-14'] },
            { name: 'Mod 8: Resource Management', contentAreas: ['Water Management', 'Waste Management', 'Sustainable Resource Use'], outcomes: ['12-15'] }
        ]
    }
};

export const cognitiveVerbs = [ 
    'Analyse', 'Calculate', 'Describe', 'Discuss', 'Evaluate', 'Explain', 'Identify', 'Justify', 'Outline', 'Predict'
    ];