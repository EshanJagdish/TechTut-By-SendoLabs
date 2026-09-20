import { QuizQuestion, QuizSourceType } from '../types';

// Sample Kahoot Dataset
export const SAMPLE_KAHOOT_QUESTIONS: QuizQuestion[] = [
  {
    id: 'kahoot_1',
    question: 'In computer algorithms, what is the average time complexity of QuickSort?',
    options: ['O(n log n)', 'O(n²)', 'O(log n)', 'O(n)'],
    correctAnswerIndex: 0,
    explanation: 'QuickSort divides the array around a pivot, yielding O(n log n) average performance.',
    timeLimitSeconds: 20,
    points: 1000,
    source: 'kahoot',
  },
  {
    id: 'kahoot_2',
    question: 'Which neural network architecture introduced the Self-Attention mechanism?',
    options: ['Convolutional Neural Network (CNN)', 'Recurrent Neural Network (RNN)', 'Transformer', 'Multilayer Perceptron (MLP)'],
    correctAnswerIndex: 2,
    explanation: 'The Transformer architecture (Vaswani et al., 2017) introduced multi-head self-attention.',
    timeLimitSeconds: 20,
    points: 1000,
    source: 'kahoot',
  },
  {
    id: 'kahoot_3',
    question: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
    options: ['Stack', 'Queue', 'Binary Search Tree', 'Hash Map'],
    correctAnswerIndex: 1,
    explanation: 'A Queue processes elements in First-In, First-Out order, like a line of people.',
    timeLimitSeconds: 20,
    points: 1000,
    source: 'kahoot',
  },
  {
    id: 'kahoot_4',
    question: 'In relational databases, what does the ACID acronym stand for?',
    options: [
      'Atomicity, Consistency, Isolation, Durability',
      'Accuracy, Concurrency, Indexing, Delivery',
      'Asynchronous, Cached, Indexed, Distributed',
      'Access, Control, Identity, Domain'
    ],
    correctAnswerIndex: 0,
    explanation: 'ACID guarantees database transactions are processed reliably.',
    timeLimitSeconds: 20,
    points: 1000,
    source: 'kahoot',
  },
  {
    id: 'kahoot_5',
    question: 'What is the primary function of an operating system kernel?',
    options: [
      'Manage system hardware resources and provide abstraction layer',
      'Compile source code into machine bytecode',
      'Render graphical user interface windows',
      'Encrypt network packets for transport security'
    ],
    correctAnswerIndex: 0,
    explanation: 'The kernel is the core of an OS, controlling CPU, memory, and hardware devices.',
    timeLimitSeconds: 20,
    points: 1000,
    source: 'kahoot',
  },
];

// Sample Blooket Dataset
export const SAMPLE_BLOOKET_QUESTIONS: QuizQuestion[] = [
  {
    id: 'blooket_1',
    question: 'Which scientist formulated the Three Laws of Planetary Motion?',
    options: ['Johannes Kepler', 'Galileo Galilei', 'Isaac Newton', 'Nicolaus Copernicus'],
    correctAnswerIndex: 0,
    explanation: 'Kepler published his laws of planetary motion based on Tycho Brahe’s observations.',
    timeLimitSeconds: 25,
    points: 1000,
    source: 'blooket',
  },
  {
    id: 'blooket_2',
    question: 'What element has the highest electrical conductivity of all metals at room temperature?',
    options: ['Silver', 'Copper', 'Gold', 'Aluminum'],
    correctAnswerIndex: 0,
    explanation: 'Silver (Ag) has the highest electrical conductivity, followed closely by copper.',
    timeLimitSeconds: 25,
    points: 1000,
    source: 'blooket',
  },
  {
    id: 'blooket_3',
    question: 'In what year was the Rosetta Stone discovered in Egypt?',
    options: ['1799', '1822', '1888', '1750'],
    correctAnswerIndex: 0,
    explanation: 'Discovered in 1799 during the Napoleonic expedition to Egypt by Pierre-François Bouchard.',
    timeLimitSeconds: 25,
    points: 1000,
    source: 'blooket',
  },
  {
    id: 'blooket_4',
    question: 'What biological macromolecule acts as the principal energy currency of the cell?',
    options: ['Adenosine Triphosphate (ATP)', 'Deoxyribonucleic Acid (DNA)', 'Glucose-6-Phosphate', 'Ribosomal RNA'],
    correctAnswerIndex: 0,
    explanation: 'ATP hydrolyzes into ADP + Pi to release energy powering cellular work.',
    timeLimitSeconds: 25,
    points: 1000,
    source: 'blooket',
  },
  {
    id: 'blooket_5',
    question: 'Which fundamental physical force is mediated by gluons?',
    options: ['Strong Nuclear Force', 'Electromagnetic Force', 'Weak Nuclear Force', 'Gravitational Force'],
    correctAnswerIndex: 0,
    explanation: 'The strong interaction binds quarks together into hadrons through gluon exchange.',
    timeLimitSeconds: 25,
    points: 1000,
    source: 'blooket',
  },
];

