const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const RUNS_DIR = path.join(__dirname, '../../temp_runs');
if (!fs.existsSync(RUNS_DIR)) {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
}

/**
 * Execute code in Java, Python, or PHP
 * @param {string} language - 'java', 'python', 'php'
 * @param {string} code - Source code
 * @param {string} input - Stdin input
 * @param {number} timeoutMs - Max execution time
 * @returns {Promise<{ stdout: string, stderr: string, executionTimeMs: number, exitCode: number, error?: string }>}
 */
function runCode(language, code, input = '', timeoutMs = 5000) {
  return new Promise((resolve) => {
    const runId = uuidv4();
    const runDir = path.join(RUNS_DIR, `run_${runId}`);
    fs.mkdirSync(runDir, { recursive: true });

    let command = '';
    let args = [];
    let fileName = '';
    let compileCommand = null;

    const lang = (language || '').toLowerCase().trim();

    if (lang === 'java') {
      // Find class name if custom, default to Solution
      const match = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      const className = match ? match[1] : 'Solution';
      fileName = `${className}.java`;
      const filePath = path.join(runDir, fileName);
      fs.writeFileSync(filePath, code, 'utf8');

      // Compile first
      try {
        const compileStart = Date.now();
        execSync(`javac ${fileName}`, { cwd: runDir, timeout: timeoutMs, stdio: 'pipe' });
      } catch (err) {
        const stderr = err.stderr ? err.stderr.toString('utf8') : (err.message || 'Compilation Error');
        cleanup(runDir);
        return resolve({
          stdout: '',
          stderr,
          executionTimeMs: 0,
          exitCode: 1,
          error: 'Compilation Error: ' + stderr
        });
      }

      command = 'java';
      args = ['-Xmx128m', className];
    } else if (lang === 'python' || lang === 'python3') {
      fileName = 'solution.py';
      const filePath = path.join(runDir, fileName);
      fs.writeFileSync(filePath, code, 'utf8');
      command = 'python3';
      args = ['-u', fileName];
    } else if (lang === 'php') {
      fileName = 'solution.php';
      const filePath = path.join(runDir, fileName);
      fs.writeFileSync(filePath, code, 'utf8');
      command = 'php';
      args = [fileName];
    } else {
      cleanup(runDir);
      return resolve({
        stdout: '',
        stderr: `Unsupported language: ${language}`,
        executionTimeMs: 0,
        exitCode: 1,
        error: `Unsupported language: ${language}`
      });
    }

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let isTimedOut = false;

    const child = spawn(command, args, {
      cwd: runDir,
      env: { ...process.env, LANG: 'en_US.UTF-8' }
    });

    const timer = setTimeout(() => {
      isTimedOut = true;
      try {
        child.kill('SIGKILL');
      } catch (e) {}
    }, timeoutMs);

    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    } else if (child.stdin) {
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString('utf8');
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString('utf8');
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;
      cleanup(runDir);
      resolve({
        stdout,
        stderr: err.message || 'Execution failed',
        executionTimeMs,
        exitCode: 1,
        error: err.message
      });
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;
      cleanup(runDir);

      if (isTimedOut) {
        return resolve({
          stdout,
          stderr: 'Time Limit Exceeded (5s)',
          executionTimeMs,
          exitCode: 124,
          error: 'Time Limit Exceeded'
        });
      }

      resolve({
        stdout,
        stderr,
        executionTimeMs,
        exitCode: exitCode ?? 0,
        error: exitCode !== 0 && stderr ? stderr : undefined
      });
    });
  });
}

function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {}
}

function normalizeOutput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\r\n/g, '\n')
    .trim();
}

/**
 * Runs code against an array of test cases
 */
async function evaluateProblem(language, code, testCases = []) {
  const results = [];
  let allPassed = true;
  let totalTimeMs = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const input = tc.input || '';
    const expected = normalizeOutput(tc.expected_output || '');
    
    const runResult = await runCode(language, code, input, 4000);
    totalTimeMs += runResult.executionTimeMs;

    const actual = normalizeOutput(runResult.stdout);
    const passed = runResult.exitCode === 0 && actual === expected;

    if (!passed) {
      allPassed = false;
    }

    results.push({
      test_case_index: i + 1,
      input: tc.is_hidden ? '[Hidden Test Case Input]' : input,
      expected_output: tc.is_hidden && !passed ? '[Hidden Expected Output]' : expected,
      actual_output: runResult.stdout,
      stderr: runResult.stderr,
      passed,
      execution_time_ms: runResult.executionTimeMs,
      error: runResult.error,
      is_hidden: !!tc.is_hidden
    });

    // If compile error or fatal runtime error on first case, stop early
    if (runResult.error && (runResult.error.startsWith('Compilation Error') || runResult.error === 'Time Limit Exceeded')) {
      break;
    }
  }

  return {
    allPassed: testCases.length > 0 ? allPassed : true,
    results,
    totalTimeMs: Math.round(totalTimeMs / (results.length || 1)),
    passedCount: results.filter(r => r.passed).length,
    totalCount: testCases.length
  };
}

module.exports = {
  runCode,
  evaluateProblem,
  normalizeOutput
};
