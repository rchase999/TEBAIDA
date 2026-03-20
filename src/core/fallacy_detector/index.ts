import type { DetectedFallacy } from '../../types';

/**
 * A single fallacy pattern definition.
 */
interface FallacyPattern {
  type: string;
  name: string;
  description: string;
  severity: DetectedFallacy['severity'];
  /** Regular expressions that strongly indicate this fallacy. */
  regexPatterns: RegExp[];
  /** Keyword / phrase triggers that suggest this fallacy. Multiple must match to trigger. */
  keywordGroups: string[][];
  /** Minimum keyword groups that must match to flag. */
  keywordThreshold: number;
}

/**
 * All supported fallacy patterns.
 */
const FALLACY_PATTERNS: FallacyPattern[] = [
  {
    type: 'ad_hominem',
    name: 'Ad Hominem',
    description:
      'Attacking the person making the argument rather than the argument itself.',
    severity: 'high',
    regexPatterns: [
      /you(?:'re| are) (?:just |merely |obviously |clearly )?(?:a |an )?(?:idiot|fool|ignorant|stupid|moron|incompetent|liar|hypocrite|dishonest)/i,
      /(?:someone|anyone|person|people) (?:like you|of your|with your)/i,
      /you (?:clearly |obviously )?(?:don't|do not|cannot|can't) understand/i,
      /(?:your|you're|you are) (?:too |so )?(?:biased|prejudiced|naive|uneducated|uninformed|unqualified)/i,
      /what (?:would|do|can) you know about/i,
      /consider the source/i,
      /of course (?:you|they) would say that/i,
    ],
    keywordGroups: [
      ['attack', 'character', 'person'],
      ['credibility', 'question', 'motive'],
      ['unqualified', 'speak', 'topic'],
    ],
    keywordThreshold: 1,
  },

  {
    type: 'straw_man',
    name: 'Straw Man',
    description:
      'Misrepresenting an opponent\'s argument to make it easier to attack.',
    severity: 'high',
    regexPatterns: [
      /so (?:what )?you(?:'re| are) (?:really |basically |essentially )?saying (?:is |that )/i,
      /(?:your|the) argument (?:is |amounts to |boils down to )(?:basically |essentially |really |just )/i,
      /you (?:seem to )?(?:believe|think|want|claim) that (?:we should |everyone should |all |every)/i,
      /in other words,? you(?:'re| are) (?:advocating|suggesting|proposing) (?:that )?(?:we |everyone )/i,
      /if we follow your logic,? then/i,
      /you(?:'re| are) essentially arguing (?:for|that)/i,
    ],
    keywordGroups: [
      ['misrepresent', 'argument', 'position'],
      ['distort', 'claim', 'said'],
      ['never said', 'not what', 'that\'s not'],
    ],
    keywordThreshold: 1,
  },

  {
    type: 'false_dichotomy',
    name: 'False Dichotomy',
    description:
      'Presenting only two options when more alternatives exist.',
    severity: 'medium',
    regexPatterns: [
      /(?:either|it's either) .{5,80} or .{5,80}(?:\.|!|$)/i,
      /you(?:'re| are|'ve| have) (?:only |just )?(?:got )?two (?:choices|options|alternatives)/i,
      /there (?:are|is) (?:only |just )?two (?:options|choices|paths|ways|possibilities)/i,
      /you (?:can )?either .{5,60} or you (?:can )?/i,
      /it's (?:either|a choice between) .{5,60} or /i,
      /(?:you're|we're|they're) either (?:with us|for|part of) or (?:against|not)/i,
      /if you(?:'re| are) not .{3,40},? (?:then )?you(?:'re| are| must be)/i,
    ],
    keywordGroups: [
      ['only', 'two', 'options'],
      ['either', 'or', 'nothing'],
      ['black', 'white', 'no middle'],
      ['binary', 'choice', 'false'],
    ],
    keywordThreshold: 1,
  },

  {
    type: 'appeal_to_authority',
    name: 'Appeal to Authority',
    description:
      'Using an authority figure\'s opinion as evidence, especially outside their expertise.',
    severity: 'low',
    regexPatterns: [
      /(?:even )?(?:dr\.?|professor|expert|scientist|economist|nobel (?:prize )?(?:laureate|winner)) .{1,40} (?:said|says|stated|argued|believes|agrees|confirmed)/i,
      /according to (?:the )?(?:renowned|famous|well-known|leading|top|prominent|distinguished) /i,
      /(?:as )?(?:a |an )?(?:leading|top|prominent|renowned|famous) (?:expert|authority|scientist|researcher|professor) (?:has |once )?(?:said|stated|noted|argued|pointed out)/i,
      /(?:if )?(?:even )?(?:einstein|hawking|chomsky|dawkins|elon musk|bill gates|steve jobs) (?:said|says|thinks|believes|agrees)/i,
      /\d+(?:,\d+)? (?:experts|scientists|doctors|researchers|professors|economists) (?:agree|say|believe|have confirmed|support)/i,
    ],
    keywordGroups: [
      ['authority', 'expert', 'said'],
      ['famous', 'person', 'agrees'],
      ['appeal', 'credentials', 'opinion'],
    ],
    keywordThreshold: 1,
  },

  {
    type: 'slippery_slope',
    name: 'Slippery Slope',
    description:
      'Arguing that one event will inevitably lead to a chain of negative consequences without justification.',
    severity: 'medium',
    regexPatterns: [
      /if we (?:allow|let|permit|accept|start) .{5,60},? (?:then |next |soon |before (?:long|you know it) |eventually |it(?:'s| is) only a matter of time )/i,
      /(?:this |that |it )?(?:will |would |could )(?:inevitably |eventually |ultimately |necessarily )?lead to/i,
      /(?:where|when) (?:does|will|would) it (?:end|stop)/i,
      /(?:the )?(?:next|logical) step (?:is|will be|would be) /i,
      /open(?:ing|s)? the (?:flood ?gates|door|pandora)/i,
      /(?:thin|wrong) end of the wedge/i,
      /today .{5,40},? tomorrow .{5,40}/i,
      /first .{5,40},? then .{5,40},? (?:then |and (?:then |eventually |before you know it ))/i,
    ],
    keywordGroups: [
      ['lead', 'eventually', 'inevitable'],
      ['slippery', 'slope', 'chain'],
      ['domino', 'effect', 'cascade'],
      ['floodgates', 'open', 'allow'],
    ],
    keywordThreshold: 1,
  },

  {
    type: 'red_herring',
    name: 'Red Herring',
    description:
      'Introducing an irrelevant topic to divert attention from the original issue.',
    severity: 'medium',
    regexPatterns: [
      /(?:but )?(?:what about|how about|let(?:'s| us) (?:talk|think|focus) (?:about|on)|the real (?:issue|question|problem) (?:is|here is))/i,
      /(?:that's |this is )?(?:beside|besides) the point/i,
      /(?:instead|rather),? (?:let's|we should|I'd like to) (?:talk|discuss|consider|focus|look at)/i,
      /(?:you're|they're|we're) (?:ignoring|avoiding|missing|overlooking) the (?:real|bigger|actual|main|larger|true|central)/i,
      /(?:more|most) import(?:ant|antly),? (?:what about|we should|let's|consider|the fact that)/i,
    ],
    keywordGroups: [
      ['irrelevant', 'distract', 'divert'],
      ['off topic', 'beside the point', 'nothing to do'],
      ['real issue', 'actual problem', 'what matters'],
    ],
    keywordThreshold: 1,
  },

  {
    type: 'tu_quoque',
    name: 'Tu Quoque (You Too)',
    description:
      'Deflecting criticism by pointing out that the accuser is guilty of the same thing.',
    severity: 'medium',
    regexPatterns: [
      /(?:but |and )?you(?:'ve| have)? (?:also |yourself |done the same|said the same)/i,
      /(?:but )?(?:what about )?(?:when )?you (?:did|said|were|supported|advocated)/i,
      /(?:look|pot) (?:who's|calling) (?:the kettle|talking)/i,
      /you(?:'re| are) (?:one|the one|guilty|no(?:t in a| )position) to (?:talk|criticize|judge|point fingers)/i,
      /(?:that's |how )?(?:rich|ironic|hypocritical) coming from (?:you|someone who)/i,
      /practice what you preach/i,
      /glass house/i,
    ],
    keywordGroups: [
      ['you', 'too', 'also', 'same'],
      ['hypocrite', 'hypocrisy', 'hypocritical'],
      ['pot', 'kettle', 'black'],
    ],
    keywordThreshold: 1,
  },

  {
    type: 'appeal_to_emotion',
    name: 'Appeal to Emotion',
    description:
      'Using emotional manipulation rather than logical reasoning to win an argument.',
    severity: 'medium',
    regexPatterns: [
      /think (?:of|about) the children/i,
      /(?:how )?(?:would|can|could) you (?:sleep at night|live with yourself|look .{1,20} in the (?:eye|face|mirror))/i,
      /(?:any |every )?(?:decent|caring|compassionate|moral|good|reasonable) (?:person|human|individual|citizen) (?:would|should|must|knows)/i,
      /(?:have you )?(?:no |any )?(?:shame|heart|compassion|empathy|soul|decency|conscience)/i,
      /(?:blood|tears) (?:on|is on) (?:your|their|our) hands/i,
      /(?:innocent|helpless|defenseless|vulnerable) (?:people|children|victims|lives)/i,
    ],
    keywordGroups: [
      ['emotion', 'feel', 'heart', 'compassion'],
      ['fear', 'scare', 'terrif', 'frighten'],
      ['shame', 'guilt', 'disgrace', 'outrage'],
      ['pity', 'sympathy', 'tragic', 'heartbreak'],
    ],
    keywordThreshold: 2,
  },

  {
    type: 'bandwagon',
    name: 'Bandwagon (Ad Populum)',
    description:
      'Arguing something is true or good because many people believe or do it.',
    severity: 'low',
    regexPatterns: [
      /(?:everyone|everybody|most people|the majority|millions|billions) (?:knows?|agrees?|believes?|thinks?|supports?|wants?)/i,
      /(?:\d+%|(?:the )?vast majority|overwhelming majority|most (?:people|experts|Americans|citizens)) (?:of )?(?:people )?(?:agree|believe|support|think|say|want|know)/i,
      /(?:popular|public) (?:opinion|consensus|support|sentiment) (?:is|shows|indicates|supports|says|demonstrates)/i,
      /(?:if )?(?:so many|that many|this many) people (?:can't|cannot|couldn't) (?:all )?be wrong/i,
      /(?:join|get on|jump on) the (?:right side|bandwagon|winning)/i,
      /(?:growing|increasing|rising) (?:consensus|support|agreement|movement|trend)/i,
    ],
    keywordGroups: [
      ['everyone', 'agrees', 'popular'],
      ['majority', 'support', 'believe'],
      ['trend', 'movement', 'growing'],
    ],
    keywordThreshold: 1,
  },

  {
    type: 'false_cause',
    name: 'False Cause (Post Hoc)',
    description:
      'Assuming that because one event followed another, the first event caused the second.',
    severity: 'medium',
    regexPatterns: [
      /(?:ever )?since .{5,60},? .{5,60} (?:has|have|had) (?:been |become |gotten |started )/i,
      /(?:after|once|when) .{5,60} (?:happened|occurred|began|started),? .{5,60} (?:followed|resulted|happened|occurred|started)/i,
      /(?:this|that|it) (?:clearly |obviously )?(?:caused|led to|resulted in|brought about|triggered|produced)/i,
      /(?:because|since) .{5,60} (?:came|happened|occurred) (?:first|before|earlier|prior)/i,
      /(?:correlation|coincidence) .{0,20}(?:proves?|means?|shows?|demonstrates?) .{0,30}(?:causation|caused)/i,
    ],
    keywordGroups: [
      ['caused', 'because', 'after', 'therefore'],
      ['correlation', 'causation', 'proves'],
      ['since', 'happened', 'resulted', 'caused'],
    ],
    keywordThreshold: 1,
  },

  {
    type: 'hasty_generalization',
    name: 'Hasty Generalization',
    description:
      'Drawing a broad conclusion from a small or unrepresentative sample of evidence.',
    severity: 'medium',
    regexPatterns: [
      /(?:all|every|always|never|no one|everyone|nobody) .{5,60}(?:because|since|after) .{3,40}(?:one|a single|a few|an? (?:example|case|instance|study|anecdote))/i,
      /(?:one|a single|a few|this one|that one) .{3,60}(?:proves?|shows?|demonstrates?|means?) (?:that )?(?:all|every|always|never|no one)/i,
      /(?:I|we|you) (?:once |just )?(?:saw|met|knew|heard about|read about) .{3,40}(?:so|therefore|which (?:means|proves|shows))/i,
      /(?:based on|from) (?:this|that|one|a (?:single|few)) (?:example|case|instance|anecdote).{0,20}(?:we can (?:conclude|say|assume)|it(?:'s| is) (?:clear|obvious|evident))/i,
    ],
    keywordGroups: [
      ['all', 'every', 'one example', 'proves'],
      ['generalize', 'always', 'never', 'sample'],
      ['anecdote', 'therefore', 'all', 'every'],
    ],
    keywordThreshold: 1,
  },

  {
    type: 'circular_reasoning',
    name: 'Circular Reasoning',
    description:
      'Using the conclusion as a premise — the argument assumes what it is trying to prove.',
    severity: 'high',
    regexPatterns: [
      /(?:it(?:'s| is) (?:true|right|correct|valid) because) .{5,60} (?:(?:which )?(?:is|makes it) (?:true|right|correct|valid))/i,
      /(?:we know|I know|it's clear|it's obvious) .{5,40} because .{5,40} (?:which (?:is why|proves|shows|means)|therefore|so|and that's why)/i,
      /(?:by definition|inherently|necessarily|axiomatically|self-evidently)/i,
      /(?:the )?(?:bible|scripture|text|book|source) (?:says|states|tells us) .{5,40} (?:because|and) .{5,40} (?:the )?(?:bible|scripture|text|book|source)/i,
      /because (?:that's |it's )?(?:just )?(?:the way|how) (?:it is|things are|it works)/i,
      /it's true because it's true/i,
    ],
    keywordGroups: [
      ['because', 'true', 'therefore', 'true'],
      ['circular', 'reasoning', 'begging'],
      ['assumes', 'conclusion', 'premise'],
    ],
    keywordThreshold: 1,
  },
];

/**
 * Fast, pattern-based logical fallacy detector.
 *
 * Uses regex patterns and keyword analysis (no AI calls) to detect
 * common logical fallacies in debate text. Designed for speed so it
 * can run on every turn without adding latency.
 */
export class FallacyDetector {
  private patterns: FallacyPattern[];

  constructor() {
    this.patterns = FALLACY_PATTERNS;
  }

  /**
   * Detect logical fallacies in the given text.
   * Returns an array of detected fallacies with the triggering passage.
   */
  detectFallacies(text: string): DetectedFallacy[] {
    const detected: DetectedFallacy[] = [];
    const seenTypes = new Set<string>();

    // Normalize text for analysis
    const normalizedText = text.replace(/\s+/g, ' ');

    // Split into sentences for passage extraction
    const sentences = this.splitSentences(normalizedText);

    for (const pattern of this.patterns) {
      // Skip if we already found this fallacy type (avoid duplicates)
      if (seenTypes.has(pattern.type)) continue;

      // Strategy 1: Regex matching — strong signal
      const regexMatch = this.checkRegexPatterns(pattern, sentences);
      if (regexMatch) {
        seenTypes.add(pattern.type);
        detected.push({
          type: pattern.type,
          name: pattern.name,
          description: pattern.description,
          passage: regexMatch,
          severity: pattern.severity,
        });
        continue;
      }

      // Strategy 2: Keyword group matching — weaker signal, needs threshold
      const keywordMatch = this.checkKeywordGroups(pattern, normalizedText, sentences);
      if (keywordMatch) {
        seenTypes.add(pattern.type);
        detected.push({
          type: pattern.type,
          name: pattern.name,
          description: pattern.description,
          passage: keywordMatch,
          severity: this.reduceSeverity(pattern.severity), // lower confidence
        });
      }
    }

    return detected;
  }

  /**
   * Get all supported fallacy types and their descriptions.
   */
  getSupportedFallacies(): Array<{ type: string; name: string; description: string }> {
    return this.patterns.map((p) => ({
      type: p.type,
      name: p.name,
      description: p.description,
    }));
  }

  // ── Private helpers ──────────────────────────────────────────────────

  /**
   * Check regex patterns against sentences. Returns the matching passage or null.
   */
  private checkRegexPatterns(pattern: FallacyPattern, sentences: string[]): string | null {
    for (const sentence of sentences) {
      for (const regex of pattern.regexPatterns) {
        // Reset lastIndex for stateful regexes
        regex.lastIndex = 0;
        if (regex.test(sentence)) {
          return sentence.trim();
        }
      }
    }
    return null;
  }

  /**
   * Check keyword groups against the full text.
   * Returns the best matching passage or null.
   */
  private checkKeywordGroups(
    pattern: FallacyPattern,
    normalizedText: string,
    sentences: string[]
  ): string | null {
    const lowerText = normalizedText.toLowerCase();

    let matchedGroups = 0;
    let bestSentence: string | null = null;
    let bestScore = 0;

    for (const group of pattern.keywordGroups) {
      // A group matches if at least half its keywords appear in the text
      const threshold = Math.ceil(group.length / 2);
      const hits = group.filter((kw) => lowerText.includes(kw.toLowerCase()));

      if (hits.length >= threshold) {
        matchedGroups++;

        // Find the sentence with the most keyword hits
        for (const sentence of sentences) {
          const sentLower = sentence.toLowerCase();
          const sentHits = group.filter((kw) => sentLower.includes(kw.toLowerCase())).length;
          if (sentHits > bestScore) {
            bestScore = sentHits;
            bestSentence = sentence.trim();
          }
        }
      }
    }

    if (matchedGroups >= pattern.keywordThreshold && bestSentence) {
      return bestSentence;
    }

    return null;
  }

  /**
   * Split text into sentences, preserving enough context.
   */
  private splitSentences(text: string): string[] {
    // Split on sentence-ending punctuation followed by space or end
    const raw = text.split(/(?<=[.!?])\s+/);

    // Merge very short fragments with the previous sentence
    const merged: string[] = [];
    for (const segment of raw) {
      if (merged.length > 0 && segment.length < 20) {
        merged[merged.length - 1] += ' ' + segment;
      } else {
        merged.push(segment);
      }
    }

    // Also create two-sentence windows for patterns that span sentences
    const windows: string[] = [...merged];
    for (let i = 0; i < merged.length - 1; i++) {
      windows.push(merged[i] + ' ' + merged[i + 1]);
    }

    return windows;
  }

  /**
   * Reduce severity by one level for keyword-only detections (lower confidence).
   */
  private reduceSeverity(severity: DetectedFallacy['severity']): DetectedFallacy['severity'] {
    switch (severity) {
      case 'high':
        return 'medium';
      case 'medium':
        return 'low';
      case 'low':
        return 'low';
    }
  }
}
