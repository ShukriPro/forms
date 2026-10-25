import type { Answers } from '../lib/answers'
import { answerTexts } from '../lib/answers'

/** The "Your Life in Perspective" prompt, with each numbered question's "Answer:" filled in from the form. */
export function buildPrompt(answers: Answers) {
  const answer = answerTexts(answers)
  return `Use my answers below to produce a short “Your Life in Perspective” summary.

  
ESTIMATION RULES

- Always give an estimate when my age, sex, and the country I live in are known. These are the only answers the estimate needs.
- Base it on the official period life table for the country I live in now and my sex: from its national statistics office, or the WHO or UN World Population Prospects tables. If you can browse, look up the latest one. If you can't, use the most recent one you know and name it with its year.
- Estimate life expectancy conditional on having already reached my current age. Do not simply use life expectancy at birth.
- Identify a life-table estimate as population-based, rather than a personalized medical prediction.
- Use my health and lifestyle answers to identify useful health priorities. Only adjust the numerical estimate if an appropriate validated prediction model supports those adjustments.
- Do not add or subtract arbitrary years for individual habits.
- Do not claim to predict my exact age at death.
- My birth country is background only: do not change the estimate because of it.
- Show “Unavailable” only if my age, sex, or the country I live in is missing or unclear. Never because a source couldn't be checked online.
- Treat “I don’t know,” blank answers, and “Prefer not to answer” as missing information, not healthy results.
- Do not diagnose conditions or recommend changing prescribed medication.

CALCULATIONS

Calculate these from the life-table estimate:

Estimated total lifespan = current age + estimated remaining years.

Estimated years ahead = estimated total lifespan − current age.

Life lived so far (%) = current age ÷ estimated total lifespan × 100.

Round the percentage to a whole number. Avoid false precision in the life-expectancy estimate.

The percentage compares my age with the estimate; it is not a known fraction of my actual life.

Weekends ahead = estimated years ahead × 52, rounded to the nearest hundred.

MY ANSWERS

1. How old are you?
Answer: ${answer[1]}

2. What was your sex assigned at birth?
Answer: ${answer[2]}

3. Which country were you born in, and which country and region do you live in now?
Answer: ${answer[3]}

4. What is your smoking history?
Include never/former/current, cigarettes per day, years smoked, and when you quit. Mention vaping separately.
Answer: ${answer[4]}

5. Which long-term medical conditions have you been diagnosed with?
Include heart disease, stroke, diabetes, cancer, kidney disease, chronic lung or liver disease, significant mental illness, or other conditions. Include severity and treatment if known.
Answer: ${answer[5]}

6. What is your usual blood pressure, and do you take blood-pressure medication?
Include both numbers, such as 120/80 mmHg, and measurement date if known.
Answer: ${answer[6]}

7. What are your latest cholesterol results, and do you take cholesterol medication?
Include total cholesterol, HDL and LDL if available, units, and test date.
Answer: ${answer[7]}

8. What is your latest HbA1c or fasting blood glucose result?
Include test type, result, units, date, and diabetes medication if applicable.
Answer: ${answer[8]}

9. What are your current height and weight?
Include units.
Answer: ${answer[9]}

10. What is your waist circumference?
Include units.
Answer: ${answer[10]}

11. How much physical activity do you do in a typical week?
Include minutes of moderate activity, minutes of vigorous activity, and days of strength training.
Answer: ${answer[11]}

12. What is your usual walking pace, and do you have difficulty with everyday physical activities?
Slow / Average / Brisk / Unable to walk.
Mention difficulty walking, climbing stairs, or managing daily tasks.
Answer: ${answer[12]}

13. What does your usual diet look like?
Include how often you eat vegetables, fruit, whole grains, legumes, nuts, processed meat, and sugary drinks.
Answer: ${answer[13]}

14. How much alcohol do you drink?
Include drinks per week, the largest amount on one occasion, and drink sizes. Mention previous heavy drinking if applicable.
Answer: ${answer[14]}

15. How many hours do you usually sleep, and do you have diagnosed sleep apnoea?
Mention whether any diagnosed sleep apnoea is treated.
Answer: ${answer[15]}

16. How would you rate your overall health?
Excellent / Very good / Good / Fair / Poor.
Answer: ${answer[16]}

17. How old are your biological parents, or how old were they when they died?
Record each parent separately. Include cause of death if known.
Answer: ${answer[17]}

18. Have close biological relatives developed major diseases unusually young?
Include the disease, relative, and age at diagnosis if known, especially for heart disease, stroke, and cancer.
Answer: ${answer[18]}

19. How socially connected and supported do you feel?
Include meaningful contact, feelings of loneliness, and whether someone can help when needed.
Answer: ${answer[19]}

20. Can you reliably afford basic necessities and access medical care and prescribed treatment?
Always / Usually / Sometimes / Rarely.
Mention relevant barriers if comfortable.
Answer: ${answer[20]}

ABOUT MY LIFE

These answers are not used for the estimate. Use them to make the summary feel personal to me. If they say “Not answered”, keep those lines general.
Answer: ${answer[21]}


# OUTPUT RULES

- Respond in no more than 500 words.
- Use exactly the output format provided below.
- Do not add an introduction, extra sections, tables, detailed calculations, or lengthy explanations.
- Replace all bracketed placeholders with supported, personalized results.
- If a numerical result is unavailable, write only "Unavailable" after its label. Do not include words such as "Around" or "About" for unavailable results.
- Do not use emojis anywhere in the response.
- Use clean, professional Markdown formatting with clear headings, bold titles, and readable spacing.
- Write like a warm, caring, encouraging friend who genuinely wants the person to enjoy their life. Never sound like a doctor, medical report, or motivational speech.

## Emotional Tone

- **The most important goal is how the person feels after reading.** They should feel hopeful, valued, encouraged, and curious about what wonderful experiences their future might hold.
- Focus on the life still available to experience, not on time running out.
- Present the numbers as statistical context, while emphasizing opportunities for new memories, meaningful relationships, discoveries, adventures, and everyday happiness.
- Make the message feel like a celebration of being alive, while respecting that life can sometimes be difficult.
- Use positive, emotionally meaningful language that feels natural and sincere.
- Avoid generic motivational clichés, exaggerated excitement, forced happiness, or empty promises.
- Help the person see that their current circumstances do not define everything their future can become.
- Never imply that someone has wasted their life, fallen behind, or must achieve extraordinary things to have a meaningful future.
- Remind the person that happiness can come from simple moments, meaningful connections, new experiences, and things they haven't discovered yet.

## Personalization Rules

- Base all personalized content on the person's actual answers, including their age, interests, lifestyle, health, relationships, dreams, and personal circumstances when available.
- Never invent personal details, relationships, achievements, medical conditions, or interests.
- Name one genuine strength from their answers and help them appreciate something positive about themselves.
- Give only one small, realistic health step, expressed gently and positively.
- Adapt suggestions to the person's abilities, circumstances, resources, and interests.
- If personal information is limited, offer relatable, achievable possibilities rather than pretending to know the person.
- Avoid repeatedly mentioning the same interest across multiple bucket-list goals unless each recommendation offers a genuinely different experience.

## Bucket List Rules

- Generate **exactly 10 unique, personalized bucket-list goals** representing meaningful things the person could achieve or experience during their lifetime.
- Make the goals feel exciting, memorable, emotionally meaningful, and worth looking forward to.
- Each goal must be specific, realistic, and connected to the person's answers whenever possible.
- Include a thoughtful mix of adventures, travel, relationships, personal achievements, learning, creativity, new experiences, happiness, and meaningful contributions.
- Use these themes only as inspiration. Do not force a category that does not suit the person.
- Do not recommend the same generic goals to everyone.
- Avoid expensive, physically demanding, or unrealistic goals unless they genuinely suit the person's circumstances.
- Make each goal feel like an exciting possibility rather than an obligation or deadline.
- Do not imply that completing the bucket list determines whether someone has lived a successful or worthwhile life.
- Make goal number 10 especially meaningful, hopeful, and personally relevant.
- Never pressure the person to complete everything before an estimated age.

## Bucket List Presentation Rules

- Use the exact heading **Your Personal Bucket List** without emojis or additional decorative text.
- Begin with one short, welcoming sentence introducing the personalized goals.
- Present exactly 10 goals in a clean, numbered list.
- Each goal must have a **short, specific, personalized title** describing an actual achievement or experience.
- Keep titles concise, ideally 4–8 words.
- Do not use generic category titles such as "An unforgettable adventure," "A dream worth pursuing," "A memory to treasure," or "Something exciting to learn."
- Use natural, meaningful titles such as "Explore New Zealand's South Island," "Launch Your First Profitable App," or "Create a Lasting Family Tradition" only when appropriate to the person's answers.
- Beneath each title, include one short sentence explaining why the experience could be memorable, enjoyable, or meaningful.
- On a separate line, include one simple, practical starting action beginning with **Start by:**.
- Keep each complete goal concise, preferably 20–30 words including its title and starting action.
- Avoid repeating the same sentence structures, emotional phrases, or recommendations.
- Use mature, polished, thoughtful language rather than exaggerated or overly enthusiastic expressions.
- Do not include emojis, hashtags, decorative symbols, or unnecessary subtitles.
- Prioritize clarity, readability, emotional relevance, and personalization.
- Make the final result feel like a thoughtfully curated personal life list, not an automatically generated motivational checklist.
- Keep all 10 goals within the overall 500-word response limit.

## Life Expectancy Accuracy

- Use a credible life table, actuarial model, or statistical source when available.
- Prefer an estimate conditional on the person's current age rather than life expectancy at birth, when appropriate data is available.
- Clearly distinguish population-based estimates from genuinely personalized estimates.
- Never invent an estimate, source, or calculation.
- Calculate the percentage of life lived and remaining years only when supported by the available estimate and age.
- Estimate weekends using approximately 52 weekends per remaining year and summers using approximately one per remaining year.
- Treat all remaining-time figures as illustrations based on a statistical estimate, not predictions of the person's actual remaining lifespan.
- Avoid negative remaining-life figures or presenting an estimated lifespan as a guaranteed endpoint.
- Briefly name and link the calculation source when available.
- Keep all numerical estimates accurate, realistic, and separate from emotional encouragement.
- If necessary information is missing, display "Unavailable" rather than guessing.

## Final Message Rules

- **Make "Live it well" the emotional highlight of the response.**
- Write one or two heartfelt sentences that help the person imagine a future worth experiencing.
- Connect the message to their interests, relationships, hopes, and values when known.
- Make the ending leave a feeling of possibility, appreciation, and excitement about life rather than sadness about mortality.
- Avoid judgment, frightening language, pressure, or promises of extra years.
- Keep the wording natural, personal, and sincere.

---

# OUTPUT FORMAT

## Your Life in Perspective

**Estimated life expectancy:** [Around X years of age, or Unavailable]

**Your age today:** [A years, or Unavailable]

**Life lived so far:** [About P% of the estimate, or Unavailable]

**Years ahead:** [Around R years, roughly W weekends and R more summers to enjoy, or Unavailable]

**What you're already doing well:** [Celebrate one genuine strength supported by the person's answers. Help them appreciate something positive about themselves without exaggeration.]

**One thing that could help:** [Suggest one small, achievable health step. Keep it friendly, encouraging, realistic, and free of pressure.]

---

## Your Personal Bucket List

[Write one short, warm introductory sentence explaining that these 10 goals are inspired by the person's interests, dreams, values, and circumstances. Make it personal, natural, and encouraging.]

1. **[Specific personalized goal title]**

   [One short sentence explaining why this experience or achievement could be meaningful.]

   **Start by:** [One simple, achievable action.]

2. **[Specific personalized goal title]**

   [One short sentence explaining why this experience or achievement could be meaningful.]

   **Start by:** [One simple, achievable action.]

3. **[Specific personalized goal title]**

   [One short sentence explaining why this experience or achievement could be meaningful.]

   **Start by:** [One simple, achievable action.]

4. **[Specific personalized goal title]**

   [One short sentence explaining why this experience or achievement could be meaningful.]

   **Start by:** [One simple, achievable action.]

5. **[Specific personalized goal title]**

   [One short sentence explaining why this experience or achievement could be meaningful.]

   **Start by:** [One simple, achievable action.]

6. **[Specific personalized goal title]**

   [One short sentence explaining why this experience or achievement could be meaningful.]

   **Start by:** [One simple, achievable action.]

7. **[Specific personalized goal title]**

   [One short sentence explaining why this experience or achievement could be meaningful.]

   **Start by:** [One simple, achievable action.]

8. **[Specific personalized goal title]**

   [One short sentence explaining why this experience or achievement could be meaningful.]

   **Start by:** [One simple, achievable action.]

9. **[Specific personalized goal title]**

   [One short sentence explaining why this experience or achievement could be meaningful.]

   **Start by:** [One simple, achievable action.]

10. **[Specific, deeply meaningful personal goal title]**

    [One short, heartfelt sentence explaining why this achievement or experience could be especially meaningful to this person.]

    **Start by:** [One simple, achievable action.]

**Your first step:** [Encourage the person to choose just one goal that excites them and take a small, enjoyable step toward making it happen. Avoid pressure or urgency.]

---

**Estimate basis:** [Briefly name and link the statistical source or model, specify whether population-based or personalized, or explain why unavailable.]

**Live it well:** [Write one or two beautiful, heartfelt, personally relevant sentences that inspire hope and excitement about life ahead. Help the person imagine meaningful connections, memories to create, places to discover, experiences to enjoy, and moments that could make life richer. Present these as possibilities, not promises. Make this the most emotionally uplifting part of the response.]

*A statistical estimate, not a deadline. Your story is still being written, with more life to explore, enjoy, and make your own. Your bucket list isn't about racing against time. It's about making room for the experiences and moments that matter to you.*

`
}
