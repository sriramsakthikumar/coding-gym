const express = require('express');
const router = express.Router();
const db = require('../db');

const ROADMAPS_DATA = {
  java: {
    title: "Java Backend Engineer Roadmap",
    description: "From core syntax and Object-Oriented Principles to high-throughput concurrency and microservice architecture.",
    stages: [
      {
        id: "java-core",
        title: "1. Core Syntax & Primitive Data",
        description: "Variables, primitive types, operators, bitwise logic, and console I/O.",
        topics: ["Variables", "Data Types", "Operators", "Input Output", "Conditions"],
        recommendedProblemIds: ["java-001", "java-002", "java-003", "java-004", "java-005"]
      },
      {
        id: "java-control",
        title: "2. Control Flow & Data Structures",
        description: "Loops, arrays manipulation, string algorithms, and functions.",
        topics: ["Loops", "Functions", "Arrays", "Strings"],
        recommendedProblemIds: ["java-006", "java-007", "java-008", "java-009", "java-010"]
      },
      {
        id: "java-oop",
        title: "3. Object-Oriented Architecture & Clean Code",
        description: "Polymorphism, inheritance, encapsulation, interfaces, custom exceptions, and stream collections.",
        topics: ["OOP", "Exception Handling", "Collections", "File I/O"],
        recommendedProblemIds: ["java-036", "java-037", "java-038", "java-039", "java-040"]
      },
      {
        id: "java-advanced",
        title: "4. Advanced Patterns & Concurrency",
        description: "Design patterns (Singleton, Factory, Observer, Builder), multithreading, and algorithmic optimizations.",
        topics: ["Design Patterns", "Algorithms", "Multithreading", "Data Structures"],
        recommendedProblemIds: ["java-071", "java-072", "java-073", "java-074", "java-075"]
      }
    ]
  },
  python: {
    title: "Python Full-Stack & Systems Developer Roadmap",
    description: "From Pythonic idioms and data processing to scalable async APIs and algorithmic systems.",
    stages: [
      {
        id: "py-foundations",
        title: "1. Python Foundations & Data Types",
        description: "Dynamic typing, slice operations, list comprehensions, and control structures.",
        topics: ["Variables", "Data Types", "Operators", "Input Output", "Conditions"],
        recommendedProblemIds: ["py-001", "py-002", "py-003", "py-004", "py-005"]
      },
      {
        id: "py-structures",
        title: "2. Iteration, Functions & Sequences",
        description: "Dictionaries, sets, lambda expressions, generator pipelines, and custom functions.",
        topics: ["Loops", "Functions", "Arrays", "Strings"],
        recommendedProblemIds: ["py-006", "py-007", "py-008", "py-009", "py-010"]
      },
      {
        id: "py-oop-data",
        title: "3. OOP & Data Processing Pipelines",
        description: "Class decorators, context managers, CSV parsing, log analysis, and custom exceptions.",
        topics: ["OOP", "Data Structures", "File Handling", "Automation Scripts"],
        recommendedProblemIds: ["py-036", "py-037", "py-038", "py-039", "py-040"]
      },
      {
        id: "py-advanced",
        title: "4. Scalable Systems & High Performance",
        description: "Rate limiting token buckets, Trie prefix search, memoization caching, and API integration.",
        topics: ["Algorithms", "API Integration", "Data Cleaning", "Automation Scripts"],
        recommendedProblemIds: ["py-071", "py-072", "py-073", "py-074", "py-075"]
      }
    ]
  },
  php: {
    title: "Modern PHP & Enterprise Web Roadmap",
    description: "From type-safe PHP 8+ and superglobals to PSR architectural patterns, DI containers, and security.",
    stages: [
      {
        id: "php-syntax",
        title: "1. PHP 8+ Modern Foundations",
        description: "Strict types, null coalescing, match expressions, array destructuring, and string parsing.",
        topics: ["Variables", "Data Types", "Operators", "Input Output", "Conditions"],
        recommendedProblemIds: ["php-001", "php-002", "php-003", "php-004", "php-005"]
      },
      {
        id: "php-web-core",
        title: "2. Web Forms, Arrays & Sanitization",
        description: "Form data validation, XSS escaping, password hashing, and associative array transforms.",
        topics: ["Loops", "Functions", "Arrays", "Strings"],
        recommendedProblemIds: ["php-006", "php-007", "php-008", "php-009", "php-010"]
      },
      {
        id: "php-oop-patterns",
        title: "3. OOP, Traits & Middleware",
        description: "Interfaces, abstract repositories, session flash managers, and file handling.",
        topics: ["OOP", "Design Patterns", "Security", "Database Queries"],
        recommendedProblemIds: ["php-036", "php-037", "php-038", "php-039", "php-040"]
      },
      {
        id: "php-advanced",
        title: "4. Micro-framework Architecture & PSR Standards",
        description: "PSR-11 Dependency Injection, regex routing engine, PDO prepared transactions, and CSRF protection.",
        topics: ["Mini CMS Features", "Design Patterns", "Performance Optimization", "Regex Parsing"],
        recommendedProblemIds: ["php-071", "php-072", "php-073", "php-074", "php-075"]
      }
    ]
  }
};

router.get('/:language', (req, res) => {
  try {
    const { language } = req.params;
    const roadmap = ROADMAPS_DATA[language.toLowerCase()];
    if (!roadmap) {
      return res.status(404).json({ success: false, error: 'Roadmap not found for language' });
    }

    // Enrich roadmap with user completion stats per stage
    const enrichedStages = roadmap.stages.map(stage => {
      const placeholders = stage.recommendedProblemIds.map(() => '?').join(',');
      const problems = db.prepare(`
        SELECT p.id, p.title, p.difficulty, up.status as user_status
        FROM problems p
        LEFT JOIN user_progress up ON p.id = up.problem_id
        WHERE p.id IN (${placeholders})
      `).all(...stage.recommendedProblemIds);

      const solvedCount = problems.filter(p => p.user_status === 'solved').length;
      return {
        ...stage,
        problems,
        totalProblems: problems.length,
        solvedCount,
        completionPct: problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: {
        language: language.toLowerCase(),
        title: roadmap.title,
        description: roadmap.description,
        stages: enrichedStages
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