// Sample Quizlet Dataset
export const SAMPLE_QUIZLET_QUESTIONS: QuizQuestion[] = [
  {
    id: 'quizlet_1',
    question: 'What is the definition of: Mitochondria?',
    options: [
      'The powerhouse of the cell that generates ATP via oxidative phosphorylation',
      'The organelle responsible for protein synthesis and translation',
      'A membrane-bound vesicle containing hydrolytic enzymes for digestion',
      'The outer lipid bilayer regulating transport in and out of the cell'
    ],
    correctAnswerIndex: 0,
    explanation: 'Quizlet term: Mitochondria -> Generates ATP through the electron transport chain.',
    timeLimitSeconds: 30,
    points: 1000,
    source: 'quizlet',
  },
  {
    id: 'quizlet_2',
    question: 'What is the definition of: Ribosome?',
    options: [
      'The molecular machine that synthesizes proteins by translating mRNA',
      'The powerhouse of the cell that generates ATP via oxidative phosphorylation',
      'A dense non-membrane structure where rRNA is transcribed and assembled',
      'The tubular network responsible for synthesizing lipids and detoxifying toxins'
    ],
    correctAnswerIndex: 0,
    explanation: 'Quizlet term: Ribosome -> Translates genetic code into amino acid polypeptide chains.',
    timeLimitSeconds: 30,
    points: 1000,
    source: 'quizlet',
  },
  {
    id: 'quizlet_3',
    question: 'What is the definition of: Endoplasmic Reticulum (Rough)?',
    options: [
      'Membrane network studded with ribosomes involved in protein folding and transport',
      'The packaging and sorting station that modifies glycoproteins for secretion',
      'A large fluid-filled organelle maintaining turgor pressure in plant cells',
      'Microtubule organizing center containing centrioles in animal cells'
    ],
    correctAnswerIndex: 0,
    explanation: 'Quizlet term: Rough ER -> Features ribosomes for synthesis of membrane and secretory proteins.',
    timeLimitSeconds: 30,
    points: 1000,
    source: 'quizlet',
  },
  {
    id: 'quizlet_4',
    question: 'What is the definition of: Golgi Apparatus?',
    options: [
      'Flattened membranous sacs that modify, sort, and package proteins from the ER',
      'The circular double-stranded DNA structure found in bacterial cells',
      'Enzymatic organelle that breaks down fatty acids and hydrogen peroxide',
      'Protective carbohydrate cell wall found outside the plasma membrane'
    ],
    correctAnswerIndex: 0,
    explanation: 'Quizlet term: Golgi Apparatus -> Serves as cellular shipping and post-translational processing center.',
    timeLimitSeconds: 30,
    points: 1000,
    source: 'quizlet',
  },
  {
    id: 'quizlet_5',
    question: 'What is the definition of: Lysosome?',
    options: [
      'Membrane-bound digestive organelle containing acid hydrolases',
      'Nuclear pores that regulate RNA and protein transport into the nucleoplasm',
      'Cytoskeletal filament composed of actin that drives cell motility',
      'Photosynthetic plastid containing thylakoids and chlorophyll'
    ],
    correctAnswerIndex: 0,
    explanation: 'Quizlet term: Lysosome -> Degrades cellular waste, debris, and foreign pathogens.',
    timeLimitSeconds: 30,
    points: 1000,
    source: 'quizlet',
  },
];

