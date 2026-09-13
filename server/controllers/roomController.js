import crypto from 'crypto';
import Room from '../models/Room.js';
import { executeCodeInternal } from './executeController.js';

// Problem Presets catalog with comprehensive test suites (Public + Hidden)
export const PROBLEM_PRESETS = {
  'two-sum': {
    title: 'Two Sum',
    language: 'javascript',
    description: `### Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

#### Example 1:
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

#### Constraints:
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Only one valid answer exists.`,
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your solution here...
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
`,
    testCases: [
      {
        input: 'twoSum([2, 7, 11, 15], 9)',
        expectedOutput: '[0,1]',
        isHidden: false,
      },
      {
        input: 'twoSum([3, 2, 4], 6)',
        expectedOutput: '[1,2]',
        isHidden: false,
      },
      {
        input: 'twoSum([3, 3], 6)',
        expectedOutput: '[0,1]',
        isHidden: false,
      },
      {
        input: 'twoSum([1, 5, 8, 10, 14, 20, 33], 24)',
        expectedOutput: '[3,4]',
        isHidden: true,
      },
      {
        input: 'twoSum([1000000000, -1000000000], 0)',
        expectedOutput: '[0,1]',
        isHidden: true,
      },
    ],
  },

  'valid-palindrome': {
    title: 'Valid Palindrome',
    language: 'javascript',
    description: `### Valid Palindrome

A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

#### Example 1:
\`\`\`
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.
\`\`\`

#### Example 2:
\`\`\`
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.
\`\`\``,
    starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindrome(s) {
  // Write your solution here...
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = clean.length - 1;

  while (left < right) {
    if (clean[left] !== clean[right]) return false;
    left++;
    right--;
  }
  return true;
}
`,
    testCases: [
      {
        input: 'isPalindrome("A man, a plan, a canal: Panama")',
        expectedOutput: 'true',
        isHidden: false,
      },
      {
        input: 'isPalindrome("race a car")',
        expectedOutput: 'false',
        isHidden: false,
      },
      {
        input: 'isPalindrome(" ")',
        expectedOutput: 'true',
        isHidden: false,
      },
      {
        input: 'isPalindrome("0P")',
        expectedOutput: 'false',
        isHidden: true,
      },
      {
        input: 'isPalindrome("ab_a")',
        expectedOutput: 'true',
        isHidden: true,
      },
    ],
  },

  'reverse-linked-list': {
    title: 'Reverse Linked List',
    language: 'javascript',
    description: `### Reverse Linked List

Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.

#### Example 1:
\`\`\`
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
\`\`\`

#### Constraints:
- The number of nodes in the list is the range \`[0, 5000]\`.
- \`-5000 <= Node.val <= 5000\``,
    starterCode: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
function reverseList(head) {
  // Write your solution here...
  let prev = null;
  let current = head;

  while (current !== null) {
    const nextNode = current.next;
    current.next = prev;
    prev = current;
    current = nextNode;
  }

  return prev;
}
`,
    testCases: [
      {
        input: 'JSON.stringify(reverseList(createList([1,2,3,4,5])))',
        expectedOutput: '[5,4,3,2,1]',
        isHidden: false,
      },
      {
        input: 'JSON.stringify(reverseList(createList([1,2])))',
        expectedOutput: '[2,1]',
        isHidden: false,
      },
      {
        input: 'JSON.stringify(reverseList(createList([])))',
        expectedOutput: 'null',
        isHidden: true,
      },
    ],
  },

  'valid-parentheses': {
    title: 'Valid Parentheses',
    language: 'javascript',
    description: `### Valid Parentheses (LeetCode #20)

Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

#### Example 1:
\`\`\`
Input: s = "()"
Output: true
\`\`\`

#### Example 2:
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

#### Example 3:
\`\`\`
Input: s = "(]"
Output: false
\`\`\`

#### Constraints:
- \`1 <= s.length <= 10^4\`
- \`s\` consists of parentheses only \`'()[]{}'\`.`,
    starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Write your solution here...
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };

  for (const char of s) {
    if (map[char]) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }

  return stack.length === 0;
}
`,
    testCases: [
      {
        input: 'isValid("()")',
        expectedOutput: 'true',
        isHidden: false,
      },
      {
        input: 'isValid("()[]{}")',
        expectedOutput: 'true',
        isHidden: false,
      },
      {
        input: 'isValid("(]")',
        expectedOutput: 'false',
        isHidden: false,
      },
      {
        input: 'isValid("([)]")',
        expectedOutput: 'false',
        isHidden: true,
      },
      {
        input: 'isValid("{[]}")',
        expectedOutput: 'true',
        isHidden: true,
      },
    ],
  },

  'best-time-to-buy-and-sell-stock': {
    title: 'Best Time to Buy and Sell Stock',
    language: 'javascript',
    description: `### Best Time to Buy and Sell Stock (LeetCode #121)

