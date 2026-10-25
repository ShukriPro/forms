/** Show a field only when another field in the same question has one of these values. */
export interface ShowIf {
  field: string
  anyOf: string[]
}

interface FieldRules {
  /** Must have a value (when visible) for the question to count as answered. */
  required?: boolean
  /** Hidden unless one of these conditions matches. */
  showIf?: ShowIf | ShowIf[]
  /** Greyed out, no longer required, and left out of the submission while this matches (e.g. "I don't know" ticked). */
  disabledIf?: ShowIf
}

export type Field = FieldRules &
  (
    | {
        kind: 'number'
        id: string
        label: string
        placeholder: string
        unit: string
        min: number
        max: number
        /** Allow decimals (e.g. cholesterol in mmol/L). Whole numbers only when false. */
        decimals?: boolean
      }
    | {
        kind: 'date'
        id: string
        label: string
        /** Entered as MM/DD/YYYY. */
        placeholder: string
        minAge: number
        maxAge: number
      }
    | {
        kind: 'text'
        id: string
        label?: string
        placeholder: string
        multiline?: boolean
        /** Optional free-text notes; doesn't count towards progress. */
        notes?: boolean
      }
    | { kind: 'choice'; id: string; label?: string; options: string[] }
    | {
        kind: 'checks'
        id: string
        label?: string
        options: string[]
        /** Options that clear every other option when picked (e.g. "None of these"). */
        exclusive?: string[]
      }
    | {
        kind: 'slider'
        id: string
        label: string
        min: number
        max: number
        step: number
        unit?: string
        unitOne?: string
        /** Show "+" on the maximum value, e.g. "300+ min". */
        openEnded?: boolean
        /** Named steps instead of numbers; min/max/step index into this list. */
        labels?: string[]
      }
  )

/** One of the questions on a multi-question card, e.g. "Do you take cholesterol medication?". */
export interface Part {
  /** The question itself, written out in full. */
  label: string
  fields: Field[]
}

export interface Question {
  id: number
  /** The question, or for cards with parts a short topic like "Cholesterol". */
  title: string
  fields: Field[]
  /** Separate questions on one card, each shown numbered under the topic title. */
  parts?: Part[]
  /** Shown under the title, e.g. to say the card is optional. Also shows the title on cards with parts. */
  description?: string
  /** Can be left blank: never blocks Next/Submit and isn't counted in "x of 20 answered". */
  optional?: boolean
}

const inParts = (...parts: Part[]) => ({ parts, fields: parts.flatMap((p) => p.fields) })

/** Fields followed by an "I don't know" checkbox that greys them out, instead of asking "Do you know…?" first. */
const orDontKnow = (option: string, fields: Field[], id = 'unknown'): Field[] => {
  const disabledIf: ShowIf = { field: id, anyOf: [option] }
  // The checkbox shows whenever the fields it covers do.
  const showIf = fields[0].showIf
  return [...fields.map((f) => ({ ...f, disabledIf })), { kind: 'checks', id, options: [option], showIf }]
}

export interface Section {
  title: string
  questions: Question[]
}

const notes = (placeholder: string, showIf?: ShowIf | ShowIf[]): Field => ({
  kind: 'text',
  id: 'notes',
  placeholder,
  multiline: true,
  notes: true,
  showIf,
})

const FREQUENCY = ['Never', 'Less than weekly', 'Weekly', '2–3 times a week', '4–6 times a week', 'Daily', '2+ times a day']

const diet = (id: string, label: string): Field => ({
  kind: 'slider',
  id,
  label,
  min: 0,
  max: FREQUENCY.length - 1,
  step: 1,
  labels: FREQUENCY,
  required: true,
})

const CONDITIONS = [
  'Heart disease',
  'Stroke',
  'Diabetes',
  'Cancer',
  'Kidney disease',
  'Chronic lung disease',
  'Chronic liver disease',
  'Significant mental illness',
  'Other',
]

