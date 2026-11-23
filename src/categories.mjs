import fs from 'node:fs';
import path from 'node:path';

const sectionNames = ['projects', 'tech', 'hobby'];
const reservedIds = new Set(['all', 'uncategorized']);
const kebab = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function sectionForType(type) {
  if (type === 'project') return 'projects';
  if (type === 'study') return 'tech';
  if (type === 'review') return 'hobby';
  return null;
}

export function loadCategories(root) {
  const file = path.join(root, 'content/categories.json');
  if (!fs.existsSync(file)) return { projects: [], tech: [], hobby: [] };
  if (fs.lstatSync(file).isSymbolicLink()) throw new Error('content/categories.json: 심볼릭 링크는 허용하지 않습니다.');
  let config;
  try { config = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (cause) { throw new Error(`content/categories.json: JSON을 읽을 수 없습니다 (${cause.message}).`); }
  if (!object(config) || config.version !== 1 || !object(config.sections)
    || Object.keys(config).some(key => !['version', 'sections'].includes(key))
    || Object.keys(config.sections).some(key => !sectionNames.includes(key))) {
    throw new Error('content/categories.json: version: 1과 projects·tech·hobby sections가 필요합니다.');
  }
  for (const section of sectionNames) {
    const items = config.sections[section];
    if (!Array.isArray(items)) throw new Error(`content/categories.json: ${section}는 카테고리 배열이어야 합니다.`);
    const ids = new Set();
    const labels = new Set();
    for (const item of items) {
      if (!object(item) || Object.keys(item).some(key => !['id', 'label'].includes(key))
        || !kebab(item.id) || reservedIds.has(item.id) || ids.has(item.id)) {
        throw new Error(`content/categories.json: ${section} 카테고리 id는 중복 없는 kebab-case여야 하며 all·uncategorized는 사용할 수 없습니다.`);
      }
      if (typeof item.label !== 'string' || !item.label.trim() || item.label !== item.label.trim()
        || /[\u0000-\u001f\u007f]/.test(item.label) || labels.has(item.label)) {
        throw new Error(`content/categories.json: ${section} 카테고리 label은 공백 없이 시작하고 끝나는 중복 없는 이름이어야 합니다.`);
      }
      ids.add(item.id);
      labels.add(item.label);
    }
  }
  return config.sections;
}

export function validatePageCategory(meta, sections, label = '문서') {
  if (!Object.hasOwn(meta, 'category')) return;
  const section = sectionForType(meta.type);
  if (!section) throw new Error(`${label}: category는 프로젝트·기술 공부·감상문에만 지정할 수 있습니다.`);
  if (!kebab(meta.category) || reservedIds.has(meta.category)) {
    throw new Error(`${label}: category는 등록된 카테고리 id 문자열이어야 합니다.`);
  }
  if (!sections[section].some(item => item.id === meta.category)) {
    throw new Error(`${label}: ${section}에 등록되지 않은 category입니다 (${meta.category}).`);
  }
}
