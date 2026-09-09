import { Student } from '../types';

/**
 * Parses raw text or CSV string into a list of Student objects.
 * Intelligently handles:
 * - CSV headers (e.g. 姓名, 座號, Name, Student)
 * - Comma, tab, semicolon or newline separators
 * - Quotes and spaces
 */
export function parseRosterInput(rawContent: string): { students: Student[]; warnings: string[] } {
  const warnings: string[] = [];
  if (!rawContent || !rawContent.trim()) {
    return { students: [], warnings: ['輸入內容為空'] };
  }

  const lines = rawContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return { students: [], warnings: ['未找到有效學生資料'] };
  }

  // Detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  } else if (firstLine.includes(',')) {
    delimiter = ',';
  }

  // Split line with simple CSV quote awareness
  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"+|"+$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"+|"+$/g, ''));
    return result;
  };

  const parsedRows = lines.map(splitLine);

  // Check if first row is a header
  const headerCandidates = ['姓名', '學生姓名', '名字', 'name', 'student', 'student name', '全名', '座號', '學號', 'id'];
  const firstRowLower = parsedRows[0].map(cell => cell.toLowerCase().trim());
  const isHeaderRow = firstRowLower.some(cell => headerCandidates.includes(cell));

  let nameColIdx = 0;
  let numberColIdx = -1;
  let startIndex = 0;

  if (isHeaderRow) {
    startIndex = 1;
    // Find column with "姓名" or "name"
    const foundNameIdx = firstRowLower.findIndex(cell => 
      cell.includes('姓名') || cell.includes('名字') || cell.includes('name') || cell.includes('student')
    );
    if (foundNameIdx !== -1) {
      nameColIdx = foundNameIdx;
    }

    // Find column with "座號" or "id"
    const foundNumIdx = firstRowLower.findIndex(cell => 
      cell.includes('座號') || cell.includes('學號') || cell.includes('號') || cell.includes('no') || cell.includes('id')
    );
    if (foundNumIdx !== -1 && foundNumIdx !== nameColIdx) {
      numberColIdx = foundNumIdx;
    }
  } else {
    // Check if the lines are just single names or multiple columns
    // If first column looks like a number and second column is text, e.g. "1, 張小明"
    if (parsedRows[0].length >= 2) {
      const col0IsNum = /^\d+$/.test(parsedRows[0][0]);
      const col1IsText = /[^\d]/.test(parsedRows[0][1]);
      if (col0IsNum && col1IsText) {
        numberColIdx = 0;
        nameColIdx = 1;
      }
    }
  }

  const students: Student[] = [];
  const seenNames = new Set<string>();

  for (let i = startIndex; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    if (row.length === 0) continue;

    const rawName = row[nameColIdx] || row[0];
    const cleanName = rawName ? rawName.trim() : '';

    if (!cleanName) continue;

    // Check if user pasted a single line of comma-separated names e.g. "王大明, 李小華, 張三"
    if (lines.length === 1 && cleanName.length > 0 && row.length > 1) {
      row.forEach((item, idx) => {
        const itemClean = item.trim();
        if (itemClean) {
          students.push({
            id: `student_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
            name: itemClean,
            number: idx + 1,
          });
        }
      });
      break;
    }

    const studentNumber = numberColIdx !== -1 && row[numberColIdx] ? row[numberColIdx].trim() : (students.length + 1);

    students.push({
      id: `student_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      number: studentNumber,
    });

    if (seenNames.has(cleanName)) {
      warnings.push(`名單中出現重複姓名：「${cleanName}」`);
    }
    seenNames.add(cleanName);
  }

  return { students, warnings };
}

/**
 * Generate CSV text from students array for export/download
 */
export function exportRosterToCSV(students: Student[]): string {
  const header = '座號,姓名\n';
  const rows = students.map((s, idx) => `"${s.number ?? (idx + 1)}","${s.name}"`).join('\n');
  return header + rows;
}