/** "Is your mother still alive?", then her age now or her age when she died. */
const parent = (who: 'mother' | 'father'): Part => {
  const [her, she] = who === 'mother' ? ['Her', 'she'] : ['His', 'he']
  const status = `${who}Status`
  return {
    label: `Is your biological ${who} still alive?`,
    fields: [
      { kind: 'choice', id: status, options: ['Yes', 'No', "I don't know"], required: true },
      ...orDontKnow(
        `I don't know ${her.toLowerCase()} age`,
        [
          {
            kind: 'number',
            id: `${who}Age`,
            label: `${her} age now`,
            placeholder: 'e.g. 70',
            unit: 'years',
            min: 30,
            max: 120,
            required: true,
            showIf: { field: status, anyOf: ['Yes'] },
          },
        ],
        `${who}AgeUnknown`,
      ),
      ...orDontKnow(
        `I don't know how old ${she} was`,
        [
          {
            kind: 'number',
            id: `${who}DeathAge`,
            label: `${her} age when ${she} died`,
            placeholder: 'e.g. 75',
            unit: 'years',
            min: 0,
            max: 120,
            required: true,
            showIf: { field: status, anyOf: ['No'] },
          },
        ],
        `${who}DeathAgeUnknown`,
      ),
      {
        kind: 'text',
        id: `${who}Cause`,
        placeholder: `What did ${she} die of? (optional)`,
        notes: true,
        showIf: { field: status, anyOf: ['No'] },
      },
    ],
  }
}