You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.

#### Example 1:
\`\`\`
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.
\`\`\`

#### Example 2:
\`\`\`
Input: prices = [7,6,4,3,1]
Output: 0
Explanation: In this case, no transactions are done and the max profit = 0.
\`\`\`

#### Constraints:
- \`1 <= prices.length <= 10^5\`
- \`0 <= prices[i] <= 10^4\``,
    starterCode: `/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {
  // Write your solution here...
  let minPrice = Infinity;
  let maxProfit = 0;

  for (const price of prices) {
    if (price < minPrice) {
      minPrice = price;
    } else if (price - minPrice > maxProfit) {
      maxProfit = price - minPrice;
    }
  }

  return maxProfit;
}
`,
    testCases: [
      {
        input: 'maxProfit([7,1,5,3,6,4])',
        expectedOutput: '5',
        isHidden: false,
      },
      {
        input: 'maxProfit([7,6,4,3,1])',
        expectedOutput: '0',
        isHidden: false,
      },
      {
        input: 'maxProfit([2,4,1])',
        expectedOutput: '2',
        isHidden: true,
      },
      {
        input: 'maxProfit([1,2])',
        expectedOutput: '1',
        isHidden: true,
      },
      {
        input: 'maxProfit([3,2,6,5,0,3])',
        expectedOutput: '4',
        isHidden: true,
      },
    ],
  },

  'binary-search': {
    title: 'Binary Search',
    language: 'javascript',
    description: `### Binary Search (LeetCode #704)

Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

#### Example 1:
\`\`\`
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4
\`\`\`

#### Example 2:
\`\`\`
Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1
Explanation: 2 does not exist in nums so return -1
\`\`\`

#### Constraints:
- \`1 <= nums.length <= 10^4\`
- \`-10^4 < nums[i], target < 10^4\`
- All the integers in \`nums\` are unique.
- \`nums\` is sorted in ascending order.`,
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // Write your solution here...
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
`,
    testCases: [
      {
        input: 'search([-1,0,3,5,9,12], 9)',
        expectedOutput: '4',
        isHidden: false,
      },
      {
        input: 'search([-1,0,3,5,9,12], 2)',
        expectedOutput: '-1',
        isHidden: false,
      },
      {
        input: 'search([5], 5)',
        expectedOutput: '0',
        isHidden: true,
      },
      {
        input: 'search([2,5], 0)',
        expectedOutput: '-1',
        isHidden: true,
      },
      {
        input: 'search([2,5], 5)',
        expectedOutput: '1',
        isHidden: true,
      },
    ],
  },

  'maximum-subarray': {
    title: 'Maximum Subarray (Kadane)',
    language: 'javascript',
    description: `### Maximum Subarray (LeetCode #53)

Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

#### Example 1:
\`\`\`
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
\`\`\`

#### Example 2:
\`\`\`
Input: nums = [1]
Output: 1
Explanation: The subarray [1] has the largest sum 1.
\`\`\`

#### Example 3:
\`\`\`
Input: nums = [5,4,-1,7,8]
Output: 23
Explanation: The subarray [5,4,-1,7,8] has the largest sum 23.
\`\`\`

#### Constraints:
- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\``,
    starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  // Write your solution here...
  let maxCurrent = nums[0];
  let maxGlobal = nums[0];

  for (let i = 1; i < nums.length; i++) {
    maxCurrent = Math.max(nums[i], maxCurrent + nums[i]);
    if (maxCurrent > maxGlobal) {
      maxGlobal = maxCurrent;
    }
  }

  return maxGlobal;
}
`,
    testCases: [
      {
        input: 'maxSubArray([-2,1,-3,4,-1,2,1,-5,4])',
        expectedOutput: '6',
        isHidden: false,
      },
      {
        input: 'maxSubArray([1])',
        expectedOutput: '1',
        isHidden: false,
      },
      {
        input: 'maxSubArray([5,4,-1,7,8])',
        expectedOutput: '23',
        isHidden: false,
      },
      {
        input: 'maxSubArray([-1])',
        expectedOutput: '-1',
        isHidden: true,
      },
      {
        input: 'maxSubArray([-2,-1])',
        expectedOutput: '-1',
        isHidden: true,
      },
    ],
  },

  'container-with-most-water': {
    title: 'Container With Most Water',
    language: 'javascript',
    description: `### Container With Most Water (LeetCode #11)

