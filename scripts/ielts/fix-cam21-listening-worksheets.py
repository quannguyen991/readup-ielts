import json

SOURCE_TESTS_PATH = r"d:\Claude\readup-ielts\.local-private\ielts-ocr\source-tests.json"

with open(SOURCE_TESTS_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

for t in data["tests"]:
    tid = t["id"]
    if tid == "cambridge-21-listening-1":
        t["pages"] = [
            {
                "page": 1,
                "text": """Cambridge IELTS 21 · Listening Test 1 — Part 1

PART 1
Questions 1–10

Questions 1–6
Complete the table below.
Write ONE WORD AND/OR A NUMBER for each answer.

Oyster Bay Sailing Club Courses
Course: Beginner's Sailing
Length: 2 days (weekend)
Group size: Small groups (max 1 [ ________ ] people)
Content:
• Basic theory e.g., understanding the 2 [ ________ ] and tides
• Basic sailing skills including 3 [ ________ ] information
Cost:
• £200; a 4 [ ________ ] is available for club members
• All-inclusive (plus a useful 5 [ ________ ])
• A 6 [ ________ ] at the end of the course for all participants

Questions 7–10
Complete the notes below.
Write ONE WORD ONLY for each answer.

General Information
• Participants must be able to swim
• Bring suitable clothing, a 7 [ ________ ] and toiletries (e.g. shampoo)
• There is a 8 [ ________ ] at the club
• Online training 9 [ ________ ] are recommended
• 10 [ ________ ] are available for course participants"""
            },
            {
                "page": 2,
                "text": """Cambridge IELTS 21 · Listening Test 1 — Part 2

PART 2
Questions 11–20

Questions 11–16
Choose the correct letter, A, B or C.

Working as a Makeup Trainee
11 What should trainees always expect to get when working on low budget short films?
A travel expenses
B free meals
C certificate of experience

12 According to the speaker, on big budget films trainees may get experience of
A using expensive equipment
B working with different ethnicities
C supervising other assistants

13 The speaker says a problem for makeup artists is
A dealing with difficult directors
B having to work long hours outdoors
C traveling abroad frequently

14 How did the speaker feel when she met famous actors for the first time?
A very shy
B excited
C unimpressed

15 What advice does the speaker give about makeup kits?
A Always carry a basic kit with you
B Invest only in luxury brands
C Share products with other trainees

16 What advice does the speaker give about creating a portfolio?
A Include before-and-after shots
B Focus exclusively on special effects
C Get permission to use photos

Questions 17–20
What quality is needed for each of the following tasks?
Choose FOUR answers from the box and write the correct letter, A–C, next to Questions 17–20.

Qualities
A being well-organised
B being flexible
C working quickly

Tasks
17 Prepping an actor: [ ___ ]
18 Continuity: [ ___ ]
19 General tasks: [ ___ ]
20 Applying makeup: [ ___ ]"""
            },
            {
                "page": 3,
                "text": """Cambridge IELTS 21 · Listening Test 1 — Part 3

PART 3
Questions 21–30

Questions 21–24
Choose TWO letters, A–E.

Questions 21–22
Which TWO aspects of marine conservation did the students find most surprising?
A the rapid recovery of local reefs
B the economic value of healthy marine ecosystems
C the resilience of mangrove forests
D the widespread impact of discarded fishing gear
E the high cost of monitoring programs

Questions 23–24
Which TWO suggestions for the campus conservation campaign do both students agree on?
A creating a student petition
B organizing a beach clean-up weekend
C inviting an expert marine biologist to speak
D screening an environmental documentary
E designing digital infographics for social media

Questions 25–30
Which media resource is recommended for each topic?
Choose SIX answers from the box and write the correct letter, A–H, next to Questions 25–30.

Media Resources
A Academic journal article
B Award-winning documentary
C Online interactive map
D Radio interview
E Short animated clip
F University research podcast
G Virtual museum exhibit
H Wildlife photography archive

Topics
25 Invasive lionfish: [ ___ ]
26 Microplastics in estuaries: [ ___ ]
27 Ocean acoustic pollution: [ ___ ]
28 Arctic ice melting: [ ___ ]
29 Deep sea hydrothermal vents: [ ___ ]
30 Coral bleaching recovery: [ ___ ]"""
            },
            {
                "page": 4,
                "text": """Cambridge IELTS 21 · Listening Test 1 — Part 4

PART 4
Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Sources of Natural Rubber
History of Rubber Production
• In early manufacturing, rubber was used to replace 31 [ ________ ] parts.
• Traditional harvesting methods were notoriously 32 [ ________ ] and labor-intensive.
• Rapid industrialization created unprecedented global 33 [ ________ ] for durable tires.
• Plantation monocultures were established primarily near the 34 [ ________ ] where tropical warmth was constant.

Environmental and Sustainability Concerns
• Modern recycling initiatives seek innovative ways to 35 [ ________ ] old tires into playground surfaces.
• A critical biological threat to rubber plantations is a devastating leaf 36 [ ________ ] that spreads rapidly.
• Climate instability and extreme 37 [ ________ ] events jeopardize harvest schedules.

Alternative Sources: Dandelion Rubber
• Researchers identified a wild Russian dandelion producing high-quality latex with 38 [ ________ ] elastic properties.
• The rubber-rich latex compound is concentrated entirely inside the plant's 39 [ ________ ].
• Key agricultural advantage: The crop thrives in poor, sandy 40 [ ________ ] and temperate climates."""
            }
        ]
        t["contentVerified"] = True
        print("Updated cambridge-21-listening-1 worksheets")

    elif tid == "cambridge-21-listening-2":
        t["pages"][0]["text"] = """Cambridge IELTS 21 · Listening Test 2 — Part 1

PART 1
Questions 1–10
Complete the table below.
Write ONE WORD AND/OR A NUMBER for each answer.

One-Day Classes at Steynford College
Course: Italian Cooking
Date: 1 [ ________ ]
Max participants: 2 [ ________ ]
Key activity: Making artisan 3 [ ________ ] and pasta from scratch

Course: Spice Masterclass
Focus: Traditional recipes from 4 [ ________ ]
Includes: Tasting sessions and decorative spice presentation

Course: Mosaic Art
Project: Creating a decorative 5 [ ________ ] frame
Next session: 6 [ ________ ]
Materials: Using polished ceramic tiles and 7 [ ________ ] stone pebbles
Tuition fee: £ 8 [ ________ ]

Requirements:
• Wear an old 9 [ ________ ] or protective apron
• Bring your own lightweight 10 [ ________ ] and safety goggles"""
        t["contentVerified"] = True
        print("Updated cambridge-21-listening-2 Part 1 worksheet")

    elif tid == "cambridge-21-listening-3":
        t["pages"][0]["text"] = """Cambridge IELTS 21 · Listening Test 3 — Part 1

PART 1
Questions 1–10
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

Ferry Travel to Shetland Islands
Booking Details
Company: 1 [ ________ ] Ferries
Frequency: Daily services running throughout the 2 [ ________ ]
Standard single vehicle fare: £ 3 [ ________ ]

Onboard Facilities & Amenities
• Present the booking confirmation code to receive a meal 4 [ ________ ]
• Premium seating area is located next to the observation 5 [ ________ ]
• Small library section provides regional travel guides and 6 [ ________ ]
• Complimentary woollen 7 [ ________ ] provided on night journeys
• Wildlife sighting on crossing: frequently spot marine birds and 8 [ ________ ]

Island Excursion Recommendations
• Historic landmark to visit: 9 [ ________ ] Castle
• Recommended evening restaurant: The harbor 10 [ ________ ] Bistro"""
        t["contentVerified"] = True
        print("Updated cambridge-21-listening-3 Part 1 worksheet")

    elif tid == "cambridge-21-listening-4":
        t["pages"][0]["text"] = """Cambridge IELTS 21 · Listening Test 4 — Part 1

PART 1
Questions 1–10
Complete the form below.
Write ONE WORD AND/OR A NUMBER for each answer.

Broadbeach Shopping Center Survey
Customer Profile
First name: 1 [ ________ ]
Primary mode of transport to center: By 2 [ ________ ]
Most frequented service store: The local 3 [ ________ ]

Recent Purchases & Habits
• Bought a formal business 4 [ ________ ] at discount
• Browsed electronics store for a lightweight 5 [ ________ ]
• Prefers shopping on a quiet 6 [ ________ ] morning
• Regular snack stop: artisan 7 [ ________ ] kiosk
• Spends longest browsing time looking at fiction 8 [ ________ ]
• Garden department purchase: ornamental balcony 9 [ ________ ]
• Suggested amenity enhancement: add a multi-screen 10 [ ________ ]"""
        t["contentVerified"] = True
        print("Updated cambridge-21-listening-4 Part 1 worksheet")

with open(SOURCE_TESTS_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Saved updated Cambridge 21 listening worksheets.")
