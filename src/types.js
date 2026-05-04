// HerNest Type Definitions v3.1
// Add @ts-check to any .js file to enable type checking

/**
 * @typedef {Object} UserProfile
 * @property {string} uid
 * @property {string} name
 * @property {string} avatar
 * @property {"working"|"stay_at_home"|"entrepreneur"|"single"} role
 * @property {string[]} priorities
 * @property {Child[]} kids
 * @property {string} [partner]
 * @property {Adult[]} [parents]
 * @property {Adult[]} [inlaws]
 * @property {Adult[]} [friends]
 * @property {string} [tripGoal]
 * @property {string} [fitnessGoal]
 * @property {number} [savingsGoal]
 * @property {string} [challenge]
 * @property {string} [bodyShape]
 * @property {string} [height]
 * @property {string} [clothingSize]
 * @property {string} [styleVibe]
 * @property {string} [dresscode]
 * @property {string} [diet]
 * @property {string} [fitnessLevel]
 * @property {number} [sleepGoal]
 * @property {"morning"|"evening"|"variable"} [energyPattern]
 * @property {number} [monthlyBudget]
 * @property {boolean} [onboardingComplete]
 * @property {number} [_onboardingStep]
 * @property {string} [fcmToken]
 */

/**
 * @typedef {Object} Child
 * @property {string} name
 * @property {string} [age]
 * @property {string} [bday] MM/DD format
 */

/**
 * @typedef {Object} Adult
 * @property {string} name
 * @property {string} [role]
 * @property {string} [bday] MM/DD format
 */

/**
 * @typedef {Object} NoraFact
 * @property {string} id
 * @property {string} fact
 * @property {"dietary"|"medical"|"family"|"preference"|"goal"|"schedule"|"event"|"temporary"} type
 * @property {number} confidence
 * @property {string|null} expiresAt ISO date string or null
 * @property {string} createdAt ISO date string
 * @property {number} useCount
 * @property {"user_explicit"|"nora_extracted"|"onboarding"} source
 */

/**
 * @typedef {Object} MorningBriefing
 * @property {string} greeting
 * @property {string} date_note
 * @property {string|null} weather_note
 * @property {"sunny"|"cloudy"|"rainy"|null} weather_type
 * @property {BriefingPriority[]} priorities
 * @property {string[]} reminders
 * @property {string|null} budget_note
 * @property {string|null} trip_note
 * @property {string} affirmation
 * @property {string} energy_tip
 * @property {string} focus_word
 */

/**
 * @typedef {Object} BriefingPriority
 * @property {"Family"|"Work"|"Me"|"Home"|"Travel"} tag
 * @property {string} text
 * @property {boolean} [urgent]
 */

/**
 * @typedef {Object} SummaryDocument
 * @property {string} name
 * @property {string} avatar
 * @property {string} role
 * @property {string[]} priorities
 * @property {number} pendingTasks
 * @property {UpcomingItem[]} upcomingBirthdays
 * @property {UpcomingItem[]} upcomingTasks
 * @property {UpcomingItem[]} upcomingSchool
 * @property {number} wellnessScore
 * @property {number} waterToday
 * @property {number} expensesThisMonth
 * @property {number} budgetRemaining
 * @property {number} schoolUrgentCount
 * @property {number} memoryFactCount
 * @property {any} lastUpdated Firestore Timestamp
 */

/**
 * @typedef {Object} UpcomingItem
 * @property {string} title
 * @property {"birthday"|"task"|"school"|"trip"} type
 * @property {number} daysUntil
 * @property {string} [name]
 * @property {string} [priority]
 * @property {string} [child]
 */

/**
 * @typedef {Object} Expense
 * @property {string} merchant
 * @property {number} amount
 * @property {"Groceries"|"Dining"|"Kids"|"Shopping"|"Travel"|"Fitness"|"Health"|"Transport"|"Entertainment"|"Bills"|"Other"} category
 * @property {string} date
 * @property {string[]} [items]
 */

/**
 * @typedef {Object} Trip
 * @property {string|number} id
 * @property {string} dest
 * @property {string} flag
 * @property {number} nights
 * @property {number} travellers
 * @property {number} budget
 * @property {"Planning"|"Booked"|"Completed"} status
 * @property {string} [departDate]
 */

export {};