// Helper to clean CSV tokens
function cleanCsvCell(cell: string): string {
  let res = cell.trim();
  if (res.startsWith('"') && res.endsWith('"')) {
    res = res.substring(1, res.length - 1).replace(/""/g, '"');
  }
  return res.trim();
}

// Split CSV / TSV line respecting quotes
function splitDelimitedLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parses Kahoot exports (CSV spreadsheet or JSON)
 * Standard format:
 * Question, Answer 1, Answer 2, Answer 3, Answer 4, Time limit (sec), Correct answer(s)
 */
export function parseKahootExport(text: string): QuizQuestion[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Try JSON first
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.items || []);
      const questions: QuizQuestion[] = [];
      list.forEach((q: any, idx: number) => {
        const questionText = q.question || q.title || `Question ${idx + 1}`;
        let options: string[] = [];
        let correctIdx = 0;

        if (Array.isArray(q.choices)) {
          options = q.choices.map((c: any) => typeof c === 'string' ? c : c.answer || c.text || '');
          const cIndex = q.choices.findIndex((c: any) => c.correct === true);
          if (cIndex !== -1) correctIdx = cIndex;
        } else if (Array.isArray(q.answers)) {
          options = q.answers.map((a: any) => typeof a === 'string' ? a : a.text || '');
          if (typeof q.correct === 'number') correctIdx = q.correct;
          else if (typeof q.correctAnswer === 'number') correctIdx = q.correctAnswer;
        }

        while (options.length < 4) {
          options.push(`Option ${options.length + 1}`);
        }

        questions.push({
          id: `kahoot_import_${Date.now()}_${idx}`,
          question: questionText,
          options: options.slice(0, 4),
          correctAnswerIndex: Math.max(0, Math.min(3, correctIdx)),
          timeLimitSeconds: q.time || q.timeLimit || 20,
          points: 1000,
          source: 'kahoot',
        });
      });
      if (questions.length > 0) return questions;
    } catch {
      // Not JSON, continue to CSV
    }
  }

  // Parse CSV / TSV
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const questions: QuizQuestion[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip header line if detected
    if (i === 0 && (line.toLowerCase().includes('question') && line.toLowerCase().includes('answer'))) {
      continue;
    }

    const delimiter = line.includes('\t') ? '\t' : ',';
    const cols = splitDelimitedLine(line, delimiter).map(cleanCsvCell);

    if (cols.length >= 5) {
      const qText = cols[0];
      const opt1 = cols[1] || 'Answer A';
      const opt2 = cols[2] || 'Answer B';
      const opt3 = cols[3] || 'Answer C';
      const opt4 = cols[4] || 'Answer D';
      
      // Parse time limit (col 5)
      let timeLimit = 20;
      if (cols[5] && !isNaN(parseInt(cols[5], 10))) {
        timeLimit = parseInt(cols[5], 10);
      }

      // Parse correct answer (col 6: e.g. "1", "2", "3", "4" or "A", "B")
      let correctIdx = 0;
      if (cols[6]) {
        const rawAns = cols[6].trim().toLowerCase();
        if (rawAns === '1' || rawAns === 'a') correctIdx = 0;
        else if (rawAns === '2' || rawAns === 'b') correctIdx = 1;
        else if (rawAns === '3' || rawAns === 'c') correctIdx = 2;
        else if (rawAns === '4' || rawAns === 'd') correctIdx = 3;
      }

      questions.push({
        id: `kahoot_csv_${Date.now()}_${i}`,
        question: qText,
        options: [opt1, opt2, opt3, opt4],
        correctAnswerIndex: correctIdx,
        timeLimitSeconds: timeLimit > 0 ? timeLimit : 20,
        points: 1000,
        source: 'kahoot',
      });
    }
  }

  return questions;
}

