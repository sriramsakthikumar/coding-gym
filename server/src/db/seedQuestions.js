const path = require('path');
const fs = require('fs');
const db = require('./index');

function seed() {
  console.log('🌱 Starting Database Seeding...');

  const jsonPath = path.join(__dirname, 'questions_data.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('Generating questions data first...');
    require('./generateAll300Questions');
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);

  const insertProblem = db.prepare(`
    INSERT INTO problems (
      id, language, level, topic, difficulty, title, description,
      starter_code, solution_code, examples, test_cases, hints, explanation, order_index
    ) VALUES (
      @id, @language, @level, @topic, @difficulty, @title, @description,
      @starter_code, @solution_code, @examples, @test_cases, @hints, @explanation, @order_index
    )
    ON CONFLICT(id) DO UPDATE SET
      language = excluded.language,
      level = excluded.level,
      topic = excluded.topic,
      difficulty = excluded.difficulty,
      title = excluded.title,
      description = excluded.description,
      starter_code = excluded.starter_code,
      solution_code = excluded.solution_code,
      examples = excluded.examples,
      test_cases = excluded.test_cases,
      hints = excluded.hints,
      explanation = excluded.explanation,
      order_index = excluded.order_index
  `);

  const initProgress = db.prepare(`
    INSERT INTO user_progress (problem_id, status, draft_code)
    VALUES (?, 'unsolved', ?)
    ON CONFLICT(problem_id) DO UPDATE SET
      draft_code = excluded.draft_code
  `);

  const allQuestions = [...data.java, ...data.python, ...data.php];
  
  const insertMany = db.transaction((questions) => {
    let count = 0;
    for (const q of questions) {
      insertProblem.run(q);
      initProgress.run(q.id, q.starter_code);
      count++;
    }
    return count;
  });

  const total = insertMany(allQuestions);
  console.log(`✅ Successfully seeded ${total} questions (Java: ${data.java.length}, Python: ${data.python.length}, PHP: ${data.php.length})`);
}

if (require.main === module) {
  seed();
}

module.exports = seed;
