import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Subject, Deadline, UserAccount } from '@/types';

interface DatabaseSchema {
  subjects: Subject[];
  deadlines: Deadline[];
  users: UserAccount[];
}

const ORIGINAL_DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const TMP_DB_PATH = path.join(os.tmpdir(), 'class_deadline_hub_db.json');

// Bộ nhớ đệm in-memory giúp hỗ trợ Vercel Serverless Function
let memoryCache: DatabaseSchema | null = null;

async function readDatabase(): Promise<DatabaseSchema> {
  if (memoryCache) {
    return memoryCache;
  }

  // Thử đọc từ /tmp nếu đã từng được ghi trên Serverless
  try {
    const tmpData = await fs.readFile(TMP_DB_PATH, 'utf-8');
    memoryCache = JSON.parse(tmpData) as DatabaseSchema;
    return memoryCache;
  } catch {
    // Chưa có file trong /tmp, chuyển sang đọc file gốc data/db.json
  }

  try {
    const rawData = await fs.readFile(ORIGINAL_DB_PATH, 'utf-8');
    memoryCache = JSON.parse(rawData) as DatabaseSchema;
    return memoryCache;
  } catch (error) {
    console.error('Error reading db.json:', error);
    throw new Error('Không thể đọc cơ sở dữ liệu JSON.');
  }
}

async function writeDatabase(data: DatabaseSchema): Promise<void> {
  memoryCache = data;

  // 1. Thử ghi vào đường dẫn gốc (hoạt động hoàn hảo ở Local & VPS)
  try {
    await fs.writeFile(ORIGINAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return;
  } catch (localWriteErr) {
    // 2. Nếu ở Vercel Serverless (Read-only file system EROFS), ghi sang thư mục /tmp
    try {
      await fs.writeFile(TMP_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (tmpErr) {
      console.warn('Vercel Serverless filesystem warning (kept in-memory):', tmpErr);
    }
  }
}

export async function getSubjects(): Promise<Subject[]> {
  const db = await readDatabase();
  return db.subjects;
}

export async function getSubjectBySlug(slug: string): Promise<Subject | null> {
  const db = await readDatabase();
  return db.subjects.find((s) => s.slug === slug) || null;
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  const db = await readDatabase();
  return db.subjects.find((s) => s.id === id) || null;
}

export async function getDeadlines(): Promise<Deadline[]> {
  const db = await readDatabase();
  // Sắp xếp hạn chót tăng dần theo ngày
  return db.deadlines.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

export async function getDeadlineById(id: string): Promise<Deadline | null> {
  const db = await readDatabase();
  return db.deadlines.find((d) => d.id === id) || null;
}

export async function getDeadlinesBySubjectId(subjectId: string): Promise<Deadline[]> {
  const db = await readDatabase();
  return db.deadlines
    .filter((d) => d.subjectId === subjectId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export async function getUserByEmail(email: string): Promise<UserAccount | null> {
  const db = await readDatabase();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getUserById(id: string): Promise<UserAccount | null> {
  const db = await readDatabase();
  return db.users.find((u) => u.id === id) || null;
}

export async function createDeadline(
  payload: Omit<Deadline, 'id' | 'createdAt' | 'completedBy'>
): Promise<Deadline> {
  const db = await readDatabase();
  
  const maxId = db.deadlines.reduce((max, d) => {
    const num = parseInt(d.id, 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  const newId = String(maxId + 1);

  const newDeadline: Deadline = {
    ...payload,
    id: newId,
    createdAt: new Date().toISOString(),
    completedBy: [],
  };

  db.deadlines.push(newDeadline);
  await writeDatabase(db);
  return newDeadline;
}

export async function deleteDeadline(id: string): Promise<boolean> {
  const db = await readDatabase();
  const initialLength = db.deadlines.length;
  db.deadlines = db.deadlines.filter((d) => d.id !== id);

  if (db.deadlines.length === initialLength) {
    return false;
  }

  await writeDatabase(db);
  return true;
}

export async function toggleDeadlineCompleted(
  deadlineId: string,
  userId: string
): Promise<Deadline | null> {
  const db = await readDatabase();
  const deadline = db.deadlines.find((d) => d.id === deadlineId);
  if (!deadline) return null;

  if (!deadline.completedBy) {
    deadline.completedBy = [];
  }

  const index = deadline.completedBy.indexOf(userId);
  if (index >= 0) {
    deadline.completedBy.splice(index, 1);
  } else {
    deadline.completedBy.push(userId);
  }

  await writeDatabase(db);
  return deadline;
}