export const SECTIONS: Section[] = [
  {
    title: 'About you',
    questions: [
      {
        id: 1,
        title: 'What is your date of birth?',
        fields: [{ kind: 'date', id: 'dob', label: 'Date of birth', placeholder: 'MM/DD/YYYY', minAge: 18, maxAge: 120, required: true }],
      },
      {
        id: 2,
        title: 'What was your sex assigned at birth?',
        fields: [{ kind: 'choice', id: 'sex', options: ['Female', 'Male'], required: true }],
      },
      {
        id: 3,
        title: 'Where you were born and where you live',
        ...inParts(
          {
            label: 'Which country were you born in?',
            fields: [{ kind: 'text', id: 'birthCountry', placeholder: 'e.g. Malaysia', required: true }],
          },
          {
            label: 'Which country and region do you live in now?',
            fields: [{ kind: 'text', id: 'location', placeholder: 'e.g. Auckland, New Zealand', required: true }],
          },
        ),
      },
    ],
  },
  {
    title: 'Health history',
    questions: [
      {
        id: 4,
        title: 'Smoking and vaping',
        ...inParts(
          {
            label: 'Do you smoke cigarettes?',
            fields: [
              { kind: 'choice', id: 'status', options: ['Never', 'I used to', 'Yes, I smoke now'], required: true },
              {
                kind: 'number',
                id: 'perDay',
                label: 'Cigarettes',
                placeholder: 'e.g. 10',
                unit: 'a day',
                min: 1,
                max: 100,
                required: true,
                showIf: { field: 'status', anyOf: ['I used to', 'Yes, I smoke now'] },
              },
              {
                kind: 'number',
                id: 'years',
                label: 'Years smoked',
                placeholder: 'e.g. 15',
                unit: 'years',
                min: 1,
                max: 90,
                required: true,
                showIf: { field: 'status', anyOf: ['I used to', 'Yes, I smoke now'] },
              },
              {
                kind: 'number',
                id: 'yearsSinceQuit',
                label: 'Years since you quit',
                placeholder: 'e.g. 5',
                unit: 'years',
                min: 0,
                max: 90,
                required: true,
                showIf: { field: 'status', anyOf: ['I used to'] },
              },
            ],
          },
          { label: 'Do you vape?', fields: [{ kind: 'choice', id: 'vape', options: ['Yes', 'No'], required: true }] },
        ),
      },
      {
        id: 5,
        title: 'Which long-term medical conditions have you been diagnosed with?',
        fields: [
          { kind: 'checks', id: 'conditions', options: [...CONDITIONS, 'None of these'], exclusive: ['None of these'], required: true },
          notes('Severity and treatment, if known (optional)', { field: 'conditions', anyOf: CONDITIONS }),
        ],
      },
      {
        id: 6,
        title: 'Blood pressure',
        ...inParts(
          {
            label: 'What is your usual blood pressure?',
            fields: orDontKnow("I don't know my blood pressure", [
              { kind: 'number', id: 'systolic', label: 'Top number', placeholder: 'e.g. 120', unit: 'mmHg', min: 60, max: 260, required: true },
              { kind: 'number', id: 'diastolic', label: 'Bottom number', placeholder: 'e.g. 80', unit: 'mmHg', min: 30, max: 160, required: true },
            ]),
          },
          { label: 'Do you take blood-pressure medication?', fields: [{ kind: 'choice', id: 'medication', options: ['Yes', 'No'], required: true }] },
        ),
      },
      {
        id: 7,
        title: 'Cholesterol',
        ...inParts(
          {
            label: 'What are your latest cholesterol results?',
            fields: orDontKnow("I don't know my results", [
              { kind: 'number', id: 'total', label: 'Total', placeholder: 'e.g. 5.2', unit: 'mmol/L', min: 1, max: 20, decimals: true, required: true },
              { kind: 'number', id: 'hdl', label: 'HDL (optional)', placeholder: 'e.g. 1.3', unit: 'mmol/L', min: 0.1, max: 5, decimals: true },
              { kind: 'number', id: 'ldl', label: 'LDL (optional)', placeholder: 'e.g. 3.1', unit: 'mmol/L', min: 0.1, max: 15, decimals: true },
            ]),
          },
          { label: 'Do you take cholesterol medication?', fields: [{ kind: 'choice', id: 'medication', options: ['Yes', 'No'], required: true }] },
        ),
      },
      {
        id: 8,
        title: 'Blood sugar',
        ...inParts(
          {
            label: 'What was your latest blood sugar test result?',
            fields: [
              { kind: 'choice', id: 'known', label: 'Which test was it?', options: ['HbA1c', 'Fasting glucose', "I don't know"], required: true },
              { kind: 'number', id: 'hba1c', label: 'HbA1c', placeholder: 'e.g. 38', unit: 'mmol/mol', min: 10, max: 200, required: true, showIf: { field: 'known', anyOf: ['HbA1c'] } },
              { kind: 'number', id: 'glucose', label: 'Fasting glucose', placeholder: 'e.g. 5.4', unit: 'mmol/L', min: 1, max: 40, decimals: true, required: true, showIf: { field: 'known', anyOf: ['Fasting glucose'] } },
            ],
          },
          { label: 'Do you take diabetes medication?', fields: [{ kind: 'choice', id: 'medication', options: ['Yes', 'No'], required: true }] },
        ),
      },
    ],
  },
  {
    title: 'Body & movement',
    questions: [
      {
        id: 9,
        title: 'What are your current height and weight?',
        fields: orDontKnow("I don't know my height and weight", [
          { kind: 'number', id: 'height', label: 'Height', placeholder: 'e.g. 175', unit: 'cm', min: 50, max: 250, required: true },
          { kind: 'number', id: 'weight', label: 'Weight', placeholder: 'e.g. 78', unit: 'kg', min: 20, max: 350, decimals: true, required: true },
        ]),
      },
      {
        id: 10,
        title: 'What is your waist measurement?',
        fields: orDontKnow("I don't know my waist measurement", [
          { kind: 'number', id: 'waist', label: 'Waist', placeholder: 'e.g. 88', unit: 'cm', min: 30, max: 250, required: true },
        ]),
      },
      {
        id: 11,
        title: 'How much physical activity do you do in a typical week?',
        fields: orDontKnow("I can't estimate this", [
          { kind: 'number', id: 'moderate', label: 'Moderate exercise, like brisk walking', placeholder: 'e.g. 150', unit: 'min a week', min: 0, max: 3000, required: true },
          { kind: 'number', id: 'vigorous', label: 'Hard exercise, like running or sport', placeholder: 'e.g. 60', unit: 'min a week', min: 0, max: 3000, required: true },
          { kind: 'slider', id: 'strength', label: 'Strength training, like weights', min: 0, max: 7, step: 1, unit: 'days', unitOne: 'day', required: true },
        ]),
      },
      {
        id: 12,
        title: 'Walking and everyday activity',
        ...inParts(
          { label: 'What is your usual walking pace?', fields: [{ kind: 'choice', id: 'pace', options: ['Slow', 'Average', 'Brisk', 'Unable to walk'], required: true }] },
          {
            label: 'Do you have difficulty with everyday physical activities?',
            fields: [
              { kind: 'choice', id: 'hasDifficulty', options: ['Yes', 'No'], required: true },
              {
                kind: 'checks',
                id: 'difficulty',
                label: 'Which ones?',
                options: ['Walking', 'Climbing stairs', 'Managing daily tasks'],
                required: true,
                showIf: { field: 'hasDifficulty', anyOf: ['Yes'] },
              },
            ],
          },
        ),
      },
    ],
  },
  {
    title: 'Daily habits',
    questions: [
      {
        id: 13,
        title: 'How often do you eat these foods?',
        fields: orDontKnow("I'm not sure", [
          diet('vegetables', 'Vegetables'),
          diet('fruit', 'Fruit'),
          diet('wholeGrains', 'Whole grains, like brown rice or oats'),
          diet('legumes', 'Beans, lentils or chickpeas'),
          diet('nuts', 'Nuts'),
          diet('processedMeat', 'Processed meat, like bacon or sausages'),
          diet('sugaryDrinks', 'Sugary drinks, like soft drinks'),
        ]),
      },
      {
        id: 14,
        title: 'Alcohol',
        ...inParts(
          {
            label: 'Do you drink alcohol?',
            fields: [
              { kind: 'choice', id: 'drinks', options: ['Yes', 'No'], required: true },
              {
                kind: 'number',
                id: 'perWeek',
                label: 'Drinks',
                placeholder: 'e.g. 6',
                unit: 'a week',
                min: 1,
                max: 200,
                required: true,
                showIf: { field: 'drinks', anyOf: ['Yes'] },
              },
              {
                kind: 'number',
                id: 'mostAtOnce',
                label: 'Most drinks at one time',
                placeholder: 'e.g. 4',
                unit: 'drinks',
                min: 1,
                max: 100,
                required: true,
                showIf: { field: 'drinks', anyOf: ['Yes'] },
              },
            ],
          },
          { label: 'Did you drink heavily in the past?', fields: [{ kind: 'choice', id: 'pastHeavy', options: ['Yes', 'No'], required: true }] },
        ),
      },
      {
        id: 15,
        title: 'Sleep',
        ...inParts(
          {
            label: 'How many hours do you usually sleep?',
            fields: [{ kind: 'slider', id: 'hours', label: 'Hours per night', min: 3, max: 12, step: 0.5, unit: 'hours', openEnded: true, required: true }],
          },
          {
            label: 'Have you been diagnosed with sleep apnoea?',
            fields: [{ kind: 'choice', id: 'apnoea', options: ['No', 'Yes, treated', 'Yes, untreated'], required: true }],
          },
        ),
      },
      {
        id: 16,
        title: 'How would you rate your overall health?',
        fields: [{ kind: 'choice', id: 'rating', options: ['Excellent', 'Very good', 'Good', 'Fair', 'Poor'], required: true }],
      },
    ],
  },
  {
    title: 'Family & life',
    questions: [
      {
        id: 17,
        title: 'Your parents',
        ...inParts(parent('mother'), parent('father')),
      },
      {
        id: 18,
        title: 'Did any close family members get a serious illness at a young age?',
        fields: [
          { kind: 'choice', id: 'earlyDisease', options: ['Yes', 'No', 'Not sure'], required: true },
          notes('Who, what illness, and how old they were (optional)', { field: 'earlyDisease', anyOf: ['Yes'] }),
        ],
      },
      {
        id: 19,
        title: 'Friends and support',
        ...inParts(
          {
            label: 'How often do you spend time with people you care about?',
            fields: [
              {
                kind: 'choice',
                id: 'contact',
                options: ['Less than monthly', 'Monthly', '2–3 times a month', 'Weekly', '2–3 times a week', 'Most days', 'Daily'],
                required: true,
              },
            ],
          },
          { label: 'How often do you feel lonely?', fields: [{ kind: 'choice', id: 'lonely', options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'], required: true }] },
          {
            label: 'Is there someone who can help you when you need it?',
            fields: [{ kind: 'choice', id: 'support', options: ['Always', 'Usually', 'Sometimes', 'Rarely'], required: true }],
          },
        ),
      },
      {
        id: 20,
        title: 'Can you usually afford the basics, like food, housing and medical care?',
        fields: [
          { kind: 'choice', id: 'afford', options: ['Always', 'Usually', 'Sometimes', 'Rarely'], required: true },
          notes('What gets in the way? (optional)', { field: 'afford', anyOf: ['Sometimes', 'Rarely'] }),
        ],
      },
      {
        // Not used for the estimate: gives the AI something personal to say in "Live it well".
        id: 21,
        title: 'About your life',
        description: 'Optional: helps make your summary personal.',
        optional: true,
        ...inParts(
          {
            label: 'What fills most of your days?',
            fields: [{ kind: 'text', id: 'days', placeholder: 'e.g. I work as a nurse and look after my two kids', multiline: true }],
          },
          {
            label: 'What do you enjoy doing in your free time?',
            fields: [{ kind: 'text', id: 'enjoy', placeholder: 'e.g. gardening, football, cooking for friends', multiline: true }],
          },
          {
            label: "Is there something you'd love to do in the years ahead?",
            fields: [{ kind: 'text', id: 'hopes', placeholder: 'e.g. travel to Japan, learn guitar, see my grandkids grow up', multiline: true }],
          },
          {
            label: 'What gives your life purpose, or what goal matters most to you?',
            fields: [{ kind: 'text', id: 'purpose', placeholder: 'e.g. my family, my faith, helping others, starting my own business', multiline: true }],
          },
        ),
      },
    ],
  },
]

export const QUESTIONS: Question[] = SECTIONS.flatMap((s) => s.questions)

/** The questions counted in "x of 20 answered": optional ones are left out. */
export const COUNTED_QUESTIONS = QUESTIONS.filter((q) => !q.optional)
