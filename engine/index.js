// One import for the app: loads every engine module (each attaches its functions to DS) and returns DS.
import { DS } from './ds.js';
import './words-en.js';
import './freq-en.js';
import './freq-big.js';
import './vocab.js';
import './ability.js';
import './cloze-en.js';
import './placement.js';
import './review.js';
import './export.js';
import './book.js';
import './quiz.js';
import './hash.js';

export { DS };
export default DS;