/**
 * Parses Blooket exports (CSV spreadsheet or JSON)
 * Standard format:
 * Question #, Question, Answer 1, Answer 2, Answer 3, Answer 4, Time Limit, Correct Answer(s)
 */
export function parseBlooketExport(text: string): QuizQuestion[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // JSON Check
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || []);
      const questions: QuizQuestion[] = [];
      list.forEach((q: any, idx: number) => {
        const questionText = q.question || `Question ${idx + 1}`;
        const answers = Array.isArray(q.answers) ? q.answers : ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
        let correctIdx = 0;
        if (q.correctAnswers && Array.isArray(q.correctAnswers)) {
          const match = answers.findIndex((a: string) => a === q.correctAnswers[0]);
          if (match !== -1) correctIdx = match;
        } else if (typeof q.correct === 'number') {
          correctIdx = q.correct;
        }

        while (answers.length < 4) {
          answers.push(`Option ${answers.length + 1}`);
        }

        questions.push({
          id: `blooket_json_${Date.now()}_${idx}`,
          question: questionText,
          options: answers.slice(0, 4),
          correctAnswerIndex: Math.max(0, Math.min(3, correctIdx)),
          timeLimitSeconds: q.timeLimit || 25,
          points: 1000,
          source: 'blooket',
        });
      });
      if (questions.length > 0) return questions;
    } catch {
      // fallback to CSV
    }
  }

  // Parse CSV / TSV
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const questions: QuizQuestion[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.toLowerCase().includes('question') && (line.toLowerCase().includes('answer') || line.toLowerCase().includes('time'))) {
      continue;
    }

    const delimiter = line.includes('\t') ? '\t' : ',';
    const cols = splitDelimitedLine(line, delimiter).map(cleanCsvCell);

    // Blooket CSV has either Question at index 0 or index 1 (if Question # is col 0)
    let qIndex = 0;
    if (!isNaN(parseInt(cols[0], 10)) && cols.length >= 6) {
      qIndex = 1; // col 0 is question number
    }

    if (cols.length >= qIndex + 5) {
      const qText = cols[qIndex];
      const opt1 = cols[qIndex + 1] || 'Answer A';
      const opt2 = cols[qIndex + 2] || 'Answer B';
      const opt3 = cols[qIndex + 3] || 'Answer C';
      const opt4 = cols[qIndex + 4] || 'Answer D';

      let timeLimit = 25;
      if (cols[qIndex + 5] && !isNaN(parseInt(cols[qIndex + 5], 10))) {
        timeLimit = parseInt(cols[qIndex + 5], 10);
      }

      let correctIdx = 0;
      const rawAnsCol = cols[qIndex + 6] || cols[cols.length - 1];
      if (rawAnsCol) {
        const cleanAns = rawAnsCol.trim().toLowerCase();
        if (cleanAns === '1' || cleanAns === 'a') correctIdx = 0;
        else if (cleanAns === '2' || cleanAns === 'b') correctIdx = 1;
        else if (cleanAns === '3' || cleanAns === 'c') correctIdx = 2;
        else if (cleanAns === '4' || cleanAns === 'd') correctIdx = 3;
        else {
          // If the text matches one of the options
          if (cleanAns === opt1.toLowerCase()) correctIdx = 0;
          else if (cleanAns === opt2.toLowerCase()) correctIdx = 1;
          else if (cleanAns === opt3.toLowerCase()) correctIdx = 2;
          else if (cleanAns === opt4.toLowerCase()) correctIdx = 3;
        }
      }

      questions.push({
        id: `blooket_csv_${Date.now()}_${i}`,
        question: qText,
        options: [opt1, opt2, opt3, opt4],
        correctAnswerIndex: correctIdx,
        timeLimitSeconds: timeLimit > 0 ? timeLimit : 25,
        points: 1000,
        source: 'blooket',
      });
    }
  }

  return questions;
}

/**
 * Parses Quizlet flashcard export:
 * Format: Term \t Definition \n Term \t Definition (or comma/semicolon separated)
 * Automatically converts each flashcard into a high-quality 4-choice test question
 * by using the term's definition as correct answer and 3 definitions from other cards as distractors!
 */