You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

Notice that you may not slant the container.

#### Example 1:
\`\`\`
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49.
\`\`\`

#### Example 2:
\`\`\`
Input: height = [1,1]
Output: 1
\`\`\`

#### Constraints:
- \`n == height.length\`
- \`2 <= n <= 10^5\`
- \`0 <= height[i] <= 10^4\``,
    starterCode: `/**
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {
  // Write your solution here...
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;

  while (left < right) {
    const width = right - left;
    const currentHeight = Math.min(height[left], height[right]);
    const area = width * currentHeight;
    if (area > maxWater) maxWater = area;

    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
}
`,
    testCases: [
      {
        input: 'maxArea([1,8,6,2,5,4,8,3,7])',
        expectedOutput: '49',
        isHidden: false,
      },
      {
        input: 'maxArea([1,1])',
        expectedOutput: '1',
        isHidden: false,
      },
      {
        input: 'maxArea([4,3,2,1,4])',
        expectedOutput: '16',
        isHidden: true,
      },
      {
        input: 'maxArea([1,2,1])',
        expectedOutput: '2',
        isHidden: true,
      },
    ],
  },

  'custom': {
    title: 'Interview Workspace',
    language: 'javascript',
    description: `### Custom Problem

Describe the challenge, constraints, and test cases for this interview session.`,
    starterCode: `// Write your solution here...

function solution() {
  return true;
}
`,
    testCases: [
      {
        input: 'solution()',
        expectedOutput: 'true',
        isHidden: false,
      },
    ],
  },
};

// Helper to generate a unique 6-digit uppercase alphanumeric room ID
const generateUniqueRoomId = async () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let isUnique = false;
  let roomId = '';

  while (!isUnique) {
    roomId = '';
    const randomBytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      roomId += chars[randomBytes[i] % chars.length];
    }

    const existing = await Room.findOne({ roomId });
    if (!existing) {
      isUnique = true;
    }
  }

  return roomId;
};

// @desc    Create a new room (Authenticated or Guest)
// @route   POST /api/rooms/create
// @access  Public / Optional Auth
export const createRoom = async (req, res) => {
  try {
    const {
      title,
      preset = 'two-sum',
      language,
      code,
      problemDescription,
      testCases,
    } = req.body;

    const roomId = await generateUniqueRoomId();
    const selectedPreset = PROBLEM_PRESETS[preset] || PROBLEM_PRESETS['two-sum'];

    const room = await Room.create({
      roomId,
      title: title?.trim() || selectedPreset.title || 'Interview Workspace',
      createdBy: req.user ? req.user._id : null,
      language: language || selectedPreset.language || 'javascript',
      code: code !== undefined ? code : selectedPreset.starterCode,
      problemDescription:
        problemDescription !== undefined
          ? problemDescription
          : selectedPreset.description,
      testCases:
        Array.isArray(testCases) && testCases.length > 0
          ? testCases
          : selectedPreset.testCases || [],
    });

    return res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      roomId: room.roomId,
      room: {
        roomId: room.roomId,
        title: room.title,
        language: room.language,
        code: room.code,
        problemDescription: room.problemDescription,
        testCases: room.testCases,
        feedback: room.feedback,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error('[Create Room Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create room.',
    });
  }
};

