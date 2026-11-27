// Placement cloze items (original, written for Looptions): one sentence with a single gap and four options.
// Six per level, A2..C2. `answer` is the index of the right option.
// The scale is grammar and usage, not rare words: every word in every item is common (a test enforces it), so a learner is
// never stopped by an unknown word, and the options are forms of the same word wherever the structure is what is tested.
// Levels follow the usual CEFR grammar progression: A2 simple tenses and comparatives, B1 first conditional, passive, used to,
// B2 third conditional, perfect forms, gerund patterns, C1 inversion and cleft sentences, C2 fine points of mood and comparison.
import { DS } from './ds.js';

  const c = (level, q, options, answer) => ({ level, q, options, answer });
  DS.CLOZE_EN = [
    c('A2', 'Yesterday we ___ to the beach and played football.', ['go', 'went', 'gone', 'goes'], 1),
    c('A2', 'My brother is ___ than me, so he can reach the top shelf.', ['tall', 'tallest', 'taller', 'more tall'], 2),
    c('A2', "Please don't call me now. I ___ dinner.", ['am cooking', 'cook', 'cooked', 'cooks'], 0),
    c('A2', 'I have never ___ fish for breakfast.', ['eat', 'ate', 'eating', 'eaten'], 3),
    c('A2', "We usually visit my grandmother ___ Sunday.", ['in', 'at', 'on', 'by'], 2),
    c('A2', 'How ___ water do you drink every day?', ['many', 'much', 'few', 'lot'], 1),
    c('B1', "If it ___ tomorrow, we will stay at home.", ['rains', 'will rain', 'rained', 'is raining'], 0),
    c('B1', 'The window ___ by the children yesterday.', ['broke', 'has broken', 'was broken', 'is breaking'], 2),
    c('B1', 'She told me that she ___ tired, so she went to bed early.', ['is', 'will be', 'has been', 'was'], 3),
    c('B1', 'I ___ play the piano when I was a child, but now I never do.', ['use to', 'used to', 'was used to', 'am used to'], 1),
    c('B1', 'The man ___ lives next door is a doctor.', ['which', 'whose', 'who', 'whom'], 2),
    c('B1', "I've been waiting here ___ two hours.", ['for', 'since', 'from', 'during'], 0),
    c('B2', 'If I ___ harder, I would have passed the exam.', ['studied', 'would study', 'have studied', 'had studied'], 3),
    c('B2', 'He denied ___ the money.', ['to take', 'taking', 'take', 'took'], 1),
    c('B2', 'By next June, they ___ married for twenty years.', ['will be', 'are', 'will have been', 'have been'], 2),
    c('B2', "You ___ have seen him at the station; he was at home all day.", ["mustn't", "can't", "shouldn't", "needn't"], 1),
    c('B2', "I'd rather you ___ smoke in here.", ["don't", "wouldn't", "won't", "didn't"], 3),
    c('B2', 'The report, ___ was published last week, caused a lot of discussion.', ['who', 'which', 'that', 'what'], 1),
    c('C1', 'Not only ___ late, but he also forgot the papers.', ['he was', 'did he', 'was he', 'he did'], 2),
    c('C1', 'Had I known about the problem, I ___ you immediately.', ['would tell', 'would have told', 'will tell', 'had told'], 1),
    c('C1', 'What I really need ___ a long holiday.', ['is', 'are', 'were', 'be'], 0),
    c('C1', 'No sooner had she sat down ___ the lights went out.', ['when', 'that', 'than', 'as'], 2),
    c('C1', "I'm not used to ___ spoken to like that.", ['be', 'been', 'am', 'being'], 3),
    c('C1', '___ the weather, the match went ahead as planned.', ['Although', 'Despite', 'However', 'Because'], 1),
    c('C2', 'Were it not ___ your help, we would never have finished.', ['of', 'for', 'with', 'by'], 1),
    c('C2', "It's high time we ___ a decision about this.", ['make', 'will make', 'are making', 'made'], 3),
    c('C2', 'He spoke as if he ___ the owner of the place.', ['is', 'has been', 'were', 'will be'], 2),
    c('C2', 'The more she thought about it, ___ she liked the idea.', ['the less', 'less', 'the least', 'least'], 0),
    c('C2', "I'd sooner stay at home ___ go out in this weather.", ['to', 'than', 'as', 'rather'], 1),
    c('C2', 'Little ___ they know that the plan had already failed.', ['do', 'were', 'did', 'had'], 2),
  ];
export default DS;
