import type { DocumentType } from '../../shared/editor';
import { HttpError } from '../errors';

const WORD_EXTS = new Set(['doc', 'docm', 'docx', 'dot', 'dotm', 'dotx', 'epub', 'fb2', 'fodt', 'htm', 'html', 'mht', 'odt', 'ott', 'rtf', 'txt', 'wps', 'xml']);
const CELL_EXTS = new Set(['csv', 'fods', 'ods', 'ots', 'xls', 'xlsm', 'xlsx', 'xlt', 'xltm', 'xltx']);
const SLIDE_EXTS = new Set(['fodp', 'odp', 'otp', 'pot', 'potm', 'potx', 'pps', 'ppsm', 'ppsx', 'ppt', 'pptm', 'pptx']);

export function getDocumentType(fileType: string): DocumentType {
  const ext = fileType.toLowerCase();
  if (WORD_EXTS.has(ext)) return 'word';
  if (CELL_EXTS.has(ext)) return 'cell';
  if (SLIDE_EXTS.has(ext)) return 'slide';
  throw new HttpError(415, 'unsupported_file_type', `Unsupported file type: ${fileType}`);
}