// @desc    Get room details by roomId
// @route   GET /api/rooms/:roomId
// @access  Public
export const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID parameter is required.',
      });
    }

    const normalizedRoomId = roomId.trim().toUpperCase();
    const room = await Room.findOne({ roomId: normalizedRoomId }).populate(
      'createdBy',
      'name email'
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room "${normalizedRoomId}" was not found or has expired (24-hour limit).`,
      });
    }

    // Default seed test cases if existing room has none
    const testCases =
      room.testCases && room.testCases.length > 0
        ? room.testCases
        : PROBLEM_PRESETS['two-sum'].testCases;

    return res.status(200).json({
      success: true,
      room: {
        roomId: room.roomId,
        title: room.title,
        language: room.language,
        code: room.code,
        problemDescription: room.problemDescription,
        testCases,
        feedback: room.feedback || null,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error('[Get Room Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching room details.',
    });
  }
};

// @desc    Update room problem description
// @route   PUT /api/rooms/:roomId/problem
// @access  Public
export const updateRoomProblem = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { problemDescription, title, testCases } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID parameter is required.',
      });
    }

    const normalizedRoomId = roomId.trim().toUpperCase();
    const updateFields = {};
    if (problemDescription !== undefined) updateFields.problemDescription = problemDescription;
    if (title !== undefined && title.trim()) updateFields.title = title.trim();
    if (Array.isArray(testCases)) updateFields.testCases = testCases;

    const room = await Room.findOneAndUpdate(
      { roomId: normalizedRoomId },
      updateFields,
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room "${normalizedRoomId}" not found or expired.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Problem details updated successfully.',
      room: {
        roomId: room.roomId,
        title: room.title,
        problemDescription: room.problemDescription,
        testCases: room.testCases,
        updatedAt: room.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Update Problem Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating problem description.',
    });
  }
};

// @desc    Update/Auto-save room code and language
// @route   PUT /api/rooms/:roomId/code
// @access  Public
export const updateRoomCode = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code, language } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID parameter is required.',
      });
    }

    if (code === undefined && language === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least code or language must be provided.',
      });
    }

    const normalizedRoomId = roomId.trim().toUpperCase();
    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (language !== undefined) updateData.language = language;

    const room = await Room.findOneAndUpdate(
      { roomId: normalizedRoomId },
      updateData,
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room "${normalizedRoomId}" not found or expired.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Room code auto-saved successfully.',
      room: {
        roomId: room.roomId,
        code: room.code,
        language: room.language,
        updatedAt: room.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Update Room Code Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating room code.',
    });
  }
};

// @desc    Verify solution against all test cases (Public & Hidden)
// @route   POST /api/rooms/:roomId/submit
// @access  Public
export const submitSolution = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code, language = 'javascript', isInterviewer = false } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Code string is required for verification.',
      });
    }

    const normalizedRoomId = roomId.trim().toUpperCase();
    const room = await Room.findOne({ roomId: normalizedRoomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room "${normalizedRoomId}" not found.`,
      });
    }

    // Retrieve test cases (fallback to Two Sum preset if room has none)
    const testCases =
      room.testCases && room.testCases.length > 0
        ? room.testCases
        : PROBLEM_PRESETS['two-sum'].testCases;

    const testResults = [];
    let passedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      let testHarnessCode = '';

      if (language === 'javascript') {
        // Linked list helper if needed
        const linkedListHelper = `
function ListNode(val, next) {
  this.val = (val===undefined ? 0 : val);
  this.next = (next===undefined ? null : next);
}
function createList(arr) {
  if (!arr || arr.length === 0) return null;
  const head = new ListNode(arr[0]);
  let curr = head;
  for (let i = 1; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return head;
}
`;
        testHarnessCode = `
${linkedListHelper}
${code}

try {
  const __eval_result = ${tc.input};
  if (typeof __eval_result === 'object' && __eval_result !== null) {
    console.log(JSON.stringify(__eval_result));
  } else {
    console.log(String(__eval_result));
  }
} catch (err) {
  console.error("Runtime error:", err.message);
}
`;
      } else if (language === 'python') {
        testHarnessCode = `
import json
import sys

${code}

try:
    __eval_result = ${tc.input}
    if isinstance(__eval_result, bool):
        print(str(__eval_result).lower())
    elif isinstance(__eval_result, (list, dict, tuple)):
        print(json.dumps(__eval_result))
    else:
        print(__eval_result)
except Exception as err:
    print(f"Runtime error: {err}", file=sys.stderr)
`;
      } else {
        // C++ / Java fallback
        testHarnessCode = code;
      }

      // Execute through execution service
      const execResult = await executeCodeInternal(testHarnessCode, language);

      const actualClean = (execResult.stdout || '')
        .trim()
        .replace(/\r/g, '')
        .replace(/\s+/g, '');
      const expectedClean = (tc.expectedOutput || '')
        .trim()
        .replace(/\r/g, '')
        .replace(/\s+/g, '');

      const passed =
        execResult.success && actualClean.length > 0 && actualClean === expectedClean;

      if (passed) passedCount++;

      // Construct item report with hidden test case masking
      if (tc.isHidden && !isInterviewer) {
        testResults.push({
          testCaseId: tc._id?.toString() || `tc_${i + 1}`,
          testIndex: i + 1,
          passed,
          executionTime: execResult.executionTime,
          isHidden: true,
          input: '[Hidden Test Case]',
          expectedOutput: '[Hidden Output]',
          actualOutput: passed ? '[Passed - Hidden]' : '[Failed - Hidden]',
          stderr: passed ? '' : 'Test case failed on hidden constraints.',
        });
      } else {
        testResults.push({
          testCaseId: tc._id?.toString() || `tc_${i + 1}`,
          testIndex: i + 1,
          passed,
          executionTime: execResult.executionTime,
          isHidden: Boolean(tc.isHidden),
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: execResult.stdout?.trim() || '',
          stderr: execResult.stderr?.trim() || '',
        });
      }
    }

    return res.status(200).json({
      success: true,
      totalTests: testCases.length,
      passedTests: passedCount,
      passRatio: `${passedCount}/${testCases.length}`,
      allPassed: passedCount === testCases.length,
      results: testResults,
    });
  } catch (error) {
    console.error('[Submit Solution Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error executing test suite verification.',
    });
  }
};