export function parseQuizletExport(text: string): QuizQuestion[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const cardPairs: { term: string; def: string }[] = [];

  for (const line of lines) {
    let term = '';
    let def = '';

    if (line.includes('\t')) {
      const parts = line.split('\t');
      term = cleanCsvCell(parts[0]);
      def = cleanCsvCell(parts.slice(1).join(' '));
    } else if (line.includes(' - ')) {
      const parts = line.split(' - ');
      term = cleanCsvCell(parts[0]);
      def = cleanCsvCell(parts.slice(1).join(' - '));
    } else if (line.includes(': ')) {
      const parts = line.split(': ');
      term = cleanCsvCell(parts[0]);
      def = cleanCsvCell(parts.slice(1).join(': '));
    } else if (line.includes(',')) {
      const parts = line.split(',');
      term = cleanCsvCell(parts[0]);
      def = cleanCsvCell(parts.slice(1).join(','));
    }

    if (term && def) {
      cardPairs.push({ term, def });
    }
  }

  if (cardPairs.length === 0) return [];

  const genericDistractors = [
    'None of the above choices accurately define the term',
    'A secondary biochemical catalyst with transient interaction',
    'An inverse regulatory feedback mechanism observed in control loops',
    'A temporary staging container used for intermediate computations'
  ];

  const questions: QuizQuestion[] = cardPairs.map((pair, idx) => {
    const questionText = `What is the correct definition or concept for: "${pair.term}"?`;
    const correctAnswer = pair.def;

    // Pick 3 distractors from other card definitions
    const otherDefs = cardPairs
      .filter((_, oIdx) => oIdx !== idx)
      .map(p => p.def);

    // Shuffle other definitions
    const shuffledOthers = [...otherDefs].sort(() => Math.random() - 0.5);
    const chosenDistractors: string[] = [];

    for (const d of shuffledOthers) {
      if (d !== correctAnswer && !chosenDistractors.includes(d) && chosenDistractors.length < 3) {
        chosenDistractors.push(d);
      }
    }

    // If fewer than 3 distractors available, supplement from genericDistractors
    let gIdx = 0;
    while (chosenDistractors.length < 3) {
      chosenDistractors.push(genericDistractors[gIdx % genericDistractors.length]);
      gIdx++;
    }

    // Insert correct answer at a randomized index (0 to 3)
    const correctPlacementIndex = Math.floor(Math.random() * 4);
    const options: string[] = [];
    let distractorCounter = 0;

    for (let pos = 0; pos < 4; pos++) {
      if (pos === correctPlacementIndex) {
        options.push(correctAnswer);
      } else {
        options.push(chosenDistractors[distractorCounter]);
        distractorCounter++;
      }
    }

    return {
      id: `quizlet_auto_${Date.now()}_${idx}`,
      question: questionText,
      options: options,
      correctAnswerIndex: correctPlacementIndex,
      explanation: `Quizlet Term: "${pair.term}" matches definition: "${pair.def}"`,
      timeLimitSeconds: 30,
      points: 1000,
      source: 'quizlet',
    };
  });

  return questions;
}

/**
 * Universal autodetect & parse for any of the 3 platforms or raw format
 */
export function autoDetectAndParse(raw: string, platformHint?: QuizSourceType): QuizQuestion[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (platformHint === 'kahoot') return parseKahootExport(trimmed);
  if (platformHint === 'blooket') return parseBlooketExport(trimmed);
  if (platformHint === 'quizlet') return parseQuizletExport(trimmed);

  // Try Quizlet (tab-separated term-definition)
  if (trimmed.includes('\t') && !trimmed.toLowerCase().includes('answer 1')) {
    const qz = parseQuizletExport(trimmed);
    if (qz.length >= 2) return qz;
  }

  // Try Kahoot
  const kh = parseKahootExport(trimmed);
  if (kh.length >= 1) return kh;

  // Try Blooket
  const bl = parseBlooketExport(trimmed);
  if (bl.length >= 1) return bl;

  // Fallback to Quizlet
  return parseQuizletExport(trimmed);
}
