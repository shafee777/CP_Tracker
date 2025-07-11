// frontend/src/components/FooterComponents/APIReference.jsx
import React, { useState } from 'react'


export default function APIReference() {
  const [copiedCode, setCopiedCode] = useState(null)

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(id)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const CodeBlock = ({ code, language, id }) => (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        className="absolute top-2 right-2 h-8 w-8 p-0 text-gray-400 hover:text-gray-100 bg-transparent border-none cursor-pointer rounded flex items-center justify-center"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  )

  const Badge = ({ children, variant = "default", style = {} }) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    const variants = {
      default: "bg-gray-100 text-gray-800",
      secondary: "bg-gray-100 text-gray-800",
      outline: "border border-gray-300 text-gray-700 bg-white"
    }
    
    return (
      <span className={`${baseClasses} ${variants[variant]}`} style={style}>
        {children}
      </span>
    )
  }

  const Card = ({ children }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {children}
    </div>
  )

  const CardHeader = ({ children }) => (
    <div className="p-6 pb-4">
      {children}
    </div>
  )

  const CardContent = ({ children }) => (
    <div className="p-6 pt-0">
      {children}
    </div>
  )

  const CardTitle = ({ children, className = "" }) => (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  )

  const CardDescription = ({ children }) => (
    <p className="text-sm text-gray-600 mt-1.5">
      {children}
    </p>
  )

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">🧰 API Reference</h1>
        <p className="text-lg text-gray-600">
          All endpoints are prefixed with your backend server URL, e.g.,{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000/</code>
        </p>
      </div>
      {/* Scraping and Utilities Section */}
      <div className="border-t border-gray-200 my-12"></div>
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">Scraping and Utilities</h2>
        <p className="text-lg text-gray-600">
          Technical details about how data is collected from each platform.
        </p>
      </div>

      <div className="space-y-8">
        {/* LeetCode */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧪</span>
              <CardTitle className="text-xl">LeetCode</CardTitle>
            </div>
            <CardDescription>Uses GraphQL queries to fetch comprehensive user data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Data Sources:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Profile:</strong> matchedUser GraphQL query</li>
                  <li><strong>Contest history:</strong> User contest participation data</li>
                  <li><strong>Recent submissions:</strong> Latest problem attempts</li>
                  <li><strong>Submission heatmap:</strong> Calendar view of activity</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Enhances submission info with tags using helper <code className="bg-gray-100 px-1 rounded">getProblemTags</code></li>
                  <li><code className="bg-gray-100 px-1 rounded">fetchAcceptedSubmissions()</code> crawls through all user submissions to list accepted ones</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Codeforces */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧪</span>
              <CardTitle className="text-xl">Codeforces</CardTitle>
            </div>
            <CardDescription>Utilizes official Codeforces APIs for reliable data access.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Official APIs Used:</h4>
                <div className="flex gap-2 mb-3">
                  <Badge variant="outline">user.info</Badge>
                  <Badge variant="outline">user.rating</Badge>
                  <Badge variant="outline">user.status</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Processing:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Parses submissions to compute total solved problems</li>
                  <li>Formats contest history with rating deltas and human-readable dates</li>
                  <li>Aggregates performance statistics across all contests</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CodeChef */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧪</span>
              <CardTitle className="text-xl">CodeChef</CardTitle>
            </div>
            <CardDescription>Scrapes HTML profile using Cheerio for comprehensive data extraction.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Extracted Data:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Profile Info:</strong> Name, rating, stars, country</li>
                  <li><strong>Statistics:</strong> Total solved problems</li>
                  <li><strong>Rating History:</strong> Parsed from embedded JavaScript data</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Additional Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><code className="bg-gray-100 px-1 rounded">getUpcomingContests()</code> calls their open API to get future contests</li>
                  <li>HTML parsing handles dynamic content and embedded data structures</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-8">
        {/* GET /all/:platform/:username */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" style={{backgroundColor: '#dcfce7', color: '#166534'}}>
                GET
              </Badge>
              <CardTitle className="text-xl">/all/:platform/:username</CardTitle>
            </div>
            <CardDescription>Fetch user profile and contest data from a given platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Supported Platforms:</h4>
                <div className="flex gap-2">
                  <Badge variant="outline">leetcode</Badge>
                  <Badge variant="outline">codeforces</Badge>
                  <Badge variant="outline">codechef</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Example Request:</h4>
                <CodeBlock code="GET /all/leetcode/Shafee_77" language="http" id="get-user-request" />
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response:</h4>
                <CodeBlock
                  code={`{
  "platform": "LeetCode",
  "username": "Shafee_77",
  "ranking": 21500,
  "problemsSolved": [...],
  "recentSubmissions": [...],
  "contests": {
    "total": 5,
    "ratingHistory": [...]
  },
  "heatmap": {
    "data": [...]
  }
}`}
                  language="json"
                  id="get-user-response"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* POST /all/combined */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" style={{backgroundColor: '#dbeafe', color: '#1e40af'}}>
                POST
              </Badge>
              <CardTitle className="text-xl">/all/combined</CardTitle>
            </div>
            <CardDescription>
              Fetch and combine user data from all 3 platforms and optionally update the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request Body:</h4>
                <CodeBlock
                  code={`{
  "leetcodeUsername": "Shafee_77",
  "codeforcesUsername": "ShafeeCF",
  "codechefUsername": "ShafeeCC",
  "userId": "mongodb_user_id"
}`}
                  language="json"
                  id="combined-request"
                />
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response:</h4>
                <CodeBlock
                  code={`{
  "success": true,
  "leetcode": {...},
  "codeforces": {...},
  "codechef": {...}
}`}
                  language="json"
                  id="combined-response"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GET /contests/upcoming */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" style={{backgroundColor: '#dcfce7', color: '#166534'}}>
                GET
              </Badge>
              <CardTitle className="text-xl">/contests/upcoming</CardTitle>
            </div>
            <CardDescription>Returns formatted upcoming LeetCode contests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Example Request:</h4>
                <CodeBlock code="GET /contests/upcoming" language="http" id="contests-request" />
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response:</h4>
                <CodeBlock
                  code={`[
  {
    "title": "Weekly Contest 401",
    "startDate": "Jul 13, 2025, 8:00 PM",
    "durationMinutes": 90,
    "link": "https://leetcode.com/contest/weekly-contest-401"
  },
  ...
]`}
                  language="json"
                  id="contests-response"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GET /recommend/:username */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" style={{backgroundColor: '#dcfce7', color: '#166534'}}>
                GET
              </Badge>
              <CardTitle className="text-xl">/recommend/:username</CardTitle>
            </div>
            <CardDescription>
              Returns 10 personalized problem recommendations based on solved problem tags using ML.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Example Request:</h4>
                <CodeBlock code="GET /recommend/Shafee_77" language="http" id="recommend-request" />
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response:</h4>
                <CodeBlock
                  code={`[
  {
    "title": "Add Two Numbers",
    "tags": ["linked-list", "math"],
    "difficulty": "Medium"
  },
  ...
]`}
                  language="json"
                  id="recommend-response"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GET /predict/:username/:contest */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" style={{backgroundColor: '#dcfce7', color: '#166534'}}>
                GET
              </Badge>
              <CardTitle className="text-xl">/predict/:username/:contest</CardTitle>
            </div>
            <CardDescription>Predicts LeetCode contest rating change using LCCN API.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Example Request:</h4>
                <CodeBlock code="GET /predict/Shafee_77/Biweekly Contest 150" language="http" id="predict-request" />
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response:</h4>
                <CodeBlock
                  code={`{
  "contestName": "Biweekly Contest 150",
  "date": "Jul 10, 2025, 8:00 PM",
  "rating": 1523,
  "rank": 1234,
  "predictedRating": 1575,
  "delta": 52,
  "problemsSolved": 3
}`}
                  language="json"
                  id="predict-response"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-t border-gray-200 my-8"></div>

      <div className="text-center text-gray-600">
        <p>Need help? Check out our documentation or contact support.</p>
      </div>
    </div>
  )
}