// @desc    Save evaluation feedback scorecard
// @route   PUT /api/rooms/:roomId/feedback
// @access  Public
export const saveFeedback = async (req, res) => {
  try {
    const { roomId } = req.params;
    const {
      problemSolvingRating,
      codeQualityRating,
      communicationRating,
      feedbackNotes,
    } = req.body;

    const normalizedRoomId = roomId.trim().toUpperCase();

    const feedbackPayload = {
      problemSolvingRating: Number(problemSolvingRating) || 3,
      codeQualityRating: Number(codeQualityRating) || 3,
      communicationRating: Number(communicationRating) || 3,
      feedbackNotes: feedbackNotes?.trim() || '',
      submittedAt: new Date(),
    };

    const room = await Room.findOneAndUpdate(
      { roomId: normalizedRoomId },
      { feedback: feedbackPayload },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room "${normalizedRoomId}" not found or expired.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Interview evaluation scorecard saved successfully.',
      feedback: room.feedback,
    });
  } catch (error) {
    console.error('[Save Feedback Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error saving interview feedback.',
    });
  }
};

// @desc    Get all active rooms created by logged-in user
// @route   GET /api/rooms/my/active
// @access  Private
export const getMyRooms = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view your rooms.',
      });
    }

    const rooms = await Room.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .select('roomId title language code problemDescription testCases feedback createdAt');

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error('[Get My Rooms Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user active rooms.',
    });
  }
};

// @desc    Get available problem presets list
// @route   GET /api/rooms/presets
// @access  Public
export const getPresets = (req, res) => {
  const presetsList = Object.keys(PROBLEM_PRESETS).map((key) => ({
    id: key,
    title: PROBLEM_PRESETS[key].title,
    language: PROBLEM_PRESETS[key].language,
  }));

  return res.status(200).json({
    success: true,
    presets: presetsList,
  });
};
